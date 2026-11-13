"""Deployment health distinguishes usable partial feeds from collection failures."""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from deployment_health import assess_collection


class DeploymentHealthTests(unittest.TestCase):
    def test_complete_collection_succeeds(self):
        level, _ = assess_collection({"StatusCode": 200}, {"state": "ok", "markets": 10})
        self.assertEqual(level, "notice")

    def test_partial_collection_warns_with_usable_market_count(self):
        level, message = assess_collection({"StatusCode": 200}, {"state": "partial", "markets": 845})
        self.assertEqual(level, "warning")
        self.assertIn("845 markets", message)
        self.assertIn("partial", message)

    def test_valid_empty_schedule_succeeds(self):
        level, _ = assess_collection({"StatusCode": 200}, {"state": "no_events", "markets": 0})
        self.assertEqual(level, "notice")

    def test_function_errors_and_invalid_responses_fail(self):
        cases = [
            ({"StatusCode": 200, "FunctionError": "Unhandled"}, {"state": "partial", "markets": 845}),
            ({"StatusCode": 202}, {"state": "ok", "markets": 10}),
            ({}, {"state": "ok", "markets": 10}),
            ({"StatusCode": 200}, {"state": "failed", "markets": 0}),
            ({"StatusCode": 200}, {"state": "partial", "markets": 0}),
            ({"StatusCode": 200}, {"state": "ok", "markets": 0}),
            ({"StatusCode": 200}, {"state": "no_events", "markets": 10}),
            ({"StatusCode": 200}, {"state": "unexpected", "markets": 10}),
            ({"StatusCode": 200}, {"state": "ok", "markets": "10"}),
            ({"StatusCode": 200}, {"state": "ok", "markets": True}),
            ({"StatusCode": 200}, {"state": "ok", "markets": -1}),
            ({"StatusCode": 200}, {}),
            ({"StatusCode": 200}, None),
            (None, {"state": "ok", "markets": 10}),
        ]
        for metadata, result in cases:
            with self.subTest(metadata=metadata, result=result), self.assertRaises(ValueError):
                assess_collection(metadata, result)
