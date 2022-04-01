import {
	createLogger,
	disableLogs
} from '/util-helpers.js';
import {
	formatMoney
} from '/util-formatters.js';

const silencedServices = [
	'disableLog',
	'getServerMoneyAvailable',
	'joinFaction',
	'sleep',
	'travelToCity',
	'workForFaction',
];

const cityFactions = [
	{name: 'Sector-12', side: 'west', reqMoney: 15000000},
	{name: 'Aevum', side: 'west', reqMoney: 40000000},
	{name: 'Volhaven', side: 'central', reqMoney: 50000000},
	{name: 'Chongqing', side: 'east', reqMoney: 20000000},
	{name: 'New Tokyo', side: 'east', reqMoney: 20000000},
	{name: 'Ishima', side: 'east', reqMoney: 30000000},
];
const tianDiHuiFaction = {
	name: 'Tian Di Hui',
	reqMoney: 1000000,
	reqHackingLevel: 50,
	cities: ['Chongqing', 'New Tokyo', 'Ishima']
};

const factionServers = [
	'CSEC', // CSEC
	'avmnite-02h', // NiteSec
	'I.I.I.I.', // The Black Hand
	'run4theh111z', // Bitrunners
];

const factionWorkTypes = [
	'hacking', // Hacking Contracts
	'field', // Field Work
	'security', // Security Work
];

const argsSchema = [
	['interval', 5000],
    ['once', false], // Set to true to run only once instead of continuously.
	['city-faction-side', 'west'], // Which city factions to side with: west: Sector-12 and Aevum, central: Volhaven, east: Chonqing, New Tokyo, Ishima.
	['allow-travel-for-faction', true],
	['reserve-money', 1000000], // Reserve at least this much money when travelling.
];

const travelCost = 200000;

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
let interval;
let logToTerminal;
let ignoredFactionNames;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
	options = ns.flags(argsSchema);

	disableLogs(ns, silencedServices);

	interval = options.interval;
	const once = options.once;
	logToTerminal = options.terminal;

	log = createLogger(ns, logToTerminal);
	const preferredCityFactionSide = findCityFactionSide(options['city-faction-side']); // We can select a preferred side by config.
	const travelForFaction = options['allow-travel-for-faction'];
	const reserveMoney = options['reserve-money'];

	log.info(`Starting Faction Manager - siding with factions from the ${preferredCityFactionSide} side, ${travelForFaction ? `can travel but reserving ${formatMoney(reserveMoney)}` : `won't travel`}`);

	ignoredFactionNames = cityFactions
		.filter(faction => faction.side !== preferredCityFactionSide)
		.map(faction => faction.name);

	do {
		if (travelForFaction && reserveMoney <= ns.getServerMoneyAvailable('home')) {
			await unlockCityFactions(preferredCityFactionSide, reserveMoney);
		}
		acceptFactionInvitations();

		await ns.sleep(interval);
	} while (!once);

	log.info('Faction Manager done');
}

function acceptFactionInvitations() {
	for (const faction of ns.checkFactionInvitations()) {
		if (!ignoredFactionNames.includes(faction) && ns.joinFaction(faction)) {
			log.info(`Joined faction ${faction}. We have ${ns.getFactionFavor(faction)} favor with them.`);
			if (!ns.isBusy()) {
				// If we're not busy, start working for the newly joined faction.
				// Try out work types until one sticks.
				factionWorkTypes.some(workType => ns.workForFaction(faction, workType));
			}
		}

		// log.info(`Got invitation from ${faction}.${cityFactions.all.includes(faction) ? ` This is a city faction${cityFactionsToJoin.includes(faction) ? ' that we want to join.' : ' that we will ignore.'}` : ''}`);
	}
}

async function unlockCityFactions(side, reserveMoney) {
	const player = ns.getPlayer();

	// Special case: Tian Di Hui, which isn't a City Faction but does requires you to be somewhere.
	if (
		  !isUnlocked(tianDiHuiFaction.name) &&
		  !tianDiHuiFaction.cities.includes(player.location) &&
		  player.money >= (tianDiHuiFaction.reqMoney + travelCost) &&
		  player.hacking >= tianDiHuiFaction.reqHackingLevel
	) {
		log.info(`Traveling to ${tianDiHuiFaction.cities[0]} to join ${tianDiHuiFaction.name}`);
		ns.travelToCity(tianDiHuiFaction.cities[0]);
		
		await ns.sleep(1000); // Give the game a bit of time to trigger the faction.
	}

	const cityFactionsToUnlock = cityFactions
		// We can unlock factions that are on our side, that we haven't unlocked yet, that are somewhere else than we are (or they'd unlock already) and we have enough money for.
		.filter(faction => faction.side === side && !isUnlocked(faction.name) && player.location !== faction.location && player.money >= (faction.reqMoney + travelCost));

	for (const faction of cityFactionsToUnlock) {
		log.info(`Traveling to ${faction.name} to join that city's faction`);
		ns.travelToCity(faction.name);

		await ns.sleep(1000); // Give the game a bit of time to trigger the faction.
	}
}

function isUnlocked(faction) {
	const player = ns.getPlayer();

	return player.factions.includes(faction) || ns.checkFactionInvitations().includes(faction);
}

function findCityFactionSide(fallback) {
	const player = ns.getPlayer();
	let foundCityFaction = cityFactions
		.find(faction => player.factions.includes(faction.name));

	return foundCityFaction?.side || fallback;
}

function calcTravelCost(toCity) {
	return ns.getPlayer().location === toCity ? 0 : travelCost;
}

class CityFaction {
	#name;

	/**
	 * @type {Requirement[]} requirements
	 */
	#requirements;

	constructor(name, requirements) {
		this.#name = name;
		this.#requirements = requirements;
	}

	get name() {
		return this.#name;
	}

	get requirements() {
		return Array.prototype.slice.call(this.#requirements);
	}
}

// Faction requirement types:
// backdoored server
// money
// skill level (hacking, combat)
// be at location
// reputation with a certain corporation
// Karma
// kills
// not working for CIA or NSA
// CTO, CFO or CEO of a company