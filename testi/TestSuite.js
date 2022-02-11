class IncorrectSuiteConfigurationError extends Error {
	constructor(message, options) {
		super(message, options);
	}
}

/**
 * A unit test suite.
 */
export default class TestSuite {
	#passString = '[PASS]';
	#failString = '[FAIL]';
	
	// Counters.
	#passed;
	#failed;
	#testsRan;
	#ignored;

	// Logging
	#logPassed;
	#logDebug;

	// Private NS reference
	#ns;

	#suiteName;

	/**
	 * @param {NS} _ns The Namespace
	 * @param {Object} suite The suite.
	 * @param {Function} [suite.setUp]
	 * @param {Array} [suite.tests]
	 * @param {Function} [suite.tearDown]
	 */
	constructor(_ns, suite) {
		this.#ns = _ns;

		this.#checkNsArg(_ns);
		this.#checkSuiteArg(suite);

		this.#suiteName = suite.name;
		this.setUp = suite.setUp || this.#emptyFn;
		this.tests = suite.tests ? [...suite.tests.map(test => Object.assign({}, test))] : [];
		this.tearDown = suite.tearDown || this.#emptyFn;
		
		this.#logPassed = suite.options?.logPassed === true;
		this.#logDebug = suite.options?.logDebug === true;
	}

