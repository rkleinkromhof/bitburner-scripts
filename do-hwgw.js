import {
    formatDuration,
    formatRam
} from '/util-formatters.js';
import {
    disableLogs,
    createLogger,
} from '/util-helpers.js';

// RAM costs
const hackRamPerThread = 1.7;
const growRamPerThread = 1.75;
const weakenRamPerThread = 1.75;

// Security rates
const weakenSecurityLowerRate = 0.05;
const growSecurityIncreaseRate = 0.004;
const hackSecurityIncreaseRate = 0.002;

// Tolerances and thresholds
const serverMinSecurityTolerance = 0.01; // We allow a difference of this factor between current and minimum security.
const serverMaxMoneyTolerance = 0.01; // We allow a difference of this factor between current and maximum money.
const hackChanceWarnLevel = 0.9;

const primaryHackMoneyFactor = 0.0625;
const hackMoneyFactors = [primaryHackMoneyFactor, 0.01, 0.005, 0.001]; // Attempt our primary factor first. If that isn't optimal, fall back to lower values.

const silencedServices = [
    'exec',
    'disableLog',
    'getServerMaxMoney',
    'getServerMoneyAvailable',
    'getServerSecurityLevel',
    'getServerMinSecurityLevel',
    'getServerMaxRam',
    'getServerUsedRam',
    'sleep',
];

const argsSchema = [
    ['continuous', false], // Set to true to run continuously, otherwise, it runs once.
	['c', false], // Alias for continuous.
	['interval', 200], // Interval between batches and batch operations.
	['terminal', false], // `true` to log to terminal too.
];

/** @param {NS} ns **/
export async function main(ns) {
    // Shortcut for usage logging.
    if (ns.args.length < 1 || ns.args[0] === 'help') {
        ns.tprint(`Usage: ${ns.getScriptName()} [target] ([threads])`);
        return;
    }

    const host = ns.getHostname();
    const target = ns.args[0];
    const maxThreads = isNaN(ns.args[1]) ? getMaxThreads(ns, host, weakenRamPerThread) : ns.args[1];

    let options = ns.flags(argsSchema);

    const continuous = options.c || options.continuous;
	const interval = options.interval;
	const logToTerminal = options.terminal;

    let hgwInterval = interval;
    let batchInterval = interval;

    // TODO support these with flags.
    let manipulateStock = false;
    let disableToastWarnings = false;
    let loop = false;

    disableLogs(ns, silencedServices);
    ns.log = createLogger(ns, {logToTerminal}); // Bolt our log function onto the ns object.

    do {
        if (!securityAtMinimum(ns, target)) {
            await prepLowerSecurity(ns, {
                host,
                target,
                maxThreads: Math.min(getMaxThreads(ns, host, weakenRamPerThread), maxThreads),
                batchName: `prep-security`,
                disableToastWarnings,
                loop
            });
            await ns.sleep(hgwInterval);
        }
        else if (!moneyAtMaximum(ns, target)) {
            await prepGrowMoney(ns, {
                host,
                target,
                maxThreads: Math.min(getMaxThreads(ns, host, growRamPerThread), maxThreads),
                batchName: `prep-money`,
                manipulateStock,
                loop
            });
            await ns.sleep(hgwInterval);
        } else {
            const valHackChance = ns.hackAnalyzeChance(target);

            if (valHackChance < hackChanceWarnLevel) {
                ns.log.warn(`Hack chance is not optimal (${valHackChance})`);
            }

            let threadsNeeded = calcThreadsNeeded(ns, host, target, maxThreads, hackMoneyFactors);

            if (threadsNeeded) {
                await startHwgwBatch(ns, {
                    host,
                    target,
                    batchNum: '1',
                    threadsHack: threadsNeeded.hack,
                    threadsWeaken1: threadsNeeded.weaken1,
                    threadsGrow: threadsNeeded.grow,
                    threadsWeaken2: threadsNeeded.weaken2,
                    manipulateStock,
                    disableToastWarnings,
                    loop,
                    hgwInterval,
                });
            }
            await ns.sleep(batchInterval);
        }
    }
    while (continuous);
}

/**
 * 
 */
