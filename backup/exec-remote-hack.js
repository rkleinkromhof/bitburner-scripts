import {scanServers} from '/util-servers.js';
import {
	formatMoney,
	formatNumber,
	formatRam
} from '/util-formatters.js';

/**
 * @param {NS} ns
 **/
export async function main(ns) {
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [numThreads] [host] [...targets]`);
		return;
	}
	ns.disableLog('getServerMaxRam');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('getScriptRam');
	ns.disableLog('getServerMaxMoney');

	let script = 'hack-server.js';
	let [numThreads, host, ...targets] = ns.args;
	let reverse = false;

	if (!ns.fileExists(script, host)) {
		ns.tprint(`Copying ${script} to ${host}`);
		await ns.scp(script, host);
		await ns.sleep(500); // Wait a short time more to make sure the script is well in place or calculation might go wrong.

		if (host !== 'home') {
			ns.killall(host); // Kill any running scripts (except for on Home, because we're running other stuff there)
		}
	}

	if (targets[targets.length - 1] === 'reverse') {
		targets.pop();
		reverse = true;
	}

	if (targets[0] === 'available') {
		targets = scanServers(ns, 0, 1000, 'hackable') // 0GB RAM, because we're host's RAM, not target's.
			.filter(server => !ns.isRunning(script, host, server.hostname))
			.map(server => server.hostname);
	}

	if (reverse) {
		targets.reverse();
	}

	if (targets.length === 0) {
		ns.tprint(`No targets found.`);

		return;
	}

	let originalTargets = Array.prototype.slice.call(targets);
	targets = targets.filter(target => ns.serverExists(target));

	if (targets.length < originalTargets.length) {
		ns.tprint(`Skipping targets that could not be found: ${originalTargets.filter(target => !targets.includes(target)).join(', ')}`);
	}

	let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	let reqRamPerThread = ns.getScriptRam(script, host);
	let maxThreads = Math.floor(availableRam / reqRamPerThread);
	let minMoneyThresh = 1000; // Minimum of $1000 or bail.
	let successfullyStarted = [];
	let failedToStart = [];
	let totalThreads;

	if (numThreads === 'max') {
		numThreads = Math.max(Math.floor(maxThreads / targets.length), 1);
		totalThreads = numThreads * targets.length;
	} else {
		numThreads = Math.max(1, numThreads); // If somehow the numThreads is lower than 1, default to 1;
		totalThreads = numThreads * targets.length;
	}

	if (totalThreads > maxThreads) {
		ns.tprint(`There isn't enough RAM available on ${host} to start ${numThreads} thread(s) of ${script} for ${targets.length} targets. (max = ${maxThreads}, needed = ${totalThreads})`);

		return;
	}	

	for (let i = 0; i < targets.length; i++) {
		let target = targets[i];
		let maxMoney = ns.getServerMaxMoney(target);

		if (maxMoney < minMoneyThresh) {
			ns.tprint(`Server ${target} can only hold ${formatMoney(maxMoney)}. We require at least ${formatMoney(minMoneyThresh)} to make this worthwile.`);
		}
		
		ns.tprint(`Starting ${script} on ${host} targeting ${target} with ${numThreads} threads.`);
		let pid = ns.exec(script, host, numThreads, target);

		if (pid > 0) {
			successfullyStarted.push(target);
		} else {
			failedToStart.push(target);
		}
	}

	await ns.sleep(1000);

	if (successfullyStarted.length) {
			let ramUsed = ns.getServerUsedRam(host);
			// let formattedRamUsed = Math.round(((ramUsed) + Number.EPSILON) * 100) / 100;
			// let ramUsedPercent = Math.round(((100 / ns.getServerMaxRam(host) * ramUsed) + Number.EPSILON) * 100) / 100;

		ns.tprint(`Successfully started ${failedToStart.length ? '': 'all '}${successfullyStarted.length} instances. RAM used: ${formatRam(ramUsed)}/${formatRam(ns.getServerMaxRam(host))} (~${formatNumber(100 / ns.getServerMaxRam(host) * ramUsed, 3, 2)}%)`);
	}
	if (failedToStart.length) {
		ns.tprint(`${failedToStart.length} instances failed to start: ${failedToStart.join(', ')}`);
	}
}