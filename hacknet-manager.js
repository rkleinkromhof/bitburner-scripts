import {
	createLogger,
	disableLogs,
	sorter
} from '/util-helpers.js';
import {
	formatDuration,
	formatMoney,
	formatRam
} from '/util-formatters.js';

// Constants; I haven't found a way to access HacknetNodeConstants so I'm just copying these.
let nodeMaxLevel = 200;
let nodeMaxRam = 64;
let nodeMaxCores = 16;

// Upgrade cost multipliers for level, RAM and cores. These values come from HacknetNodeConstants
// found at https://github.com/danielyxie/bitburner/blob/dev/src/Hacknet/data/Constants.ts
// let nodeUpgradeLevelMult = 1.04;
// let nodeUpgradeRamMult = 1.28;
// let nodeUpgradeCoreMult = 1.48;

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

let silencedServices = [
	'disableLog',
	'sleep',
	'scan',
	'exec'
];

const argsSchema = [
	['once', false], // Set to true to run only once instead of continuously.
	['max-payoff-time', '1h'], // Controls how far to upgrade hacknets. Can be a number of seconds, or an expression of minutes/hours (e.g. '123m', '4h').
	['time', null], // Alias for max-payoff-time.
	['interval', 250], // Rate at which the program purchases upgrades when running continuously.
	['max-spend', Number.MAX_VALUE], // The maximum amount of money to spend on upgrades.
	['tail', false], // `true` to tail the script.
	['terminal', false], // `true` to log to terminal too.
	['upgrade-level-step', 1], // Upgrade node levels by this number. Defaults to 10, meaning upgrade in steps of 10 levels.
];

let options,
	maxPayoffTime,
	maxSpend,
	spent,
	upgradeLevelStep,
	productionBeforeUpgrade;

/** @param {NS} ns **/
export async function main(ns) {
	_ns = ns;

	disableLogs(ns, silencedServices);

	options = ns.flags(argsSchema);

	let once = options.once;
	let interval = options.interval;
	let logToTerminal = options.terminal;

	maxPayoffTime = parseTime(options.time || options['max-payoff-time']);
	maxSpend = options['max-spend'];
	spent = 0;
	upgradeLevelStep = options['upgrade-level-step'];

	productionBeforeUpgrade = calcHacknetProduction();

	_log = createLogger(ns, logToTerminal);
	_log(`Starting Hacknet Manager ${once ? '' : 'in continuous mode '}with max-payoff-time of ${formatDuration(maxPayoffTime)}, interval ${formatDuration(interval)} and ${maxSpend === Number.MAX_VALUE ? 'no spending limit' : `a spending limit of ${formatMoney(maxSpend)}`}`);

	let continueUpgrade = true;

	do {
		continueUpgrade = upgradeHacknet();
		await ns.sleep(interval);
	}
	while (!once && continueUpgrade);

	_log('Hacknet Manager done.');
}

