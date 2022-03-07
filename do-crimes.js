import {
	formatDuration,
	formatMoney,
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
	['terminal', false], // `true` to log to terminal too.
	['threads', 10000],
	['training-frequency', 5], // train every 10 crimes.
];

let ns;

/** @param {NS} _ns **/
export async function main(_ns) {
	ns = _ns;

	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} `);
		return;
	}

	const flagOpts = ns.flags(argsSchema);
	const logToTerminal = flagOpts.terminal;
	const trainingFrequency = flagOpts['training-frequency'];

	disableLogs(ns, silencedServices);
	ns.log = createLogger(ns, {logToTerminal}); // Bolt our log function onto the ns object.

	const crimes = crimeNames.map(crime => ns.getCrimeStats(crime));

	// crimes.sort((statA, statB) => statA.profitPerSec - statB.profitPerSec);b
	// crimes.reverse(); // Most profitable one first.

	// for (const crime of crimes) {
	// 	const successChance = ns.getCrimeChance(crime.name);
	// 	ns.tprint(`${crime.name} (${crime.type}) - ${formatPercent(successChance)} - profit = ${formatMoney(calcProfitPerSec(crime))}/s`);
	// }
	let doCrimes = true;
	let crimesCount = 0;

	while (doCrimes) {
		let focus = crimesCount && crimesCount % trainingFrequency === 0 ? 'training' : 'profit';
		let crime = getBestCrimeFor(crimes, focus);
		const time = ns.commitCrime(crime.name);
		const start = Date.now();

		ns.log.info(`(${focus}) going to ${crime.type} for ${formatMoney(crime.money)} in ${formatDuration(crime.time)}`);

		while (ns.isBusy()) {
			await ns.sleep(500);
		}

		// If less time has passed than the crime would take, then the action was cancelled by the user.
		// Subtract a second for safety. The longer the action takes, the higher the chance for inaccuracies.
		if ((Date.now() - start) < (time - 1000)) {
			// ns.log.warn(`${Date.now()} - ${start} < ${time}`);
			ns.log.warn(`Cancelled by user (${Date.now() - start - time})`);
			doCrimes = false;
		} else {
			crimesCount++;
		}
	}
}

function calcProfitPerSec(crime) {
	const adjustedChance = getAdjustedChance(crime.name);
	const adjustedGains = crime.money * adjustedChance;

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

function getBestCrimeForComparer(crimes, compareFn) {
	sortCrimesBy(crimes, compareFn);

	return crimes[crimes.length - 1];
}

function getAdjustedChance(crimeName) {
	return Math.pow(ns.getCrimeChance(crimeName), 2); // Favor higher chances over lower ones.
}

const getBestCrimeFor = (function() {
	const criminalFocusCompareFns = {
		profit: calcProfitPerSec,
		training: calcTotalExpGainPerSec,
	};

	return (crimes, focus) => getBestCrimeForComparer(crimes, criminalFocusCompareFns[focus]);
}());