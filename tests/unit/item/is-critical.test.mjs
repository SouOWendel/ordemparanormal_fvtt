import { describe, it, expect } from "vitest";
import { OrdemItem } from "../../../module/documents/item.mjs";

function makeItem() {
	return new OrdemItem({}, {});
}

function makeCritical(crtalFormula, rollResult) {
	return {
		isCritical: false,
		crtalFormula,
		roll: { result: rollResult },
	};
}

describe("OrdemItem.isCritical", () => {
	it('"19/x3" with roll result "19 + 5" → margin=19, multiplier=3, isCritical=true', () => {
		const item = makeItem();
		const critical = makeCritical("19/x3", "19 + 5");
		item.isCritical(critical);
		expect(critical.margin).toBe(19);
		expect(critical.multiplier).toBe(3);
		expect(critical.isCritical).toBe(true);
	});

	it('"19/x3" with roll result "18 + 5" → margin=19, multiplier=3, isCritical=false', () => {
		const item = makeItem();
		const critical = makeCritical("19/x3", "18 + 5");
		item.isCritical(critical);
		expect(critical.margin).toBe(19);
		expect(critical.multiplier).toBe(3);
		expect(critical.isCritical).toBe(false);
	});

	it('"x3/19" with roll result "19 + 5" → margin=19, multiplier=3, isCritical=true (order-independent)', () => {
		const item = makeItem();
		const critical = makeCritical("x3/19", "19 + 5");
		item.isCritical(critical);
		expect(critical.margin).toBe(19);
		expect(critical.multiplier).toBe(3);
		expect(critical.isCritical).toBe(true);
	});

	it('"20" with roll result "20" → margin="20" (string), multiplier=2, isCritical=true', () => {
		const item = makeItem();
		const critical = makeCritical("20", "20");
		item.isCritical(critical);
		expect(Number(critical.margin)).toBe(20);
		expect(critical.multiplier).toBe(2);
		expect(critical.isCritical).toBe(true);
	});

	it('"x2" with roll result "20" → margin=20, multiplier="2" (string), isCritical=true', () => {
		const item = makeItem();
		const critical = makeCritical("x2", "20");
		item.isCritical(critical);
		expect(critical.margin).toBe(20);
		expect(Number(critical.multiplier)).toBe(2);
		expect(critical.isCritical).toBe(true);
	});

	it('"19" with roll result "18" → isCritical=false', () => {
		const item = makeItem();
		const critical = makeCritical("19", "18");
		item.isCritical(critical);
		expect(critical.isCritical).toBe(false);
	});
});
