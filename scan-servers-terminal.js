import {
	scanServers
} from './util-servers.js';
import {
	formatMoney,
	formatNumber,
	formatRam
} from './util-formatters.js';

/**
 * @param {NS} ns Namespace
 */
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} ([minimum max RAM]) ([minimum max money]) ([...options])`);
		ns.tprint(` => available options: ${getScanServerOptions().join(', ')}`);
		return;
	}

	// Arguments
	let options = Array.prototype.slice.call(ns.args);
	let serverMinMaxRam = isNaN(options[0]) ? 0 : parseInt(options.shift(), 10); // Minimum of max RAM on a server or skip it. Default to 4GB.
	let serverMinMaxMoney = isNaN(options[0]) ? 0 : parseInt(options.shift(), 10); // Minimum amount of max money available on a server or skip that server. Default to $1000.
	let optionHacked = contains(options, 'hacked');

	let serversLeft = scanServers(ns, serverMinMaxRam, serverMinMaxMoney, ...options); // Scan for servers with the RAM and money restrictions and maybe options.

	ns.tprint(`Listing servers: ${options.length ? (`[options: ${options.join(', ')}]`)  : ''}`);

	if (serversLeft.length) {
		serversLeft.forEach((server, index) => {
			let ramUsedPercent = server.ramAvailable ? (100 / server.maxRam * server.ramAvailable) : "0";
			let moneyAvailablePercent = server.moneyAvailable ? (100 / server.moneyMax * server.moneyAvailable) : "0";

			ns.tprint(`(${String.prototype.padStart.call(index + 1, 2, '0')}) ${server.hostname} - Hack: ${server.requiredHackingSkill}, Req. open ports: ${server.numOpenPortsRequired}, RAM: ${formatRam(server.ramAvailable)}/${formatRam(server.maxRam)} (${formatNumber(ramUsedPercent, 3, 2)}%), Money: ${formatMoney(server.moneyAvailable)}/${formatMoney(server.moneyMax)} (${formatNumber(moneyAvailablePercent, 3, 2)}%)${(!optionHacked && server.hasAdminRights) ? ' [ACCESS]' : ''}`)
		});
	} else {
		ns.tprint(`No servers found.`);
	}
}

function contains(arr, value) {
	return Array.prototype.indexOf.call(arr, value) >= 0;
}