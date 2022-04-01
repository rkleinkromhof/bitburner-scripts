import {
	Arrays
} from '/util-helpers.js';

import HackAnalysis from '/classes/HackAnalysis.js';
import TestSuite from '/testi/TestSuite.js';
import mockery from 'testi/mockery.js';

let ns;

const argsSchema = [
	['debug', false],
	['log-passed', false]
];

export function autocomplete(data, args) {
	const opts = data.flags(argsSchema);

	return [...Object.keys(opts)];
}

/** @param {NS} ns **/
export async function main(_ns) {
	ns = _ns;
	const options = ns.flags(argsSchema);

	const suite = new TestSuite(ns, {
		name: 'HackAnalysis',
		
		options: {
			logPassed: options['log-passed'] === true,
			logDebug: options.debug === true
		},

		tests: [
			{
				name: 'constructor',
				fn: function(assert) {
					const server = {
						name: 'fake'
					};
					const sl = new HackAnalysis({
						ns: {},
						server,
						allocatedRam: 1024,
						hackMoneyPercentage: 6.25,
						isAutoAdjustMoneyPercentage: false // prevent calculations from running at construction time
					});

					assert.equals(sl.server, server);
					assert.equals(sl.allocatedRam, 1024);
					assert.equals(sl.hackMoneyPercentage, 6.25);
				}
			},
			{
				name: 'isSecurityPrepped',
				fn: function(assert) {
					const server = {
						name: 'fake',
						securityLevel: 1,
						minSecurityLevel: 1
					};
					const sl = new HackAnalysis({
						ns: {},
						server,
						allocatedRam: 1024,
						hackMoneyPercentage: 6.25,
						isAutoAdjustMoneyPercentage: false // prevent calculations from running at construction time
					});

					assert.equals(sl.isSecurityPrepped, true);

					server.securityLevel = 10;
					assert.equals(sl.isSecurityPrepped, false);

					server.minSecurityLevel = 10;
					assert.equals(sl.isSecurityPrepped, true);
				}
			},
			{
				name: 'isMoneyPrepped',
				fn: function(assert) {
					const server = {
						name: 'fake',
						moneyAvailable: 100,
						maxMoney: 100
					};
					const sl = new HackAnalysis({
						ns: {},
						server,
						allocatedRam: 1024,
						hackMoneyPercentage: 6.25,
						isAutoAdjustMoneyPercentage: false // prevent calculations from running at construction time
					});

					assert.equals(sl.isMoneyPrepped, true);

					server.maxMoney = 1000;
					assert.equals(sl.isMoneyPrepped, false);

					server.moneyAvailable = 1000;
					assert.equals(sl.isMoneyPrepped, true);
				}
			},
			{
				name: 'calcHackThreads',
				fn: function(assert) {
					const server = {
						name: 'fake'
					};
					const nsObj = {
						hackAnalyzeThreads: mockery.fn().returns(10)
					};
					const sl = new HackAnalysis({
						ns: nsObj,
						server,
						allocatedRam: 1024,
						hackMoneyPercentage: 6.25,
						isAutoAdjustMoneyPercentage: false // prevent calculations from running at construction time
					});

					// assert.equals(sl.securityLevel, 42);
					// assert.equals(sl.hackDifficulty, 42); // Alias
					
				}
			},
		],
	});

	suite.execute();
}