import {
	createLogger,
	disableLogs
} from '/util-helpers.js';
import {
	breachServer,
	connectTo,
	getOpenablePorts,
	scanServers
} from '/util-servers.js';

const homeName = 'home';

const portCrackerPrices = [
	{ name: 'BruteSSH.exe', price: 500000 },
	{ name: 'FTPCrack.exe', price: 1500000 },
	{ name: 'relaySMTP.exe', price: 5000000 },
	{ name: 'HTTPWorm.exe', price: 30000000 },
	{ name: 'SQLInject.exe', price: 250000000 },
];

const argsSchema = [
	['once', false], // Set to true to run once; otherwise, it will run continuously.
	['interval', 1000], // Rate at which the program purchases upgrades when running continuously.
	['terminal', false], // `true` to log to terminal too.
	['max-home-ram', 16384],
	['max-home-cores', 4],
	['reserve-money', 1000000], // Reserve this much money when doing purchases.
];

const silencedServices = [
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
	'installBackdoor',
	'nuke',
	'purchaseProgram',
	'relaysmtp',
	'scan',
	'sleep',
	'sqlinject',
	'upgradeHomeCores',
	'upgradeHomeRam',
];

const factionServers = [
	'CSEC', // CSEC
	'avmnite-02h', // NiteSec
	'I.I.I.I.', // The Black Hand
	'run4theh111z', // Bitrunners
];

const serverIgnoreList = [
	'darkweb'
];

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

let options;
let logToTerminal;
// let hosts;

/**
 * @param {NS} _ns Namespace
 */
export async function main(_ns) {
	ns = _ns;
	options = ns.flags(argsSchema);

	disableLogs(ns, silencedServices);

	const once = options.once;
	const interval = options.interval;
	logToTerminal = options.terminal;

	log = createLogger(ns, logToTerminal);

	do {
		if (getOpenablePorts(ns) < 5) {
			checkBuyPortCrackers();
		}
		breachServers();
		buyHomeUpgrades();
		await backdoorFactionServers();

		await ns.sleep(interval);

	} while (!once && !jobsDone());

	log.info('Host Manager done');
}

function breachServers() {
	const targets = scanServers(ns, 0, 0, 'unhacked');

	if (targets.length > 0) {
		for (let i = 0; i < targets.length; i++) {	
			let hostname = targets[i].hostname;

			if (breachServer(ns, hostname)) {
				log.info(`Gained root access to ${hostname}`)
			}
		}
	}
}

function checkBuyPortCrackers() {
	const hackingSkill = ns.getHackingLevel();
	const wantedPortCrackLevel = scanServers(ns, 0, 0, 'all')
		.filter(server => server.requiredHackingSkill <= hackingSkill)
		.filter(server => !serverIgnoreList.includes(server.hostname))
		.map(server => server.numOpenPortsRequired)
		.sort()
		.pop();

	// log.info(`Wanted crack level: ${wantedPortCrackLevel}`);
	upgradePortCrackingAbility(wantedPortCrackLevel);
}

function upgradePortCrackingAbility(level) {
	const wantedLevel = Math.min(level, portCrackerPrices.length); // We can't upgrade farther than the amount of port crackers available.
	const currentLevel = getOpenablePorts(ns);
	const upgrades = portCrackerPrices.filter(cracker => !ns.fileExists(cracker.name));

	if (currentLevel < wantedLevel) {
		upgrades.slice(0, wantedLevel - currentLevel)
			// buy every upgrade we can afford
			.every(upgrade => {
				if (allowPurchase(upgrade.price, 'program') && ns.purchaseProgram(upgrade.name)) {
					log.info(`Purchased program ${upgrade.name}`);
					return true;
				}
				return false;
			});
	}
}

function buyHomeUpgrades() {
	if (allowPurchase(ns.getUpgradeHomeRamCost(), 'upgrade-home-ram') && ns.upgradeHomeRam()) {
		log.info(`Upgraded Home RAM to ${ns.getServer(homeName).maxRam}`);
	}
	if (allowPurchase(ns.getUpgradeHomeCoresCost(), 'upgrade-home-cores') && ns.upgradeHomeCores()) {
		log.info(`Upgraded Home Cores to ${ns.getServer(homeName).cpuCores}`);
	}
}

function allowPurchase(cost, purchase) {
	// Make sure we have at least the configured reserve money left, or 10% of the cost, whichever is higher .
	return ns.getServerMoneyAvailable(homeName) - cost >= Math.max(0.1 * cost, options['reserve-money']);
}

function jobsDone() {
	// do a cheap check first to see if we have all port crackers; if so, then check if we've rooted every server. 
	const allBreached = getOpenablePorts(ns) === 5 && scanServers(ns, 0, 0, 'all').every(server => ns.hasRootAccess(server.hostname));
	const homeServer = ns.getServer(homeName);

	return allBreached && homeServer.maxRam >= options['max-home-ram'] && homeServer.cpuCores >= options['hax-home-cores'];
}

async function backdoorFactionServers() {
	const unbackdooredServers = scanServers(ns, 0, 0, 'hackable')
		.filter(server => server.hostname !== homeName)
		.filter(server => !server.backdoorInstalled);

	for (const server of unbackdooredServers) {
		if (connectTo(ns, server.hostname)) {
			log.info(`Installing backdoor on ${server.hostname}`);
			await ns.installBackdoor(); // This can take a while depending on our hack skill level.
			log.info(`Backdoor installed on ${server.hostname}`);
			ns.connect(homeName); // And back to home.
		}
	}
}