function calcThreadsNeeded(ns, host, target, maxThreads, moneyFactors) {
    moneyFactors = Array.prototype.slice.call(moneyFactors); // Make a copy, 'cause we're going to edit it.

    const moneyFactor = moneyFactors.shift();
    const serverMoneyMax = ns.getServerMaxMoney(target);

    const hackMoney = moneyFactor * serverMoneyMax;
    const hackThreadsNeeded = Math.min(Math.ceil(ns.hackAnalyzeThreads(target, hackMoney)), maxThreads);
    const growBackThreads = Math.ceil(ns.growthAnalyze(target, serverMoneyMax / (serverMoneyMax - (hackMoney))));

    const hackSecurityIncrease = hackThreadsNeeded * hackSecurityIncreaseRate;
    const hackCounterWeakenThreads = Math.ceil(hackSecurityIncrease / weakenSecurityLowerRate);
    const growSecurityIncrease = growBackThreads * growSecurityIncreaseRate;
    const growCounterWeakenThreads = Math.ceil(growSecurityIncrease / weakenSecurityLowerRate);

    const ramNeeded = (hackThreadsNeeded * hackRamPerThread) + ((hackCounterWeakenThreads + growCounterWeakenThreads) * weakenRamPerThread) + (growBackThreads * growRamPerThread);
    const ramAvailable = getRamAvailable(ns, host);

    if (ramNeeded && (ramNeeded <= ramAvailable)) {
        return {
            hack: hackThreadsNeeded,
            weaken1: hackCounterWeakenThreads,
            grow: growBackThreads,
            weaken2: growCounterWeakenThreads
        };
    }
    // If we've more money factors to try, do that.
    else if (moneyFactors.length) {
        return calcThreadsNeeded(ns, host, target, maxThreads, moneyFactors);
    }
    return null;
}

function securityAtMinimum(ns, target) {
    return ns.getServerSecurityLevel(target) <= (ns.getServerMinSecurityLevel(target) * (1 + serverMinSecurityTolerance));
}

function moneyAtMaximum(ns, target) {
    return ns.getServerMoneyAvailable(target) >= (ns.getServerMaxMoney(target) * (1 - serverMaxMoneyTolerance));
}

async function prepLowerSecurity(ns, options) {
    const { host, target, maxThreads, disableToastWarnings, loop } = options;

    const securityReduction = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
    const threadsNeeded = Math.ceil(securityReduction / weakenSecurityLowerRate);

    const threads = Math.min(threadsNeeded, maxThreads);
    const duration = ns.getWeakenTime(target);
    const timeStart = Date.now();

    if (threadsNeeded <= maxThreads) {
        ns.log.info(`Prepping ${target} (${options.batchName}) - lowering security by ${securityReduction} in ${threadsNeeded} threads and ${formatDuration(duration)}`);
    } else {
        ns.log.info(`Prepping ${target} (${options.batchName}) - lowering security by ${maxThreads * weakenSecurityLowerRate} in ${maxThreads} threads and ${formatDuration(duration)}. Need to run ${Math.ceil(threadsNeeded - maxThreads)} additional threads.`);
    }

    execWeaken(ns, {
        host,
        target,
        threads,
        timeStart,
        timeEnd: timeStart + duration,
        duration,
        batchName: options.batchName || `prep-security`,
        disableToastWarnings,
        loop
    });
    await ns.sleep(duration);
}

async function prepGrowMoney(ns, options) {
    const { host, target, maxThreads, manipulateStock, loop } = options;

    const growthFactor = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
    const threadsNeeded = Math.ceil(ns.growthAnalyze(target, growthFactor));
    const threads = Math.min(threadsNeeded, maxThreads);
    const duration = ns.getGrowTime(target);
    const timeStart = Date.now();

    if (threadsNeeded <= maxThreads) {
        ns.log.info(`Prepping ${target} (${options.batchName}) - growing money by ${growthFactor} in ${threadsNeeded} threads and ${formatDuration(duration)}`);
    } else {
        ns.log.info(`Prepping ${target} (${options.batchName}) - growing money by ${maxThreads * weakenSecurityLowerRate} in ${maxThreads} threads and ${formatDuration(duration)}. Need to run ${Math.ceil(threadsNeeded - maxThreads)} additional threads.`);
    }

    execGrow(ns, {
        host,
        target,
        threads,
        timeStart,
        timeEnd: timeStart + duration,
        duration,
        batchName: options.batchName || `prep-money`,
        manipulateStock,
        loop,
    });

    await ns.sleep(duration);
}

