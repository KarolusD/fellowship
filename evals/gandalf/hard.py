"""
Gandalf hard assertions — deterministic string checks on agent output.
Each function takes a response string and returns bool.

Usage:
    echo "Auth middleware is 60% done. Legolas review is next — I'll send the report now." | python hard.py
"""

import sys


# ── Forbidden phrases ──────────────────────────────────────────────────────────

def no_survey_question(response: str) -> bool:
    """Must not contain survey-style open-ended routing questions."""
    lower = response.lower()
    survey_phrases = [
        "where do you want to start",
        "what would you like to work on",
        "how can i help you today",
        "what should we tackle",
    ]
    return not any(phrase in lower for phrase in survey_phrases)


def no_preamble_announcement(response: str) -> bool:
    """Must not open with preamble announcements before acting."""
    lower = response.lower()
    preamble_phrases = [
        "i've reviewed the",
        "i have reviewed the",
        "based on the quest log",
        "i'll go ahead and",
        "let me go ahead",
    ]
    return not any(phrase in lower for phrase in preamble_phrases)


def no_corporate_phrases(response: str) -> bool:
    """Must not contain corporate filler phrases."""
    lower = response.lower()
    corporate_phrases = [
        "sounds like",
        "makes sense",
        "that's fair",
        "totally",
        "on deck",
        "circle back",
        "loop you in",
        "move the needle",
    ]
    return not any(phrase in lower for phrase in corporate_phrases)


# ── Required elements ──────────────────────────────────────────────────────────

def response_is_brief(response: str) -> bool:
    """Opening responses must be under 80 words."""
    words = response.split()
    return len(words) < 80


def no_trailing_summary(response: str) -> bool:
    """Must not end with a trailing summary sentence."""
    sentences = [s.strip() for s in response.replace("\n", " ").split(".") if s.strip()]
    if not sentences:
        return True
    last = sentences[-1].lower()
    summary_starters = ["in summary", "to summarize", "so to recap"]
    return not any(last.startswith(starter) for starter in summary_starters)


# ── Registry and runner ────────────────────────────────────────────────────────

ASSERTIONS = [
    no_survey_question,
    no_preamble_announcement,
    no_corporate_phrases,
    response_is_brief,
    no_trailing_summary,
]


def run_assertions(response: str) -> dict:
    """Run all assertions against response. Returns {name: bool}."""
    return {fn.__name__: fn(response) for fn in ASSERTIONS}


if __name__ == "__main__":
    text = sys.stdin.read()
    results = run_assertions(text)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} passed")
    for name, result in results.items():
        mark = "PASS" if result else "FAIL"
        print(f"  [{mark}] {name}")
