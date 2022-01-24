/** @param {NS} ns **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([...threadsSteps])`);
		ns.tprint(`  => threadsSteps)`);
		return;
	}

	let target = ns.args[0];

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	ns.killall(target);
}