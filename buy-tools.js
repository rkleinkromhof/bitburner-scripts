import { formatMagnitude } from './util-formatters.js';

/** @param {NS} ns **/
export async function main(ns) {
	let programs = [
		{ filename: 'FTPCrack.exe', cost: 1500000 },
		{ filename: 'relaySMTP.exe', cost: 5000000 },
		{ filename: 'HTTPWorm.exe', cost: 30000000 },
		{ filename: 'SQLInject.exe', cost: 250000000 },
		{ filename: 'ServerProfiler.exe', cost: 500000000 },
		{ filename: 'DeepscanV1.exe', cost: 500000000 },
		{ filename: 'DeepscanV2.exe', cost: 25000000 },
		{ filename: 'AutoLink.exe', cost: 1000000 },
		{ filename: 'Formulas.exe', cost: 5000000000 }
	];
	let torCost = 200000;
	let spent = 0;
	let boughtTools = [];

	if (ns.getPlayer().bitNodeN < 4) {
		ns.tprint(`This script requires Source-File 4+ to run. You're at ${ns.getPlayer().bitNodeN}`);
		return;
	}

	if (ns.getPlayer().bitNodeN >= 4 && ns.getServerMoneyAvailable('home') >= torCost && ns.purchaseTor()) {
		ns.tprint(`Purchased TOR router`);
		boughtTools.push('TOR router');
		spent += torCost;
	}

	for (let i = 0; i < programs.length; i++) {
		const program = programs[i];

		if (!ns.fileExists(program.filename) && (ns.getServerMoneyAvailable('home') >= program.cost) && ns.purchaseProgram(program.filename)) {
			ns.tprint(`Purchasd ${program.filename}`);
			boughtTools.push(program.filename);
			spent += program.cost;
		}
	}

	if (spent) {
		ns.tprint(`Bought ${boughtTools.join(', ')}; spent ${formatMagnitude(spent, 'k')}`);
	} else {
		ns.tprint('Bought nothing... you broke, brah?');
	}
}