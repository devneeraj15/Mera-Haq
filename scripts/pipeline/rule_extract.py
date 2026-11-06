"""Conservative rule extraction from official eligibility statements.

Each eligibility *line* from an official page becomes exactly one criterion:
  * a machine-checkable criterion, ONLY when a reviewed pattern matches the
    line unambiguously (e.g. one income figure, explicit domicile wording), or
  * a "manual" criterion that the citizen confirms themselves (verbatim text).

The line itself is stored as the evidence quote, so validate_schemes.py can
re-check it against the snapshot. When in doubt, the line stays manual:
a false "manual" is safe, a false machine rule is not.
"""
from __future__ import annotations

import re

LAKH = 100000

_AMOUNT = r"(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(lakhs?|lacs?|lakh)?"


def parse_amount(num: str, unit: str | None) -> float | None:
    try:
        v = float(num.replace(",", ""))
    except ValueError:
        return None
    if unit:
        v *= LAKH
    return v


def _income_rule(line: str):
    low = line.lower()
    if "income" not in low:
        return None
    if "<" in low or ">" in low:
        return None  # e.g. "limit is RS. > 2,50,000": symbol contradicts wording, keep manual
    if re.search(r"labou?r|alpabhud|\bor\b.*child of|child of.*\bor\b", low):
        return None  # alternative (OR) conditions cannot be one hard ceiling
    if re.search(r"less than or equal|less than ?/ ?equal|less than equal|equal to or less|or less", low):
        amounts = [a for a in re.findall(_AMOUNT, low) if parse_amount(*a) and parse_amount(*a) >= 10000]
        return {"field": "annualFamilyIncome", "op": "lte", "value": parse_amount(*amounts[0])} if len(amounts) == 1 else None
    amounts = re.findall(_AMOUNT, low)
    amounts = [a for a in amounts if a[0].replace(",", "").replace(".", "").isdigit() and parse_amount(*a) and parse_amount(*a) >= 10000]
    if len(amounts) != 1:
        return None  # zero or several figures: ambiguous, keep manual
    if re.search(r"\b(more than|above|exceed(?:s|ing)? and|minimum)\b", low) and not re.search(r"not (?:be )?(?:more|exceed)|should not exceed|does not exceed|not more than", low):
        # Explicit lower bound, e.g. "annual income above Rs. 250000 to unlimited"
        if re.search(r"income[^.]{0,40}\b(?:above|more than)\b", low) and not re.search(r"\b(?:not|below|less|upto|up to|limit is)\b", low):
            return {"field": "annualFamilyIncome", "op": "gt", "value": parse_amount(*amounts[0])}
        return None  # other lower bounds / slabs stay manual
    value = parse_amount(*amounts[0])
    if re.search(r"less than|below|under", low) and not re.search(r"up ?to|not (?:be )?more than|not exceed|maximum|limit", low):
        return {"field": "annualFamilyIncome", "op": "lt", "value": value}
    if re.search(r"up ?to|upto|not (?:be )?more than|not exceed|should not exceed|does not exceed|maximum|limit|within|less than or equal", low):
        return {"field": "annualFamilyIncome", "op": "lte", "value": value}
    return None


_CATEGORY_PATTERNS = [
    ("SC", r"\bscheduled castes?\b|\bs\.?c\.?\b(?! ?/ ?st)|neo[- ]?b(?:o|u)ddh|navb(?:o|au)ddh"),
    ("ST", r"\bscheduled tribes?\b|\bs\.?t\.?\b|\btribal\b"),
    ("OBC", r"\bobc\b|other backward class"),
    ("VJNT", r"\bvjnt\b|vimukta jati|nomadic tribe"),
    ("SBC", r"\bsbc\b|special backward class"),
    ("SEBC", r"\bsebc\b|socially and educationally backward"),
    ("EWS", r"\bews\b|economically weaker section"),
    ("GENERAL", r"\bopen category\b|\bgeneral category\b"),
]


def _category_rule(line: str):
    low = line.lower()
    if not re.search(r"belong(?:s|ing)? to|should be (?:of|from)|category (?:should|shall|must) be|applicable (?:for|to) (?:sc|st|obc|vjnt|sbc|sebc|ews)\b.*\bonly\b|category (?:students?|candidates?|applicants?)|from (?:the )?(?:sc|st|obc|vjnt|sbc|sebc) ", low):
        return None
    if re.search(r"\bnot\b|\bexcept\b|excluding|other than", low):
        return None
    cats = [code for code, pat in _CATEGORY_PATTERNS if re.search(pat, low)]
    if not cats:
        return None
    if "EWS" in cats and "GENERAL" in cats and " and " in low:
        cats = ["EWS"]  # "OPEN category and EWS" = EWS among open category (both must hold)
    return {"field": "socialCategory", "op": "in", "value": sorted(set(cats))}


