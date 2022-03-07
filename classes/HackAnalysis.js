import {
	formatMoney,
	formatPercent,
	formatRam,
} from '/util-formatters.js';

/**
 * An analysis of Hack, Grow and Weaken on a Server.
 */
export default class HackAnalysis  {
	// References
	#ns;
	#server;

	// RAM costs
	#hackRamPerThread = 1.7;
	#growRamPerThread = 1.75;
	#weakenRamPerThread = 1.75;

	// Security rates
	#weakenSecurityLowerRate = 0.05;
	#growSecurityIncreaseRate = 0.004;
	#hackSecurityIncreaseRate = 0.002;
	
	// Configs
	#allocatedRam; // How much RAM we are allowed to use.
	#hackMoneyPercentage; // How much money we're supposed to hack for.
	#interval; // How much time between Hack-Weaken-Grow-Weaken processes.
	#isAutoAdjustMoneyPercentage;
	#isAdjustForHackChance;

	/** ctor */
	constructor(config) {
		const {ns, server, allocatedRam, hackMoneyPercentage, interval = 200, isAutoAdjustMoneyPercentage = true, isAdjustForHackChance = true} = config;

		this.#ns = ns;
		this.#server = server;
		this.#allocatedRam = allocatedRam;
		this.#hackMoneyPercentage = hackMoneyPercentage;
		this.#interval = interval;
		this.#isAutoAdjustMoneyPercentage = isAutoAdjustMoneyPercentage;
		this.#isAdjustForHackChance = isAdjustForHackChance;

		if (isAutoAdjustMoneyPercentage) {
			this.adjustHackMoneyPercentage();
		}
	}

	/**
	 * The Server.
	 */
	get server() {
		return this.#server;
	}

	/**
	 * The amount of RAM we were allocated with.
	 */
	get allocatedRam() {
		return this.#allocatedRam;
	}

	/**
	 * How much money we're supposed to hack for, as a percentage of the server's maximum money.
	 */
	get hackMoneyPercentage() {
		return this.#hackMoneyPercentage;
	}

	/**
	 * The time to wait between Hack/Weaken1/Grow/Weaken2 processes.
	 */
	get interval() {
		return this.#interval;
	}

	/**
	 * Should we automatically adjust the percentage of money we're hacking?
	 */
	get isAutoAdjustMoneyPercentage() {
		return this.#isAutoAdjustMoneyPercentage;
	}

	/**
	 * Is the security level at a minimum?
	 */
	get isSecurityPrepped() {
 		return this.server.securityLevel <= this.server.minSecurityLevel;
	}

	/**
	 * Is the amount of money available at a maximum?
	 */
	get isMoneyPrepped() {
		return this.server.moneyAvailable >= this.server.maxMoney;
	}

	/**
	 * Are we prepped on security (minimum) and money (maximum)?
	 */
	get isPrepped() {
		return this.isSecurityPrepped && this.isMoneyPrepped;
	}

	/**
	 * The intended amount of money to hack for.
	 */
	get hackMoney() {
		return this.#hackMoneyPercentage * this.server.maxMoney;
	}

