import json
import logging
import os
import re

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, ReadTimeoutError

from prompts import PLAN_TOOL, SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger(__name__)

MODEL_ID = os.environ.get("MODEL_ID", "us.amazon.nova-lite-v1:0")
TOOL_NAME = PLAN_TOOL["name"]

# API Gateway cuts off at 29 s: a single attempt and a slightly shorter timeout.
_client = boto3.client(
    "bedrock-runtime",
    config=Config(read_timeout=25, connect_timeout=5, retries={"max_attempts": 1}),
)


class PlannerError(Exception):
    def __init__(self, code: str, message: str, status: int = 502):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


def generate_plan(idea: str, level: str, budget: str) -> dict:
    try:
        response = _client.converse(
            modelId=MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": build_user_prompt(idea, level, budget)}]}],
            inferenceConfig={"maxTokens": 3500, "temperature": 0.4},
            toolConfig={
                "tools": [{"toolSpec": PLAN_TOOL}],
                "toolChoice": {"tool": {"name": TOOL_NAME}},
            },
        )
    except ReadTimeoutError:
        raise PlannerError("model_timeout", "Nimbo took too long thinking. Try a shorter idea.", 504)
    except ClientError as err:
        raise _map_client_error(err)

    if response.get("stopReason") == "max_tokens":
        logger.warning("Response truncated by max_tokens")
        raise PlannerError("plan_truncated", "The plan came out too long and got cut off. Try a more focused idea.")

    raw = _extract_plan(response)
    if raw is None:
        raise PlannerError("bad_model_output", "I couldn't put the blueprint together this time. Please try again.")
    return normalize_plan(raw)


def _extract_plan(response: dict):
    content = response.get("output", {}).get("message", {}).get("content", [])
    for block in content:
        tool_use = block.get("toolUse")
        if tool_use and tool_use.get("name") == TOOL_NAME:
            data = tool_use.get("input")
            return json.loads(data) if isinstance(data, str) else data
    # Fallback: some models return JSON as plain text.
    text = "".join(b.get("text", "") for b in content)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return None


def _map_client_error(err: ClientError) -> PlannerError:
    code = err.response.get("Error", {}).get("Code", "")
    logger.error("Bedrock ClientError: %s", err)
    if code in ("ThrottlingException", "ServiceQuotaExceededException"):
        return PlannerError("busy", "The drafting table is busy right now. Wait a few seconds and try again.", 429)
    if code == "AccessDeniedException":
        return PlannerError(
            "model_access",
            "This AWS account doesn't have access to the configured Bedrock model yet. Check 'Model access' in the console.",
            503,
        )
    if code in ("ResourceNotFoundException", "ValidationException"):
        return PlannerError("model_config", "The configured model isn't available in this region. Check MODEL_ID.", 503)
    if code == "ModelTimeoutException":
        return PlannerError("model_timeout", "Nimbo took too long thinking. Try a shorter idea.", 504)
    return PlannerError("model_error", "Something went wrong talking to the model. Please try again in a moment.")


# ---------- Normalization: the frontend never receives missing fields ----------
def _s(value, default="") -> str:
    return value.strip() if isinstance(value, str) else default


def _list(value) -> list:
    return value if isinstance(value, list) else []


def normalize_plan(raw: dict) -> dict:
    arch = raw.get("architecture") if isinstance(raw.get("architecture"), dict) else {}
    cost = raw.get("cost") if isinstance(raw.get("cost"), dict) else {}
    tier = _s(cost.get("tier"), "low")
    if tier not in ("free-tier", "low", "medium", "high"):
        tier = "low"

    return {
        "title": _s(raw.get("title"), "Your project"),
        "tagline": _s(raw.get("tagline")),
        "summary": _s(raw.get("summary")),
        "architecture": {
            "pattern": _s(arch.get("pattern")),
            "services": [
                {"name": _s(x.get("name")), "role": _s(x.get("role")), "why": _s(x.get("why"))}
                for x in _list(arch.get("services")) if isinstance(x, dict) and _s(x.get("name"))
            ],
            "flow": [_s(x) for x in _list(arch.get("flow")) if _s(x)],
        },
        "roadmap": [
            {
                "phase": _s(x.get("phase")),
                "title": _s(x.get("title")),
                "duration": _s(x.get("duration")),
                "tasks": [_s(t) for t in _list(x.get("tasks")) if _s(t)],
            }
            for x in _list(raw.get("roadmap")) if isinstance(x, dict)
        ],
        "cost": {
            "tier": tier,
            "monthlyEstimateUsd": _s(cost.get("monthlyEstimateUsd"), "—"),
            "notes": _s(cost.get("notes")),
        },
        "risks": [
            {"risk": _s(x.get("risk")), "mitigation": _s(x.get("mitigation"))}
            for x in _list(raw.get("risks")) if isinstance(x, dict) and _s(x.get("risk"))
        ],
        "nextStep": _s(raw.get("nextStep")),
    }
