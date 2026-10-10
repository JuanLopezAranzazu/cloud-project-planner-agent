import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

from validation import ValidationError, validate_request
from planner import normalize_plan


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


if __name__ == "__main__":
    unittest.main()
