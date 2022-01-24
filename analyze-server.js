/** @param {NS} ns **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([...threadsSteps])`);
		ns.tprint(`  => threadsSteps)`);
		return;
	}

	let target = ns.args[0];

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	let analyzeHackabilityScript = 'analyze-server-hackability.js';
	let analyzeProcesses = 'analyze-processes.js';

	try {
		ns.exec(analyzeHackabilityScript, ns.getHostname(), 1, target);
	} catch (ex) {
		ns.tprint('Exception: ' + ex);
	}
	try {
		ns.exec(analyzeProcesses, ns.getHostname(), 1, target, ...Array.prototype.slice.call(ns.args, 1));
	} catch (ex) {
		ns.tprint('Exception: ' + ex);
	}
}