_RELIGIONS = [("MUSLIM", r"muslim"), ("CHRISTIAN", r"christian"), ("SIKH", r"sikh"), ("BUDDHIST", r"buddhist"), ("JAIN", r"jain"), ("PARSI", r"parsi|zoroastrian"), ("JEWISH", r"jew")]


def _minority_rule(line: str):
    low = line.lower()
    if "minority" not in low:
        return None
    rel = [code for code, pat in _RELIGIONS if re.search(pat, low)]
    if len(rel) < 2:
        return None  # a bare "minority" without the notified list is not enough
    return {"field": "religion", "op": "in", "value": rel}


def _domicile_rule(line: str, state_code: str, state_name: str):
    low = line.lower()
    if "domicile" in low and state_name.lower() in low and not re.search(r"\bnot\b", low):
        return {"field": "domicileState", "op": "in", "value": [state_code]}
    return None


def _residence_rule(line: str, state_code: str, state_name: str):
    low = line.lower()
    if re.search(r"\bresident(?:ial)? of " + re.escape(state_name.lower()), low) and not re.search(r"\bnot\b|\bor\b", low):
        return {"field": "state", "op": "in", "value": [state_code]}
    return None


def _gender_rule(line: str):
    low = line.lower()
    if re.search(r"\b(only (?:for )?girls?|only (?:for )?(?:female|women)|girl students? (?:are|is) (?:only )?eligible|applicant (?:should|must) be (?:a )?(?:girl|female|woman))\b", low):
        return {"field": "gender", "op": "in", "value": ["FEMALE"]}
    return None


def _age_rule(line: str):
    low = line.lower()
    m = re.search(r"\bage\b[^.]{0,40}?\bbetween\s+(\d{1,3})\s*(?:and|to|-)\s*(\d{1,3})\s*years", low) or re.search(r"\bage\b[^.]{0,40}?(\d{1,3})\s*(?:to|-)\s*(\d{1,3})\s*years", low)
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
        if 0 <= lo <= hi <= 120:
            return [{"field": "age", "op": "gte", "value": lo}, {"field": "age", "op": "lte", "value": hi}]
    m = re.search(r"\bage\b[^.]{0,40}?(?:not (?:be )?more than|maximum|below|up ?to)\s*(\d{1,3})\s*years", low)
    if m:
        op = "lt" if "below" in m.group(0) else "lte"
        return [{"field": "age", "op": op, "value": int(m.group(1))}]
    return None


def _disability_rule(line: str):
    low = line.lower()
    if not re.search(r"disabilit|disable|divyang|handicap", low):
        return None
    out = [{"field": "disability", "op": "isTrue", "value": True}]
    m = re.search(r"(\d{2})\s*%|(\d{2})\s*percent", low)
    if m and re.search(r"(?:at ?least|minimum|not less than|more than|or more|and above|or above)", low):
        out.append({"field": "disabilityPercent", "op": "gte", "value": int(m.group(1) or m.group(2))})
    return out


CONDITIONAL = re.compile(r"^\W*(?:[0-9a-z]{1,2}[.)]\s*)?(?:for|in case|if|where|also)\b|\balso (?:eligible|applicable)\b|\bpreference\b", re.I)


def extract_rules(line: str, state_code: str | None = None, state_name: str | None = None) -> list[dict]:
    """Return a list of machine criteria for one statement ([] => manual)."""
    rules: list[dict] = []
    if CONDITIONAL.search(line):
        return rules  # conditional / sub-group / cross-scheme statements stay manual
    if state_code:
        for fn in (_domicile_rule, _residence_rule):
            r = fn(line, state_code, state_name or "")
            if r:
                rules.append(r)
    for fn in (_income_rule, _category_rule, _minority_rule, _gender_rule):
        r = fn(line)
        if r:
            rules.append(r)
    for fn in (_age_rule, _disability_rule):
        r = fn(line)
        if r:
            rules.extend(r)
    return rules


def human_label(rule: dict, names: dict | None = None) -> str:
    f, op, v = rule["field"], rule["op"], rule.get("value")
    sym = {"gte": "at least", "lte": "at most", "lt": "below", "gt": "above"}
    if f == "annualFamilyIncome":
        amt = f"₹{int(v):,}" if float(v).is_integer() else f"₹{v:,}"
        return f"Annual family income {sym[op]} {amt}"
    if f == "age":
        return f"Age {sym[op]} {v} years"
    if f == "domicileState":
        return "Domicile of " + ", ".join((names or {}).get(c, c) for c in v)
    if f == "socialCategory":
        return "Social category: " + " / ".join(v)
    if f == "religion":
        return "Notified minority community: " + ", ".join(x.title() for x in v)
    if f == "gender":
        return "Gender: " + " / ".join(x.title() for x in v)
    if f == "disability":
        return "Person with disability"
    if f == "disabilityPercent":
        return f"Disability of at least {v}%"
    if f == "state":
        return "Resident of " + ", ".join((names or {}).get(c, c) for c in v)
    return f"{f} {op} {v}"
