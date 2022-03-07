import {
	Arrays
} from '/util-helpers.js';

import ServerLight from '/classes/ServerLight.js';
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
		name: 'ServerLight',
		
		options: {
			logPassed: options['log-passed'] === true,
			logDebug: options.debug === true
		},

		tests: [
			{
				name: 'constructor',
				fn: function(assert) {
					const sl = new ServerLight(ns, 'fakeHost');

					assert.equals(sl.hostname, 'fakeHost');
					assert.equals(sl.ns, ns);
				}
			},
			{
				name: 'securityLevel',
				fn: function(assert) {
					const nsObj = {
						getServerSecurityLevel: mockery.fn().returns(42),
						phydzn: () => {}
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.securityLevel, 42);
					assert.that(nsObj.getServerSecurityLevel).hasBeenCalledWith('fakeHost');

					assert.equals(sl.hackDifficulty, 42); // Alias
				}
			},
			{
				name: 'hasRootAccess',
				fn: function(assert) {
					const nsObj = {
						hasRootAccess: mockery.fn()
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					nsObj.hasRootAccess.returns(true);
					assert.equals(sl.hasRootAccess, true);
					assert.that(nsObj.hasRootAccess).hasBeenCalledWith('fakeHost');
					assert.equals(sl.hasAdminRights, true); // Alias

					assert.that(nsObj.hasRootAccess).hasBeenCalledTimes(2);

					nsObj.hasRootAccess.resetCalls();

					nsObj.hasRootAccess.returns(false);
					assert.equals(sl.hasRootAccess, false);
					assert.that(nsObj.hasRootAccess).hasBeenCalledWith('fakeHost');
					assert.equals(sl.hasAdminRights, false); // Alias
				}
			},
			{
				name: 'maxRam',
				fn: function(assert) {
					const nsObj = {
						getServerMaxRam: mockery.fn().returns(1337)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.maxRam, 1337);
					assert.that(nsObj.getServerMaxRam).hasBeenCalledWith('fakeHost');
				}
			},
			{
				name: 'minSecurityLevel',
				fn: function(assert) {
					const nsObj = {
						getServerMinSecurityLevel: mockery.fn().returns(13)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.minSecurityLevel, 13);
					assert.that(nsObj.getServerMinSecurityLevel).hasBeenCalledWith('fakeHost');
					assert.equals(sl.minDifficulty, 13); // Alias
				}
			},
			{
				name: 'moneyAvailable',
				fn: function(assert) {
					const nsObj = {
						getServerMoneyAvailable: mockery.fn().returns(123456)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.moneyAvailable, 123456);
					assert.that(nsObj.getServerMoneyAvailable).hasBeenCalledWith('fakeHost');
				}
			},
			{
				name: 'maxMoney',
				fn: function(assert) {
					const nsObj = {
						getServerMaxMoney: mockery.fn().returns(654321)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.maxMoney, 654321);
					assert.that(nsObj.getServerMaxMoney).hasBeenCalledWith('fakeHost');
					assert.equals(sl.moneyMax, 654321); // Alias
				}
			},
			{
				name: 'numOpenPortsRequired',
				fn: function(assert) {
					const nsObj = {
						getServerNumPortsRequired: mockery.fn().returns(4)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.numOpenPortsRequired, 4);
					assert.that(nsObj.getServerNumPortsRequired).hasBeenCalledWith('fakeHost');
				}
			},
			{
				name: 'usedRam',
				fn: function(assert) {
					const nsObj = {
						getServerUsedRam: mockery.fn().returns(345)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.usedRam, 345);
					assert.that(nsObj.getServerUsedRam).hasBeenCalledWith('fakeHost');
					assert.equals(sl.ramUsed, 345); // Alias
				}
			},
			{
				name: 'ramAvailable',
				fn: function(assert) {
					const nsObj = {
						getServerUsedRam: mockery.fn().returns(111),
						getServerMaxRam: mockery.fn().returns(567)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.ramAvailable, 456);
					assert.that(nsObj.getServerUsedRam).hasBeenCalledWith('fakeHost');
					assert.that(nsObj.getServerMaxRam).hasBeenCalledWith('fakeHost');
				}
			},
			{
				name: 'requiredHackingLevel',
				fn: function(assert) {
					const nsObj = {
						getServerRequiredHackingLevel: mockery.fn().returns(12)
					};
					const sl = new ServerLight(nsObj, 'fakeHost');

					assert.equals(sl.requiredHackingLevel, 12);
					assert.that(nsObj.getServerRequiredHackingLevel).hasBeenCalledWith('fakeHost');
					assert.equals(sl.requiredHackingSkill, 12); // Alias
				}
			},
		],
	});

	suite.execute();
}