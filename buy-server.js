import {formatMoney} from "util-formatters.js";

/** @param {NS} ns **/
export async function main(ns) {
	let [mem, ...names] = ns.args;
	let moneyAvailable = ns.getServerMoneyAvailable('home');
	let nOfServers = names.length;

	if (mem === 'max') {
		mem = ns.getPurchasedServerMaxRam();
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