	/**
	 * The amount of threads needed to hack for the intended amount of money.
	 */
	get hackThreads() {
		return this.hackMoney ? Math.ceil(this.#ns.hackAnalyzeThreads(this.server.hostname, this.hackMoney)) : 0;
	}

	/**
	 * The amount of threads needed to grow back the amount of money we intend to hack for.
	 */
	get growThreads() {
		return this.server.maxMoney ? Math.ceil(this.#ns.growthAnalyze(this.server.hostname, this.server.maxMoney / (this.server.maxMoney - this.hackMoney))) : 0;
	}

	/**
	 * The security increase our hacking will cause.
	 */
	get hackSecurityIncrease() {
		return this.hackThreads * this.#hackSecurityIncreaseRate;
	}

	/**
	 * The amount of weaken threads we need to counter our hack attempt.
	 */
	get hackCounterWeakenThreads() {
		return Math.ceil(this.hackSecurityIncrease / this.#weakenSecurityLowerRate);
	}
	
	/**
	 * The security increate our growing will cause.
	 */
	get growSecurityIncrease() {
		return this.growThreads * this.#growSecurityIncreaseRate;
	}

	/**
	 * The amount of weaken threads we need to counter our grow process.
	 */
	get growCounterWeakenThreads() {
		return Math.ceil(this.growSecurityIncrease / this.#weakenSecurityLowerRate);
	}

	/**
	 * The total amount of RAM we need to do a single Hack/Weaken1/Grow/Weaken2 batch.
	 */
	get totalRamCost() {
		return (this.hackThreads * this.#hackRamPerThread) + ((this.hackCounterWeakenThreads + this.growCounterWeakenThreads) * this.#weakenRamPerThread) + (this.growThreads * this.#growRamPerThread);
	}

	/**
	 * The total amount of time needed to do a Hack/Weaken1/Grow/Weaken2 batch.
	 */
	get totalRuntime() {
		// The assumption here is that Weaken will always take the longest.
		// TODO check this assumption is correct!
		return this.#ns.getWeakenTime(this.server.hostname) + 2 * this.#interval;
	}

	/**
	 * The amount of money we intend to hack for, adjusted by the hack chance.
	 * 
	 * If we can hack for 1 million, but our hack chance is 80%, then this will return 800k.
	 * This provides a more accurate measure of money hacked for profit calculations.
	 */
	get adjustedHackMoney() {
		if (this.#isAdjustForHackChance) {
			return this.hackMoney * this.#ns.hackAnalyzeChance(this.server.hostname);
		}
		return this.hackMoney;
	}

	/**
	 * How much money we can hack for per second.
	 * 
	 * @see #adjustedHackMoney
	 */
	get profitPerSec() {
		return this.adjustedHackMoney / (this.totalRuntime / 1000);
	}

	/**
	 * How much money we can hack for per MB of RAM.
	 * 
	 * @see #adjustedHackMoney
	 */
	get profitPerMb() {
		return this.adjustedHackMoney / this.totalRamCost;
	}

	/**
	 * A calculation of how efficient hacking this server is.
	 * 
	 * This is an amount of money that can be hacked for per MB of RAM per second.
	 */
	get profitabilityEfficiency() {
		return this.adjustedHackMoney / this.totalRamCost / (this.totalRuntime / 1000);
	}

	/**
	 * TODO Check this
	 */
	analyzeSecurityPrep() {
		const securityReduction = this.server.securityLevel - this.server.minSecurityLevel;
		const threads = Math.ceil(securityReduction / this.#weakenSecurityLowerRate);
		const time = this.#ns.getWeakenTime(this.server.hostname);

		// TODO take allocatedRam into account
		// If we need to split into 2 executions of weaken, then obviously we're
		// going to twice the time.

		return {
			time,
			threads,
			securityReduction,
		};
	}

	/**
	 * TODO Check this
	 */
	analyzeMoneyPrep() {
		const threads = this.growThreads;
		
		const secIncrease = this.#growSecurityIncreaseRate * threads;
		const counterWeakens = Math.ceil(secIncrease * this.#weakenSecurityLowerRate);

		const time = this.ns.getGrowTime(this.server.hostname);
		const counterWeakenTime = this.ns.getWeakenTime(this.server.hostname);

		// TODO take allocatedRam into account
		// If we need to split into 2 executions of grow, then we also need
		// 2 executions of weaken, increasing the total run time.

		return {
			time,
			threads,
			securityImpact: secIncrease,
			counterWeaken: {
				time: counterWeakenTime,
				threads: counterWeakens,
			}
		};
	}

	/**
	 * Adjust the amount of money to hack based on the amount of RAM we have been allocated with.
	 */
	adjustHackMoneyPercentage() {
		if (this.totalRamCost) {
			if (this.allocatedRam < this.totalRamCost) {
				const newHackMoneyPercentage = (this.hackMoneyPercentage / this.totalRamCost) * this.allocatedRam;

				this.#hackMoneyPercentage = newHackMoneyPercentage;
				
			}
			// this.#ns.tprint(`[${this.server.hostname}] Percentage = ${formatPercent(this.hackMoneyPercentage)}, Hack money = ${formatMoney(this.hackMoney)}, threads = ${this.hackThreads}/${this.hackCounterWeakenThreads}/${this.growThreads}/${this.growCounterWeakenThreads}=${this.hackThreads + this.hackCounterWeakenThreads + this.growThreads + this.growCounterWeakenThreads}, RAM = ${formatRam(this.totalRamCost)}`);
		}
		// else: this.#ns.tprint(`[${this.server.hostname}] no RAM`);
	}
}