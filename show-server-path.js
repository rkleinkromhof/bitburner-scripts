import {scanServers} from './util-servers.js';

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
				ns.tprint(`${target} found at: ${path.join(' -> ')}`);
			}
		}
	}
}

/**
 * Finds a node somewhere in the network of nodes.
 * 
 * @param {NS} ns Namespace
 * @param {string} parent The parent server name (yes, this 'network' is a tree)
 * @param {string} hostname The host server name
 * @param {string} target The target server name
 * @returns {Promise<String[]>} path of servers to get from the root to the target.
 */
function findNode(ns, parent, hostname, target) {
	// Shortcut if we've already found our target.
	if (hostname === target) {
		return [target];
	}	

	let nodes = ns.scan(hostname)
		.filter(server => server !== parent) // Servers can also connect to their parent, but we don't want to get stuck in an infinite loop, so, yeah, remove that.
		.filter(server => !ns.getServer(server).purchasedByPlayer);// Ignore our own servers.

	let foundNode = [];
	let node;
	let iterations = 0;
	let maxIterations = 50; // Safety catch for not getting stuck in loops. I should remove this once I am confident this won't fuck itself up.

	while (!foundNode.length && nodes.length && (node = nodes.shift()) && iterations <= maxIterations) {
		iterations++;
		foundNode = findNode(ns, hostname, node, target);
	}
	
	return (foundNode && foundNode.length) ? [hostname].concat(...foundNode) : [];
}