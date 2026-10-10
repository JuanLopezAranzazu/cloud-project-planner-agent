import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

from validation import ValidationError, validate_request
from planner import _extract_plan, normalize_plan


class ValidationTests(unittest.TestCase):
    def test_ok_with_defaults(self):
        out = validate_request({"idea": "An app to book haircut appointments"})
        self.assertEqual(out["level"], "beginner")
        self.assertEqual(out["budget"], "low")

    def test_short_idea(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_request({"idea": "hola"})
        self.assertEqual(ctx.exception.code, "idea_too_short")

    def test_missing_idea(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_request({})
        self.assertEqual(ctx.exception.code, "idea_missing")

    def test_bad_level(self):
        with self.assertRaises(ValidationError):
            validate_request({"idea": "x" * 30, "level": "god"})


class NormalizeTests(unittest.TestCase):
    def test_fills_missing_fields(self):
        plan = normalize_plan({"title": "Demo", "cost": {"tier": "weird"}})
        self.assertEqual(plan["cost"]["tier"], "low")
        self.assertEqual(plan["roadmap"], [])
        self.assertEqual(plan["architecture"]["services"], [])


def _resp(text):
    return {"output": {"message": {"content": [{"text": text}]}}}


class ExtractTests(unittest.TestCase):
    def test_prefilled_brace_is_missing(self):
        out = _extract_plan(_resp('"title": "Demo", "nextStep": "Go"}'))
        self.assertEqual(out["title"], "Demo")

    def test_model_repeats_brace_and_adds_trailing_text(self):
        out = _extract_plan(_resp('{"title": "Demo"}\n\nHope this helps!'))
        self.assertEqual(out["title"], "Demo")

    def test_code_fence(self):
        out = _extract_plan(_resp('```json\n{"title": "Demo"}\n```'))
        self.assertEqual(out["title"], "Demo")

    def test_garbage_returns_none(self):
        self.assertIsNone(_extract_plan(_resp("sorry, I can't")))
        self.assertIsNone(_extract_plan(_resp('"title": "oops",')))


if __name__ == "__main__":
    unittest.main()
