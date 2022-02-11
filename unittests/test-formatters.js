import {
	formatMoney,
	formatNumberShort,
	parseShortNumber,
	formatNumber,
	formatPercent,
	formatRam,
	formatDateTime,
	formatTime,
	formatDuration
} from '/util-formatters.js';

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
		name: 'util-formatters',

		options: {
			logPassed: options['log-passed'] === true,
			logDebug: options.debug === true
		},

		// setUp: function() {
		// 	ns.tprint('Setting up tests');
		// },

		tests: [
			
			{
				name: 'util-formatters formatMoney (\'\') - formats 123 as $123.000',
				fn: function(assert) {
					assert.equals(formatMoney(123), '$123.000');
				}
			},
			{
				name: 'util-formatters formatMoney (k) - formats 1234.5678 as $1.235k',
				fn: function(assert) {
					assert.equals(formatMoney(1234.5678), '$1.235k');
				}
			},
			{
				name: 'util-formatters formatMoney (m) - formats 123456789 as $123.457m',
				fn: function(assert) {
					assert.equals(formatMoney(123456789), '$123.457m');
				}
			},
			{
				name: 'util-formatters formatMoney (b) - formats 12345678900 as $12.346b',
				fn: function(assert) {
					assert.equals(formatMoney(12345678900), '$12.346b');
				}
			},
			{
				name: 'util-formatters formatMoney (t) - formats 1234567890000 as $1.235t',
				fn: function(assert) {
					assert.equals(formatMoney(1234567890000), '$1.235t');
				}
			},
			{
				name: 'util-formatters formatMoney (q) - formats 987654321000000000 as $987.654q',
				fn: function(assert) {
					assert.equals(formatMoney(987654321000000000), '$987.654q');
				}
			},
			{
				name: 'util-formatters formatMoney (Q) - formats 987654321000000000 as $98.765Q',
				fn: function(assert) {
					assert.equals(formatMoney(98765432100000000000), '$98.765Q');
				}
			},
			{
				name: 'util-formatters formatMoney (s) - formats 9876543210000000000000 as $9.877s',
				fn: function(assert) {
					assert.equals(formatMoney(9876543210000000000000), '$9.877s');
				}
			},
			{
				name: 'util-formatters formatMoney (S) - formats 987654321000000000000000000 as $987.654S',
				fn: function(assert) {
					assert.equals(formatMoney(987654321000000000000000000), '$987.654S');
				}
			},
			{
				name: 'util-formatters formatMoney (o) - formats 98765432100000000000000000000 as $98.765o',
				fn: function(assert) {
					assert.equals(formatMoney(98765432100000000000000000000), '$98.765o');
				}
			},
			{
				name: 'util-formatters formatMoney (n) - formats 9876543210000000000000000000000 as $9.877n',
				fn: function(assert) {
					assert.equals(formatMoney(9876543210000000000000000000000), '$9.877n');
				}
			},
			{
				name: 'util-formatters formatMoney (e33) - formats a 42 with 33 zeroes as $42.000e33',
				fn: function(assert) {
					assert.equals(formatMoney(42 * Math.pow(10, 33)), '$42.000e33');
				}
			},
			{
				name: 'util-formatters formatMoney (e36) - formats a 42 with 36 zeroes as $42.000e36',
				fn: function(assert) {
					assert.equals(formatMoney(42 * Math.pow(10, 36)), '$42.000e36');
				}
			},
			{
				name: 'util-formatters formatMoney (e39) - formats a 42 with 39 zeroes as $42.000e39',
				fn: function(assert) {
					assert.equals(formatMoney(42 * Math.pow(10, 39)), '$42.000e39');
				}
			},
			{
				name: 'util-formatters formatMoney - maxSignificantFigures',
				fn: function(assert) {
					assert.equals(formatMoney(123.456, 0), '$123');
					assert.equals(formatMoney(123.456, 1), '$123');
					assert.equals(formatMoney(123.456, 2), '$123');
					assert.equals(formatMoney(123.456, 3), '$123');
					assert.equals(formatMoney(123.456, 4), '$123.5');
					assert.equals(formatMoney(123.456, 5), '$123.46');
					assert.equals(formatMoney(123.456, 6), '$123.456');
				}
			},
			{
				name: 'util-formatters formatMoney - maxDecimalPlaces',
				fn: function(assert) {
					assert.equals(formatMoney(123.456, 6, 0), '$123');
					assert.equals(formatMoney(123.456, 6, 1), '$123.5');
					assert.equals(formatMoney(123.456, 6, 2), '$123.46');
					assert.equals(formatMoney(123.456, 6, 3), '$123.456');
					assert.equals(formatMoney(123.456, 6, 4), '$123.456');
					assert.equals(formatMoney(123.456, 6, 5), '$123.456');
				}
			},


			// formatNumberShort
			// {
			// 	name: 'util-formatters formatNumberrShort - ',
			// 	fn: function(assert) {
					
			// 	}
			// }
			// {
			// 	name: '',
			// 	fn: function(assert) {

			// 	}
			// }
		],
	});

	suite.execute();
}