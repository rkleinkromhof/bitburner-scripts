import {formatMoney} from "./util-formatters.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length < 2) {
		ns.tprint(`Usage: run ${ns.getScriptName()} [mem] [hostname1] ([...other-hostnames])`);
		ns.tprint(`  => shortcuts for mem: max = maximum amount of RAM money can buy; highest = maximum amount of RAM you can afford.`);
		return;
	}

	let [mem, ...names] = ns.args;
	let moneyAvailable = ns.getServerMoneyAvailable('home');
	let nOfServers = names.length;

	if (mem === 'max') {
		mem = ns.getPurchasedServerMaxRam();
	} else if (mem === 'highest') {
		let maxAffordableMem = 2;
		while (ns.getPurchasedServerCost(maxAffordableMem) < moneyAvailable) {
			mem = maxAffordableMem;
			maxAffordableMem *= 2;
		}
	}

	let purchaseCost = ns.getPurchasedServerCost(mem);
	let totalCost = nOfServers * purchaseCost;

	if (ns.getServerMoneyAvailable('home') < totalCost) {
		ns.tprint(`You don't have enough money to purchase ${nOfServers} server(s) with ${mem}GB of RAM. You need \$${formatMoney(totalCost - moneyAvailable, 'm')} more`);
	} else {
		names.forEach((name) => {
			ns.purchaseServer(name, mem);
			ns.tprint(`Purchased server "${name}" with ${mem}GB of RAM for \$${formatMoney(purchaseCost, 'm')}`);
		});
	}
}