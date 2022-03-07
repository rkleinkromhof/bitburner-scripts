import {
	findNode,
	getOpenablePorts,
	getScanServerOptions,
	scanServersLight as scanServers
} from '/util-servers.js';
import {
	formatMoney,
	formatNumber,
	formatPercent,
	formatRam
} from '/util-formatters.js';
import {
	Arrays,
	disableLogs,
	sortCaseInsensitiveAlphabetical
} from '/util-helpers.js';

const css =
`<style id="scan-css">
	.server-list {
		font-size: 16px;
		color: #339900;
		font-family: Lucida Console, Lucida Sans Unicode, Fira Mono, Consolas, Courier New, Courier, monospace, Times New Roman;
		max-width: 1700px;
	}
	.server-list-title {
		font-size: 20px;
		font-weight: bold;
	}
	.server-list-body {
		list-style: none;
	}
	.server-list-tags {
		width: 70px;
	}
	.server-list-header {
		font-size: 16px;
		font-weight: bold;
		text-transform: capitalize;
		border-bottom: 2px solid #339900;
		margin-bottom: 10px;
		padding-bottom: 2px;
	}
	.server-list-cell {
		display: inline-block;
		min-width: 50px;
		margin: 0 10px;
	}
	.server-list-idx {
		text-align: right;
		width: 50px;
	}
	.server-list-hostname {
		color: #0066CC;
		width: 200px;
	}
	.server-list-requiredhackingskill {
		width: 50px;
	}
	.server-list-numopenportsrequired {
		width: 50px;
	}
	.server-list-ramavailable {
		width: 80px;
	}
	.server-list-maxram {
		width: 80px;
	}
	.server-list-ramusedpercent {
		width: 80px;
	}
	.server-list-moneyavailable {
		width: 100px;
	}
	.server-list-moneymax {
		width: 100px;
	}
	.server-list-cell-moneymax-adj {
		width: 100px;
	}
	.server-list-moneyavailablepercent {
		width: 80px;
	}
	.server-list-security {
		width: 50px;
	}
	.security-list-securitymin {
		width: 50px;
	}
	.server-list-hackchance {
		width: 80px;
	}
	.server-list-score {
		width: 80px;
	}

	.server-list-cell-security-unsullied {
		color: #FFD700;
	}

	.server-list-hostname-hackerfaction {
		color: #CC00FF;
	}

	// .server-list-tags-hasadminrights {
	// 	content: '@';
	// }

	// .server-list-header-idx {}
	// .server-list-header-tags {}
	// .server-list-header-hostname {}
	// .server-list-header-requiredhackingskill {}
	// .server-list-header-numopenportsrequired {}
	// .server-list-header-ramavailable {}
	// .server-list-header-maxram {}
	// .server-list-header-ramusedpercent {}
	// .server-list-header-moneyavailable {}
	// .server-list-header-moneymax {}
	// .server-list-header-moneyavailablepercent {}
	// .server-list-header-security {}
	// .server-list-header-securitymin {}
	// .server-list-header-hackchance {}

	.server-list-hostname-connect {
		cursor:pointer;
		text-decoration: underline;
	}

	.server-list-hostname-backdoor {
		margin-left: 10px;
		color: #FFFF33;
		cursor:pointer;
		text-decoration: underline;
	}

	.number-align {
		text-align: right;
	}

	.outofreach {
		color: #CC0033
	}
	.lessvisible {
		opacity: 0.5;
	}
</style>`; 

const serverListId = 'server-list';
const terminalId = 'terminal';
const terminalInputId = 'terminal-input';
const insertAdjacentHtmlPosition = 'beforeend';

const hackerFactionServerList = [
	'CSEC',
	'avmnite-02h',
	'I.I.I.I',
	'run4theh111z'
];

const serverIgnoreList = [
	'darkweb'
];

