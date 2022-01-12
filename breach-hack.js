/** @param {NS} ns **/
export async function main(ns) {
	let targets = ns.args;

	for(let i = 0; i < targets.length; i++) {
		await doBreachAndHack(ns, targets[i]);
	}
}

/**
 * @param {NS} ns Namespace
 * @param {string} target Target server
 **/
async function doBreachAndHack(ns, target) {
	let home = 'home';
	let breachScript = 'breach-server.js';
	let execHackScript = 'exec-hack.js';

	if (ns.serverExists(target)) {
		if (ns.exec(breachScript, home, 1, target)) {
			ns.tprint(`Breaching ${target}`);
			await ns.sleep(1000);
			
			if (ns.exec(execHackScript, home, 1, target, 'max')) {
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