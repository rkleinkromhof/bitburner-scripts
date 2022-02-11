import { breachServer, getScanServerOptions, scanServers } from './util-servers.js';

/**
 * @param {NS} ns Namespace
 */
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} ([...targets])`);
		return;
	}
	
	let targets = Array.prototype.slice.call(ns.args);
	let availableOptions = getScanServerOptions();

	if (targets[0] === 'available') {
		targets = ['hackable'];
	}

	let allOptions = Array.prototype.every.call(targets, target => availableOptions.indexOf(target) >= 0);

	if (allOptions) {
		targets = scanServers(ns, 0, 0, ...targets)
			.map(server => server.hostname);
	}

	if (targets.length === 0) {
		ns.tprint(`No targets found.`);
	}
	else {
		for (let i = 0; i < targets.length; i++) {			
			await doBreach(ns, targets[i]);
		}
		
	}
}

async function doBreach(ns, target) {
	if (ns.serverExists(target)) {
		ns.tprint(`Breaching ${target}`);
		breachServer(ns, target);

		await ns.sleep(50);
	} else {
		ns.tprint(`Server ${target} does not exists.`);
	}
}