function upgradeHacknet() {
	let productionMultiplier = _ns.getHacknetMultipliers().production;
	let newNodeCost = _ns.hacknet.getPurchaseNodeCost();
	let newNodeProduction = calcMoneyGainRate(1, 1, 1, productionMultiplier);

	let nOfNodes = _ns.hacknet.numNodes(); // The number of nodes we own.
	let maxNodes = _ns.hacknet.maxNumNodes(); // The maximum amount of nodes we can own.

	let upgrades = [];

	if (nOfNodes < maxNodes) {
		// We can buy an extra node. Add it to the list of possible upgrades.
		upgrades.push({
			isNewNode: true,
			node: `hacknet-node-${nOfNodes}`,
			nodeIndex: nOfNodes,
			upgradeName: 'Purchase node',
			upgradeDescription: 'purchase',
			cost: newNodeCost,
			productionPerDollar: newNodeProduction / newNodeCost,
			payoffTime: calcHacknetPayoffTime(newNodeCost, newNodeProduction),
			doUpgrade: (nsRef) => nsRef.hacknet.purchaseNode() >= 0 // purchaseNode returns -1 when the player cannot afford that node. Make sure we return a boolean.
		});
		// _ns.tprint(`New node (${nOfNodes + 1 }) costs \$${newNodeCost}`);
	}

	// _ns.tprint('='.repeat(40));

	for (let i = 0; i < nOfNodes; i++) {
		let node = _ns.hacknet.getNodeStats(i);

		// _ns.tprint(`Node ${node.name}: lvl ${node.level}, ${node.ram}GB RAM, ${node.cores} core${node.cores > 1 ? 's' : ''}; Online for ~${Math.round(node.timeOnline / 60)} min`);
		// _ns.tprint(`Total production: ${node.totalProduction}`);

		let nodeIsMaxLevel = node.level === nodeMaxLevel;
		let nodeIsMaxRam = node.ram === nodeMaxRam;
		let nodeIsMaxCores = node.cores === nodeMaxCores;
		let nodeIsMaxedOut = nodeIsMaxLevel && nodeIsMaxRam && nodeIsMaxCores;

		if (!nodeIsMaxedOut) {
			let productionCurrentStats = calcMoneyGainRate(node.level, node.ram, node.cores, productionMultiplier);

			// _ns.tprint(`Upgrade costs for ${node.name}:`);

			// TODO clean this up.

			// Level
			if (!nodeIsMaxLevel) {
				// If we're upgrading in steps and we're at, say, 73, then only upgrade to 80 to keep levels as multiples of the step number.
				let upgradeStep = upgradeLevelStep ? (upgradeLevelStep - node.level % upgradeLevelStep) : 1;
				let upgradedValue = node.level + upgradeStep;
				let upgradeCost = _ns.hacknet.getLevelUpgradeCost(i, upgradeStep);
				let productionUpgraded = calcMoneyGainRate(upgradedValue, node.ram, node.cores, productionMultiplier);
				let productionDiff = productionUpgraded - productionCurrentStats;
				let upgradedCostPerDollar = productionDiff / upgradeCost;
				
				let upgrade = {
					node: node.name,
					nodeIndex: i,
					upgradeName: 'level',
					upgradeDescription: `level ${upgradedValue}`,
					productionDiff: productionDiff,
					cost: upgradeCost,
					productionPerDollar: upgradedCostPerDollar,
					payoffTime: calcHacknetPayoffTime(upgradeCost, productionDiff),
					doUpgrade: (nsRef) => nsRef.hacknet.upgradeLevel(i, upgradeStep)
				};

				upgrades.push(upgrade);
				// _ns.tprint(`(${node.name}) ${upgrade.upgradeDescription}: ${formatMoney(upgradeCost)} (production: ${formatMoney(productionCurrentStats)} => ${formatMoney(productionUpgraded)} = +${formatMoney(productionDiff)}; \$${formatMoney(upgradedCostPerDollar, 8, 6)} per dollar; payoff time: ${formatDuration(upgradedPayoffTime)})`);
			}

			if (!nodeIsMaxRam) {
				// RAM
				let upgradeStep = 1;
				let upgradedValue = node.ram * Math.pow(2, upgradeStep); // It doubles in size every step.
				let upgradeCost = _ns.hacknet.getRamUpgradeCost(i, upgradeStep);
				let productionUpgraded = calcMoneyGainRate(node.level, upgradedValue, node.cores, productionMultiplier);
				let productionDiff = productionUpgraded - productionCurrentStats;
				let upgradedCostPerDollar = productionDiff / upgradeCost;

				let upgrade = {
					node: node.name,
					nodeIndex: i,
					upgradeName: 'RAM',
					upgradeDescription: `${formatRam(upgradedValue)} RAM`,
					productionDiff: productionDiff,
					cost: upgradeCost,
					productionPerDollar: upgradedCostPerDollar,
					payoffTime: calcHacknetPayoffTime(upgradeCost, productionDiff),
					doUpgrade: (nsRef) => nsRef.hacknet.upgradeRam(i, upgradeStep)
				};

				upgrades.push(upgrade);
				// _ns.tprint(`(${node.name}) ${upgrade.upgradeDescription}: ${formatMoney(upgradeCost)} (production: ${formatMoney(productionCurrentStats)} => ${formatMoney(productionUpgraded)} = +${formatMoney(productionDiff)}; \$${formatMoney(upgradedCostPerDollar, 8, 6)} per dollar; payoff time: ${formatDuration(upgradedPayoffTime)})`);
			}

			if (!nodeIsMaxCores) {
				// Core
				let upgradeStep = 1;
				let upgradedValue = node.cores + upgradeStep;
				let upgradeCost = _ns.hacknet.getCoreUpgradeCost(i, upgradeStep);
				let productionUpgraded = calcMoneyGainRate(node.level, node.ram, upgradedValue, productionMultiplier);
				let productionDiff = productionUpgraded - productionCurrentStats;
				let upgradedCostPerDollar = productionDiff / upgradeCost;

				let upgrade = {
					node: node.name,
					nodeIndex: i,
					upgradeName: 'core',
					upgradeDescription: `${upgradedValue} cores`,
					productionDiff: productionDiff,
					cost: upgradeCost,
					productionPerDollar: upgradedCostPerDollar,
					payoffTime: calcHacknetPayoffTime(upgradeCost, productionDiff),
					doUpgrade: (nsRef) => nsRef.hacknet.upgradeCore(i, upgradeStep)
				};

				upgrades.push(upgrade);
				// _ns.tprint(`(${node.name}) ${upgrade.upgradeDescription}: ${formatMoney(upgradeCost)} (production: ${formatMoney(productionCurrentStats)} => ${formatMoney(productionUpgraded)} = +${formatMoney(productionDiff)}; \$${formatMoney(upgradedCostPerDollar, 8, 6)} per dollar; payoff time: ${formatDuration(upgradedPayoffTime)})`);
			}

			// let bestUpgrade = upgrades.filter(upgrade => upgrade.node === node.name).sort((upgradeA, upgradeB) => upgradeA.productionPerDollar - upgradeB.productionPerDollar).pop(); // Best last.
			// _ns.tprint(`Best upgrade for ${node.name} : ${bestUpgrade.upgradeDescription} for ${formatMoney(bestUpgrade.cost)}, producing ${formatMoney(bestUpgrade.productionPerDollar, 8, 6)} per dollar spent (payoff time: ${formatDuration(bestUpgrade.payoffTime)})`);
		}
		// else: node is maxed out on levels, RAM and cores

		// _ns.tprint('-'.repeat(40));
	}

	let playerMoney = _ns.getPlayer().money;
	let budgetLeft = maxSpend - spent;
	let spendingMoney = Math.min(playerMoney, budgetLeft);

	let noUpgradeReason = null;

	if (upgrades.length && maxPayoffTime) {
		// If we have a max payoff time, remove all upgrades that exceed that limit.
		upgrades = upgrades.filter(upgrade => upgrade.payoffTime < maxPayoffTime);

		if (!upgrades.length) {
			noUpgradeReason = 'Reached max payoff time.';
		}
	}

	if (upgrades.length) {
		// Filter to keep only upgrades we can afford right now.
		upgrades = upgrades.filter(upgrade => upgrade.cost < spendingMoney);
		upgrades.sort(sorter('productionPerDollar', {direction: 'desc'})); // Sort to get most efficient upgrade first.

		if (!upgrades.length) {
			noUpgradeReason = `${playerMoney < budgetLeft ? `Cannot afford anymore upgrades. Money left: ${formatMoney(playerMoney)}` : 'Out of budget.'} ${maxSpend < Number.MAX_VALUE ? `Budget spent: ${formatMoney(spent)}/${formatMoney(maxSpend)}` : ''}`;
		}
	}

	let bestOverallUpgrade = upgrades[0];
	let purchasedUpgrade = false;

	if (upgrades.length === 0) {
		// (${playerMoney < budgetLeft ? `too little funds: ${formatMoney(playerMoney)}` : `budget left: ${formatMoney(budgetLeft)}/${formatMoney(maxSpend)}`})
		_log(noUpgradeReason || 'Could not upgrade; unknown reason.');
		return false;
	}
	if (bestOverallUpgrade.doUpgrade(_ns)) {
		purchasedUpgrade = true;
		spent += bestOverallUpgrade.cost;
		// _ns.tprint(`Best overall upgrade: ${bestOverallUpgrade.node} to ${bestOverallUpgrade.upgradeDescription} for ${formatMoney(bestOverallUpgrade.cost)}, producing ${formatMoney(bestOverallUpgrade.productionPerDollar, 8, 6)} per dollar spent (payoff time: ${formatDuration(bestOverallUpgrade.payoffTime)})`);

		if (bestOverallUpgrade.isNewNode) {
			_log(`Purchased new node ${bestOverallUpgrade.node} for ${formatMoney(bestOverallUpgrade.cost)}`);
		} else {
			_log(`Upgraded ${bestOverallUpgrade.node} to ${bestOverallUpgrade.upgradeDescription} for ${formatMoney(bestOverallUpgrade.cost)} (payoff time: ${formatDuration(calcHacknetPayoffTime())})`);
		}
	}
	else {
		_log(`Error while upgrading ${bestOverallUpgrade.node} to ${bestOverallUpgrade.upgradeDescription} for ${formatMoney(bestOverallUpgrade.cost)}`);
	}

	return purchasedUpgrade; // ok, continue; return false if something is wrong or we're done.
}

