/**
 * Formats a number value as a sum of money.
 * @param {number} value The money value.
 * @param {string} magnitude Determines the output format: '' for one, 'k' for thousands, 'm' for millions, 'b' for billions.
 **/
 export function formatMagnitude(value, magnitude) {
	 let magnitudes = {
		one: {
			orderOfMagnitude: 0,
			postfix: ''
		},
		k: {
			orderOfMagnitude: 3,
			postfix: 'k'
		},
		m: {
			orderOfMagnitude: 6,
			postfix: 'm'
		},
		b: {
			orderOfMagnitude: 9,
			postfix: 'b'
		}
	};

	let magnitudeObj = magnitudes[magnitude] || magnitudes.one;
	let orderOfMagnitude = magnitudeObj.orderOfMagnitude;
	let magnitudeValue = Math.pow(10, orderOfMagnitude);
	let formattedValue = Math.round(((value / magnitudeValue) + Number.EPSILON) * 100) / 100;
	let dotIndex = String.prototype.indexOf.call(formattedValue, '.');

	// Make sure all these values end in 2 decimals.
	if (dotIndex === -1) {
		formattedValue = formattedValue += '.00';
	} else {
		formattedValue = String.prototype.padEnd.call(formattedValue, dotIndex + 3, '0');
	}
	

	return formattedValue + magnitudeObj.postfix;
 }

/**
 * Formats a number value as a sum of money.
 * @param {number} value The money value.
 * @param {string} magnitude Determines the output format: '' for one, 'k' for thousands, 'm' for millions, 'b' for billions.
 **/
export function formatMoney(value, magnitude) {
	return formatMagnitude(value, magnitude);
}