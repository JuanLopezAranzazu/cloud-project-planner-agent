MIN_IDEA = 15
MAX_IDEA = 2000
LEVELS = {"beginner", "intermediate", "advanced"}
BUDGETS = {"free", "low", "flexible"}


class ValidationError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def validate_request(body) -> dict:
    if not isinstance(body, dict):
        raise ValidationError("bad_request", "I couldn't read your request. Send a JSON body with an 'idea' field.")

    idea = body.get("idea")
    if not isinstance(idea, str) or not idea.strip():
        raise ValidationError("idea_missing", "Tell me your idea first. One sentence is enough to start.")
    idea = " ".join(idea.split())

    if len(idea) < MIN_IDEA:
        raise ValidationError(
            "idea_too_short",
            f"That's a bit short to draw a blueprint. Give me at least {MIN_IDEA} characters: "
            "who would use it, and what problem does it solve?",
        )
    if len(idea) > MAX_IDEA:
        raise ValidationError(
            "idea_too_long",
            f"Your idea is over {MAX_IDEA} characters. Trim it to the essentials; we can refine the details later.",
        )

    level = body.get("level", "beginner")
    budget = body.get("budget", "low")
    if level not in LEVELS:
        raise ValidationError("bad_level", "Level must be beginner, intermediate or advanced.")
    if budget not in BUDGETS:
        raise ValidationError("bad_budget", "Budget must be free, low or flexible.")

    return {"idea": idea, "level": level, "budget": budget}
