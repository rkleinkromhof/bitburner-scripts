// Here are a couple of formatters copied from util-formatters.js. They're here so we only have to copy one script to hacked servers.

/* START SELF CONTAINED FORMATTERS */

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. $6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
function formatMoney(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    let numberShort = formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces);
    return num >= 0 ? "$" + numberShort : numberShort.replace("-", "-$");
}

const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M) 
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
    // TODO: A number like 9.999 once rounted to show 3 sig figs, will become 10.00, which is now 4 sig figs.
    return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
}

/**
 * Return a number formatted with the specified number of significatnt figures or decimal places, whichever is more limiting.
 * @param {number} num - The number to format
 * @param {number=} minSignificantFigures - (default: 6) The minimum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} minDecimalPlaces - (default: 3) The minimum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
function formatNumber(num, minSignificantFigures = 3, minDecimalPlaces = 1) {
    return num == 0.0 ? num : num.toFixed(Math.max(minDecimalPlaces, Math.max(0, minSignificantFigures - Math.ceil(Math.log10(num)))));
}

/* END SELF CONTAINED FORMATTERS */

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
		return [...data.servers];
	}
	return [];
}

/** 
 * Hacks, weakens and grows the target, taking given thesholds into account.
 * 
 * @version 3.2
 * @param {NS} ns namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target]`);
		return;
	}

	let version = 3.1;
	let target = ns.args[0];
	let minMoneyThresh = 1000; // Minimum of $1000 or bail.
	let maxMoney = ns.getServerMaxMoney(target);
	let moneyThresh = maxMoney * 0.9;
	let securityThresh = ns.getServerMinSecurityLevel(target) + 2;
	let i = 0;
	let weakens = 0;
	let grows = 0;
	let hacks = 0;

	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('getServerMoneyAvailable');

	if (maxMoney < minMoneyThresh) {
		return;
	}

	ns.print(`Starting hack ${version} on ${target} with thresholds: money >= ${formatMoney(moneyThresh)}, security >= ${formatNumber(securityThresh)}`);
	
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
			ns.print(`After ${i} iterations done ${hacks} hacks, ${grows} grows and ${weakens} weakens. Stats: security level: ${formatNumber(secLevel)}; money: ${formatMoney(availableMoney)}`);
		}
	}
}