async function startHwgwBatch(ns, options) {
    const { host, target, batchNum, threadsHack, threadsWeaken1, threadsGrow, threadsWeaken2, manipulateStock, disableToastWarnings, loop, hgwInterval } = options;

    let ramNeeded = (threadsHack * hackRamPerThread) + ((threadsWeaken1 + threadsWeaken2) * weakenRamPerThread) + (threadsGrow * growRamPerThread);
    let ramAvailable = getRamAvailable(ns, host);

    if (ramNeeded && (ramNeeded <= ramAvailable)) {
        // Durations
        let durationWeaken = ns.getWeakenTime(target);
        let durationGrow = ns.getGrowTime(target);
        let durationHack = ns.getHackTime(target);

        let timeNow = Date.now();

        // Start times
        let timeStartWeaken1 = timeNow;
        let timeStartWeaken2 = timeStartWeaken1 + 2 * hgwInterval;
        let timeStartGrow = timeStartWeaken1 + durationWeaken + hgwInterval - durationGrow;
        let timeStartHack = timeStartWeaken1 + durationWeaken - hgwInterval - durationHack;
        let timeStartAdjust = Math.abs(Math.min(timeStartWeaken1, timeStartWeaken2, timeStartGrow, timeStartHack, 0));

        let totalRuntime = durationWeaken + 2 * hgwInterval;

        execHack(ns, {
            host,
            target,
            threads: threadsHack,
            timeStart: timeStartAdjust + timeStartHack,
            timeEnd: timeStartAdjust + timeStartHack + durationHack,
            duration: durationHack,
            batchName: `batch-${batchNum}-hack`,
            manipulateStock,
            disableToastWarnings,
            loop,
        });

        execWeaken(ns, {
            host,
            target,
            threads: threadsWeaken1,
            timeStart: timeStartAdjust + timeStartWeaken1,
            timeEnd: timeStartAdjust + timeStartWeaken1 + durationWeaken,
            duration: durationWeaken,
            batchName: `batch-${batchNum}-weaken1`,
            disableToastWarnings,
            loop
        });

        execGrow(ns, {
            host,
            target,
            threads: threadsGrow,
            timeStart: timeStartAdjust + timeStartGrow,
            timeEnd: timeStartAdjust + timeStartGrow + durationGrow,
            duration: durationGrow,
            batchName: `batch-${batchNum}-grow`,
            manipulateStock,
            loop,
        });

        execWeaken(ns, {
            host,
            target,
            threads: threadsWeaken2,
            timeStart: timeStartAdjust + timeStartWeaken2,
            timeEnd: timeStartAdjust + timeStartWeaken2 + durationWeaken,
            duration: durationWeaken,
            batchName: `batch-${batchNum}-weaken2`,
            disableToastWarnings,
            loop
        });

        ns.log.info(`HWGW started on ${target} - cycle ends in ${formatDuration(totalRuntime)}`);
        await ns.sleep(totalRuntime);

        return true;
    } else {
        ns.log.error(`Not enough RAM available on ${host} to start HWGW on ${target}: have ${formatRam(ramAvailable)} of ${formatRam(ramNeeded)} needed RAM`);
    }

    return false;
}

function execHack(ns, options) {
    const { host, threads, target, timeStart, timeEnd, duration, batchName, manipulateStock, disableToastWarnings, loop } = options;

    ns.exec('do-hack.js',
        host,
        threads,
        target,
        timeStart, // desiredStartTime
        timeEnd, // expectedEndTime: for informational purposed in process list
        duration, // expectedDuration
        batchName, // description: for informational purposed in process list
        manipulateStock,
        disableToastWarnings,
        loop,
    );
}

function execWeaken(ns, options) {
    const { host, threads, target, timeStart, timeEnd, duration, batchName, disableToastWarnings, loop } = options;

    ns.exec('do-weaken.js',
        host,
        threads,
        target,
        timeStart, // desiredStartTime
        timeEnd, // expectedEndTime: for informational purposed in process list
        duration, // expectedDuration
        batchName, // description: for informational purposed in process list
        disableToastWarnings,
        loop,
    );
}

function execGrow(ns, options) {
    const { host, threads, target, timeStart, timeEnd, duration, batchName, manipulateStock, loop } = options;

    ns.exec('do-grow.js',
        host,
        threads,
        target,
        timeStart, // desiredStartTime
        timeEnd, // expectedEndTime: for informational purposed in process list
        duration, // expectedDuration
        batchName, // description: for informational purposed in process list
        manipulateStock,
        loop,
    );
}

function getRamAvailable(ns, host) {
    return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

function getMaxThreads(ns, host, ramPerThread) {
    return Math.floor(getRamAvailable(ns, host) / ramPerThread);
}