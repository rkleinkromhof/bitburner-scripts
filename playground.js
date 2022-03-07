import {
	Arrays,
	seconds,
	minutes,
	hours,
	createLogger,
	disableLogs,
} from '/util-helpers.js';
import {
	formatDuration,
	formatMoney,
	formatPercent,
	formatRam,
	formatTime,
} from '/util-formatters.js';
import {
	getOpenablePorts,
	scanServers,
} from '/util-servers.js';
import HackAnalysis from '/classes/HackAnalysis.js';

/**
 * Global Namespace reference.
 * @type NS
 */
let ns;

/**
 * Logs the given message
 * @param {String} message
 * @type Function
 */
let log;

let host; // The host to run on. Should only be 'home'.

const silencedServices = [
	'disableLog',
	'exec',
	'getHackingLevel',
	'getServerMaxMoney',
	'getServerMaxRam',
	'getServerMinSecurityLevel',
	'getServerMoneyAvailable',
	'getServerRequiredHackingLevel',
	'getServerSecurityLevel',
	'getServerUsedRam',
	'scan',
	'sleep',	
];

const argsSchema = [
	['ltt', false],
	['log-to-terminal', false],
	['reserve-ram', 0], // in GB
	['top', 0],
	['eff', false]
];

const hackMoneyPercentage = 0.0625; // Hack for this factor of money (0.0625 = 6.25%)

let startTime;
let options;
let reserveRam;
const loopInterval = seconds(1); // 1s between loops.


const serverIgnoreList = [
	'darkweb'
];
const availableServers = [];

/** @param {NS} ns **/
export async function main(_ns) {
	ns = _ns;
	host = ns.getHostname();
	startTime = Date.now();

	options = ns.flags(argsSchema);

	log = createLogger(ns, {
		logToTerminal: options.ltt || options['log-to-terminal'], // -t or -log-to-terminal command line arguments; logs most messages to terminal too.
		prefix: () => `[${formatTime()}] `
	});

	reserveRam = options['reserve-ram'];

	disableLogs(ns, silencedServices);

	inventarizeServers();

	let continuous = true;

	while (continuous) {
		mainLoop();
		await ns.sleep(loopInterval);

		continuous = false;
	}
	// const server = ns.getServer('n00dles');
	// const analysis = new HackAnalysis({
	// 	ns,
	// 	server,
	// 	allocatedRam: ns.getServerMaxRam(host) - ns.getServerUsedRam(host) - reserveRam,
	// 	hackMoneyPercentage
	// });

	// log(`${server.hostname} - (${server.requiredHackingLevel}) (${formatPercent(analysis.hackMoneyPercentage)}) runtime ${formatDuration(analysis.totalRuntime)}, est. profitability = ${formatMoney(analysis.profitPerSec)}/s (${formatMoney(analysis.hackMoney)}) or ${formatMoney(analysis.profitPerMb)}/MB (${formatRam(analysis.totalRamCost)}), efficiency = ${analysis.profitabilityEfficiency}/s/MB`);
}

function mainLoop() {
	log(`processing ${availableServers.length} available servers`);
	const hackSkill = ns.getHackingLevel();
	const openablePorts = getOpenablePorts(ns);

	const ramAvailable = ns.getServerMaxRam(host) - ns.getServerUsedRam(host) - reserveRam;
	const analyses = Array.prototype.slice.call(availableServers)
		.filter(server => server.requiredHackingLevel <= hackSkill)
		.filter(server => server.numOpenPortsRequired <= openablePorts)
		.map(server => new HackAnalysis({ns, server, allocatedRam: ramAvailable, hackMoneyPercentage}));
	
	if (options.eff) {
		analyses.sort((serverA, serverB) => (serverA.profitabilityEfficiency || 0) - (serverB.profitabilityEfficiency || 0));
	} else {
		analyses.sort((serverA, serverB) => (serverA.profitPerSec || 0) - (serverB.profitPerSec || 0));
	}

	analyses.reverse();

	if (options.top) {
		analyses.splice(options.top);
	}

	for (let i = 0; i < analyses.length; i++) {
		const analysis = analyses[i];
		const server = analysis.server;

		let prepped = [];

		if (analysis.isSecurityPrepped) {
			prepped.push('Security');
		}
		if (analysis.isMoneyPrepped) {
			prepped.push('Money');
		}

		// log(`(${String.prototype.padStart.call(i, 2)}) ${server.hostname} - prepped = ${analysis.isPrepped ? prepped.join(' & ') : 'No'}, est. profitability = ${formatMoney(analysis.profitPerSec)}/s or ${formatMoney(analysis.profitPerMb)}/MB, efficiency = ${analysis.profitabilityEfficiency}/s/MB`);
		// log(`(${String.prototype.padStart.call(i+1, 2)}) ${server.hostname} - (${server.requiredHackingLevel}) runtime ${formatDuration(analysis.totalRuntime)}, est. profitability = ${formatMoney(analysis.profitPerSec)}/s (${formatMoney(analysis.hackMoney)}) or ${formatMoney(analysis.profitPerMb)}/MB (${formatRam(analysis.totalRamCost)}), efficiency = ${analysis.profitabilityEfficiency}/s/MB`);
		log(`(${String.prototype.padStart.call(i+1, 2)}) ${server.hostname} - (${server.requiredHackingLevel}) (${formatPercent(analysis.hackMoneyPercentage)}) runtime ${formatDuration(analysis.totalRuntime)}, est. profitability = ${formatMoney(analysis.profitPerSec)}/s (${formatMoney(analysis.hackMoney)}) or ${formatMoney(analysis.profitPerMb)}/MB (${formatRam(analysis.totalRamCost)}), efficiency = ${analysis.profitabilityEfficiency}/s/MB`);
	}
}

function inventarizeServers() {
	Arrays.eraseAll(availableServers);

	let servers = scanServers(ns, 0, 0, 'all')
		.filter(server => !Arrays.contains(serverIgnoreList, server.hostname)); // Remove ignored servers.

	Arrays.add(availableServers, ...servers);
}