/**
 * @param {NS} ns
 **/
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([numThreads])`);
		return;
	}

	let script = 'hack-v3.js';
	let target = ns.args[0];

	// Copy the script file if it doesn't exist.
	if (!ns.fileExists(script, target)) {
		ns.tprint(`Copying ${script} to ${target}`);
		await ns.scp(script, target);
	}

	let numThreads = ns.args[1];
	let availableRam = ns.getServerMaxRam(target) - ns.getServerUsedRam(target);
	let reqRamPerThread = ns.getScriptRam(script, target);
	let maxThreads = Math.floor(availableRam / reqRamPerThread);
	let minMoneyThresh = 1000; // Minimum of $1000 or bail.
	let maxMoney = ns.getServerMaxMoney(target);

	if (maxMoney < minMoneyThresh) {
		ns.tprint(`Server ${target} can only hold \$${maxMoney}. We require at least \$${minMoneyThresh} to make this worthwile.`);
	}

	// If we should use the max number of threads, then calculate what that is.
	if (numThreads === 'max') {
		numThreads = maxThreads;
	}

	numThreads = numThreads || 1; // If somehow the numThreads is falsy, default to 1;
	
	if (numThreads > maxThreads) {
		ns.tprint(`There isn't enough RAM available on ${target} to start ${numThreads} thread(s) of ${script}. (max = ${maxThreads})`);
	} else {
		ns.tprint(`Starting ${script} on ${target} with ${numThreads} threads`);
		ns.exec(script, target, numThreads, target);
	}
}