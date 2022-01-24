/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length !== 2 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [numThreads] [target]`);
		return;
	}
	ns.disableLog('getServerMaxRam');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('getScriptRam');
	ns.disableLog('getServerMaxMoney');

	let script = 'do-share.js';
	let [numThreads, target] = ns.args;

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	if (!ns.fileExists(script, target)) {
		ns.tprint(`Copying ${script} to ${target}`);
		await ns.scp(script, target);
		await ns.sleep(500); // Wait a short time more to make sure the script is well in place or calculation might go wrong.
	}

	let availableRam = ns.getServerMaxRam(target) - ns.getServerUsedRam(target);
	let reqRamPerThread = ns.getScriptRam(script, target);
	let maxThreads = Math.floor(availableRam / reqRamPerThread);

	if (numThreads === 'max') {
		numThreads = maxThreads;
	} else {
		numThreads = Math.max(1, numThreads); // If somehow the numThreads is lower than 1, default to 1;
	}

	if (numThreads > maxThreads) {
		ns.tprint(`There isn't enough RAM available on ${target} to start ${numThreads} thread(s) of ${script}. (max = ${maxThreads})`);

		return;
	}	

	ns.tprint(`Starting ${script} on ${target} with ${numThreads} threads.`);
	let pid = ns.exec(script, target, numThreads);

	if (pid > 0) {
		let ramUsed = ns.getServerUsedRam(target);
		let formattedRamUsed = Math.round(((ramUsed) + Number.EPSILON) * 100) / 100;
		let ramUsedPercent = Math.round(((100 / ns.getServerMaxRam(target) * ramUsed) + Number.EPSILON) * 100) / 100;

		ns.tprint(`Successfully started the instance. RAM used: ${formattedRamUsed}/${ns.getServerMaxRam(target)}GB (~${ramUsedPercent}%)`);
	} else {
		ns.tprint(`Instance failed to start.`);
	}
	
	await ns.sleep(500);
}