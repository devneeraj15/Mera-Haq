const test = require("node:test");
const assert = require("node:assert/strict");
const I = require("../../src/engine/impact.js");
const CTX = require("../../data/impact/fiscal-context.json");

test("impact estimate: arithmetic is exact and transparent", () => {
  const r = I.estimate({ allocationCrore: 1000, spentCrore: 800, demandSharePct: 50, uptakeGainPct: 20, avgBenefitRupees: 10000 });
  assert.ok(r.ok);
  assert.equal(r.result.unspentCrore, 200);
  assert.equal(r.result.utilisationPct, 80);
  assert.equal(r.result.demandLinkedUnspentCrore, 100);
  assert.equal(r.result.reductionInUnspentCrore, 20);
  assert.equal(r.result.newUtilisationPct, 82);
  assert.equal(r.result.additionalBeneficiaries, 20000); // ₹20 crore / ₹10,000
});

test("impact estimate: zero assumptions give zero impact (no hidden defaults)", () => {
  const r = I.estimate({ allocationCrore: 1000, spentCrore: 800, demandSharePct: 0, uptakeGainPct: 50 });
  assert.equal(r.result.reductionInUnspentCrore, 0);
  assert.equal(r.result.additionalBeneficiaries, null);
});

test("impact estimate: rejects invalid inputs", () => {
  assert.ok(I.estimate({}).errors.allocationCrore);
  assert.ok(I.estimate({ allocationCrore: 100, spentCrore: 150, demandSharePct: 10, uptakeGainPct: 10 }).errors.spentCrore);
  assert.ok(I.estimate({ allocationCrore: 100, spentCrore: 50, demandSharePct: 120, uptakeGainPct: 10 }).errors.demandSharePct);
  assert.ok(I.estimate({ allocationCrore: 100, spentCrore: 50, demandSharePct: 10, uptakeGainPct: -1 }).errors.uptakeGainPct);
  assert.ok(I.estimate({ allocationCrore: "abc", spentCrore: 50, demandSharePct: 10, uptakeGainPct: 1 }).errors.allocationCrore);
  assert.ok(I.estimate({ allocationCrore: 100, spentCrore: 50, demandSharePct: 10, uptakeGainPct: 1, avgBenefitRupees: 0 }).errors.avgBenefitRupees);
  assert.ok(I.estimate({ allocationCrore: "1,00,000", spentCrore: "90,000", demandSharePct: "5", uptakeGainPct: "10" }).ok);
});

test("sensitivity grid is monotonic in both assumptions", () => {
  const g = I.sensitivity(1000, 800, [5, 10, 25], [10, 25, 50]);
  assert.deepEqual(g, [[1, 2.5, 5], [2, 5, 10], [5, 12.5, 25]]);
});

test("fiscal context figures are internally consistent (approved − spent = savings)", () => {
  for (const f of CTX.facts.filter((x) => x.approvedCrore !== null)) {
    assert.ok(Math.abs(f.approvedCrore - f.spentCrore - f.savingsCrore) < 0.02, f.id);
    assert.ok(f.evidence.quote.length > 20);
  }
  assert.match(CTX.caveat, /NOT known/);
});
