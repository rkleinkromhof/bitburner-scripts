import ServerLight from '/classes/ServerLight.js';

/**
 * An analysis of Hack, Grow and Weaken analysis 
 */
export default class ServerHackAnalysis extends ServerLight {
	// RAM costs
	#hackRamPerThread = 1.7;
	#growRamPerThread = 1.75;
	#weakenRamPerThread = 1.75;

	// Security rates
	#weakenSecurityLowerRate = 0.05;
	#growSecurityIncreaseRate = 0.004;
	#hackSecurityIncreaseRate = 0.002;
	
	/** ctor */
	constructor(_ns, hostname) {
		super(_ns, hostname);
	}
	
	calcThreadsNeeded(ns, maxThreads, maxRam, moneyFactors) {
		moneyFactors = Array.prototype.slice.call(moneyFactors); // Make a copy, 'cause we're going to edit it.

		const moneyFactor = moneyFactors.shift();

		const hackMoney = moneyFactor * this.maxMoney;
		const hackThreadsNeeded = Math.min(calcHackThreads(hackMoney), maxThreads);
		const growBackThreads = calcGrowBackThreads(hackMoney);

		const hackSecurityIncrease = hackThreadsNeeded * this.#hackSecurityIncreaseRate;
		const hackCounterWeakenThreads = Math.ceil(hackSecurityIncrease / this.#weakenSecurityLowerRate);
		const growSecurityIncrease = growBackThreads * this.#growSecurityIncreaseRate;
		const growCounterWeakenThreads = Math.ceil(growSecurityIncrease / weakenSecurityLowerRate);

		const ramNeeded = (hackThreadsNeeded * this.#hackRamPerThread) + ((hackCounterWeakenThreads + growCounterWeakenThreads) * this.#weakenRamPerThread) + (growBackThreads * this.#growRamPerThread);

		if (ramNeeded && (ramNeeded <= maxRam)) {
			return {
				hack: hackThreadsNeeded,
				weaken1: hackCounterWeakenThreads,
				grow: growBackThreads,
				weaken2: growCounterWeakenThreads
			};
		}
		// If we've more money factors to try, do that.
		else if (moneyFactors.length) {
			return calcThreadsNeeded(ns, host, maxThreads, maxRam, moneyFactors);
		}
		return null;
	}
}

function calcGrowBackThreads(hackMoney) {
	return Math.ceil(this.ns.growthAnalyze(this.hostname, this.maxMoney / (this.maxMoney - (hackMoney))));
}

function calcHackThreads(hackMoney) {
	return Math.ceil(this.ns.hackAnalyzeThreads(this.hostname, hackMoney));
}