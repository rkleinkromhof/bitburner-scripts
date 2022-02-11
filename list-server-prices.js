import {formatMoney} from "./util-formatters.js";

/** @param {NS} ns **/
export async function main(ns) {
	let [nOfServers = 1] = ns.args;
	let moneyAvailable = ns.getServerMoneyAvailable('home');
	let maxRam = ns.getPurchasedServerMaxRam();
	let prices = [];

	let padLeft = (str, len, fill = ' ') => {
		return String.prototype.padStart.call(str, len, fill);
	}

	// if (!ns.args.length) {
	// 	ns.tprint(`Usage: ${ns.getScriptName()} [nOfServers]`);
	// 	return;
	// }
	let i = 0;

	for (let mem = 2; mem <= maxRam; mem*= 2) {
		let costPerServer = ns.getPurchasedServerCost(mem);
		let nOfServersCanBuy = Math.floor(moneyAvailable / costPerServer);
		i++;

		ns.tprint(`(${padLeft(i, 2)}) ${nOfServers} server${nOfServers === 1 ? '' : 's'} with ${padLeft(mem, 7)}GB for ${padLeft(formatMoney(costPerServer), 9)} per server = ${padLeft(formatMoney(nOfServers * costPerServer), 9)}. Can buy ${padLeft(Math.floor(nOfServersCanBuy), 10)} servers for ${padLeft(formatMoney(nOfServersCanBuy * costPerServer,), 9)}`);
	}
}