const sorters = {
	tags: (serverA, serverB) => { getTags(serverA).length - getTags(serverB).length},
	hostname: (serverA, serverB) => sortCaseInsensitiveAlphabetical(serverA.hostname, serverB.hostname),
	hackskill: (serverA, serverB) => serverA.requiredHackingSkill - serverB.requiredHackingSkill,
	openports: (serverA, serverB) => serverA.numOpenPortsRequired - serverB.numOpenPortsRequired,
	ramavailable: (serverA, serverB) => serverA.ramAvailable - serverB.ramAvailable,
	rammax: (serverA, serverB) => serverA.maxRam - serverB.maxRam,
	rampercent: (serverA, serverB) => serverA.ramUsedPercent - serverB.ramUsedPercent,
	moneyavailable: (serverA, serverB) => serverA.moneyAvailable - serverB.moneyAvailable,
	moneymax: (serverA, serverB) => serverA.moneyMax - serverB.moneyMax,
	moneymaxadj: (serverA, serverB) => serverA.moneyMaxAdj - serverB.moneyMaxAdj,
	moneypercent: (serverA, serverB) => serverA.moneyAvailablePercent - serverB.moneyAvailablePercent,
	security: (serverA, serverB) => serverA.securityLevel - serverB.securityLevel,
	securitymin: (serverA, serverB) => serverA.minSecurityLevel - serverB.minSecurityLevel,
	hackchance: (serverA, serverB) => serverA.hackChance - serverB.hackChance,
	score: (serverA, serverB) => serverA.score - serverB.score,

	// aliases
	availableram: (serverA, serverB) => serverA.ramAvailable - serverB.ramAvailable,
	maxram: (serverA, serverB) => serverA.maxRam - serverB.maxRam,
	percentram:  (serverA, serverB) => serverA.ramUsedPercent - serverB.ramUsedPercent,
	availablemoney: (serverA, serverB) => serverA.moneyAvailable - serverB.moneyAvailable,
	maxmoney: (serverA, serverB) => serverA.moneyMax - serverB.moneyMax,
	percentmoney: (serverA, serverB) => serverA.moneyAvailablePercent - serverB.moneyAvailablePercent,
	minsecurity: (serverA, serverB) => serverA.minSecurityLevel - serverB.minSecurityLevel,
}

const silencedServices = [
	'disableLog',
	'getHackingLevel',
	'getServerMaxMoney',
	'getServerMaxRam',
	'getServerMoneyAvailable',
	'getServerNumPortsRequired',
	'getServerRequiredHackingLevel',
	'getServerUsedRam',
	'scan',
];

const argsSchema = [
	['sort', 'hackskill'],
	['sortdir', 'asc'],
	['desc', false] // Alias for --sortdir desc
];

