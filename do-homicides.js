import {
	formatDuration,
	formatNumber,
	formatPercent,
} from '/util-formatters.js';
import {
	createLogger,
	disableLogs
} from '/util-helpers.js';

const silencedServices = [
	'disableLog',
	'commitCrime',
	'sleep',
];

const wantedKarmaLevel = -54000; // Needed to be able to join a gang.

const argsSchema = [
	['terminal', false], // `true` to log to terminal too.
];

let ns;

/** @param {NS} _ns **/
export async function main(_ns) {
	ns = _ns;

	const flagOpts = ns.flags(argsSchema);
	const logToTerminal = flagOpts.terminal;

	disableLogs(ns, silencedServices);
	ns.log = createLogger(ns, {logToTerminal}); // Bolt our log function onto the ns object.
	let doCrimes = true;
	let lastKarmaLevel;

	while (doCrimes && ns.heart.break() > wantedKarmaLevel) {
		const karma = ns.heart.break();
		const time = ns.commitCrime('Homicide');
		const start = Date.now();
	
		if (lastKarmaLevel) {
			
		}
		ns.log.info(`We're going to commit Homicide. Karma: ${formatNumber(karma)} / ${wantedKarmaLevel} (${formatPercent(karma/wantedKarmaLevel)}).${lastKarmaLevel ? ` Estimated time left: ${formatDuration((wantedKarmaLevel-karma)/ ((karma-lastKarmaLevel)/time))}` : ''}`);

		while (ns.isBusy()) {
			await ns.sleep(500);
		}

		// If less time has passed than the crime would take, then the action was cancelled by the user.
		// Subtract a second for safety. The longer the action takes, the higher the chance for inaccuracies.
		if ((Date.now() - start) < (time - 1000)) {
			ns.log.warn(`Cancelled by user (${Date.now() - start - time})`);
			doCrimes = false;
		}
		lastKarmaLevel = karma;
	}

	if (ns.heart.break() <= wantedKarmaLevel) {
		// Join a gang and start managing it.
		ns.exec('gang-manager.js', ns.getHostname(), 1, '--training-only');
	}
}