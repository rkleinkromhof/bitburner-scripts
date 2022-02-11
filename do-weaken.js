/**
 * Wait until an appointed time and then execute a weaken.
 * @param {NS} ns Namespace.
 * @param {Array} ns.args Arguments.
 * @param {string} ns.args.0 Target server to weaken.
 * @param {number} ns.args.1 Desired start time as datetime stamp.
 * @param {number} ns.args.2 Expected end time as datetime stamp.
 * @param {number} ns.args.3 Expected duration in milliseconds.
 * @param {string} ns.args.4 Description of the weaken operation.
 * @param {boolean} ns.args.5 Disable toast warning - `true` to disable the 'weaken reduced 0 security' toast message.
 * @param {boolean} ns.args.6 Loop: `true` to keep hacking.
 */
export async function main(ns) {
    //args[0: target, 1: desired start time, 2: expected end, 3: expected duration, 4: description, 5: disable toast warnings, 6: loop]
	const [
        target,
        desiredStartTime,
        expectedEndTime,
        expectedDuration = 0,
        description,
        disableToastWarnings = false,
        loop = false
    ] = ns.args;


	const sleepDuration = desiredStartTime ? desiredStartTime - Date.now() : 0;
	let result;

    if (sleepDuration > 0) {
        await ns.sleep(sleepDuration);
	}
    do {
        if (!(result = await ns.weaken(target)) && !disableToastWarnings) {
            ns.toast(`Warning, weaken reduced 0 security. Might be a misfire. ${JSON.stringify(ns.args)}`, 'warning');
		}
    } while (loop);

	// ns.print(`${description} @ ${target}: weakened security by ${result}`);
}