import {formatMoney} from './util-formatters.js';

/**
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	let defaultThreadsSteps = [1, 10, 100, 1000];

	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([...threadsSteps])`);
		ns.tprint(`  => threadsSteps: show hack/grow/weaken analysis for these thread counts. Defaults to ${defaultThreadsSteps.join(', ')}`);
		return;
	}

	let [target, ...threadsSteps] = ns.args;

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}
	
	let player = ns.getPlayer();
	let weakenSecurityLowerRate = 0.05;
	let growSecurityIncreaseRate = 0.004;
	let hackSecurityIncreaseRate = 0.002;
	
	let server = ns.getServer(target);
	let serverMaxMoney = server.moneyMax;
	let serverGrowth = server.serverGrowth;

	if (!threadsSteps.length) {
		threadsSteps = Array.prototype.slice.call(defaultThreadsSteps);
	}
	let longestThreadsLength = ('' + Array.prototype.slice.call(threadsSteps).sort((threadsA, threadsB) => ('' + threadsB).length - ('' + threadsA).length)[0]).length;
	let padStart = (str, len, fill = ' ') => {
		return String.prototype.padStart.call(str, len, fill);
	}

	ns.tprint('======================= PROCESS ANALYSIS ======================');
	ns.tprint(`Hack skill: ${player.hacking}`);
	ns.tprint(`Analysis of hack/grow/weaken processen on ${target}:`);

	for (let i = 0; i < threadsSteps.length; i++) {
		let threads = threadsSteps[i];
		let paddedThreads = padStart(threads, longestThreadsLength);
		let valWeakenTime = ns.formulas.hacking.weakenTime(server, player);

		ns.tprint(`Weaken (t=${paddedThreads}) - takes ${Math.round(valWeakenTime / 1000)}s - lowers security by ${threads * weakenSecurityLowerRate}`);
	}
	ns.tprint('---------------------------------------------------------------')

	for (let i = 0; i < threadsSteps.length; i++) {
		let threads = threadsSteps[i];
		let paddedThreads = padStart(threads, longestThreadsLength);
		let valGrowPercent = ns.formulas.hacking.growPercent(server, threads, player);
		let valGrowTime = ns.formulas.hacking.growTime(server, player);

		ns.tprint(`Grow   (t=${paddedThreads}) - takes ${Math.round(valGrowTime / 1000)}s - grows by ~${Math.round((valGrowPercent + Number.EPSILON) * 100) / 100}% (=${formatMoney(valGrowPercent * serverGrowth * threads)} of ${formatMoney(serverMaxMoney)} max) - raises security by ${growSecurityIncreaseRate * threads}`);
	}
	ns.tprint('---------------------------------------------------------------')

	for (let i = 0; i < threadsSteps.length; i++) {
		let threads = threadsSteps[i];
		let paddedThreads = padStart(threads, longestThreadsLength);
		let valHackChance = ns.formulas.hacking.hackChance(server, player);
		let valHackExp = ns.formulas.hacking.hackExp(server, player);
		let valHackPercent = ns.formulas.hacking.hackPercent(server, player);
		let valHackTime = ns.formulas.hacking.hackTime(server, player);

		ns.tprint(`Hack   (t=${paddedThreads}) - takes ${Math.round(valHackTime / 1000)}s - ${(valHackChance * 100).toPrecision(3)}% chance to hack for ${formatMoney(valHackPercent * serverMaxMoney * threads)} - raises security by ${hackSecurityIncreaseRate * threads} - yields ${Math.floor(valHackExp * threads)} xp`);
	}
	ns.tprint('===============================================================');
}