/**
 * @param {NS} ns Namespace
 */
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} ([minimum max RAM]) ([minimum max money]) ([...options])`);
		ns.tprint(` => available options: ${getScanServerOptions().join(', ')}`);
		ns.tprint(` => available tags:`);
		ns.tprint(` =>   --sort (tags | hostname | hackskill | openports | ramavailable | rammax | rampercent | moneyavailable | moneymax | moneymaxadj | moneypercent | security | securitymin | hackchance | score)`);
		ns.tprint(` =>    	sort aliases: availableram | maxram | percentram | availablemoney | maxmoney | percentmoney | minsecurity)`);
		ns.tprint(` =>   --sortdir (asc | desc)`);
		ns.tprint(` =>   --desc`)
		return;
	}

	disableLogs(ns, silencedServices);

	const flagOpts = ns.flags(argsSchema);
	const sortprop = flagOpts.sort;
	let sortdir = flagOpts.sortdir;

	if (flagOpts.desc) {
		sortdir = 'desc';
	}

	const doc = eval('document'); // eval for sneaky reference without the insane RAM cost.

	// Arguments
	let options = Array.prototype.slice.call(ns.args);
	let serverMinMaxRam = isNaN(options[0]) ? 0 : parseInt(options.shift(), 10); // Minimum of max RAM on a server or skip it. Default to 4GB.
	let serverMinMaxMoney = isNaN(options[0]) ? 0 : parseInt(options.shift(), 10); // Minimum amount of max money available on a server or skip that server. Default to $1000.

	let serversLeft = scanServers(ns, serverMinMaxRam, serverMinMaxMoney, ...options); // Scan for servers with the RAM and money restrictions and maybe options.

	serversLeft = serversLeft.filter(server => !Arrays.contains(serverIgnoreList, server.hostname)); // Remove ignored servers.

	if (serversLeft.length) {
		serversLeft.forEach(server => {
			server.ramUsedPercent = server.usedRam ? (server.usedRam / server.maxRam) : 0;
			server.moneyAvailablePercent = server.moneyAvailable ? (server.moneyAvailable / server.moneyMax) : 0;
			server.hackChance = ns.hackAnalyzeChance(server.hostname);
			server.moneyMaxAdj = server.moneyMax * server.hackChance;
			server.score = Math.sqrt(server.moneyMax / server.minSecurityLevel); //  * Math.pow(server.hackChance, 3)
			server.baseSecurityLevel = ns.getServerBaseSecurityLevel(server.hostname);
			server.isBeingHacked = ns.ps('home').some(processInfo => processInfo.args[0] === server.hostname);
			server.isHackerFaction = Arrays.contains(hackerFactionServerList, server.hostname);
		});

		let sorter = sorters[sortprop];

		if (sorter) {
			serversLeft.sort(sorter);

			if (sortdir === 'desc') {
				serversLeft.reverse();
			}
		}

		htmlPrintServers(ns, doc, serversLeft, {
			hackingSkill: ns.getHackingLevel(),
			openablePorts: getOpenablePorts(ns),
		});

	} else {
		ns.tprint(`No servers found.`);
	}
}

function htmlPrintServers(ns, doc, servers, options) {
	removeElement(doc, serverListId);
	replaceCss(doc);
	printHtml(doc, buildServersHtml(serverListId, servers, options));
	bindHostConnectClickEvents(ns, doc);
}

function buildServersHtml(listId, servers, options) {
	const htmlJoinChar = '';
	const rowJoinChar = '';
	let html = [];
		
	html.push(`<div id='${listId}' class='server-list'>`);
	html.push(`<div class='server-list-title'>Servers ${options.length ? (`[options: ${options.join(', ')}]`)  : ''}</div>`);
	html.push(`<ul class='server-list-body'>`);
	html.push(``);

	const header = [];	
	header.push(`<li class='server-list-row server-list-header'>`)
	header.push(`<div class='server-list-cell server-list-idx server-list-header-idx'>#</div>`);
	header.push(`<div class='server-list-cell server-list-tags server-list-header-tags'>Tags</div>`);
	header.push(`<div class='server-list-cell server-list-hostname server-list-header-hostname'>hostname</div>`);
	header.push(`<div class='server-list-cell server-list-requiredhackingskill server-list-header-requiredhackingskill'>Req. Hack Skill</div>`);
	header.push(`<div class='server-list-cell server-list-numopenportsrequired server-list-header-numopenportsrequired'># Open Ports Req.</div>`);
	header.push(`<div class='server-list-cell server-list-ramavailable server-list-header-ramavailable'>RAM av.</div>`);
	header.push(`<div class='server-list-cell server-list-maxram server-list-header-maxram'>RAM max</div>`);
	header.push(`<div class='server-list-cell server-list-ramusedpercent server-list-header-ramusedpercent'>% RAM used</div>`);
	header.push(`<div class='server-list-cell server-list-moneyavailable server-list-header-moneyavailable'>\$ available</div>`);
	header.push(`<div class='server-list-cell server-list-moneymax server-list-header-moneymax'>\$ max</div>`);
	header.push(`<div class='server-list-cell server-list-moneymax server-list-cell-moneymax-adj'>\$ max adj.</div>`);
	header.push(`<div class='server-list-cell server-list-moneyavailablepercent server-list-header-moneyavailablepercent'>%\$ av.</div>`);
	header.push(`<div class='server-list-cell server-list-security server-list-header-security'>sec.</div>`);
	header.push(`<div class='server-list-cell server-list-securitymin server-list-header-securitymin'>min. sec.</div>`);
	header.push(`<div class='server-list-cell server-list-hackchance server-list-header-hackchance'>Hack chance</div>`);
	header.push(`<div class='server-list-cell server-list-score server-list-header-score'>Score</div>`);
	html.push(header.join(rowJoinChar));

	for(let i = 0; i < servers.length; i++) {
		const server = servers[i];
		const row = [];

		row.push(`<li class='server-list-row'>`)
		row.push(`<div class='server-list-cell server-list-idx server-list-cell-idx number-align'>${i + 1}</div>`);
		row.push(`<div class='server-list-cell server-list-tags server-list-cell-tags'>`);
		row.push(` <span class='server-list-tag-hasadminrights'>${server.hasAdminRights ? '@' : '&nbsp;'}</span>`);
		row.push(` <span class='server-list-tag-isbeinghacked'>${server.maxMoney ? (server.isBeingHacked ? 'H' : '&nbsp;') : '-'}</span>`);
		row.push(` <span class='server-list-tag-moneyprepped'>${server.maxMoney ? (server.moneyAvailable >= server.maxMoney ? 'M' : '&nbsp;') : '-'}</span>`);
		row.push(` <span class='server-list-tag-securityprepped'>${server.minSecurityLevel === 1 ? '-' : (server.securityLevel <= server.minSecurityLevel ? 'S' : '&nbsp;')}</span>`);
		row.push(`</div>`);
		row.push(`<div class='server-list-cell server-list-hostname server-list-cell-hostname'><a class='server-list-hostname-connect${server.isHackerFaction ? ' server-list-hostname-hackerfaction': ''}' data-server-hostname='${server.hostname}'>${server.hostname}</a>${server.isHackerFaction ? `<a class='server-list-hostname-backdoor' data-server-hostname='${server.hostname}'>ß</a>` : ''}</div>`);
		row.push(`<div class='server-list-cell server-list-requiredhackingskill server-list-cell-requiredhackingskill number-align${server.requiredHackingSkill <= options.hackingSkill ? '' : ' outofreach'}'>${server.requiredHackingSkill}</div>`);
		row.push(`<div class='server-list-cell server-list-numopenportsrequired server-list-cell-numopenportsrequired number-align${server.numOpenPortsRequired <= options.openablePorts ? '' : ' outofreach' }'>${server.numOpenPortsRequired}</div>`);
		row.push(`<div class='server-list-cell server-list-ramavailable server-list-cell-ramavailable number-align${server.ramAvailable === 0 ? ' lessvisible' : ''}'>${formatRam(server.ramAvailable)}</div>`);
		row.push(`<div class='server-list-cell server-list-maxram server-list-cell-maxram number-align${server.maxRam === 0 ? ' lessvisible' : ''}'>${formatRam(server.maxRam)}</div>`);
		row.push(`<div class='server-list-cell server-list-ramusedpercent server-list-cell-ramusedpercent number-align${server.ramUsedPercent === 0 ? ' lessvisible' : ''}'>${formatPercent(server.ramUsedPercent)}</div>`);
		row.push(`<div class='server-list-cell server-list-moneyavailable server-list-cell-moneyavailable number-align${server.moneyAvailable === 0 ? ' lessvisible' : ''}'>${formatMoney(server.moneyAvailable)}</div>`);
		row.push(`<div class='server-list-cell server-list-moneymax server-list-cell-moneymax number-align${server.moneyMax === 0 ? ' lessvisible' : ''}'>${formatMoney(server.moneyMax)}</div>`);
		row.push(`<div class='server-list-cell server-list-moneymax server-list-cell-moneymax-adj number-align${server.moneyMaxAdj === 0 ? ' lessvisible' : ''}'>${formatMoney(server.moneyMaxAdj)}</div>`);
		row.push(`<div class='server-list-cell server-list-moneyavailablepercent server-list-cell-moneyavailablepercent number-align${server.moneyAvailablePercent === 0 ? ' lessvisible' : ''}'>${formatPercent(server.moneyAvailablePercent)}</div>`);
		row.push(`<div class='server-list-cell server-list-security server-list-cell-security number-align${server.securityLevel === server.baseSecurityLevel ? ' server-list-cell-security-unsullied' : ''} ${server.securityLevel === 0 ? ' lessvisible' : ''}'>${server.securityLevel === 1 ? '1.00' : formatNumber(server.securityLevel, 3, 2)}</div>`);
		row.push(`<div class='server-list-cell server-list-security server-list-cell-security number-align'>${server.minSecurityLevel}</div>`);
		row.push(`<div class='server-list-cell server-list-hackchance server-list-cell-hackchance number-align'>${formatPercent(server.hackChance)}</div>`);
		row.push(`<div class='server-list-cell server-list-score server-list-cell-score number-align'>${Math.floor(server.score)}</div>`);
		row.push(`</li>`);

		html.push(row.join(rowJoinChar));
	}

	html.push(`</ul>`);
	html.push(`</div>`);

	return html.join(htmlJoinChar);
}

