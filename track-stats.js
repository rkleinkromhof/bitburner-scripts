import {
	formatMoney,
	formatNumberShort,
	formatNumber
} from '/util-formatters.js'

/** @param {NS} ns **/
export async function main(ns) {
	const doc = eval('document'); // Using document directly is expensive (25GB RAM!). This is a sneaky workaround.
	const hook0 = doc.getElementById('overview-extra-hook-0');
	const hook1 = doc.getElementById('overview-extra-hook-1');

	ns.disableLog('disableLog');
	ns.disableLog('sleep');

	while (true) {
		try {
			const headers = []
			const values = [];
			// Add script income per second
			headers.push("ScrInc");
			values.push(formatMoney(ns.getScriptIncome()[0], 3, 2) + '/s');

			headers.push("ScrIncAU");
			values.push(formatMoney(ns.getScriptIncome()[1], 3, 2) + '/s');

			// Add script exp gain rate per second
			headers.push("ScrExp");
			values.push(formatNumberShort(ns.getScriptExpGain(), 3, 2) + '/s');

			
			headers.push('Karma ');
			values.push(formatNumber(ns.heart.break()));

			// Now drop it into the placeholder elements
			hook0.innerText = headers.join(" \n");
			hook1.innerText = values.join("\n");
		} catch (err) { // This might come in handy later
			ns.print("ERROR: Update Skipped: " + String(err));
		}
		await ns.sleep(1000);
	}

}