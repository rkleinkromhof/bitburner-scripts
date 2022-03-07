import {
	createLogger,
	disableLogs
} from '/util-helpers.js';
import {
	scanServersLight
} from '/util-servers.js';

import ContractSolverFactory from '/classes/ContractSolverFactory.js';

/**
 * Global Namespace reference.
 * @type NS
 */
let _ns;

/**
 * Logs the given message
 * @param {String} message
 * @type Function
 */
let _log;

let _host; // The host to run on.

let silencedServices = [
	'disableLog',
	'codingcontract.attempt',
	'exec',
	'getHackingLevel',
	'getServerSecurityLevel',
	'getServerMaxRam',
	'getServerMinSecurityLevel',
	'getServerMoneyAvailable',
	'getServerMaxMoney',
	'getServerNumPortsRequired',
	'getServerUsedRam',
	'getServerRequiredHackingLevel',
	'scan',
	'sleep',
];

const argsSchema = [
	['terminal', false], // `true` to log to terminal too.
	['toast-contract', false], // `true` show a toast message upon completing a contract.
	['toast', false] // shorthand for 'toast-contract'
];

let options;

/** @param {NS} ns **/
export async function main(ns) {
	_ns = ns;
	_host = ns.getHostname();

	options = ns.flags(argsSchema);
	let showToast = options['toast'] || options['toast-contract'];
	let logToTerminal = options.terminal;

	_log = createLogger(ns, logToTerminal);

	_log(`Starting Contract Manager ${showToast ? 'with toast messages enabled' : ''}`);

	disableLogs(ns, silencedServices);

	let contracts = getContracts();
	let solved = solveContracts(contracts);
	
	_log(`Contract Manager done: solved ${solved} of ${contracts.length} contracts.`);

	await ns.sleep(1000);
}

function solveContracts(contracts) {
	let solved = 0;

	contracts.forEach(contract => {
		let answer = ContractSolverFactory.instance.createSolver(contract.type).solve(_ns.codingcontract.getData(contract.filename, contract.hostname));

		if (answer !== null) {
			let reward;

			// Only attempt automatically while we don't run the risk of losing this contract. I'm still figuring this out and don't want to
			// lose contracts because of a bug.
			// Array Jumping Game only has a single try, so just go ahead and do that one.
			// Comment this back in if you want a safeguard.
			// if (contract.type === 'Array Jumping Game' || _ns.codingcontract.getNumTriesRemaining(contract.filename, contract.hostname) > 1) {
			reward = _ns.codingcontract.attempt(answer, contract.filename, contract.hostname, {returnReward: true});
			// }

			if (reward) {
				let message = `Solved ${contract.filename} (${contract.type}) on ${contract.hostname}. Reward: ${reward}`;
				solved++;
				_log(message);

				if (options['toast-contract']) {
					_ns.toast(message);
				}

			} else {
				_log(`Gave the wrong answer for ${contract.filename} (${contract.type}) on ${contract.hostname}. The following answer was rejected: ${answer}`);
			}
		}
	});

	return solved;
}

function getContracts() {
	let servers = scanServersLight(_ns, 0, 0);
	let contracts = [];

	for (let i = 0; i < servers.length; i++) {
		let hostname = servers[i].hostname;
		let filenames = _ns.ls(hostname, '.cct');

		filenames.forEach(filename => {
			let type = _ns.codingcontract.getContractType(filename, hostname);
			// let description = _ns.codingcontract.getDescription(filename, hostname); // Unneccesary bit of info that takes 5GB of RAM.

			contracts.push({hostname, filename, type});
		});
	}

	return contracts;
}