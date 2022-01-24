import {scanServers, findNode} from './util-servers.js';

/**
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [...targets]`);
		ns.tprint(` =>: target can also be 'noram' or 'nomaxmoney' to target servers without any RAM or money capacity, respectively`);
		return;
	}

	let targets = Array.prototype.slice.call(ns.args);
	let target = targets[0];

	if (target === 'nomaxmoney' || target === 'noram') {
		targets = scanServers(ns, 4, 1000, target)
			.filter(server => !server.purchasedByPlayer)
			.filter(server => !server.backdoorInstalled) // Remove all servers we've already backdoored
			.map(server => server.hostname); // There's no reason to backdoor own servers.
	}

	if (targets.length === 0) {
		ns.tprint(`No targets found.`);
	}
	else {
		for (let i = 0; i < targets.length; i++) {
			let target = targets[i];
			let path = findNode(ns, null, ns.getHostname(), target);

			if (path.length) {
				path.shift(); // Remove 'home' from the path. We know.

				ns.tprint(`${target} found at: ${path.join(' -> ')}`);
				ns.tprint(`Command: home; connect ${path.join('; connect ')}`);
			}
		}
	}
}