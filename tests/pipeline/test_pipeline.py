"""Pipeline unit tests (stdlib unittest, no network).

Run: python -m unittest discover -s tests/pipeline -v
"""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "pipeline"))

from detect_duplicates import find_duplicates, norm_name  # noqa: E402
from rule_extract import extract_rules, parse_amount  # noqa: E402
from safe_fetch import FetchError, SafeFetcher, html_to_text, normalize_for_match  # noqa: E402
from validate_schemes import contradictions, url_problem  # noqa: E402


class RuleExtraction(unittest.TestCase):
    def r(self, line):
        return extract_rules(line, "MH", "Maharashtra")

    def test_income_ceiling_inclusive(self):
        self.assertEqual(self.r("1) The parents/Guardian annual income shall be less than or equal to Rs. 2,50,000."),
                         [{"field": "annualFamilyIncome", "op": "lte", "value": 250000.0}])
        self.assertEqual(self.r("Family annual income limit is upto Rs. 8.00 lakh."),
                         [{"field": "annualFamilyIncome", "op": "lte", "value": 800000.0}])
        self.assertEqual(self.r("h) The Total Annual Income of Family / Guardian should not be more than 8 Lakhs.")[0]["value"], 800000.0)

    def test_ambiguous_income_stays_manual(self):
        self.assertEqual(self.r("* Family annual income limit is RS. > 2,50,000"), [])
        self.assertEqual(self.r("Income up to Rs 2.5 lakh for 100% and up to Rs 8 lakh for 50%"), [])
        self.assertEqual(self.r("For Non Professional Courses, applicant should have upto 1 lakh family Annual Income."), [])
        self.assertEqual(self.r("Applicant should be child of Registered Labour or Child of Alpabhudharak or Both / Total Annual Income of Family should not be more than 6 Lakhs"), [])
        self.assertEqual(self.r("7. SC trainees with an annual income of less than Rs. 2.5 lac are also eligible for the Post Matric Scholarship."), [])

    def test_domicile_and_residence(self):
        self.assertEqual(self.r("1. Applicant should be Domicile of Maharashtra."), [{"field": "domicileState", "op": "in", "value": ["MH"]}])
        self.assertEqual(self.r("Applicant must be a resident of Maharashtra."), [{"field": "state", "op": "in", "value": ["MH"]}])
        self.assertEqual(self.r("Applicant need not be domicile of Maharashtra"), [])

    def test_category(self):
        self.assertEqual(self.r("Student should belong to SC.")[0]["value"], ["SC"])
        self.assertEqual(self.r("3.Student should belong to OBC, SEBC, VJNT & SBC Category and should provide caste certificate.")[0]["value"], ["OBC", "SBC", "SEBC", "VJNT"])
        self.assertEqual(self.r("Students not belonging to SC category are eligible"), [])

    def test_disability_percent(self):
        out = self.r("• Student should be disable. (40% or above)")
        self.assertIn({"field": "disability", "op": "isTrue", "value": True}, out)
        self.assertIn({"field": "disabilityPercent", "op": "gte", "value": 40}, out)

    def test_parse_amount(self):
        self.assertEqual(parse_amount("2.5", "lac"), 250000)
        self.assertEqual(parse_amount("2,50,000", None), 250000)


class FetchSecurity(unittest.TestCase):
    def setUp(self):
        self.f = SafeFetcher(policy={"pmuy.gov.in": {"host": "pmuy.gov.in", "status": "ALLOWED"}, "www.myscheme.gov.in": {"status": "BLOCKED_BY_TERMS"}})

    def code(self, url):
        with self.assertRaises(FetchError) as cm:
            self.f._validate_url(url)
        return cm.exception.code

    def test_rejects_non_https(self):
        self.assertEqual(self.code("http://pmuy.gov.in/"), "SCHEME_REJECTED")
        self.assertEqual(self.code("file:///etc/passwd"), "SCHEME_REJECTED")

    def test_rejects_non_allowlisted_and_blocked(self):
        self.assertEqual(self.code("https://example.com/"), "HOST_NOT_ALLOWLISTED")
        self.assertEqual(self.code("https://www.myscheme.gov.in/schemes/x"), "HOST_NOT_ALLOWLISTED")
        self.assertEqual(self.code("https://127.0.0.1/"), "HOST_NOT_ALLOWLISTED")
        self.assertEqual(self.code("https://169.254.169.254/latest/meta-data"), "HOST_NOT_ALLOWLISTED")

    def test_rejects_credentials_and_ports(self):
        self.assertEqual(self.code("https://user:pw@pmuy.gov.in/"), "CREDENTIALS_IN_URL")
        self.assertEqual(self.code("https://pmuy.gov.in:8443/"), "PORT_REJECTED")

    def test_html_to_text_drops_scripts(self):
        title, text = html_to_text(b"<html><title>T</title><script>alert(1)</script><p>Eligibility</p><style>p{}</style></html>")
        self.assertEqual(title, "T")
        self.assertNotIn("alert", text)
        self.assertIn("Eligibility", text)

    def test_quote_normalisation(self):
        self.assertIn(normalize_for_match("Shopkeeper’s  Retail\n traders"), normalize_for_match("of Shopkeeper's Retail traders and"))


class Validation(unittest.TestCase):
    def test_url_problem(self):
        self.assertIsNone(url_problem("https://mahadbt2.maharashtra.gov.in/"))
        self.assertIsNotNone(url_problem("http://pmuy.gov.in/"))
        self.assertIsNotNone(url_problem("https://pmuy.gov.in.evil.com/"))

    def test_contradictions(self):
        self.assertTrue(contradictions([{"field": "age", "op": "gte", "value": 30}, {"field": "age", "op": "lte", "value": 18}]))
        self.assertFalse(contradictions([{"field": "age", "op": "gte", "value": 18}, {"field": "age", "op": "lte", "value": 40}]))

    def test_duplicates(self):
        recs = [{"id": "a", "name": "Rajarshri X (DHE)", "jurisdictions": ["MH"], "sources": [{"contentSha256": "h1"}]},
                {"id": "b", "name": "Rajarshi X", "jurisdictions": ["MH"], "sources": [{"contentSha256": "h1"}]}]
        d = find_duplicates(recs)
        self.assertEqual(len(d["sameName"]), 1)
        self.assertEqual(d["sameSourceText"], [["a", "b"]])
        self.assertEqual(norm_name("Dr. Punjabrao Deshmukh Vastigruh"), norm_name("Dr Panjabrao Deshmukh Vasatigruh"))

    def test_published_dataset_evidence(self):
        data = json.loads((ROOT / "data" / "schemes.json").read_text(encoding="utf-8"))
        for s in data["schemes"]:
            v = s["verification"]
            if v["status"] in ("VERIFIED", "PARTIALLY_VERIFIED"):
                self.assertEqual(v["quotesFound"], v["quotesTotal"], s["id"])
                self.assertEqual(v["errors"], [], s["id"])


if __name__ == "__main__":
    unittest.main()


class ImpactEvidence(unittest.TestCase):
    def test_fiscal_context_quotes_found_in_cag_snapshot(self):
        from snapshot_store import load_snapshot
        ctx = json.loads((ROOT / "data" / "impact" / "fiscal-context.json").read_text(encoding="utf-8"))
        snap = load_snapshot(ctx["sources"][0]["url"])
        self.assertIsNotNone(snap, "CAG press-release snapshot missing")
        text = normalize_for_match(snap["text"])
        for f in ctx["facts"]:
            self.assertIn(normalize_for_match(f["evidence"]["quote"]), text, f["id"])
