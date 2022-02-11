/**
 * @param {NS} ns Namespace
 */
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [minimum max RAM] [minimum max money] ([...options])`);
		ns.tprint(`  available options: hacked, unhacked, hackable`);
		return;
	}

	// Arguments
	let [...options] = ns.args;
	let serverMinMaxRam = isNaN(options[0]) ? 4 : parseInt(options.unshift(), 10); // Minimum of max RAM on a server or skip it. Default to 4GB.
	let serverMinMaxMoney = isNaN(options[0]) ? 1000 : parseInt(options.unshift(), 10); // Minimum amount of max money available on a server or skip that server. Default to $1000.

	let openablePorts = getOpenablePorts(ns);
	let servers = deepScan(ns, ns.getHostname());
	let hackingSkill = ns.getHackingLevel();
	let optionHacked = contains(options, 'hacked');
	let optionUnhacked = contains(options, 'unhacked');
	let optionHackable = contains(options, 'hackable');

	let header = `Listing servers${options.length ? (` with options [${options.join(', ')}]`)  : ''} at Hack ${hackingSkill} and ${openablePorts} port crackers, with at least \$${serverMinMaxMoney} of maximum amount of money:`;
	ns.tprint(header);

	if (optionHacked && optionUnhacked) {
		// If both are true then we just show everything. It's just dumb to use both, but ok. We just disable them.
		ns.tprint(`pro tip: don't use both options 'hacked' and 'unhacked', because they just cancel each other out.`);
		optionHacked = optionUnhacked = false;
	}

	ns.tprint('='.repeat(header.length));

	let serversLeft = servers
		.map(server => ns.getServer(server))
		.filter(server => server.numOpenPortsRequired <= openablePorts)
		.filter(server => server.maxRam >= serverMinMaxRam)
		.filter(server => server.moneyMax > serverMinMaxMoney)
		.filter(server => !optionHacked || server.hasAdminRights)
		.filter(server => !optionUnhacked || !server.hasAdminRights)
		.filter(server => !optionHackable || server.requiredHackingSkill <= hackingSkill)
		// .filter(server => !(optionHacked && server.hasAdminRights) || !(optionUnhacked && !server.hasAdminRights) || !(optionHackable && server.requiredHackingSkill <= hackingSkill))
		.sort((serverA, serverB) => serverA.requiredHackingSkill - serverB.requiredHackingSkill);

	if (serversLeft.length) {
		serversLeft.forEach((server, index) => {
			let ramAvailable = server.maxRam - server.ramUsed;
			let formattedRamAvailable = Math.round(((ramAvailable) + Number.EPSILON) * 100) / 100;
			let ramUsedPercent = Math.round(((100 / server.maxRam * ramAvailable) + Number.EPSILON) * 100) / 100;

			ns.tprint(`(${String.prototype.padStart.call(index + 1, 2, '0')}) ${server.hostname} - Hack: ${server.requiredHackingSkill}, Req. open ports: ${server.numOpenPortsRequired}, RAM: ${formattedRamAvailable}/${server.maxRam}GB (${ramUsedPercent}%)${(!optionHacked && server.hasAdminRights) ? ' [HACKED]' : ''}`)
		});
	} else {
		ns.tprint(`No servers found.`);
	}
}

/**
 * @param {NS} ns Namespace
 * @returns {number} The number of ports we can open, which is the number of port opening programs we have.
 */
function getOpenablePorts(ns) {
	let openablePorts = 0;
	let portCrackers = [
		'BruteSSH.exe',
		'FTPCrack.exe',
		'relaySMTP.exe',
		'HTTPWorm.exe',
		'SQLInject.exe'
	];

	portCrackers.every(portCracker => {
		if (ns.fileExists(portCracker, 'home')) {
			openablePorts++;
			return true;
		}
		return false;
	});
	
	return openablePorts;
}

/**
 * Get the list of all servers connected to the given one.
 * 
 * @param {NS} ns Namespace
 * @param {string} hostname The server name
 * @returns {String[]} list of servers
 */
function deepScan(ns, hostname) {	
	let serversSeen = [hostname];

	for (let i = 0; i < serversSeen.length; i++) {
		let connectedServers = ns.scan(serversSeen[i]);

		for (let j = 0; j < connectedServers.length; j++) {
			if (serversSeen.indexOf(connectedServers[j]) < 0) {
				serversSeen.push(connectedServers[j]);
			}
		}
	}

	return serversSeen.slice(1); // Remove hostname from the list.
}

function contains(arr, value) {
	return Array.prototype.indexOf.call(arr, value) >= 0;
}