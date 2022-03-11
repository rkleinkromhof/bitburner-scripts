// Couple of time convertion functions.
export const seconds = value => value * 1000;
export const minutes = value => 60 * seconds(value);
export const hours = value => 60 * minutes(value);

export const allGameServers = [
	'home',
	'darkweb',
	'n00dles',
	'foodnstuff',
	'sigma-cosmetics',
	'joesguns',
	'nectar-net',
	'hong-fang-tea',
	'harakiri-sushi',
	'neo-net',
	'CSEC',
	'zer0',
	'max-hardware',
	'iron-gym',
	'phantasy',
	'silver-helix',
	'omega-net',
	'avmnite-02h',
	'crush-fitness',
	'johnson-ortho',
	'the-hub',
	'I.I.I.I',
	'comptek',
	'netlink',
	'catalyst',
	'rothman-uni',
	'aevum-police',
	'summit-uni',
	'millenium-fitness',
	'.',
	'rho-construction',
	'run4theh111z',
	'alpha-ent',
	'syscore',
	'lexo-corp',
	'snap-fitness',
	'zb-institute',
	'solaris',
	'global-pharm',
	'vitalife',
	'nova-med',
	'microdyne',
	'zeus-med',
	'zb-def',
	'applied-energetics',
	'titan-labs',
	'unitalife',
	'deltaone',
	'univ-energy',
	'galactic-cyber',
	'icarus',
	'aerocorp',
	'omnia',
	'infocomm',
	'helios',
	'4sigma',
	'b-and-a',
	'taiyang-digital',
	'The-Cave',
	'stormtech',
	'defcomm',
	'clarkinc',
	'omnitek',
	'blade',
	'powerhouse-fitness',
	'nwo',
	'fulcrumtech',
	'megacorp',
	'kuai-gong',
	'ecorp',
	'fulcrumassets',
	'w0r1d_d43m0n'
];

export const factions = [
    // Early game
    'CyberSec',
    'Tian Di Hui',
    'Netburners',

    // City factions
    'Sector-12',
    'Aevum',
    'Volhaven',
    'Chongqing',
    'New Tokyo',
    'Ishima',

    // Hacking Groups
    'NiteSec',
    'The Black Hand',
    'BitRunners',

    // Megacorporations
    'ECorp',
    'MegaCorp',
    'KuaiGong International',
    'Four Sigma',
    'NWO',
    'Blade Industries',
    'OmniTek Incorporated',
    'Bachman & Associates',
    'Clarke Incorporated',
    'Fulcrum Secret Technologies',

    // Criminal Organizations
    'Slum Snakes',
    'Tetrads',
    'Silhouette',
    'Speakers for the Dead',
    'The Dark Army',
    'The Syndicate',

    // End-game factions
    'The Covenant',
    'Daedalus',
    'Illuminati',
];

const heightenedLogLevels = ['info', 'warning', 'error'];

/**
 * Logs a message. To log a message to the terminal or as a toast, use the options 'inTerminal' and 'inToast', respectively.
 * @param {NS} Namespace
 * @param {String} message The message to log.
 * @param {Object|Boolean} [options] The options. If this is a boolean value, it is treated as value for `logToTerminal`.
 * @param {Boolean} [options.logToTerminal=false] `true` to log to the terminal too.
 * @param {String} [options.level='primary'|'info'|'warning'|'error'] The log level
 * @param {*|Function} [options.prefix] The value, or value producing function, to prefix the log messages with.
 */
export function log(ns, message, options) {
	checkNsInstance(ns, 'log');

	options = Object.assign({}, {
		logToTerminal: false
	}, isBoolean(options) ? {logToTerminal: options} : options);

	let prefix = options.prefix ? getFromValueOrFunction(options.prefix) : '';

	if (options.level && Arrays.contains(heightenedLogLevels, options.level)) {
		prefix = `${String.prototype.toUpperCase.call(options.level)}: ${prefix}`;
	}

	let prefixedMessage = `${prefix}${message}`;

	ns.print(prefixedMessage);

	if (options.logToTerminal) {
		ns.tprint(prefixedMessage);
	}
}

export function info(ns, message, options) {
	log(ns, message, Object.assign({}, options, {level: 'info'}));
}

export function warn(ns, message, options) {
	log(ns, message, Object.assign({}, options, {level: 'warning'}));
}

export function error(ns, message, options) {
	log(ns, message, Object.assign({}, options, {level: 'error'}));
}

