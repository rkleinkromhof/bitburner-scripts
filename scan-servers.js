import {scanServers} from './util-servers.js';
import {formatMagnitude} from './util-formatters.js';

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
	let serverMinMaxRam = isNaN(options[0]) ? 4 : parseInt(options.shift(), 10); // Minimum of max RAM on a server or skip it. Default to 4GB.
	let serverMinMaxMoney = isNaN(options[0]) ? 1000 : parseInt(options.shift(), 10); // Minimum amount of max money available on a server or skip that server. Default to $1000.
	let optionHacked = contains(options, 'hacked');

	ns.tprint(`Listing servers: ${options.length ? (`[options: ${options.join(', ')}]`)  : ''}`);

	let serversLeft = scanServers(ns, serverMinMaxRam, serverMinMaxMoney, ...options); // Scan for servers with the RAM and money restrictions and maybe options.

	if (serversLeft.length) {
		serversLeft.forEach((server, index) => {
			let ramAvailable = server.maxRam - server.ramUsed;
			let formattedRamAvailable = ramAvailable ? Math.round(((ramAvailable) + Number.EPSILON) * 100) / 100 : "0";
			let ramUsedPercent = ramAvailable ? Math.round(((100 / server.maxRam * ramAvailable) + Number.EPSILON) * 100) / 100 : "0";

			ns.tprint(`(${String.prototype.padStart.call(index + 1, 2, '0')}) ${server.hostname} - Hack: ${server.requiredHackingSkill}, Req. open ports: ${server.numOpenPortsRequired}, RAM: ${formattedRamAvailable}/${server.maxRam}GB (${ramUsedPercent}%), Money: \$${formatMagnitude(server.moneyAvailable, 'm')}/${formatMagnitude(server.moneyMax, 'm')}${(!optionHacked && server.hasAdminRights) ? ' [ACCESS]' : ''}`)
		});
	} else {
		ns.tprint(`No servers found.`);
	}
}

function contains(arr, value) {
	return Array.prototype.indexOf.call(arr, value) >= 0;
}