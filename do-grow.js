/**
 * Wait until an appointed time and then execute a grow.
 * @param {NS} ns Namespace.
 * @param {Array} ns.args Arguments.
 * @param {string} ns.args.0 Target server to grow.
 * @param {number} ns.args.1 Desired start time as datetime stamp.
 * @param {number} ns.args.2 Expected end time as datetime stamp.
 * @param {number} ns.args.3 Expected duration in milliseconds.
 * @param {string} ns.args.4 Description of the grow operation.
 * @param {boolean} ns.args.5 Manipulate stock - `true` to manipulate stock on grow.
 * @param {boolean} ns.args.6 Loop: `true` to keep hacking.
 */
export async function main(ns) {
    //args[0: target, 1: desired start time, 2: expected end, 3: expected duration, 4: description, 5: manipulate stock, 6: loop]
     const [
        target,
        desiredStartTime,
        expectedEndTime,
        expectedDuration = 0,
        description,
        manipulateStock = false,
        loop = false
    ] = ns.args;

    const sleepDuration = desiredStartTime ? desiredStartTime - Date.now() : 0;
    const cycleTime = expectedDuration / 3.2 * 4;
    let result;

    if (sleepDuration > 0) {
        await ns.sleep(sleepDuration);
    }
    do {
        result = await ns.grow(target, { stock: manipulateStock });
        
        if (loop) {
            await ns.sleep(cycleTime - expectedDuration);
        }
    } while (loop);

    // ns.print(`${description} @ ${target}: growth factor = ${result}`);
}