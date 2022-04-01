import Manager from '/classes/Manager.js';

import {
    charCheck,
    seconds,
} from '/util-helpers.js';
import {
    formatMoney,
    formatNumber,
    formatPercent,
} from '/util-formatters.js';

const argsSchema = [
    ['ltt', false],
    ['log-to-terminal', false],
    ['interval', seconds(4)],
    ['reserve-money', 10e6], // Reserve this much money.
    ['minimum-purchase-size', 5e6],
    ['sell-threshold', 0.51],
    ['buy-threshold', 0.60],
    ['liquidate', false], // `true` to sell all stock, even at a loss
    ['no-buy', false], // `true` to not buy any stock, only sell it.
    ['no-sell', false], // `true` to not sell any stock, only buy it.
];

/** @param {NS} ns **/
export async function main(ns) {
    const manager = new StockManager({
        ns,
        name: 'Stock Manager',
        options: ns.flags(argsSchema)
    });

    await manager.start();
}

class StockManager extends Manager {
    #prices = {
        wseAccount: 200e6, // 200m
        tixApi: 5e9, //5b
        fourSData: 1e9, // 1b
        fourSDataTixApi: 25e9, // 25b
        commission: 1e5, // The commission when buying stock = 100k
    };
    #spent;
    #profit; // TODO Check if I got this right

    async beforeMainLoop() {
        this.#spent = this.#profit = 0; // Reset

        // Check if both no-buy and no-sell are set. If so, quit out with a warning.
        if (this.getOption('no-buy') && this.getOption('no-sell')) {
            this.warn(`Setting both 'no-buy' and 'no-sell' will make the ${this.name} do nothing. Use only one or the other.`);
            return false;
        }

        // Buy accounts/APIs.
        const haveApis = this.#buyApis();

        if (!haveApis) {
            const checkify = bool => bool ? charCheck : ' ';
            const player = this.ns.getPlayer();

            this.log(`Missing accounts/API's:`);
            this.log(`  [${checkify(player.hasWseAccount)}] WSE account`);
            this.log(`  [${checkify(player.hasTixApiAccess)}] TIX API access`);
            this.log(`  [${checkify(player.has4SData)}] 4S Market Data access`);
            this.log(`  [${checkify(player.has4SDataTixApi)}] 4S Market Data TIX API access`);
        }

        return haveApis;
    }

    /**
     * @param {NS} ns
     */
    async mainLoop() {
        const ns = this.ns;
        // const symbols = ns.stock.getSymbols();

        // for (const sym of symbols) {
        //     this.log(`${sym} - price: ${formatMoney(ns.stock.getPrice(sym))}, ask price: ${formatMoney(ns.stock.getAskPrice(sym))}, bid price: ${formatMoney(ns.stock.getBidPrice(sym))}, purchase cost/share (long): ${formatMoney(ns.stock.getPurchaseCost(sym, 1, 'Long'))}`);
        //     this.log(`${sym} - volatility: ${formatPercent(ns.stock.getVolatility(sym))}, forecast: ${formatPercent(ns.stock.getForecast(sym))}, max shares: ${formatNumber(ns.stock.getMaxShares(sym))}`);
        // }

        // return false;
        if (this.getOption('liquidate')) {
            const allStocks = Object.values(this.getAllStocks(ns));

            if (allStocks.length) {
                this.log(`Selling everything`);
                // Sell everything.
                this.sellStocks(ns, allStocks);
            }
            

            return false; // Once we've sold everything, quit. Liquidate is a single run operation.
        }
        return this.tendStocks(ns);
    }

    /**
     * Tries to buy the WSE accountm TIX API access, 4S Market Data access and 4S Market Data TIX API access,
     * if not already owned.
     */
    #buyApis() {
        const ns = this.ns;
        const player = ns.getPlayer();
        let haveWseAccount = player.hasWseAccount;
        let hasTixApiAccess = player.hasTixApiAccess;
        let has4SData = player.has4SData;
        let has4SDataTixApi = player.has4SDataTixApi;

        // All four of these access types are necessary for this script to function.
        // Check if we have them, buy what we can, and see if that's enough.

        if (!haveWseAccount && this.#canAffordPurchase(this.#prices.wseAccount)) {
            this.log(`Bought WSE account`);
            haveWseAccount = ns.stock.purchaseWseAccount();
        }

        if (!hasTixApiAccess && this.#canAffordPurchase(this.#prices.tixApi) && ns.stock.purchaseTixApi()) {
            this.log(`Bought TIX API access`);
            hasTixApiAccess = true;
            this.#spent += this.#prices.tixApi;
        }

        if (!has4SData && this.#canAffordPurchase(this.#prices.fourSData) && ns.stock.purchase4SMarketData()) {
            this.log(`Bought 4S Market Data access`);
            has4SData = true;
            this.#spent += this.#prices.fourSData;
        }

        if (!has4SDataTixApi && this.#canAffordPurchase(this.#prices.fourSDataTixApi) && ns.stock.purchase4SMarketDataTixApi()) {
            this.log(`Bought 4S Market Data TIX API access`);
            has4SDataTixApi = true;
            this.#spent += this.#prices.fourSDataTixApi;
        }

        return haveWseAccount && hasTixApiAccess && has4SData && has4SDataTixApi;
    }

    #canAffordPurchase(cost) {
        return this.ns.getPlayer().money >= (this.#getReserveMoney() + cost)
    }

    #getReserveMoney() {
        return this.getOption('reserve-money')
    }

    tendStocks(ns) {
        const allStocks = this.getAllStocks(ns);

        if (!this.getOption('no-sell')) {
            // Select stocks with chance lower than our sell threshold to increase price.
            const stocksToSell = this.getBearStocks(allStocks, this.getOption('sell-threshold'));
            // Sell all those stocks.
            this.sellStocks(ns, stocksToSell);
        }

        if (!this.getOption('no-buy')) {
            // Select stocks with chance higher than our buy threshold to increase price.
            const stocksToBuy = this.getBullStocks(allStocks, this.getOption('buy-threshold'));
            // Buy the highest-rated stocks available.
            this.buyStocks(ns, stocksToBuy);
        }

        // Keep a log of net worth change over time
        const portfolioValue = this.getPortfolioValue(allStocks);
        const cashValue = ns.getPlayer().money;
        const totalValue = portfolioValue + cashValue;

        this.log(`Net worth: ${formatMoney(totalValue)} = ${formatMoney(portfolioValue)} stocks + ${formatMoney(cashValue)} cash. Spent ${formatMoney(this.#spent)} and made ${formatMoney(this.#profit)} profit`);

        return true;
    }

    getAllStocks(ns) {
        // make a lookup table of all stocks and all their properties
        const stockSymbols = ns.stock.getSymbols();
        const stocks = {};

        for (const sym of stockSymbols) {

            const pos = ns.stock.getPosition(sym);
            const stock = {
                sym,
                forecast: ns.stock.getForecast(sym),
                volatility: ns.stock.getVolatility(sym),
                askPrice: ns.stock.getAskPrice(sym),
                bidPrice: ns.stock.getBidPrice(sym),
                maxShares: ns.stock.getMaxShares(sym),
                shares: pos[0],
                sharesAvgPrice: pos[1],
                sharesShort: pos[2],
                sharesAvgPriceShort: pos[3]
            };
            stock.summary = `${stock.sym}: ${formatPercent(stock.forecast)} ± ${formatPercent(stock.volatility)}`;
            stocks[sym] = stock;
        }

        return stocks;
    }

    getPortfolioValue(stocks) {
        let value = 0;

        for (const stock of Object.values(stocks)) {
            value += stock.bidPrice * stock.shares - stock.askPrice * stock.sharesShort;
        }

        return value;
    }

    getBullStocks(stocks, threshold = 0.55) {
        // select stocks with at least threshold % chance to increase each cycle
        const bullStocks = [];

        for (const stock of Object.values(stocks)) {
            if (stock.forecast - stock.volatility > threshold) {
                bullStocks.push(stock);
            }
        }

        return bullStocks;
    }

    getBearStocks(stocks, threshold = 0.48) {
        // select stocks with at most threshold % chance to increase each cycle
        const bearStocks = [];

        for (const stock of Object.values(stocks)) {
            if (stock.forecast - stock.volatility < threshold) {
                bearStocks.push(stock);
            }
        }

        return bearStocks;
    }

    /**
     * @param {NS} ns Namespace
     * @param {Object[]} stocksToSell Stocks that will be sold.
     */
    sellStocks(ns, stocksToSell) {
        for (const stock of stocksToSell) {
            if (stock.shares > 0) {
                const salePrice = ns.stock.sell(stock.sym, stock.shares);

                if (salePrice !== 0) {
                    const saleTotal = salePrice * stock.shares;
                    const saleCost = stock.sharesAvgPrice * stock.shares;
                    const saleProfit = saleTotal - saleCost;
                    stock.shares = 0;

                    this.#profit += saleProfit;
                    this.#spent += this.#prices.commission; 

                    this.log(`Sold ${stock.summary} stock for ${formatMoney(saleProfit)} profit`);
                }
            }
        }
    }

    /**
     * @param {NS} ns Namespace
     * @param {Object[]} stocksToSell Stocks that will be sold.
     */
    buyStocks(ns, stocksToBuy, maxTransactions = 4) {
        // buy stocks, spending more money on higher rated stocks
        const bestStocks = stocksToBuy.sort((a, b) => {
            return b.forecast - a.forecast; // descending
        });

        let transactions = 0;

        for (const stock of bestStocks) {
            // Determine budget, respecting the amount of money to reserve.
            const budget = ns.getPlayer().money - this.#getReserveMoney();

            // Only allow purchase when we have at least the minimum purchase size.
            if (budget < this.getOption('minimum-purchase-size') || transactions >= maxTransactions) {
                return;
            }
            // spend up to half the money available on the highest rated stock
            // (the following stock will buy half as much)
            const moneyThisStock = budget / 2 - this.#prices.commission;
            let numShares = moneyThisStock / stock.askPrice;

            numShares = Math.min(numShares, stock.maxShares - stock.shares - stock.sharesShort);
            const boughtPrice = ns.stock.buy(stock.sym, numShares);

            if (boughtPrice !== 0) {
                const boughtTotal = boughtPrice * numShares;
                transactions += 1;
                stock.shares += numShares;

                this.#spent += boughtTotal + this.#prices.commission;

                this.log(`Bought ${formatMoney(boughtTotal)} of ${stock.summary}`);
            }
        }
    }
}