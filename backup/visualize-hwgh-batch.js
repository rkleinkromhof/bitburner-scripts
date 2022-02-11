import {
	formatDuration,
	formatNumber,
	formatMoney,
	formatPercent,
	formatRam
} from './util-formatters.js';

// RAM costs
const hackRamPerThread = 1.7;
const growRamPerThread = 1.75;
const weakenRamPerThread = 1.75;

const weakenSecurityLowerRate = 0.05;
const growSecurityIncreaseRate = 0.004;
const hackSecurityIncreaseRate = 0.002;

/**
 * CLI autocomplete.
 * @param {Object} data General data about the game you might want to autocomplete.
 * @param {String[]} data.serrvers List of all servers in the game.
 * @param {String[]} data.txts List of text files on the current server.
 * @param {String[]} data.scripts List of all scripts on the current server.
 * @param {String[]} data.flags The same flags function as passed with ns. Calling this function adds all the flags as autocomplete arguments.
 * @param {String[]} args Current arguments. Minus `run script.js`.
 */
export function autocomplete(data, args) {
	if (args.length <= 1) {
		return [...data.servers];
	}
	return [];
}

/**
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([hackMoneyFactor]) ([interval])`);
		return;
	}

	let [target, hackMoneyFactor = 0.0625, durationInterval = 200] = ns.args;

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	let toSecs = (millis) => {
		let precision = millis < 1000 ? 3 : (Math.round(millis / 1000) + '').length;
		return (millis / 1000).toPrecision(precision);
	}

	try {
		// Security
		const serverMinSecLevel = ns.getServerMinSecurityLevel(target);
		const serverBaseSecLevel = ns.getServerBaseSecurityLevel(target);
		const serverCurrentSecLevel = ns.getServerSecurityLevel(target);

		// Money
		const serverMoneyMax = ns.getServerMaxMoney(target);
		const serverMoneyAvailable = ns.getServerMoneyAvailable(target);

		let timeNow = 0; Date.now();
		
		// Durations
		const durationWeaken = ns.getWeakenTime(target); // ns.formulas.hacking.weakenTime(server, player);
		const durationGrow = ns.getGrowTime(target); // ns.formulas.hacking.growTime(server, player);
		const durationHack = ns.getHackTime(target); // ns.formulas.hacking.hackTime(server, player);

		// End times (heh)
		// let timeEndPhase1 = timeNow + durationWeaken - durationInterval;
		// let timeEndPhase2 = timeNow + durationWeaken;
		// let timeEndPhase3 = timeNow + durationWeaken + durationInterval;
		// let timeEndPhase4 = timeNow + durationWeaken + 2 * durationInterval;
		
		// Start times
		let timeStartWeaken1 = timeNow;
		let timeStartWeaken2 = timeStartWeaken1 + 2 * durationInterval;
		let timeStartGrow = timeStartWeaken1 + durationWeaken + durationInterval - durationGrow;
		let timeStartHack = timeStartWeaken1 + durationWeaken - durationInterval - durationHack;
		let timeStartAdjust = Math.abs(Math.min(timeStartWeaken1, timeStartWeaken2, timeStartGrow, timeStartHack, 0));

		timeStartWeaken1 += timeStartAdjust;
		timeStartWeaken2 += timeStartAdjust;
		timeStartGrow += timeStartAdjust;
		timeStartHack += timeStartAdjust;

		const totalRuntime = durationWeaken + 2 * durationInterval;

		const hackMoney = hackMoneyFactor * serverMoneyMax;
		const hackThreadsNeeded = Math.ceil(ns.hackAnalyzeThreads(target, hackMoney));
		const growBackThreads = Math.ceil(ns.growthAnalyze(target, serverMoneyMax / (serverMoneyMax - (hackMoney))));
		const valHackChance = ns.hackAnalyzeChance(target);
		
		const hackSecurityIncrease = hackThreadsNeeded * hackSecurityIncreaseRate;
		const hackCounterWeakenThreads = Math.ceil(hackSecurityIncrease / weakenSecurityLowerRate);
		const growSecurityIncrease = growBackThreads * growSecurityIncreaseRate;
		const growCounterWeakenThreads = Math.ceil(growSecurityIncrease / weakenSecurityLowerRate);

		const securityPrepped = serverCurrentSecLevel <= serverMinSecLevel;
		const moneyPrepped = serverMoneyAvailable >= serverMoneyMax;

		ns.tprint('======================= HWGW BATCH ANALYSIS ======================');
		ns.tprint(`Hack money factor: ${hackMoneyFactor} (${formatPercent(hackMoneyFactor)})`);
		ns.tprint(`Hack skill: ${ns.getHackingLevel()}`);
		ns.tprint(`[Security level] base: ${serverBaseSecLevel}, min: ${serverMinSecLevel}, current: ${formatNumber(serverCurrentSecLevel)}${securityPrepped ? ' [PREPPED]' : ''}`);
		ns.tprint(`[Money available/max] ${formatMoney(serverMoneyAvailable)}/${formatMoney(serverMoneyMax)}${moneyPrepped ? ' [PREPPED]' : ''}`);

		if (!securityPrepped) {
			const securityReduction = serverCurrentSecLevel - serverMinSecLevel;
			const weakensToMin = Math.ceil(securityReduction / weakenSecurityLowerRate);

			ns.tprint(`Prep Weaken - takes ${formatDuration(durationWeaken)} - need ${weakensToMin} weakens to get security to min (= ${serverMinSecLevel}).`);
		}
		if (!moneyPrepped) {
			const growthFactor = serverMoneyMax / serverMoneyAvailable;
			const growsToMax = Math.ceil(ns.growthAnalyze(target, growthFactor));
			const secIncrease = growSecurityIncreaseRate * growsToMax;
			const counterWeakens = Math.ceil(secIncrease * weakenSecurityLowerRate);

			ns.tprint(`Prep Grow   - takes ${formatDuration(durationGrow)} - need ${growsToMax} (factor: ${growthFactor}) grows to max money (= +${formatMoney(serverMoneyMax - serverMoneyAvailable)}) - raises security by ${secIncrease} and takes ${counterWeakens} weakens to counter.`);
		}

		ns.tprint(`Hack     - takes ${formatDuration(durationHack)} - need ${hackThreadsNeeded} threads to hack for ${formatMoney(hackMoney)} of ${formatMoney(serverMoneyMax)} - raises security by ${formatNumber(hackSecurityIncrease)} - chance of success ${formatPercent(valHackChance)}`);
		ns.tprint(`Weaken 1 - takes ${formatDuration(durationWeaken)} - need ${hackCounterWeakenThreads} threads to lowers security by ${formatNumber(hackCounterWeakenThreads * weakenSecurityLowerRate)}`);
		ns.tprint(`Grow     - takes ${formatDuration(durationGrow)} - need ${growBackThreads} threads to grow ${formatMoney(hackMoney)} back - raises security by ${formatNumber(growSecurityIncrease)}`);
		ns.tprint(`Weaken 2 - takes ${formatDuration(durationWeaken)} - need ${growCounterWeakenThreads} threads to lowers security by ${formatNumber(growCounterWeakenThreads * weakenSecurityLowerRate)}`);
		
		let totalRamCost = (hackThreadsNeeded * hackRamPerThread) + (growBackThreads * growRamPerThread) + ((hackCounterWeakenThreads + growCounterWeakenThreads) * weakenRamPerThread);
		let profitPerMb = hackMoney / totalRamCost;
		let profitPerSec = hackMoney / (totalRuntime / 1000);

		ns.tprint(`Total RAM cost: ${formatRam(totalRamCost)}`);
		ns.tprint(`Profit per MB : ${formatMoney(profitPerMb)}/MB`);
		ns.tprint(`Profit per sec: ${formatMoney(profitPerSec)}/s`);
		ns.tprint(`Profit/MB/sec : ${formatMoney(hackMoney / totalRamCost / (totalRuntime / 1000))}/MB/s`);

		ns.tprint(`Start time    : ${timeNow}s`);
		ns.tprint(`Dur. interval : ${formatDuration(durationInterval)}`);
		ns.tprint(`Start time adj: ${formatDuration(timeStartAdjust)}`);

		ns.tprint(`Start Weaken 1: ${formatDuration(timeStartWeaken1)}`);
		ns.tprint(`Start Weaken 2: ${formatDuration(timeStartWeaken2)}`);
		ns.tprint(`Start Grow    : ${formatDuration(timeStartGrow)}`);
		ns.tprint(`Start Hack    : ${formatDuration(timeStartHack)}`);

		let processes = [
			{name: 'Weaken 1', endTime: timeStartWeaken1 + durationWeaken},
			{name: 'Weaken 2', endTime: timeStartWeaken2 + durationWeaken},
			{name: 'Grow', endTime: timeStartGrow + durationGrow},
			{name: 'Hack', endTime: timeStartHack + durationHack}
		];
		processes.sort((process1, process2) => process1.endTime - process2.endTime);

		processes.forEach(process => {
			ns.tprint(`End ${process.name.padEnd(10)}: ${formatDuration(process.endTime)}`);
		});

		ns.tprint(`1 HWGW batch runs for a total of ${formatDuration(totalRuntime)}`);
		
		ns.tprint('---------------------------------------------------------------')

		let repeat = (str, times) => {
			return String.prototype.repeat.call(str, Math.max(times, 0));
		};
		let totalLength = toSecs(durationWeaken + 2 * durationInterval);
		// ns.tprint(`total length ${totalLength}`);
		let factor = Math.min(Math.round(1000000 / ([durationWeaken, durationGrow, durationHack].reduce((total, duration) => total + duration) / 3)) / 10, 10);

		let durationWeakenSecs = toSecs(durationWeaken);
		let durationGrowSecs = toSecs(durationGrow);
		let durationHackSecs = toSecs(durationHack);
		let durations = [durationWeaken, durationGrow, durationHack];

		ns.tprint(`Weaken: ${durationWeakenSecs}s`);
		ns.tprint(`Grow  : ${durationGrowSecs}s`);
		ns.tprint(`Hack  : ${durationHackSecs}s`);
		ns.tprint(`Min: ${toSecs(Math.min(...durations))}, Max: ${toSecs(Math.max(...durations))}, Avg: ${toSecs(durations.reduce((total, duration) => total + duration) / 3)}`);
		ns.tprint(`Factor: ${factor}`);

		let visTotalLength = Math.ceil(factor * totalLength);
		// let visWhitespaceBeforeFirstPhase = toSecs(Math.ceil(factor * (timeNow + durationWeaken - durationInterval - 1)));
		let visWhitespaceBeforeWeaken1 = toSecs(Math.ceil(factor * timeStartWeaken1));
		let visWhitespaceBeforeWeaken2 = toSecs(Math.ceil(factor * timeStartWeaken2));
		let visWhitespaceBeforeGrow = toSecs(Math.ceil(factor * timeStartGrow));
		let visWhitespaceBeforeHack = toSecs(Math.ceil(factor * timeStartHack));
		// let visWhitespaceBetweenPhases = toSecs(Math.ceil(factor * (durationInterval - 1))) - 1;
		let visLineWeakenLength = toSecs(Math.ceil(factor * durationWeaken));
		let visLineGrowLength = toSecs(Math.ceil(factor * durationGrow));
		let visLineHackLength = toSecs(Math.ceil(factor * durationHack));

		let visLineWeaken1 = `${repeat(' ', visWhitespaceBeforeWeaken1)}${repeat('-', visLineWeakenLength)}`;
		let visLineWeaken2 = `${repeat(' ', visWhitespaceBeforeWeaken2)}${repeat('-',visLineWeakenLength)}`;
		let visLineGrow = `${repeat(' ', visWhitespaceBeforeGrow)}${repeat('-', visLineGrowLength)}`;
		let visLineHack = `${repeat(' ', visWhitespaceBeforeHack)}${repeat('-', visLineHackLength)}`;

		// Visualize!
		ns.tprint(`Total length: ${visTotalLength}`);
		ns.tprint(`   ╔═${repeat('═', visTotalLength)}═╗`);
		ns.tprint(`   ║ ${repeat(' ', visTotalLength)} ║`);
		// ns.tprint(`   ║ ${repeat(' ', visLineHack.length - 1)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}| ║`);
		ns.tprint(` W ║ ${visLineWeaken1.padEnd(visTotalLength)} ║ (${formatDuration(durationWeaken)})`);
		ns.tprint(` W ║ ${visLineWeaken2.padEnd(visTotalLength)} ║ (${formatDuration(durationWeaken)})`);
		ns.tprint(` G ║ ${visLineGrow.padEnd(visTotalLength)} ║ (${formatDuration(durationGrow)}s)`);
		ns.tprint(` H ║ ${visLineHack.padEnd(visTotalLength)} ║ (${formatDuration(durationHack)}s)`);
		// ns.tprint(`   ║ ${repeat(' ', visLineHack.length - 1)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}| ║`);
		ns.tprint(`   ║ ${repeat(' ', visTotalLength)} ║`);
		ns.tprint(`   ╚═${repeat('═', visTotalLength)}═╝`);
		// For easy copy-pasta: ╣║╗╝╚╔╩╦╠═╬
	}
	catch (ex) {
		ns.tprint(`ERROR: ${ex.stack}`);
	}	
}