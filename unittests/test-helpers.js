import {
	seconds,
	minutes,
	hours,
	Arrays,
	allGameServers
} from '/util-helpers.js';

import TestSuite from '/testi/TestSuite.js';

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
		name: 'util-helpers.js',
		
		options: {
			logPassed: options['log-passed'] === true,
			logDebug: options.debug === true
		},

		tests: [
			{
				name: 'seconds',
				fn: function(assert) {
					assert.equals(seconds(0.25), 250);
					assert.equals(seconds(0.5), 500);
					assert.equals(seconds(1), 1000);
					assert.equals(seconds(20), 20000);
					assert.equals(seconds(60), 60000);
				}
			},
			{
				name: 'minutes',
				fn: function(assert) {
					assert.equals(minutes(0.25), 15000);
					assert.equals(minutes(0.5), 30000);
					assert.equals(minutes(1), 60000);
					assert.equals(minutes(20), 1200000);
					assert.equals(minutes(60), 3600000);
				}
			},
			{
				name: 'hours',
				fn: function(assert) {
					assert.equals(minutes(0.25), 15000);
					assert.equals(minutes(0.5), 30000);
					assert.equals(minutes(1), 60000);
					assert.equals(minutes(20), 1200000);
					assert.equals(minutes(60), 3600000);
				}
			},
			
			{
				name: 'allGameServers',
				fn: function(assert) {
					assert.arrayIsSize(allGameServers, 72);
				}
			},

			// {
			// 	name: '',
			// 	fn: function(assert) {

			// 	}
			// },

			{
				name: 'Arrays - add - edits array in place',
				fn: function(assert) {
					const arr = [1, 2];
					const result = Arrays.add(arr, 3);

					assert.equals(result, arr);
				}
			},
			{
				name: 'Arrays - add - adds one item to the array',
				fn: function(assert) {
					const arr = [1, 2];
					const result = Arrays.add(arr, 3);

					assert.equals(result, [1, 2, 3]);
				}
			},
			{
				name: 'Arrays - add - adds multiple items to the array',
				fn: function(assert) {
					const arr = [1, 2];
					const result = Arrays.add(arr, 3, 4);

					assert.equals(result, [1, 2, 3, 4]);

					Arrays.add(arr, 5, 6, 7);

					assert.equals(result, [1, 2, 3, 4, 5, 6, 7]);
				}
			},

			{
				name: 'Arrays - erase - edits array in place',
				fn: function(assert) {
					const arr = [1, 2, 3];
					const result = Arrays.add(arr, 3);

					assert.equals(result, arr);
				}
			},
			{
				name: 'Arrays - erase - removes one item from the array',
				fn: function(assert) {
					const arr = [1, 2, 10, 3, 4];
					const result = Arrays.erase(arr, 10);

					assert.equals(result, [1, 2, 3, 4]);
				}
			},
			{
				name: 'Arrays - erase - removes multiple items from the array',
				fn: function(assert) {
					const arr = [11, 1, 2, 10, 3, 12, 4, 13];
					const result = Arrays.erase(arr, 10, 11, 12, 13);

					assert.equals(result, [1, 2, 3, 4]);
				}
			},

			{
				name: 'Arrays - contains - returns true when array contains value',
				fn: function(assert) {
					const arr = ['one', 'two', 'three'];

					assert.equalsTrue(Arrays.contains(arr, 'one'));
					assert.equalsTrue(Arrays.contains(arr, 'two'));
					assert.equalsTrue(Arrays.contains(arr, 'three'));
				}
			},
			{
				name: 'Arrays - contains - returns false when array does not contain value',
				fn: function(assert) {
					const arr = ['one', 'two', 'three'];

					assert.equalsFalse(Arrays.contains(arr, 'zero'));
					assert.equalsFalse(Arrays.contains(arr, 'five'));
					assert.equalsFalse(Arrays.contains(arr, 'forty two'));
				}
			},

			{
				name: 'Arrays - eraseAll - erases all items from the array',
				fn: function(assert) {
					const arr = [1, 2, 3, 4];

					assert.equals(Arrays.eraseAll(arr), []);
				}
			},

			{
				name: 'Arrays - include - edits array in place',
				fn: function(assert) {
					const arr = [1, 2, 3];

					assert.equals(Arrays.include(arr, 3), arr);
					assert.equals(Arrays.include(arr, 4), arr);
				}
			},
			{
				name: 'Arrays - include - adds items that aren\'t already in the array',
				fn: function(assert) {
					const arr = [1, 2, 3, 4];

					assert.equals(Arrays.include(arr, 5), [1, 2, 3, 4, 5]);
					assert.equals(Arrays.include(arr, 6), [1, 2, 3, 4, 5, 6]);
				}
			},
			{
				name: 'Arrays - include - does not add items that are already in the array',
				fn: function(assert) {
					const arr = [1, 2, 3, 4];

					assert.equals(Arrays.include(arr, 1), [1, 2, 3, 4]);
					assert.equals(Arrays.include(arr, 2), [1, 2, 3, 4]);
					assert.equals(Arrays.include(arr, 3), [1, 2, 3, 4]);
					assert.equals(Arrays.include(arr, 4), [1, 2, 3, 4]);
				}
			},
		],
	});

	suite.execute();
}