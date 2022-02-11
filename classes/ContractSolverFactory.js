/**
 * Factory for contract solvers.
 */
export default class ContractSolverFactory {
	static #theInstance;

	static get instance() {
		return this.#theInstance || (this.#theInstance = new ContractSolverFactory());
	}

	#solverFactories = {
		'Find Largest Prime Factor': () => new FindLargestPrimeFactorContractSolver('Find Largest Prime Factor'),
		'Subarray with Maximum Sum': () => new SubarrayWithMaximumSumContractSolver('Subarray with Maximum Sum'),							// Implementation by alainbryden
		'Total Ways to Sum': () => new TotalWaysToSumContractSolver('Total Ways to Sum'),
		'Spiralize Matrix': () => new SpiralizeMatrixContractSolver('Spiralize Matrix'),													// Implementation by alainbryden
		'Array Jumping Game': () => new ArrayJumpingGameContractSolver('Array Jumping Game'),
		'Merge Overlapping Intervals': () => new MergeOverlappingIntervalsContractSolver('Merge Overlapping Intervals'),
		'Generate IP Addresses': () => new GenerateIpAddressesContractSolver('Generate IP Addresses'),										// Implementation by alainbryden
		'Algorithmic Stock Trader I': () => new AlgorithmicStockTrader1ContractSolver('Algorithmic Stock Trader I'),						// Implementation by alainbryden
		'Algorithmic Stock Trader II': () => new AlgorithmicStockTrader2ContractSolver('Algorithmic Stock Trader II'),
		'Algorithmic Stock Trader III': () => new AlgorithmicStockTrader3ContractSolver('Algorithmic Stock Trader III'),					// Implementation by alainbryden
		'Algorithmic Stock Trader IV': () => new AlgorithmicStockTrader4ContractSolver('Algorithmic Stock Trader IV'),						// Implementation by alainbryden
		'Minimum Path Sum in a Triangle': () => new MinimumPathSumInATriangleContractSolver('Minimum Path Sum in a Triangle'),
		'Unique Paths in a Grid I': () => new UniquePathsInAGrid1ContractSolver('Unique Paths in a Grid I'),
		'Unique Paths in a Grid II': () => new UniquePathsInAGrid2ContractSolver('Unique Paths in a Grid II'),
		'Sanitize Parentheses in Expression': () => new SanitizeParenthesesInExpressionContractSolver('Sanitize Parentheses in Expression'),// Implementation by alainbryden
		'Find All Valid Math Expressions': () => new FindAllValidMathExpressionsContractSolver('Find All Valid Math Expressions'),			// Implementation by alainbryden
	};

	createSolver(type) {
		let solver = Object.prototype.hasOwnProperty.call(this.#solverFactories, type) ? this.#solverFactories[type] : null;

		return solver && solver();
	}
}

class ContractSolver {
	name;
	solver;

	constructor(name, solver) {
		this.name = name;
		this.solver = solver;
	}

	solve(data) {
		return this.solver.call(null, data);
	}
}

class FindLargestPrimeFactorContractSolver extends ContractSolver {
	constructor(name) {
		let solver = data => {
			let n = data;
			let maxPrime = -1;

			while (n % 2 === 0) {
				n = n / 2;
				maxPrime = 2;
			}

			while (n % 3 === 0) {
				n = n / 3;
				maxPrime = 3;
			}

			for (let i = 5; i <= Math.sqrt(n); i += 6) {
				while (n % i === 0) {
					n = n / i;
					maxPrime = i;
				}

				while (n % (i + 2) === 0) {
					n = n / (i + 2);
					maxPrime = i + 2;
				}
			}
			let result = n > 4 ? n : maxPrime;

			return result;
		};

		super(name, solver);
	}
}


class SubarrayWithMaximumSumContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let nums = data.slice();
			for (let i = 1; i < nums.length; i++) {
				nums[i] = Math.max(nums[i], nums[i] + nums[i - 1]);
			}
			return Math.max.apply(Math, nums);
		});
	}
}

class TotalWaysToSumContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let number = data;
			let n = number;
			let k = number - 1;

			let dp = Array.from({ length: n + 1 }, (_, i) => 0);
			dp[0] = 1;

			// Iterate over the range [1, k + 1]
			for (let row = 1; row < k + 1; row++) {
				// Iterate over the range [1, n + 1]
				for (let col = 1; col < n + 1; col++) {
					if (col >= row) {
						dp[col] = dp[col] + dp[col - row];
					}
				}
			}

			return dp[n];
		});
	}
}

class SpiralizeMatrixContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			return this.spiralize(data);
		});
	}

	spiralize(board) {
		let spiral = [];
		let m = board.length;
		let n = board[0].length;
		let u = 0;
		let d = m - 1;
		let l = 0;
		let r = n - 1;
		let k = 0;
		while (true) {
			// Up
			for (let col = l; col <= r; col++) {
				spiral[k] = board[u][col];
				++k;
			}
			if (++u > d) {
				break;
			}
			// Right
			for (let row = u; row <= d; row++) {
				spiral[k] = board[row][r];
				++k;
			}
			if (--r < l) {
				break;
			}
			// Down
			for (let col = r; col >= l; col--) {
				spiral[k] = board[d][col];
				++k;
			}
			if (--d < u) {
				break;
			}
			// Left
			for (let row = d; row >= u; row--) {
				spiral[k] = board[row][l];
				++k;
			}
			if (++l > r) {
				break;
			}
		}

		return spiral;
	}
}

class ArrayJumpingGameContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			// data is an array like [5, 10, 6, 7, 0, 4, 0, 4, 0, 0, 0, 0, 0, 3, 0, 0, 8, 5, 9, 0, 10, 6, 0];
			// Each element in the array represents your MAXIMUM jump length at that position.
			// This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.
			// Assuming you are initially positioned at the start of the array, determine whether you are able to reach the last index.
			// Your answer should be submitted as 1 or 0, representing true and false respectively.
			return this.canJumpToEnd(Array.prototype.slice.call(data), 0) ? 1 : 0;
		});
	}

	/**
	 * Check if the end can be reached from the current position on the board.
	 * @param {Number[]} board The Gaming Board (it's just the numbers array, but Gaming Board sounds more fun ^^)
	 * @param {Number} currentPosition The current position on the board. This'll start at 0 but this method calls itself
	 * for further positions.
	 */
	canJumpToEnd(board, currentPosition) {
		let maxJumpDistance = board[currentPosition];
		let maxJumpPosition = currentPosition + maxJumpDistance;

		// Shortcut: if we can jump from here to the end, then we're done.
		if (board.length - 1 <= maxJumpPosition) {
			return true;
		}
		// Shortcut: if we can't jump at all, then we're not going to reach the end from here anyway.
		if (maxJumpDistance === 0) {
			return false;
		}

		for (let position = currentPosition + 1; position <= maxJumpPosition; position++) {
			if (this.canJumpToEnd(board, position)) {
				return true;
			}
		}
		return false; // If we're here, then we can't jump to the end from here.
	}
}

class MergeOverlappingIntervalsContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			// data: [[1, 3], [8, 10], [2, 6], [10, 16]]
			// return [[1, 6], [8, 16]].
			let ranges = Array.prototype.slice.call(data).sort((entryA, entryB) => entryA[0] - entryB[0]);
			let result = [];

			// TODO Check again with more complex Contracts, if this works at intended.
			// It seemed that the result could still contain overlap if that was a new oplap
			// which was created by the process below. Maybe I should loop the logic below until
			// there's no more overlap to detect.
			do {
				let range = ranges.shift(); // range = [1, 3]; ranges = [[8, 10], [2, 6], [10, 16]]
				let merged = false;

				for (let entry of result) {
					// 2st do itr, 1st result itr: entry = [1, 3]; range = [8, 10];
					// 3rd do itr, 1st result itr: entry = [1, 3] range = [2, 6];
					// 3rd do itr, 2st result itr: entry = [8, 10] range = [2, 6];
					if (range[0] <= entry[1] && range[1] >= entry[0]) {
						// There's an overlap. Merge ranges.
						entry[0] = Math.min(entry[0], range[0]);
						entry[1] = Math.max(entry[1], range[1]);
						merged = true;
					}

					// merged = true;
				}

				if (!merged) {
					result.push(range); // No merge, then push the range onto the results.
				}
			}
			while (ranges.length);

			// Sort so lowest ranges come first. We only have to check one range (lower or upper)
			// because there are no more overlaps.
			return result.sort((entryA, entryB) => entryA[0] - entryB[0]);
		});
	}
}

class GenerateIpAddressesContractSolver extends ContractSolver {

