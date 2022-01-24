/** @param {NS} ns **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target]`);
		return;
	}

	let target = ns.args[0];

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	if (ns.killall(target)) {
		ns.tprint(`Killed all processes on ${target}`);
	}
	ns.exec('exec-remote-hack.js', ns.getHostname(), 1, 'max', target, 'available');
}