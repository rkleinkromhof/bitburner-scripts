import {
	formatMoney,
	formatNumber,
	formatPercent,
} from '/util-formatters.js';
import {
	createLogger,
	disableLogs
} from '/util-helpers.js';

const crimeNames = [
	'Shoplift',
	'Rob store',
	'Mug someone',
	'Larceny',
	'Deal Drugs',
	'Bond Forgery',
	'Traffick Illegal Arms',
	'Homicide',
	'Grand Theft Auto',
	'Kidnap and Random',
	'Assassinate',
	'Heist'
];

const silencedServices = [
	'disableLog',
	'commitCrime',
	'sleep',
];

const argsSchema = [
	['terminal', true], // `true` to log to terminal too.
];

let ns;

/** @param {NS} ns **/
export async function main(_ns) {
	ns = _ns;

	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} `);
		return;
	}

	const flagOpts = ns.flags(argsSchema);
	const logToTerminal = flagOpts.terminal;

	disableLogs(ns, silencedServices);
	ns.log = createLogger(ns, {logToTerminal}); // Bolt our log function onto the ns object.

	const crimes = crimeNames.map(crime => ns.getCrimeStats(crime));

	sortCrimesBy(crimes, calcProfitPerSec);
	crimes.reverse(); // Most profitable one first.

	ns.log('Crimes by profit per second:');
	for (const crime of crimes) {
		const successChance = ns.getCrimeChance(crime.name);
		ns.log(`${crime.name} (${crime.type}) - ${formatPercent(successChance)} - profit = ${formatMoney(calcProfitPerSec(crime))}/s`);
	}

	sortCrimesBy(crimes, calcTotalExpGainPerSec);
	crimes.reverse(); // Most profitable one first.

	ns.log('Crimes by experience per second:');
	for (const crime of crimes) {
		const successChance = ns.getCrimeChance(crime.name);
		ns.log(`${crime.name} (${crime.type}) - ${formatPercent(successChance)} - exp. gain = ${formatNumber(calcTotalExpGainPerSec(crime))}/s (str: ${crime.strength_exp}, def: ${crime.defense_exp}, dex: ${crime.dexterity_exp}, agi: ${crime.agility_exp}, cha: ${crime.charisma_exp})`);
	}
}

function calcProfitPerSec(crime) {
	const adjustedGains = crime.money * getAdjustedChance(crime.name);

	return adjustedGains / (crime.time / 1000);
}

function calcTotalExpGainPerSec(crime) {
	const totalExp = crime.strength_exp + crime.defense_exp + crime.dexterity_exp + crime.agility_exp + crime.charisma_exp;
	const adjustedChance = getAdjustedChance(crime.name);

	return totalExp * adjustedChance / (crime.time / 1000);
}

function sortCrimesBy(crimes, compareFn) {
	crimes.sort((crimeA, crimeB) => compareFn(crimeA) - compareFn(crimeB));
}

function getAdjustedChance(crimeName) {
	return Math.pow(ns.getCrimeChance(crimeName), 2); // Favor higher chances over lower ones.
}

function getBestCrimeFor(crimes, compareFn) {
	sortCrimesBy(crimes, compareFn);

	return crimes[crimes.length - 1];
}