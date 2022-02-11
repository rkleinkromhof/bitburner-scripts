import {
    formatMoney
} from '/util-formatters.js';

/**
 * Wait until an appointed time and then execute a hack.
 * @param {NS} ns Namespace.
 * @param {Array} ns.args Arguments.
 * @param {string} ns.args.0 Target server to hack.
 * @param {number} ns.args.1 Desired start time as datetime stamp.
 * @param {number} ns.args.2 Expected end time as datetime stamp.
 * @param {number} ns.args.3 Expected duration in milliseconds.
 * @param {string} ns.args.4 Description of the hack operation.
 * @param {boolean} ns.args.5 Manipulate stock - `true` to manipulate stock on hack.
 * @param {boolean} ns.args.6 Disable toast warning - `true` to disable the '0 money stolen' toast message.
 * @param {boolean} ns.args.7 Loop: `true` to keep hacking.
 */
export async function main(ns) {
    //args[0: target, 1: desired start time, 2: expected end, 3: expected duration, 4: description, 5: manipulate stock, 6: disable toast warnings, 7: loop]
    const [
        target,
        desiredStartTime,
        expectedEndTime,
        expectedDuration = 0,
        description,
        manipulateStock = false,
        disableToastWarnings = false,
        loop = false
    ] = ns.args;

    const sleepDuration = desiredStartTime ? desiredStartTime - Date.now() : 0;
    let cycleTime = expectedDuration * 4;
    let result;

    // ns.tprint(`do-hack: target = ${target}, desiredStartTime = ${desiredStartTime} (${formatDateTime(new Date(desiredStartTime))}), expectedEndTime = ${expectedEndTime} (${formatDateTime(new Date(expectedEndTime))}), expectedDuration = ${expectedDuration} (${formatDuration(expectedDuration)}), description = ${description}, manipulateStock = ${manipulateStock}, disableToastWarnings = ${disableToastWarnings}, loop = ${loop} `);

    if (cycleTime < 100) {
        // For fast hacking loops, inject a delay on hack in case grow/weaken are running a bit slow.
        cycleTime = Math.max(1, Math.min(5, cycleTime * 2));
    }

    if (sleepDuration > 0) {
        await ns.sleep(sleepDuration);
    }
    do {
        if (!(result = await ns.hack(target, { stock: manipulateStock })) && !disableToastWarnings) {
            ns.toast(`Warning, hack stole 0 money. Might be a misfire. ${JSON.stringify(ns.args)}`, 'warning');
        }
        if (loop) {
            await ns.sleep(cycleTime - expectedDuration);
        }
    } while (loop);

    // ns.print(`${description} @ ${target}: hacked for ${formatMoney(result)}`);
}