function calcHacknetPayoffTime(extraExpense = 0, extraProduction = 0) {
	return (spent + extraExpense) / (calcHacknetProduction() - productionBeforeUpgrade + extraProduction) * 1000;
}

function calcHacknetProduction() {
	let productionMultiplier = _ns.getHacknetMultipliers().production;
	let nOfNodes = _ns.hacknet.numNodes(); // The number of nodes we own.
	let production = 0;

	for (let i = 0; i < nOfNodes; i++) {
		let node = _ns.hacknet.getNodeStats(i);
		production += calcMoneyGainRate(node.level, node.ram, node.cores, productionMultiplier);
	}

	return production;
}

/**
 * Calculate the money gain rate of a Hacknet node configuration
 * @param {number} level Hacknet node level
 * @param {number} ram Hacknet node RAM
 * @param {number} cores Hacknet node cores
 * @param {number} mult Hacknet node production multiplier. (see ns.getHacknetMultipliers().production)
 * @returns {number} The calculated money gain rate
 */
function calcMoneyGainRate(level, ram, cores, mult) {
	// TODO Find out if our manual way of calculation is just as good as the API one. If so, then just always do manual.
	if (_ns.fileExists('Formulas.exe', 'home')) {
		return _ns.formulas.hacknetNodes.moneyGainRate(level, ram, cores, mult);
	}
	return calcMoneyGainRateManual(level, ram, cores, mult);
}

