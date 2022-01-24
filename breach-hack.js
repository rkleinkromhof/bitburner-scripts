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
	
	let allScriptsPresent = [
		getHackScript(),
		getBreachScript(),
		getExecSelfHackScript()
	].every(script => {
		if (!ns.fileExists(script)) {
			ns.tprint(`Cannot find script ${script}`);
			return false;
		}
		return true;
	});

	if (!allScriptsPresent) {
		ns.tprint('Can\'t continue because there are scripts missing.');
		return;
	}

	let targets = Array.prototype.slice.call(ns.args);

	if (targets[0] === 'available') {
		targets = scanServers(ns, 4, 1000, 'hackable')
		.filter(server => !ns.scriptRunning(getHackScript(), server.hostname))
		.map(server => server.hostname);
	}

	if (targets.length === 0) {
		ns.tprint(`No targets found.`);
	}
	else if (memoryAvailableFor(ns, getBreachScript())) {
		for (let i = 0; i < targets.length; i++) {
			await doBreachAndHack(ns, targets[i]);
		}
	}
	else {
		ns.tprint(`Cannot start ${getBreachScript()} because there's not enough memory available on this machine. Free up memory first`);
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

	if (ns.serverExists(target)) {
		// Check again for memory available; situation could've changed again.
		let ramCost = ns.getScriptRam(getBreachScript());

		if (!memoryAvailableFor(ns, getBreachScript())) {
			ns.tprint(`Cannot start ${getBreachScript()} for ${target} because there's not enough memory available on this machine.`);
		}
		else if (!memoryAvailableFor(ns, getExecSelfHackScript())) {
			ns.tprint(`Cannot start ${getExecSelfHackScript()} for ${target} because there's not enough memory available on this machine.`);
		}
		else if (ns.exec(getBreachScript(), home, 1, target)) {
			ns.tprint(`Breaching ${target}`);
			
			if (ns.exec(getExecSelfHackScript(), home, 1, target, 'max')) {
				await ns.sleep(1000);
				ns.tprint(`${target} hacked successfully.`);
				
				return Promise.resolve(true); // Yaaay, success!
			} else {
				ns.tprint(`${getExecSelfHackScript()} failed on ${target}.`);
			}
		}			
		else {
			ns.tprint(`${getBreachScript()} failed on ${target}.`);
		}
	} else {
		ns.tprint(`Server ${target} does not exists.`);
	}
	return Promise.resolve(false); // Failed :'(
}

function getHackScript() {
	return 'hack-v3.js';
}

function getExecSelfHackScript() {
	return 'exec-self-hack.js';
}

function getBreachScript() {
	return 'breach-server.js';
}

function memoryAvailableFor(ns, script) {
	let ramCost = ns.getScriptRam(script);

	return ramCost > 0 && ramCost <= (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname()));
}