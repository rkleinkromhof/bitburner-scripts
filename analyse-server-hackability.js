import {formatMoney} from "./util-formatters.js";

/**
 * @param {NS} ns namespace
 **/
export async function main(ns) {
	let script = 'hack-v3.js';
	let target = ns.args[0];

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}

	// Access
	let haveRootAccess = ns.hasRootAccess(target);
	let numPortsReq = ns.getServerNumPortsRequired(target);

	// Security
	let serverMinSecLevel = ns.getServerMinSecurityLevel(target);
	let serverBaseSecLevel = ns.getServerBaseSecurityLevel(target);
	let serverCurrentSecLevel = ns.getServerSecurityLevel(target);

	// RAM, processes and threads
	let maxRam = ns.getServerMaxRam(target);
	let availableRam = maxRam - ns.getServerUsedRam(target);
	let reqRamPerThread = ns.getScriptRam(script, target);
	let maxAvailableThreads = Math.floor(availableRam / reqRamPerThread);
	let runningProcessFilenames = ns.ps(target)
		.filter(info => info.filename !== ns.getScriptName()) // Filter out this script, in case we're analysing the current server.
		.map(info => info.filename);
	
	let isRunningScript = ns.ps(target)
		.some(info => info.filename === script);

	// Money
	let availableMoney = ns.getServerMoneyAvailable(target);
	let maxMoney = ns.getServerMaxMoney(target);


	ns.tprint('======================== HACK ANALYSIS ========================');
	ns.tprint(`[Server]: ${target}`);
	ns.tprint(`[Access] Root: ${haveRootAccess ? 'Yes' : 'No'}; ports required: ${numPortsReq}`);
	ns.tprint(`[Security level] base: ${serverBaseSecLevel}, min: ${serverMinSecLevel}, current: ${serverCurrentSecLevel}`);
	ns.tprint(`[RAM available/max] ${Math.round((availableRam + Number.EPSILON) * 100) / 100}/${maxRam}GB`);
	ns.tprint(`[Processes] running: ${runningProcessFilenames.length} => [${runningProcessFilenames.join(', ')}]`);
	
	if (ns.fileExists(script, target)) {
		ns.tprint(`[${script}] exists ${isRunningScript ? 'and is' : 'but is NOT'} running`);
		
		if (maxAvailableThreads) {
			ns.tprint(`[threads] RAM available to run ${maxAvailableThreads} additional threads`);
		} else {
			ns.tprint(`[threads] not enough RAM available to run ${isRunningScript ? 'additional threads' : 'script'}`);
		}
	} else {
		ns.tprint(`[${script}] does not exist on server`);
	}

	ns.tprint(`[Money available/max] \$${formatMoney(availableMoney, 'm')}/\$${formatMoney(maxMoney, 'm')}`);
	
	ns.tprint('===============================================================');
}