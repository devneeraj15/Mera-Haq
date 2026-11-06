/**
 * Mera Haq impact model: how much less of a scheme's allocation might go
 * unspent (and be surrendered or lapse) if more eligible citizens found and
 * applied for it.
 *
 * This is an explicit MODEL, not a forecast. Every result depends on two
 * assumptions an official supplies:
 *   demandShare   share of the unspent amount caused by eligible citizens not
 *                 applying (as opposed to procurement delays, budgeting, etc.)
 *   uptakeGain    share of that missed demand that proactive discovery converts
 *                 into successful applications
 * Neither is known today. The pilot is designed to measure them.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MeraHaqImpact = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s₹]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }

  /**
   * @param {object} input  { allocationCrore, spentCrore, demandSharePct, uptakeGainPct, avgBenefitRupees? }
   * @returns {{ ok: boolean, errors: object, result?: object }}
   */
  function estimate(input) {
    const i = input || {};
    const allocation = num(i.allocationCrore);
    const spent = num(i.spentCrore);
    const demand = num(i.demandSharePct);
    const gain = num(i.uptakeGainPct);
    const avg = num(i.avgBenefitRupees);
    const errors = {};
    if (allocation === null || Number.isNaN(allocation) || allocation <= 0) errors.allocationCrore = "Enter the allocation in crore rupees (more than 0).";
    if (spent === null || Number.isNaN(spent) || spent < 0) errors.spentCrore = "Enter actual spend in crore rupees (0 or more).";
    if (!errors.allocationCrore && !errors.spentCrore && spent > allocation) errors.spentCrore = "Spend is above the allocation: there is no unspent amount to model.";
    for (const [k, v] of [["demandSharePct", demand], ["uptakeGainPct", gain]]) {
      if (v === null || Number.isNaN(v) || v < 0 || v > 100) errors[k] = "Enter a percentage between 0 and 100.";
    }
    if (avg !== null && (Number.isNaN(avg) || avg <= 0)) errors.avgBenefitRupees = "Enter the average benefit per beneficiary in rupees (more than 0), or leave it blank.";
    if (Object.keys(errors).length) return { ok: false, errors };

    const unspent = allocation - spent;
    const demandUnspent = unspent * (demand / 100);
    const recovered = demandUnspent * (gain / 100);
    const result = {
      unspentCrore: round2(unspent),
      utilisationPct: round2((spent / allocation) * 100),
      demandLinkedUnspentCrore: round2(demandUnspent),
      reductionInUnspentCrore: round2(recovered),
      newUtilisationPct: round2(((spent + recovered) / allocation) * 100),
      additionalBeneficiaries: avg ? Math.floor((recovered * 1e7) / avg) : null,
      assumptions: { demandSharePct: demand, uptakeGainPct: gain },
    };
    return { ok: true, errors: {}, result };
  }

  /** Sensitivity grid: reduction (crore) for each demandShare × uptakeGain pair. */
  function sensitivity(allocationCrore, spentCrore, demandShares, uptakeGains) {
    return demandShares.map((d) => uptakeGains.map((g) => {
      const r = estimate({ allocationCrore, spentCrore, demandSharePct: d, uptakeGainPct: g });
      return r.ok ? r.result.reductionInUnspentCrore : null;
    }));
  }

  function round2(x) {
    return Math.round(x * 100) / 100;
  }

  return Object.freeze({ estimate, sensitivity });
});
