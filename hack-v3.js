/** 
 * Hacks, weakens and grows the target, taking given thesholds into account.
 * 
 * @version 3.1
 * @param {NS} ns namespace
 **/
export async function main(ns) {
	let version = 3.1;
	let target = ns.args[0];
	let minMoneyThresh = 1000; // Minimum of $1000 or bail.
	let maxMoney = ns.getServerMaxMoney(target);
	let moneyThresh = maxMoney * 0.75;
	let securityThresh = ns.getServerMinSecurityLevel(target) + 5;
	let i = 0;
	let weakens = 0;
	let grows = 0;
	let hacks = 0;

	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('getServerMoneyAvailable');

	if (maxMoney < minMoneyThresh) {
		return;
	}

	ns.print(`Starting hack ${version} on ${target} with thresholds: money >= ${moneyThresh}, security >= ${securityThresh}`);
	
	while(true) {
		let secLevel = ns.getServerSecurityLevel(target);
		let availableMoney = ns.getServerMoneyAvailable(target);

		if (secLevel > securityThresh) {
			//If the server's security level is above our threshold, weaken it.
			await ns.weaken(target);
			weakens++;
		} else if (availableMoney < moneyThresh) {
			//If the server's money is less than our threshold, grow it.
			await ns.grow(target);
			grows++;
		} else {
			//Otherwise, hack it.
			await ns.hack(target);
			hacks++;
		}
		i++;

		if (i % 10 === 0) {
			ns.print(`After ${i} iterations done ${hacks} hacks, ${grows} grows and ${weakens} weakens. Stats: security level: ${secLevel}; money: ${availableMoney}`);
		}
	}
}