function bindHostConnectClickEvents(ns, doc) {
	doc.querySelectorAll('.server-list-hostname-connect')
		.forEach(el => el.addEventListener('click', createTerminalInputCommand(ns, doc, el)));

		doc.querySelectorAll('.server-list-hostname-backdoor')
		.forEach(el => el.addEventListener('click', createTerminalInputCommand(ns, doc, el, true)));
}

function replaceCss(doc) {
	removeElement(doc, 'scan-css');
    doc.head.insertAdjacentHTML('beforeend', css);
}

function printHtml(doc, html) {
	 return doc.getElementById(terminalId).insertAdjacentHTML(insertAdjacentHtmlPosition, `<li>${html}</li>`);
}

function removeElement(doc, elementId) {
	const el = doc.getElementById(elementId);
    
	if (el) {
		el.parentNode.removeChild(el);
	}
}

function createTerminalInputCommand(ns, doc, element, backdoor = false) {
	const host = element.getAttribute('data-server-hostname');

	const tInput = doc.getElementById(terminalInputId);
	const reactProps = tInput[Object.keys(tInput)[1]];
	const keyCodeEnter = '13';

	const path = findNode(ns, null, ns.getHostname(), host);
	const connectInputValue = `${path.join('; connect ')}${backdoor ? '; backdoor' : ''}`;

	return el => {  
		tInput.value = connectInputValue;
		reactProps.onChange({ target: tInput });
		reactProps.onKeyDown({ keyCode: keyCodeEnter, preventDefault: () => 0 });
	}
}

function getTags(server) {
	const tags = [];
	
	if (server.hasAdminRights) {
		tags.push(`<span class='server-list-tag-hasadminrights'>@</span>`);
	}
	if (server.isBeingHacked) {
		tags.push(`<span class='server-list-tag-isbeinghacked'>H</span>`);
	}
	if (server.maxMoney && server.moneyAvailable >= server.maxMoney) {
		tags.push(`<span class='server-list-tag-moneyprepped'>M</span>`);
	}
	if (server.minSecurityLevel && server.securityLevel <= server.minSecurityLevel) {
		tags.push(`<span class='server-list-tag-securityprepped'>S</span>`);
	}

	return tags;
}