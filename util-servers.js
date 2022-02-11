import ServerLight from '/classes/ServerLight.js';

/**
 * Breaches the given server.
 * @param {NS} ns Namespace
 * @returns {boolean} `true` if the given server is breached and we now have root access to it.
 **/
export function breachServer(ns, target) {
	if (ns.fileExists('BruteSSH.exe', 'home')) {
		ns.brutessh(target);
	}
	
	if (ns.fileExists('FTPCrack.exe', 'home')) {
		ns.ftpcrack(target);
	}

	if (ns.fileExists('relaySMTP.exe', 'home')) {
		ns.relaysmtp(target);
	}

	if (ns.fileExists('HTTPWorm.exe', 'home')) {
		ns.httpworm(target);
	}

	if (ns.fileExists('SQLInject.exe', 'home')) {
		ns.sqlinject(target);
	}

	if (!ns.hasRootAccess(target)) {
		ns.nuke(target);
	}
	
	return ns.hasRootAccess(target);
}

/**
 * Scans for servers matching the given conditions.
 * @param {NS} ns Namespace
 * @param {number} serverMinMaxRam // Minimum of max RAM on a server. Default to 4GB.
 * @param {number} serverMinMaxMoney Minimum amount of max money available on a server or skip that server. Default to $1000.
 * @param {ServerLight[]} options Filter options
 */
export function scanServers(ns, serverMinMaxRam, serverMinMaxMoney, ...options) {
	options = options ? Array.prototype.slice.call(options) : []; // Copy the options array, if we have one.

	let openablePorts = getOpenablePorts(ns);
	let servers = deepScan(ns, ns.getHostname());
	let hackingSkill = ns.getHackingLevel();
	let optionHacked = contains(options, 'hacked');
	let optionUnhacked = contains(options, 'unhacked');
	let optionHackable = contains(options, 'hackable');
	let optionNoAvailableMoney = contains(options, 'nomoney');
	let optionNoMaxMoney = contains(options, 'nomaxmoney');
	let optionNoRam = contains(options, 'noram');
	let optionAll = contains(options, 'all');

	// Shortcut for scanning for all servers.
	if (optionAll) {
		return servers
			.map(server => new ServerLight(ns, server))
			.sort((serverA, serverB) => serverA.requiredHackingSkill - serverB.requiredHackingSkill);
	}
	
	return servers
		.map(server => new ServerLight(ns, server))
		.filter(server => server.numOpenPortsRequired <= openablePorts)
		.filter(server => optionNoRam ? server.maxRam === 0 : server.maxRam >= serverMinMaxRam)
		.filter(server => !optionNoAvailableMoney || server.moneyAvailable === 0)
		.filter(server => optionNoMaxMoney ? server.moneyMax === 0 : server.moneyMax >= serverMinMaxMoney)
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

/**
 * Finds a node somewhere in the network of nodes.
 * 
 * @param {NS} ns Namespace
 * @param {string} parent The parent server name (yes, this 'network' is a tree)
 * @param {string} hostname The host server name
 * @param {string} target The target server name
 * @returns {Promise<String[]>} path of servers to get from the root to the target.
 */
export function findNode(ns, parent, hostname, target) {
	// Shortcut if we've already found our target.
	if (hostname === target) {
		return [target];
	}	

	let nodes = ns.scan(hostname)
		.filter(server => server !== parent) // Servers can also connect to their parent, but we don't want to get stuck in an infinite loop, so, yeah, remove that.
		.filter(server => !ns.getServer(server).purchasedByPlayer);// Ignore our own servers.

	let foundNode = [];
	let node;

	while (!foundNode.length && nodes.length && (node = nodes.shift())) {
		foundNode = findNode(ns, hostname, node, target);
	}
	
	return (foundNode && foundNode.length) ? [hostname].concat(...foundNode) : [];
}

/**
 * Get all options available for scanning servers.
 * @return {String[]} options
 */
export function getScanServerOptions() {
	return ['hacked', 'unhacked', 'hackable', 'noram', 'nomoney', 'nomaxmoney'];
}

function contains(arr, value) {
	return Array.prototype.indexOf.call(arr, value) >= 0;
}