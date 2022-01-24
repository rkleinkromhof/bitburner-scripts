import {findNode} from './util-servers.js';

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

	let path = findNode(ns, null, ns.getHostname(), target);

	if (path.length) {
		ns.tprint(`Command: connect ${path.join('; connect ')}`);
		// let connected = path.every((node => ns.connect(node)));
		// if (connected) {
		// 	ns.connect(home); // Only works with SF-4 and up
		// }
		// else {
		// 	ns.tprint(`Could not connect to ${target}`);
		// 	ns.connect(home);
		// }
	}
}