	#checkNsArg(_ns) {
		if (!_ns.print) {
			throw new IncorrectSuiteConfigurationError(`The first argument to Suite should be a 'ns' instance`);
		}
	}

	#checkSuiteArg(suite) {
		if (!suite) {
			throw new IncorrectSuiteConfigurationError('No suite configuration');
		}
		if (!this.#isObject(suite)) {
			throw new IncorrectSuiteConfigurationError('Suite configuration is not an object');
		}
	}

	execute() {
		const timeStart = Date.now();
		this.#log(`Suite starting.`);
		this.#resetCounter();
		this.setUp();
		this.#executeTests();
		this.tearDown();
		const timeEnd = Date.now();
		this.#log(`Results - ${this.#passed}/${this.#testsRan} tests passed, ${this.#failed} failed${this.#ignored ? ` and ${this.#ignored} ignored` : ''}. Suite took ${this.#formatDuration(timeEnd - timeStart)}.`);
	}

	#executeTests() {
		for (const test of this.tests) {
			if (test.ignore) {
				this.#ignored++;
			}
			else {
				try {
					const assertWrapper = this.#createAssertWrapper(test);

					test.fn.call(test, assertWrapper);
				} catch (ex) {
					this.#logFailReason(test.name, ex.message);
					throw ex; // Comment in for debugging purposes.
				}
			}
		}
	}

	#resetCounter() {
		this.#passed = this.#failed = this.#testsRan = this.#ignored = 0;
	}


	#createAssertWrapper(test) {
		const _this = this;

		return {
			equals(actual, expected) {
				_this.#assertEquals(test, actual, expected);
			},
			equalsStrict(actual, expected) {
				_this.#doAssert(_this.#assertStrictEquals, test.name, actual, expected);
			},
			equalsNull(actual) {
				_this.#doAssert(_this.#assertIsNull, test.name, actual, null);
			},
			equalsUndefined(actual) {
				_this.#doAssert(_this.#assertIsNull, test.name, actual, undefined);
			},
			equalsTrue(actual) {
				_this.#doAssert(_this.#assertBooleanEquals, test.name, actual, true);
			},
			equalsFalse(actual) {
				_this.#doAssert(_this.#assertBooleanEquals, test.name, actual, false);
			},
			arrayIsSize(actual, size) {
				_this.#doAssert(_this.#assertNumberEquals, test.name, actual?.length, size);
			},
			that(assertion) {
				return {
					hasBeenCalledWith(value) {
						// _this.#doAssert(_this.#)
					}
				}
			}
		};
	}

	#assertEquals(test, actual, expected) {
		const asserter = this.#determineAssertEqualsFn(expected);

		this.#doAssert(asserter, test.name, actual, expected);
	}

	#doAssert(asserter, testName, actual, expected) {
		if (!asserter.call(this, actual, expected)) {
			this.#failed++;
			this.#logFail(testName, actual, expected);
		} else {
			this.#passed++;

			if (this.#logPassed) {
				this.#logPass(testName);
			}
		}
		this.#testsRan++;
	}

	/**
	 * Returns the correct equals asserter method for the given value.
	 * @param {*} value The value.
	 * @returns {Function} The assert function.
	 */
	#determineAssertEqualsFn(value) {
		const checkers = [
			{ checkFn: this.#isUndefined, assertFn: this.#assertIsUndefined },
			{ checkFn: this.#isNull, assertFn: this.#assertIsNull },
			{ checkFn: this.#isArray, assertFn: this.#assertArrayEquals },
			{ checkFn: this.#isBoolean, assertFn: this.#assertBooleanEquals },
			{ checkFn: this.#isNumber, assertFn: this.#assertNumberEquals },
			{ checkFn: this.#isObject, assertFn: this.#assertObjectEquals },
			{ checkFn: this.#isString, assertFn: this.#assertStringEquals },
		];

		for (const checker of checkers) {
			if (checker.checkFn.call(this, value)) {
				return checker.assertFn;
			}
		}

		return () => false;
	}

	#assertIsUndefined(actual) {
		return this.#isUndefined(actual);
	}

	#assertIsNull(actual) {
		return this.#isNull(actual);
	}

	#assertArrayEquals(actual, expected) {
		// this.#log(`assertStrictEquals: ${expected} === ${actual}? => ${expected === actual}`);
		this.#debugAssertLog('assertArrayEquals', actual, expected, this.#isArrayEquals(actual, expected));
		return this.#isArrayEquals(actual, expected);
	}

	#assertObjectEquals(actual, expected) {
		return this.#isObjectEquals(actual, expected);
	}

	#assertStringEquals(actual, expected) {
		return this.#assertStrictEquals(actual, expected);
	}

	#assertBooleanEquals(actual, expected) {
		return this.#assertStrictEquals(actual, expected);
	}

	#assertNumberEquals(actual, expected) {
		return this.#assertStrictEquals(actual, expected);
	}

	#assertStrictEquals(actual, expected) {
		// this.#log(`assertStrictEquals: ${expected} === ${actual}? => ${expected === actual}`);
		return expected === actual;
	}

	#logFailReason(testName, reason) {
		this.#log(`${this.#failString} ${this.#suiteName} - ${testName}: ${reason}`);
	}

	#logFail(testName, actual, expected) {
		this.#log(`ERROR: ${this.#failString} ${this.#suiteName} - ${testName}: Expected ${actual} to be ${expected}`);
	}

	#logPass(testName) {
		this.#log(`${this.#passString} ${this.#suiteName} - ${testName}`);
	}

	#log(message) {
		this.#ns.tprint(message);
	}

	#isUndefined(value) {
		return value === undefined;
	}

	#isNull(value) {
		return value === null;
	}

	#isBoolean(value) {
		return this.#isType(value, 'boolean');
	}

	#isString(value) {
		return this.#isType(value, 'string');
	}

	#isNumber(value) {
		return this.#isType(value, 'number');
	}

	#isFunction(value) {
		return this.#isType(value, 'function');
	}

	#isObject(value) {
		// typof null === 'object'!
		return value !== null && this.#isType(value, 'object') && !(value instanceof Array);
	}

	#isArray(value) {
		return value instanceof Array;
	}

	#isType(value, type) {
		return typeof value === type;
	}

	#emptyFn = () => { };

	#isArrayEquals(array1, array2) {
		// Code taken from https://docs.sencha.com/extjs/7.5.0/modern/src/Array.js-1.html#Ext.Array-method-equals
		const len1 = array1.length;
		const len2 = array2.length;

		// Short circuit if the same array is passed twice
		if (array1 === array2) {
			this.#debugLog('isArrayEquals', 'Arrays are equal');
			return true;
		}

		if (len1 !== len2) {
			this.#debugLog('isArrayEquals', 'Arrays lengths are not equal');
			return false;
		}

		for (let i = 0; i < len1; ++i) {
			if (array1[i] !== array2[i]) {
				this.#debugLog('isArrayEquals', `Arrays have different values at index ${i} --> ${array1[i]} (${typeof array1[i]}) !== ${array2[i]} (${typeof array2[i]})`);
				return false;
			}
		}

		this.#debugLog('isArrayEquals', 'Arrays are the same');
		return true;
	}

	#isObjectEquals = (function () {
		// Code taken from https://docs.sencha.com/extjs/7.5.0/modern/src/Array.js-1.html#Ext.Array-method-equals
		const check = function (o1, o2) {
			let key;

			for (key in o1) {
				if (o1.hasOwnProperty(key)) {
					if (o1[key] !== o2[key]) {
						return false;
					}
				}
			}

			return true;
		};

		return function (object1, object2) {
			// Short circuit if the same object is passed twice
			if (object1 === object2) {
				return true;
			}

			if (object1 && object2) {
				// Do the second check because we could have extra keys in
				// object2 that don't exist in object1.
				return check(object1, object2) && check(object2, object1);
			}
			else if (!object1 && !object2) {
				return object1 === object2;
			}
			else {
				return false;
			}
		};
	})()

	/**
	 * Format a duration (in milliseconds) as e.g. '1h 21m 6s' for big durations or e.g '12.5s' / '23ms' for small durations
	 * @param {number} duration The duration in milliseconds.
	 * @returns {string} A formatted duration.
	 */
	#formatDuration(duration) {
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

	#debugAssertLog = (methodName, actual, expected, result) => {
		this.#debugLog(methodName, `${expected} === ${actual}? => ${result}`);
	}

	#debugLog = (methodName, message) => {
		if (this.#logDebug) {
			this.#log(`[DEBUG] ${methodName}: ${message}`);
		}
	}
}