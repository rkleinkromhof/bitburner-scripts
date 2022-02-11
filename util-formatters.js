/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. $6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 * @returns {string} The formatted money string.
 */
export function formatMoney(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    let numberShort = formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces);
    return num >= 0 ? "$" + numberShort : numberShort.replace("-", "-$");
}

const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M) 
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 * @returns {string} The formatted number value.
 */
export function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
    // TODO: A number like 9.999 once rounted to show 3 sig figs, will become 10.00, which is now 4 sig figs.
    return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
}

/**
 * Convert a shortened number back into a value
 * @param {string} [text='0'] The text to convert.
 * @returns {number} The number value.
 */
export function parseShortNumber(text = '0') {
    let parsed = Number(text);
    if (!isNaN(parsed)) return parsed;
    for (const sym of symbols.slice(1))
        if (text.toLowerCase().endsWith(sym))
            return Number.parseFloat(text.slice(0, text.length - sym.length)) * Math.pow(10, 3 * symbols.indexOf(sym));
    return Number.NaN;
}

/**
 * Return a number formatted with the specified number of significatnt figures or decimal places, whichever is more limiting.
 * @param {number} num - The number to format
 * @param {number=} minSignificantFigures - (default: 6) The minimum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} minDecimalPlaces - (default: 3) The minimum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 * @returns {string} A formatted number string.
 */
export function formatNumber(num, minSignificantFigures = 3, minDecimalPlaces = 1) {
    return num == 0.0 ? num : num.toFixed(Math.max(minDecimalPlaces, Math.max(0, minSignificantFigures - Math.ceil(Math.log10(num)))));
}

/**
 * Returns a decimal number formatted as a percentage: 0.42 -> '42%'.
 * @param {number} num The number.
 * @returns {string} A formatted percentage string.
 */
export function formatPercent(num) {
    return `${formatNumber(num * 100, 3, 2)}%`;
}

/**
 * Formats some RAM amount as a round number of GB with thousands separators e.g. `1,028 GB`
 * @param {number} num The number.
 * @returns {string} A formatted RAM string.
 */
export function formatRam(num) {
    return `${Math.round(num).toLocaleString()} GB`;
}

/**
 * Return a datatime om the desired date and time format.
 * @param {Date} datetime The date and time.
 * @param {Object} [options] Intl.DateTimeFormat options. 
 * @returns {string} A formatted datetime string.
 */
export function formatDateTime(datetime = new Date(), options) {
    options = Object.assign({}, {dateStyle: 'short', timeStyle: 'medium'}, options);

    return createDateTimeFormat(options).format(datetime);
}

/**
 * Return a datatime om the desired time format.
 * @param {Date} datetime The time. Note that the date part is ignored.
 * @param {Object} [options] Intl.DateTimeFormat options.
 * @returns {string} A formatted time string.
 */
export function formatTime(datetime = new Date(), options) {
    options = Object.assign({}, {timeStyle: 'medium'}, options);

    delete options.dateStyle; // Remove date; we're only doing time format here.

    return createDateTimeFormat(options).format(datetime);
}

/**
 * Format a duration (in milliseconds) as e.g. '1h 21m 6s' for big durations or e.g '12.5s' / '23ms' for small durations
 * @param {number} duration The duration in milliseconds.
 * @returns {string} A formatted duration.
 */
export function formatDuration(duration) {
    if (duration < 1000) return `${duration.toFixed(0)}ms`
    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);
    if (hours > 0) {
        portions.push(hours + 'h');
        duration -= (hours * msInHour);
    }
    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);
    if (minutes > 0) {
        portions.push(minutes + 'm');
        duration -= (minutes * msInMinute);
    }
    let seconds = (duration / 1000.0)
    // Include millisecond precision if we're on the order of seconds
    seconds = (hours == 0 && minutes == 0) ? seconds.toPrecision(3) : seconds.toFixed(0);
    if (seconds > 0) {
        portions.push(seconds + 's');
        duration -= (minutes * 1000);
    }
    return portions.join(' ');
}

/**
 * Returns an Intl.DateTimeFormat instance for the given configuration options.
 * @param {Object} options Second arg for the Intl.DateTimeFormat constructor.
 * @param {string} [locale='default'] First arg for the Intl.DateTimeFormat constructor.
 * @returns {Intl.DateTimeFormat} Date-time formatter.
 */
function createDateTimeFormat(options, locale = 'default') {
    return new Intl.DateTimeFormat(locale, options);
}