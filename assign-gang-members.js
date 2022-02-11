import {
	createLogger
} from '/util-helpers.js';


const tasks = [
	'Unassigned',
	'Mug People',
	'Deal Drugs',
	'Strongarm Civilians',
	'Run a Con',
	'Armed Robbery',
	'Traffick Illegal Arms',
	'Threaten & Blackmail',
	'Human Trafficking',
	'Terrorism',
	'Vigilante Justice',
	'Train Combat',
	'Train Hacking',
	'Train Charisma',
	'Territory Warfare'
];

/**
 * CLI autocomplete.
 * @param {Object} data General data about the game you might want to autocomplete.
 * @param {String[]} data.serrvers List of all servers in the game.
 * @param {String[]} data.txts List of text files on the current server.
 * @param {String[]} data.scripts List of all scripts on the current server.
 * @param {String[]} data.flags The same flags function as passed with ns. Calling this function adds all the flags as autocomplete arguments.
 * @param {String[]} args Current arguments. Minus `run script.js`.
 */
export function autocomplete(data, args) {
	if (args.length <= 1) {
		return [...tasks];
	}
	return [];
}

/** @param {NS} ns **/
export async function main(ns) {
	const task = ns.args.join(' '); // Task names have spaces, you know.
	const members = ns.gang.getMemberNames();
	const tasks = ns.gang.getTaskNames();

	const _log = createLogger(ns, true);

	if (members && members.length && task && tasks.indexOf(task) >= 0) {
		members.forEach(member => {
			if (ns.gang.setMemberTask(member, task)) {
				_log(`Assigned ${member} to task '${task}'`);
			}
		});
	}
}