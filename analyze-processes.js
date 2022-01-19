import {formatMagnitude} from './util-formatters.js';

/**
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} target1 ([...additional-targets])`);
		return;
	}

	let threadsSteps = [1, 100, 500, 1000, 10000];
	let targets = Array.prototype.slice.call(ns.args);
	let player = ns.getPlayer();
	let weakenSecurityLowerRate = 0.05;
	let growSecurityIncreaseRate = 0.004;


	targets.forEach(target => {
		let server = ns.getServer(target);
		let serverMaxMoney = server.moneyMax;
		let serverGrowth = server.serverGrowth;

		for (let i = 0; i < threadsSteps.length; i++) {
			let threads = threadsSteps[i];
			let valGrowPercent = ns.formulas.hacking.growPercent(server, threads, player);
			let valGrowTime = ns.formulas.hacking.growTime(server, player);
			let valHackChance = ns.formulas.hacking.hackChance(server, player);
			let valHackExp = ns.formulas.hacking.hackExp(server, player);
			let valHackPercent = ns.formulas.hacking.hackPercent(server, player);
			let valHackTime = ns.formulas.hacking.hackTime(server, player);
			let valWeakenTime = ns.formulas.hacking.weakenTime(server, player);

			ns.tprint(`Analysis of hack/grow/weaken processen on ${target} with t=${threads}:`);
			ns.tprint(`Hack - ${(valHackChance * 100).toPrecision(3)}% chance to hack for \$${formatMagnitude(valHackPercent * serverMaxMoney * threads, 'm')} in ${Math.round(valHackTime / 1000)}s which yields ${Math.floor(valHackExp * threads)} xp`);
			ns.tprint(`Grow - grows by ~${Math.round((valGrowPercent + Number.EPSILON) * 100) / 100}% (=\$${formatMagnitude(valGrowPercent * serverGrowth * threads, 'm')} of ${serverMaxMoney} max) in ${Math.round(valGrowTime / 1000)}s, raising security by ${growSecurityIncreaseRate * threads}`);
			ns.tprint(`Weaken - lowers security by ${threads * weakenSecurityLowerRate} in ${Math.round(valWeakenTime / 1000)}s`);
		}
	});

	
}