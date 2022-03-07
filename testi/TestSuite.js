class IncorrectSuiteConfigurationError extends Error {
	constructor(message, options) {
		super(message, options);
	}
}

/**
 * A unit test suite.
 */
export default class TestSuite {
	#passString = '[✓]';
	#failString = '[✗]';
	
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

		const message = `Results - ${this.#passed}/${this.#testsRan} tests passed, ${this.#failed} failed${this.#ignored ? ` and ${this.#ignored} ignored` : ''}. Suite took ${this.#formatDuration(timeEnd - timeStart)}.`;

		if (this.#failed) {
			this.#logWarning(message);
		} else {
			this.#log(message);
		}
	}

	#processTestResults(results) {
		const {
			test,
			passedAsserts,
			failedAsserts,
			ignored,
			exception,
		} = results;

		if (ignored) {
			// Ignored on purpose.
			this.#ignored++;
		} else if (exception) {
			this.#failed++;
			this.#logFailReason(test.name, exception.message);
		} else {
			if (failedAsserts.length) {
				this.#failed++;
				this.#testsRan++;

				// Log failed asserts individually.
				for (const fail of failedAsserts) {
					this.#logFail(test.name, fail.failMessage);
				}
			} else if (passedAsserts.length) {
				this.#passed++; // Only count test as passed if there's at least one passed assert and  there are no failed asserts.
				this.#testsRan++;

				if (passedAsserts.length && this.#logPassed) {			
					// Log a passed test once, if configured to do so.
					this.#logPass(test.name);
				}
			} else {
				// No asserts in a test mean we ignore it.
				this.#ignored++;
			}
		}
	}

	#executeTests() {
		for (const test of this.tests) {
			if (test.ignore) {
				// The entire test is ignored so we can process it immediately.
				this.#processTestResults({
					test,
					ignored: true
				});
			}
			else {
				try {
					const wrapper = this.#createAssertWrapper(test);

					test.fn.call(test, wrapper.assert);

					wrapper.processResults(test);
				} catch (ex) {
					this.#processTestResults({
						test,
						exception: ex
					});

					if (this.#logDebug) {
						throw ex; // Rethrow asap when debugging.
					}
				}
			}
		}
	}

	#resetCounter() {
		this.#passed = this.#failed = this.#testsRan = this.#ignored = 0;
	}

	#createAssertWrapper(test) {
		const wrapper = {
			suite: this,
			test,
			recordedAsserts: [],
			record: recording => wrapper.recordedAsserts.push(recording)
		};
		
		wrapper.assert = {
			equals(actual, expected) {
				const asserter = wrapper.suite.#determineAssertEqualsFn(expected);

				wrapper.record({
					result: asserter.call(wrapper.suite, actual, expected),
					failMessage: `Expected ${actual} to be ${expected}`,
				});
			},
			is(actual, expected) {
				wrapper.record({
					result: wrapper.suite.#assertStrictEquals(actual, expected),
					failMessage: `Expected ${actual} to be ${expected}`,
				});
			},
			equalsNull(actual) {
				wrapper.record({
					result: wrapper.suite.#assertIsNull(actual),
					failMessage: `Expected ${actual} to be null`,
				});
			},
			equalsUndefined(actual) {
				wrapper.record({
					result: wrapper.suite.#assertIsUndefined(actual),
					failMessage: `Expected ${actual} to be undefined`,
				});
			},
			equalsTrue(actual) {
				wrapper.record({
					result: wrapper.suite.#assertBooleanEquals(actual, true),
					failMessage: `Expected ${actual} to be true`,
				});
			},
			equalsFalse(actual) {
				wrapper.record({
					result: wrapper.suite.#assertBooleanEquals(actual, false),
					failMessage: `Expected ${actual} to be false`,
				});
			},
			arrayIsSize(actual, size) {
				const actualValue = actual.length;

				wrapper.record({
					result: wrapper.suite.#assertNumberEquals(actualValue, size),
					failMessage: `Expected array size to be ${size} but was ${actualValue}`,
				});
			},
			fail(reason) {
				wrapper.record({
					result: false,
					failMessage: reason || 'failed'
				});
			},
			that(assertFn) {
				const assertObj = {
					hasBeenCalledWith(value) {
						wrapper.record({
							result: assertFn.hasBeenCalledWith(value),
							failMessage: `Expected ${assertFn.name || 'function'} to have been called with ${value}, but it was called with (${assertFn.calls.map(call => JSON.stringify(call.args))})`
						});

						return continuation; // For chaining asserts.
					},
					hasBeenCalledTimes(times) {
						wrapper.record({
							result: assertFn.hasBeenCalledTimes(times),
							failMessage: `Expected ${assertFn.name || 'function'} to have been called ${times} times, but it was called ${assertFn.calls.length} times`
						});

						return continuation; // For chaining asserts.
					}
				};
				
				if (!assertFn?.isMockFn) {
					for (const prop in assertObj) {
						assertObj[prop] = () => {
							wrapper.record({
								result: false,
								failMessage: `${assertFn?.name || 'function'} is not a mock function!`
							});
						}
					}
				}

				const continuation = {
					and: assertObj
				};

				return assertObj;
			}
		};

		wrapper.processResults = () => {
			const suite = wrapper.suite;
			const passedAsserts = wrapper.recordedAsserts.filter(recording => recording.result);
			const failedAsserts = wrapper.recordedAsserts.filter(recording => !recording.result);

			if (passedAsserts.length + failedAsserts.length !== wrapper.recordedAsserts.length) {
				suite.#log('wrapper.processResults', `addition error: ${passedAsserts.length} + ${failedAsserts.length} !== ${wrapper.recordedAsserts.length}`);
			}

			suite.#processTestResults({
				test,
				passedAsserts,
				failedAsserts
			});
		};

		return wrapper;
	}

	/**
	 * Returns the correct equals asserter method for the given value.
	 * @param {*} value The value.
	 * @returns {Function} The assert function.
	 */
	#determineAssertEqualsFn(value) {
		const checkers = [
			{ checkFn: this.#isUndefined, assertFn: this.#assertIsUndefined, name: 'isUndefined' },
			{ checkFn: this.#isNull, assertFn: this.#assertIsNull, name: 'isNull' },
			{ checkFn: this.#isArray, assertFn: this.#assertArrayEquals, name: 'isArray' },
			{ checkFn: this.#isBoolean, assertFn: this.#assertBooleanEquals, name: 'isBoolean' },
			{ checkFn: this.#isNumber, assertFn: this.#assertNumberEquals, name: 'isNumber' },
			{ checkFn: this.#isObject, assertFn: this.#assertObjectEquals, name: 'isObject' },
			{ checkFn: this.#isString, assertFn: this.#assertStringEquals, name: 'isString' },
		];

		for (const checker of checkers) {
			if (checker.checkFn.call(this, value)) {
				return checker.assertFn;
			}
		}
		if (this.#logDebug) {
			this.#debugLog('determineAssertEqualsFn', `Could not determine check method for value ${value}`);
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
		// this.#debugAssertLog('assertArrayEquals', actual, expected, this.#isArrayEquals(actual, expected));
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
		this.#logError(`${this.#failString} ${this.#suiteName} - ${testName}: ${reason}`);
	}

	#logFail(testName, message) {
		this.#logError(`${this.#failString} ${this.#suiteName} - ${testName}: ${message}`);
	}

	#logPass(testName) {
		this.#log(`       ${this.#passString} ${this.#suiteName} - ${testName}`);
	}

	#log(message) {
		this.#ns.tprint(message);
	}

	#logError(message) {
		this.#log(`ERROR: ${message}`);
	}

	#logWarning(message) {
		this.#log(`WARN: ${message}`);
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
	 * 
	 * This method is copied from `util-formatters.js` to here because we want this class to not have any dependencies.
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