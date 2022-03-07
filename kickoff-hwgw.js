import {
	scanServers
} from '/util-servers.js';
import {
	Arrays,
	disableLogs,
} from '/util-helpers.js';

const serverIgnoreList = [
	'darkweb'
];

const silencedServices = [
	'disableLog',
	'getHackingLevel',
	'getServerMaxMoney',
	'getServerMaxRam',
	'getServerMoneyAvailable',
	'getServerNumPortsRequired',
	'getServerRequiredHackingLevel',
	'getServerUsedRam',
	'scan',
];

const argsSchema = [
	['threads', 10000],
];

const hackScript = 'do-hwgw.js';

/**
 * @param {NS} ns Namespace
 */
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} ([threads=10000])`);
		return;
	}

	disableLogs(ns, silencedServices);

	const flagOpts = ns.flags(argsSchema);
	const threads = flagOpts.threads;

	const alreadyHackingServers = ns.ps('home')
		.filter(process => process.filename === hackScript)
		.map(process => process.args[0]);

	const servers = scanServers(ns, 0, 1, 'hackable')
		.filter(server => !Arrays.contains(serverIgnoreList, server.hostname)) // Remove ignored servers.
		.filter(server => !Arrays.contains(alreadyHackingServers, server.hostname));

	if (servers.length) {
		for (const server of servers) {
			ns.exec(hackScript, ns.getHostname(), 1, server.hostname, threads);
			// ns.tprint(`ns.exec(${hackScript}, ${ns.getHostname()}, 1, ${server.hostname}, ${threads});`);
		}

	} else {
		ns.tprint(`No servers found.`);
	}
}