	constructor(name) {
		super(name, data => {
			let ret = [];
			for (let a = 1; a <= 3; ++a) {
				for (let b = 1; b <= 3; ++b) {
					for (let c = 1; c <= 3; ++c) {
						for (let d = 1; d <= 3; ++d) {
							if (a + b + c + d === data.length) {
								let first = parseInt(data.substring(0, a), 10);
								let second = parseInt(data.substring(a, a + b), 10);
								let third = parseInt(data.substring(a + b, a + b + c), 10);
								let fourth = parseInt(data.substring(a + b + c, a + b + c + d), 10);
								if (first <= 255 && second <= 255 && third <= 255 && fourth <= 255) {
									let ip = [first.toString(), '.', second.toString(), '.', third.toString(), '.', fourth.toString()].join('');
									if (ip.length === data.length + 3) {
										ret.push(ip);
									}
								}
							}
						}
					}
				}
			}
			return ret;
		});
	}
}

class AlgorithmicStockTrader1ContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let maxCur = 0;
			let maxSoFar = 0;
			for (let i = 1; i < data.length; ++i) {
				maxCur = Math.max(0, (maxCur += data[i] - data[i - 1]));
				maxSoFar = Math.max(maxCur, maxSoFar);
			}
			return maxSoFar.toString();
		});
	}
}

class AlgorithmicStockTrader2ContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let maxLookAhead = 1;
			let stockPrices = data;
			let boughtStockPrice = false;
			let profit = 0;
			let price;

			for (let i = 0; i < stockPrices.length; i++) {
				let lastItem = i === stockPrices.length - 1;
				let stockSlice = stockPrices.slice(i + 1, i + 1 + maxLookAhead);
				price = stockPrices[i];

				// If we've bought stock and it's worth more now, and won't be worth even more in the future, then sell.
				if (boughtStockPrice && (price > boughtStockPrice) && (lastItem || (price > Math.max.apply(null, stockSlice)))) {
					profit += price - boughtStockPrice;
					boughtStockPrice = 0;
				}
				// If we've sold our stock and it's worth less than it is going to be in the future, then buy.
				// TODO: fix the bug that happens in the following scenario:
				// [154, 18, 122, 8, 29, ...]
				//   wait-^  ^wait^-buy
				// It shouldn't wait to buy lower because there's a chance to sell in between.
				else if (!boughtStockPrice && (price < Math.min.apply(null, stockSlice))) {
					boughtStockPrice = price;
				}
				// If we've bought stock and we're at the end of the array, then we've made a mistake.
				else if (boughtStockPrice && lastItem) {
					throw new Error('Error during solving: we\'re holding stock with no option to sell.');
				}
				// Not buying or selling means we wait.
			}

			return profit;
		});
	}
}

class AlgorithmicStockTrader3ContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let hold1 = Number.MIN_SAFE_INTEGER;
			let hold2 = Number.MIN_SAFE_INTEGER;
			let release1 = 0;
			let release2 = 0;
			for (let _i = 0, data_1 = data; _i < data_1.length; _i++) {
				let price = data_1[_i];
				release2 = Math.max(release2, hold2 + price);
				hold2 = Math.max(hold2, release1 - price);
				release1 = Math.max(release1, hold1 + price);
				hold1 = Math.max(hold1, price * -1);
			}
			return release2.toString();
		});
	}
}

class AlgorithmicStockTrader4ContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let k = data[0];
			let prices = data[1];
			let len = prices.length;
			if (len < 2) {
				return 0;
			}
			if (k > len / 2) {
				let res = 0;
				for (let i = 1; i < len; ++i) {
					res += Math.max(prices[i] - prices[i - 1], 0);
				}
				return res;
			}
			let hold = [];
			let rele = [];
			hold.length = k + 1;
			rele.length = k + 1;
			for (let i = 0; i <= k; ++i) {
				hold[i] = Number.MIN_SAFE_INTEGER;
				rele[i] = 0;
			}
			let cur;
			for (let i = 0; i < len; ++i) {
				cur = prices[i];
				for (let j = k; j > 0; --j) {
					rele[j] = Math.max(rele[j], hold[j] + cur);
					hold[j] = Math.max(hold[j], rele[j - 1] - cur);
				}
			}
			return rele[k];
		});
	}
}

class MinimumPathSumInATriangleContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			return this.findMinimumPathSum(data);
		});
	}

	findMinimumPathSum(triangle, row = 0, col = 0) {
		let rowArr = triangle[row];
		let nextColLeft = col;
		let nextColRight = col + 1;
		let value = rowArr[col];
		let rowBeforeLast = triangle.length - 1 === row + 1;
		// Get the Sum for the left path. If the next row is the last row, then just get the value directly.
		let sumLeft = rowBeforeLast ? triangle[row + 1][nextColLeft] : this.findMinimumPathSum(triangle, row + 1, nextColLeft);
		let sumRight = rowBeforeLast ? triangle[row + 1][nextColRight] : this.findMinimumPathSum(triangle, row + 1, nextColRight); // Now do the same for the right path.

		// Return the value from our current cell plus the value from the path with the lowest sum.
		return value + Math.min(sumLeft, sumRight);
	}
}

