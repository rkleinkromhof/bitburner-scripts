import {deepScan} from './util-servers.js';

/** @param {NS} ns **/
export async function main(ns) {
	let servers = deepScan(ns, ns.getHostname())
		.map(server => ns.getServer(server))
		.filter(server => server.purchasedByPlayer);

	let colHeaders = ['#', 'Hostname', 'RAM available', 'RAM max', 'Ram % av.'];
	// let colPadding = ['start', 'start', 'end', 'end'];
	let rows = [Array.prototype.slice.call(colHeaders)];
	let cols = [colHeaders.map(header => [header])];
	// let colSizes = colHeaders.map(header => header.length);

	for (let i = 0; i < servers.length; i++) {
		let server = servers[i];
		let ramAvailable = server.maxRam - server.ramUsed;
		let formattedRamAvailable = ramAvailable ? Math.round(((ramAvailable) + Number.EPSILON) * 100) / 100 : "0";
		let ramAvailablePercent = ramAvailable ? Math.round(((100 / server.maxRam * ramAvailable) + Number.EPSILON) * 100) / 100 : "0";
		let row = [i, server.hostname, formattedRamAvailable, server.maxRam, ramAvailablePercent];

		rows.push(row);
		for (let col = 0; col < cols.length; col++) {
			cols[col].push = row[col];
		}
	}

	let colSizes = cols.map((col, index) => {
		let sortedLengths = Array.prototype.map.call(col, value => ('' + value).length)
			.sort((lengthA, lengthB) => lengthA - lengthB);
		
		return sortedLengths[0];
	});

	// printRow(ns, rows.pop());

	for (let i = 0; i < rows.length; i++) {
		let isHeader = i === 0;
		let cells = rows[i];
		let formattedRow = cells.reduce((line, value) => {
			let padFunc = isNaN(value) ? String.prototype.padStart : String.prototype.padEnd;

			return `${line} ${[padFunc.call(value, colSizes[i])]}`;
		});
		
		ns.tprint(formattedRow);
		if (isHeader) {
			ns.tprint('-'.repeat(colSizes.reduce((previousLen, len) => previousLen + len)));
		}
	}


	// ns.tprint(` ${String.prototype.padEnd.call('#', colRowNumberLength)} | ${labelHostname.padEnd(colHostnameLength)}`);
	// ns.tprint(`(${String.prototype.padStart.call(i, colRowNumberLength)}) ${String.prototype.padEnd.call(server.hostname, longestHostnameSize)}: RAM available: ${formattedRamAvailable}/${server.maxRam}GB (~${ramAvailablePercent}%) `);
}

function printRow(ns, row) {
	ns.tprint(`(${String.prototype.padStart.call(i, colRowNumberLength)}) ${String.prototype.padEnd.call(server.hostname, longestHostnameSize)}: RAM available: ${formattedRamAvailable}/${server.maxRam}GB (~${ramAvailablePercent}%) `);
}