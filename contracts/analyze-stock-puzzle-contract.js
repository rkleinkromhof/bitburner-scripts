/** @param {NS} ns **/
export async function main(ns) {
	let [maxLookAhead, stockPrices] = [...ns.args];

	if (ns.args.length === 2) {
		stockPrices = stockPrices.split(',').map(price => Number.parseInt(price));
	}

	let diffs = [];
	let price = stockPrices[0];
	let previousPrice;

	for (let i = 0; i < stockPrices.length; i++) {
		previousPrice = price;
		price = stockPrices[i];
		let diff = price - previousPrice;

		diffs.push(diff);
	}

	price = previousPrice = stockPrices[0];
	// let lastLow = Number.MAX_SAFE_INTEGER;
	// let lastHigh = Number.MIN_SAFE_INTEGER;
	let boughtStockPrice = false;
	let profit = 0;
	// let maxLookAhead = ns.args[0] || 2;
	let transactions = [];


	for (let i = 0; i < stockPrices.length; i++) {
		let lastItem = i === stockPrices.length - 1;
		let stockSlice = stockPrices.slice(i + 1, i + 1 + maxLookAhead);
		let action;
		price = stockPrices[i];

		// If we've bought stock and it's worth more now, and won't be worth even more in the future, then sell.
		if (boughtStockPrice && (price > boughtStockPrice) && (lastItem || (price > Math.max.apply(null, stockSlice)))) {
			transactions.push('sell');
			profit += price - boughtStockPrice;
			boughtStockPrice = 0;
		}
		// If we've sold our stock and it's worth less than it is going to be in the future, then buy.
		// TODO: fix the bug that happens in the following scenario:
		// [154, 18, 122, 8, 29, ...]
		//   wait-^  ^wait^-buy
		// It shouldn't wait to buy lower because there's a chance to sell in between.
		else if (!boughtStockPrice && (price < Math.min.apply(null, stockSlice))) {
			transactions.push('buy');
			boughtStockPrice = price;
		}
		// If we've bought stock and we're at the end of the array, then we've made a mistake.
		else if (boughtStockPrice && lastItem) {
			ns.tprint(`Something went wrong... we're holding stock with no option to sell.`);
		}
		// Not buying or selling means we wait.
		else {
			transactions.push('wait');
		}
	}

	ns.tprint(`Stock: ${stockPrices.map(price => String.prototype.padStart.call(price, 4)).join(', ')}`);
	ns.tprint(`Diffs: ${diffs.map(diff => String.prototype.padStart.call(diff, 4)).join(', ')}`);
	ns.tprint(`Trnsx: ${transactions.map(trnsx => String.prototype.padStart.call(trnsx, 4)).join(', ')}`);
	ns.tprint(`Projected profit: ${profit}`);
}