class UniquePathsInAGridContractSolver extends ContractSolver {
	constructor(name, solver) {
		super(name, solver);
	}

	getUniquePaths(grid, col = 0, row = 0, path = [], uniquePaths = []) {
		let lastRow = grid.length - 1;
		let lastCol = grid[row].length - 1;

		if (grid[row][col] === 1) {
			// We've reached a blockade.
			return;
		}

		if (col === lastCol && row === lastRow) {
			// We've reached the end. Print the path taken
			uniquePaths.push(path.join(''));
		} else {
			if (col < lastCol) {
				// Going right.
				let newPath = Array.prototype.slice.call(path);
				newPath.push('R');

				this.getUniquePaths(grid, col + 1, row, newPath, uniquePaths);
			}
			if (row < lastRow) {
				// Going down.
				let newPath = Array.prototype.slice.call(path);
				newPath.push('D');

				this.getUniquePaths(grid, col, row + 1, newPath, uniquePaths);
			}
		}

		return uniquePaths;
	}
}

class UniquePathsInAGrid1ContractSolver extends UniquePathsInAGridContractSolver {
	constructor(name) {
		super(name, data => {
			// data = [4, 12] // (rows, columns)
			let [rows, columns] = data;
			let grid = [];

			// Generate a grid with only 0's, no blockades.
			for (let row = 0; row < rows; row++) {
				grid[row] = Array(columns).fill(0);
			}

			// There's probably an easier solution to this, but for now I'm using the
			// solver I built for Unique Paths in a Grid II.
			let uniquePaths = this.getUniquePaths(grid);

			return uniquePaths.length;
		});
	}
}

class UniquePathsInAGrid2ContractSolver extends UniquePathsInAGridContractSolver {
	constructor(name) {
		super(name, data => this.getUniquePaths(Array.prototype.slice.call(data)).length);
	}
}

class SanitizeParenthesesInExpressionContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let left = 0;
			let right = 0;
			let res = [];
			for (let i = 0; i < data.length; ++i) {
				if (data[i] === '(') {
					++left;
				} else if (data[i] === ')') {
					left > 0 ? --left : ++right;
				}
			}

			function dfs(pair, index, left, right, s, solution, res) {
				if (s.length === index) {
					if (left === 0 && right === 0 && pair === 0) {
						for (let i = 0; i < res.length; i++) {
							if (res[i] === solution) {
								return;
							}
						}
						res.push(solution);
					}
					return;
				}
				if (s[index] === '(') {
					if (left > 0) {
						dfs(pair, index + 1, left - 1, right, s, solution, res);
					}
					dfs(pair + 1, index + 1, left, right, s, solution + s[index], res);
				} else if (s[index] === ')') {
					if (right > 0) {
						dfs(pair, index + 1, left, right - 1, s, solution, res);
					}
					if (pair > 0) {
						dfs(pair - 1, index + 1, left, right, s, solution + s[index], res);
					}
				} else {
					dfs(pair, index + 1, left, right, s, solution + s[index], res);
				}
			}
			dfs(0, 0, left, right, data, '', res);

			return res;
		});
	}
}

class FindAllValidMathExpressionsContractSolver extends ContractSolver {
	constructor(name) {
		super(name, data => {
			let num = data[0];
			let target = data[1];

			function helper(res, path, num, target, pos, evaluated, multed) {
				if (pos === num.length) {
					if (target === evaluated) {
						res.push(path);
					}
					return;
				}
				for (let i = pos; i < num.length; ++i) {
					if (i != pos && num[pos] == '0') {
						break;
					}
					let cur = parseInt(num.substring(pos, i + 1))
					if (pos === 0) {
						helper(res, path + cur, num, target, i + 1, cur, cur);
					} else {
						helper(res, path + '+' + cur, num, target, i + 1, evaluated + cur, cur);
						helper(res, path + '-' + cur, num, target, i + 1, evaluated - cur, -cur);
						helper(res, path + '*' + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
					}
				}
			}

			if (num == null || num.length === 0) {
				return [];
			}
			
			let result = [];
			helper(result, '', num, target, 0, 0, 0);

			return result;
		});
	}
}