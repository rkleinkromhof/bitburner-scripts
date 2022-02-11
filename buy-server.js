import {formatMoney} from "./util-formatters.js";
import {allGameServers} from '/util-helpers.js';

const memValues = (function () {
	const maxMemStep = 20;
	const values = [];

	for (let step = 1; step <= maxMemStep; step++) {
		values.push('' + Math.pow(2, step)); // Convert to string.
	}

	return values;
})();

export function autocomplete(data, args) {
	let allOtherServers = Array.prototype.filter.call(data.servers, server => allGameServers.indexOf(server) < 0);

	return args.length <= 1 ? [...memValues, 'highest', 'max'] : [...allOtherServers];
}

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
		ns.tprint(`You don't have enough money to purchase ${nOfServers} server(s) with ${mem}GB of RAM. You need ${formatMoney(totalCost - moneyAvailable)} more`);
	} else {
		names.every((name) => {
			let boughtServer = ns.purchaseServer(name, mem);

			if (boughtServer) {
				ns.tprint(`Purchased server "${boughtServer}" with ${mem}GB of RAM for ${formatMoney(purchaseCost)}`);
			}
			else {
				ns.tprint(`Failed to purchase server. Are you at max capacity?`);
			}

			return !!boughtServer;
		});
	}
}