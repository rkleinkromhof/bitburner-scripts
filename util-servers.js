/**
 * Scans for servers matching the given conditions.
 * @param {NS} ns Namespace
 * @param {number} serverMinMaxRam // Minimum of max RAM on a server. Default to 4GB.
 * @param {number} serverMinMaxMoney Minimum amount of max money available on a server or skip that server. Default to $1000.
 * @param {Array} options Filter options
 */
export function scanServers(ns, serverMinMaxRam, serverMinMaxMoney, ...options) {
	options = options ? Array.prototype.slice.call(options) : []; // Copy the options array, if we have one.

	let openablePorts = getOpenablePorts(ns);
	let servers = deepScan(ns, ns.getHostname());
	let hackingSkill = ns.getHackingLevel();
	let optionHacked = contains(options, 'hacked');
	let optionUnhacked = contains(options, 'unhacked');
	let optionHackable = contains(options, 'hackable');

	return servers
		.map(server => ns.getServer(server))
		.filter(server => server.numOpenPortsRequired <= openablePorts)
		.filter(server => server.maxRam >= serverMinMaxRam)
		.filter(server => server.moneyMax >= serverMinMaxMoney)
		.filter(server => !optionHacked || server.hasAdminRights)
		.filter(server => !optionUnhacked || !server.hasAdminRights)
		.filter(server => !optionHackable || server.requiredHackingSkill <= hackingSkill)
		.sort((serverA, serverB) => serverA.requiredHackingSkill - serverB.requiredHackingSkill);
}

/**
 * @param {NS} ns Namespace
 * @returns {number} The number of ports we can open, which is the number of port opening programs we have.
 */
export function getOpenablePorts(ns) {
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
export function deepScan(ns, hostname) {	
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