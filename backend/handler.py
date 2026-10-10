import base64
import json
import logging

from planner import PlannerError, generate_plan
from validation import ValidationError, validate_request

logger = logging.getLogger()
logger.setLevel(logging.INFO)

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
}


def _response(status: int, payload: dict) -> dict:
    return {"statusCode": status, "headers": HEADERS, "body": json.dumps(payload, ensure_ascii=False)}


def _error(status: int, code: str, message: str) -> dict:
    return _response(status, {"error": {"code": code, "message": message}})


def lambda_handler(event, context):
    try:
        raw_body = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        try:
            body = json.loads(raw_body)
        except json.JSONDecodeError:
            return _error(400, "bad_json", "I couldn't read your request. Send valid JSON.")

        params = validate_request(body)
        logger.info("plan request level=%s budget=%s idea_chars=%d",
                    params["level"], params["budget"], len(params["idea"]))
        plan = generate_plan(**params)
        return _response(200, {"plan": plan})

    except ValidationError as err:
        return _error(400, err.code, err.message)
    except PlannerError as err:
        return _error(err.status, err.code, err.message)
    except Exception:
        logger.exception("Unexpected error")
        return _error(500, "internal", "Something unexpected broke on my side. Please try again in a moment.")
