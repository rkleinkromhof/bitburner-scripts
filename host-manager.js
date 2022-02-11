import {
	createLogger,
	disableLogs
} from '/util-helpers.js';
import {
	formatDuration,
	formatMoney,
	formatRam
} from '/util-formatters.js';
import {
	breachServer,
	getOpenablePorts,
	scanServers
} from '/util-servers.js';

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

let silencedServices = [
	'brutessh',	
	'codingcontract.attempt',
	'disableLog',
	'exec',
	'ftpcrack',
	'getHackingLevel',
	'getServerSecurityLevel',
	'getServerMaxRam',
	'getServerMinSecurityLevel',
	'getServerMoneyAvailable',
	'getServerMaxMoney',
	'getServerNumPortsRequired',
	'getServerUsedRam',
	'getServerRequiredHackingLevel',
	'httpworm',
	'nuke',
	'relaysmtp',
	'scan',
	'sleep',
	'sqlinject',
];

const argsSchema = [
	['continuous', false], // Set to true to run continuously, otherwise, it runs once.
	['c', false], // Alias for continuous.
	['interval', 1000], // Rate at which the program purchases upgrades when running continuously.
	['terminal', false], // `true` to log to terminal too.
];

let options;
let logToTerminal;
let hosts;

/**
 * @param {NS} _ns Namespace
 */
export async function main(_ns) {
	ns = _ns;
	options = ns.flags(argsSchema);

	disableLogs(ns, silencedServices);

	const continuous = options.c || options.continuous;
	const interval = options.interval;
	logToTerminal = options.terminal;

	log = createLogger(ns, logToTerminal);

	let allBreached = false;

	do {
		breachServers();

		await ns.sleep(interval);

		// If we have all the port crackers and we've just breached servers
		// assume we've done all we can and stop looping.
		allBreached === getOpenablePorts(ns) === 5;
	} while (continuous && !allBreached)
}

function breachServers() {
	const targets = scanServers(ns, 0, 0, 'unhacked');

	if (targets.length > 0) {
		for (let i = 0; i < targets.length; i++) {	
			let hostname = targets[i].hostname
			if (breachServer(ns, hostname)) {
				log(`Gained root access to ${hostname}`)
			}
		}
	}
}