/**
 * Manual calculation of money gain rate, as apposed to using the API `ns.hacknet.formulas.moneyGainRate` which requires BitNode 4 or up.
 * @param {number} level Hacknet node level
 * @param {number} ram Hacknet node RAM
 * @param {number} cores Hacknet node cores
 * @param {number} mult Hacknet node production multiplier. (see ns.getHacknetMultipliers().production)
 * @returns {number} The calculated money gain rate
 */
function calcMoneyGainRateManual(level, ram, cores, mult) {
	// Hacknet node money multiplier 1 for BitNodes 1 through 3 or 4. Starting with 4 or 5 (not sure which), this will be different.
	const nodeMoneyMultiplier = (_ns.getPlayer().bitNodeN >= 5) ? _ns.getBitNodeMultipliers().HacknetNodeMoney : 1; // BitNodeMultipliers.HacknetNodeMoney
	const gainPerLevel = 1.5; // HacknetNodeConstants.MoneyGainPerLevel;
	const levelMult = level * gainPerLevel;
	const ramMult = Math.pow(1.035, ram - 1);
	const coresMult = (cores + 5) / 6;

	return levelMult * ramMult * coresMult * mult * nodeMoneyMultiplier;
}

function parseTime(time) {
	let parsed;

	if (time && String(time).endsWith("m")) {
		parsed = Number.parseFloat(time.replace("m", "")) * 60 * 1000;
	}
	else if (time && String(time).endsWith("h")) {
		parsed = Number.parseFloat(time.replace("h", "")) * 60 * 60 * 1000;
	}
	else {
		parsed = Number.parseFloat(time) * 1000;
	}

	return parsed;
}