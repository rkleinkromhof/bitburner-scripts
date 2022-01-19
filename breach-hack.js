import {scanServers} from './util-servers.js';

/**
 * Runs breach and hack scripts for the given targets.
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} ([...targets])`);
		return;
	}

	let targets = Array.prototype.slice.call(ns.args);
	let hackScript = 'hack-v3.js';

	if (targets[0] === 'available') {
		targets = scanServers(ns, 4, 1000, 'hackable')
		.filter(server => !ns.scriptRunning(hackScript, server.hostname))
		.map(server => server.hostname);
	}

	if (targets.length === 0) {
		ns.tprint(`No targets found.`);
	}
	else {
		for (let i = 0; i < targets.length; i++) {
			await doBreachAndHack(ns, targets[i]);
		}
	}
}

/**
 * Runs `breach-server.js` and `exec-hack.js` on the target server.
 * @param {NS} ns Namespace
 * @param {string} target Target server
 * @return {Promise} Promise that either gets resolved with `true` on success or rejected with `false` when it fails.
 **/
async function doBreachAndHack(ns, target) {
	let home = 'home';
	let breachScript = 'breach-server.js';
	let execHackScript = 'exec-self-hack.js';

	if (ns.serverExists(target)) {
		if (ns.exec(breachScript, home, 1, target)) {
			ns.tprint(`Breaching ${target}`);
			
			if (ns.exec(execHackScript, home, 1, target, 'max')) {
				await ns.sleep(1000);
				ns.tprint(`${target} hacked successfully.`);
				
				return Promise.resolve(true); // Yaaay, success!
			} else {
				ns.tprint(`${execHackScript} failed on ${target}.`);
			}
		} else {
			ns.tprint(`${breachScript} failed on ${target}.`);
		}
	} else {
		ns.tprint(`Server ${target} does not exists.`);
	}
	return Promise.reject(false); // Failed :'(
}