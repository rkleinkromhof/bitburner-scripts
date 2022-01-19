/**
 * Buys one or more maxed out hacknodes.
 * 
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	let nOfNodesToBuy = ns.args[0];

	if (nOfNodesToBuy === 'max') {
		nOfNodesToBuy = ns.hacknet.maxNumNodes();
	}
	else if (!isNaN(nOfNodesToBuy)) {
		nOfNodesToBuy = Math.max(1, nOfNodesToBuy); // Buy at least one node.
	} else {
		nOfNodesToBuy = 1; // Some weird value. Just default to 1.
	}

	if (ns.getServerMoneyAvailable('home') < ns.hacknet.getPurchaseNodeCost()) {
		ns.tprint(`You don't even have enough money to buy a single Hacknet node, you cheap fuck.`);

		return;
	}
	let node;
	let nodes = [];

	while (nodes.length < nOfNodesToBuy
		&& (ns.getServerMoneyAvailable('home') >= ns.hacknet.getPurchaseNodeCost())
		&& (node = ns.hacknet.purchaseNode())
		&& nodes.push(node)
		&& (ns.getServerMoneyAvailable('home') >= calculateTotalUpgradeCost(ns, node))) {
			ns.hacknet.upgradeLevel(node, 199);
			ns.hacknet.upgradeRam(node, 6);
			ns.hacknet.upgradeCore(node, 15);
	}

	ns.tprint(`Bought Hacknet nodes: ${nodes.join(', ')}`);
}

function calculateTotalUpgradeCost(ns, node) {
	return ns.hacknet.getLevelUpgradeCost(node) + ns.hacknet.getRamUpgradeCost(node) + ns.hacknet.getCoreUpgradeCost(node);
}