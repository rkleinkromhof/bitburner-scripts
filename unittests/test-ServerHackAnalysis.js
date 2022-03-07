import {
	Arrays
} from '/util-helpers.js';

import ServerHackAnalysis from '/classes/ServerHackAnalysis.js';
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
		name: 'ServerHackAnalysis',
		
		options: {
			logPassed: options['log-passed'] === true,
			logDebug: options.debug === true
		},

		tests: [
			{
				name: 'constructor',
				fn: function(assert) {
					const sl = new ServerHackAnalysis(ns, 'fake');

					assert.equals(sl.hostname, 'fake');
					assert.equals(sl.ns, ns);
				}
			},
			{
				name: 'calcGrowBackThreads',
				fn: function(assert) {
					const nsObj = mockery.obj('Mock Namespace', {
						growthAnalyze: 42.2,
						getServerMaxMoney: 1000000 // A million
					});
					const sl = new ServerHackAnalysis(nsObj, 'fake');

					// return Math.ceil(this.ns.growthAnalyze(this.hostname, this.maxMoney / (this.maxMoney - (hackMoney))));
					assert.equals(sl.calcGrowBackThreads(200000), 43);
					// assert.equals();
				}
			},
			{
				name: 'calcHackThreads',
				fn: function(assert) {
					const nsObj = {
						hackAnalyzeThreads: mockery.fn().returns(10)
					};
					const sl = new ServerHackAnalysis(nsObj, 'fake');

					// assert.equals(sl.securityLevel, 42);
					// assert.equals(sl.hackDifficulty, 42); // Alias
					
				}
			},
		],
	});

	suite.execute();
}