/**
 * Creates a logger function with NS built in.
 * @param {NS} ns The Namespace
 * @param {Object|Boolean} [options] The options. See `log` for options.
 * @return {Function} the logger function.
 * @return {Function} returns.info The info logger function.
 * @return {Function} returns.warn The warning logger function.
 * @return {Function} returns.error The error logger function.
 * @see log
 */
export function createLogger(ns, options) {
	const logger = (message, level) => log(ns, message, Object.assign({}, options, {level: level}));

	logger.info = (message) => info(ns, message, options);
	logger.warn = (message) => warn(ns, message, options);
	logger.error = (message) => error(ns, message, options);

	return logger;
}

/**
 * Disabled logging for the given services.
 * @param {NS} ns Namespace
 * @param {String[]} loggers
 */
export function disableLogs(ns, loggers) {
	checkNsInstance(ns, 'disableLogs');

	// If we're disabling logging of the disableLog method itself, then make sure it's the first
	// or it'll still log for each log that's disabled before it.
	if (Arrays.contains(loggers, 'disableLog')) {
		Arrays.erase(loggers, 'disableLog');
		loggers.unshift('disableLog');
	}

	loggers.forEach(logger => ns.disableLog(logger));
}

/** @param {NS} ns 
 * Returns a helpful error message if we forgot to pass the ns instance to a function */
export function checkNsInstance(ns, fnName = "this function") { if (!ns.print) throw `The first argument to ${fnName} should be a 'ns' instance.`; return ns; }

/**
 * Creates a compare method for Array.prototype.sort.
 * @param {String} property The property name
 * @param {Object} options Sorting options.
 * @param {String} [options.direction='asc'] Sorting direction. Possible values: ['asc', 'desc']
 */
export function sorter(property, options = {}) {
	const {direction = 'asc'} = options;

	return String.prototype.toLocaleLowerCase.call(direction) === 'asc' ? sorterAsc(property) : sorterDesc(property);
}

export function sorterAsc(property) {
	return (left, right) => left[property] - right[property];
}

export function sorterDesc(property) {
	return (left, right) => right[property] - left[property];
}

export function sortAlphabetical(a, b) {
	return  a === b ? 0 : a < b ? -1 : 1
}

export function sortCaseInsensitiveAlphabetical(a, b) {
	return sortAlphabetical(String.prototype.toLowerCase.call(a), String.prototype.toLowerCase.call(b));
}

export function isBoolean(value) {
	return isType(value, 'boolean');
}

export function isString(value) {
	return isType(value, 'string');
}

export function isObject(value) {
	return isType(value, 'object') && !Array.isArray(value) && value !== null;
}

export function isFunction(value) {
	return isType(value, 'function');
}

export function isType(value, type) {
	return typeof value === type;
}

export function getFromValueOrFunction(value, _this, args) {
	return isFunction(value) ? value.call(_this || null, args ? [...args] : []) : value;
}

export function createSimpleReturnFunction(value) {
	return () => value;
}

export function identityFn(o) {
	return o;
}

class ArrayHelper {
	add(arr, ...values) {
		Array.prototype.push.call(arr, ...values);

		return arr;
	}

	/**
	 * Removes items from the array.
	 * 
	 * This is called 'erase' and not 'remove' because the latter gets flagged as if using Stanek.remove,
	 * which'll increase the RAM cost by 150MB.
	 */
	erase(arr, ...values) {
		for (const value of values) {
			let index = arr.indexOf(value);
			Array.prototype.splice.call(arr, index, 1);
		}

		return arr;
	}

	contains(arr, ...values) {
		for (const value of values) {
			if (arr.indexOf(value) < 0) {
				return false;
			}
		}
		return true;
	}

	eraseAll(arr) {
		Array.prototype.splice.call(arr, 0, arr.length);

		return arr;
	}

	include(arr, ...values) {
		for (const value of values) {
			if (!this.contains(arr, value)) {
				arr.push(value);
			}
		}

		return arr;
	}

	equals(array1, array2) {
		// Code taken from https://docs.sencha.com/extjs/7.5.0/modern/src/Array.js-1.html#Ext.Array-method-equals
		const len1 = array1.length;
		const len2 = array2.length;

		// Short circuit if the same array is passed twice.
		if (array1 === array2) {
			// console.log('array1 === array2 => true');
			return true;
		}

		if (len1 !== len2) {
			// console.log(`array1.length (${len1}) !== array2.length (${len2}) => false`);
			return false;
		}

		for (let i = 0; i < len1; ++i) {
			if (array1[i] !== array2[i]) {
				// console.log(`array1[${i}] !== array2[${i}] => false`);
				return false;
			}
		}

		// console.log('array1 ~= array2');
		return true;
	}
}

export const Arrays = new ArrayHelper();