const haxStyleId = 'haxx-css';

/** @param {NS} ns **/
export async function main(ns) {
	getDoc().querySelector('.MuiDrawer-paperAnchorLeft > ul .MuiCollapse-vertical .MuiList-root .MuiListItem-root:nth-child(1)')

	clickHackingButton(2); // Activate Script Editor.
	await ns.sleep(50); // Wait a bit;
	replaceHaxStyle();
	await ns.sleep(50);
	clickHackingButton(1); // Re-activate Terminal.
	await ns.sleep(50);
}

function clickHackingButton(num) {
	const button = getDoc().querySelector(`.MuiDrawer-paperAnchorLeft > ul .MuiCollapse-vertical .MuiList-root .MuiListItem-root:nth-child(${num})`);

	button.click();
}

function getDoc() {
	return eval('document'); // eval for sneaky reference without the insane RAM cost.
}

function replaceHaxStyle() {
	const doc = getDoc();
	const tabs = doc.querySelector('[data-rbd-droppable-id="tabs"]');
	const cssClass = tabs.classList.item(tabs.classList.length - 1);

	removeElement(doc, haxStyleId);
	doc.head.insertAdjacentHTML('beforeend', `<style id="${haxStyleId}">
	.${cssClass} {
		max-width: 100%;
	}
</style>`);
	}

function removeElement(doc, elementId) {
	const el = doc.getElementById(elementId);
    
	if (el) {
		el.parentNode.removeChild(el);
	}
}