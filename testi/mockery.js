import {
	Arrays
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

	hasBeenCalledWith(args) {
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

		result.returns = returnValue => {
			fn.returns = returnValue;

			return result;
		}

		result.throws = error => {
			fn.thrown = error;

			return result;
		}

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

	hasBeenCalledWith(args) {
		for (const call of this.#calls) {
			if (call.hasBeenCalledWith(args)) {
				return true;
			}
		}
		return false;
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
}

const mockery = new Mockery();


export default mockery;