import {
	Arrays,
	isObject
} from '/util-helpers.js';

/**
 * A recording of a single function call of a MockFn.
 */
class MockFnCall {
	#args;
	#returned;
	#thrown;

	constructor(args, returned, thrown) {
		this.#args = args;
		this.#returned = returned;
		this.#thrown = thrown;
	}

	get args() {
		return this.#args;
	}

	get returned() {
		return this.#returned;
	}

	hasBeenCalledWith(...args) {
		// console.log(`MockFnCall#hasBeenCalledWith: Arrays.equals(${this.args} (${typeof this.args}), ${args}) (${typeof args})`);
		return Arrays.equals(this.args, args);
	}
}

/**
 * A mocked function.
 */
class MockFn {
	static create() {
		const fn = new MockFn();

		const result = (...args) => {
			if (fn.throws) {
				fn.record(new MockFnCall([...args], null, fn.throws));

				throw fn.throws; // TODO Check: throw here?
			} else {
				fn.record(new MockFnCall([...args], fn.returns, null));
			}

			return fn.returns;
		};

		Object.assign(result, {
			returns: returnValue => {
				fn.returns = returnValue;

				return result;
			},
			throws: error => {
				fn.thrown = error;

				return result;
			},
			resetCalls: () => fn.resetCalls(),
			hasBeenCalledWith: value => fn.hasBeenCalledWith(value),
			hasBeenCalledTimes: times => fn.hasBeenCalledTimes(times),
		});

		Object.defineProperties(result, {
			isMockFn: {
				value: true
			},
			calls: {
				get: () => fn.calls
			}
		});

		return result;
	}

	#calls;
	returns;
	throws;

	constructor() {
		this.#calls = [];
		this.returns = undefined;
		this.throws = undefined;
	}

	get calls() {
		return Array.prototype.slice.call(this.#calls);
	}

	record(call) {
		this.#calls.push(call);
	}

	resetCalls() {
		this.#calls = [];
	}

	hasBeenCalledWith(args) {
		for (const call of this.#calls) {
			if (call.hasBeenCalledWith(args)) {
				// console.log('MockFn#hasBeenCalledWith: true');
				return true;
			}
		}
		// console.log('MockFn#hasBeenCalledWith: false');
		return false;
	}

	hasBeenCalledTimes(times) {
		return this.#calls.length === times;
	}
}


/**
 * Main mockery class.
 */
class Mockery {
	name = 'Mockery';

	fn() {
		return MockFn.create();
	}

	obj(name, config) {
		if (isObject(name)) {
			config = name;
			name = 'Mock Object';
		}

		let result = {};

		for (const prop in config) {
			if (Object.prototype.hasOwnProperty.call(config, prop)) {
				result[prop] = this.fn().returns(config[prop]);
			}
		}

		return result;
	}
}

const mockery = new Mockery();


export default mockery;