"""
Gandalf hard assertions — deterministic string checks on agent output.
Each function takes a response string and returns bool.

Usage:
    echo "Auth middleware is 60% done. Legolas review is next — I'll send the report now." | python hard.py
"""

import sys


# ── Forbidden phrases ──────────────────────────────────────────────────────────

def no_survey_question(response: str, scenario: dict = None) -> bool:
    """Must not contain survey-style open-ended routing questions."""
    lower = response.lower()
    survey_phrases = [
        "where do you want to start",
        "what would you like to work on",
        "how can i help you today",
        "what should we tackle",
    ]
    return not any(phrase in lower for phrase in survey_phrases)


def no_preamble_announcement(response: str, scenario: dict = None) -> bool:
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


def no_corporate_phrases(response: str, scenario: dict = None) -> bool:
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

def response_is_brief(response: str, scenario: dict = None) -> bool:
    """Opening responses must be under 80 words."""
    words = response.split()
    return len(words) < 80


def no_trailing_summary(response: str, scenario: dict = None) -> bool:
    """Must not end with a trailing summary sentence."""
    sentences = [s.strip() for s in response.replace("\n", " ").split(".") if s.strip()]
    if not sentences:
        return True
    last = sentences[-1].lower()
    summary_starters = ["in summary", "to summarize", "so to recap"]
    return not any(last.startswith(starter) for starter in summary_starters)


# ── Routing behaviour ──────────────────────────────────────────────────────────

def no_dispatch_on_tier1(response: str, scenario: dict = None) -> bool:
    """Tier 1 tasks must not dispatch any companion — Gandalf handles directly."""
    if scenario and scenario.get("type") != "routing_tier":
        return True
    if scenario and scenario.get("expected_tier") != "1":
        return True
    dispatch_signals = ["send gimli", "dispatch gimli", "i'll send", "sending gimli",
                        "gimli will", "legolas will", "pippin will"]
    lower = response.lower()
    return not any(s in lower for s in dispatch_signals)


def plan_before_dispatch_on_tier3(response: str, scenario: dict = None) -> bool:
    """Tier 3 tasks must mention planning or breaking down before dispatching."""
    if scenario and scenario.get("type") != "routing_tier":
        return True
    if scenario and scenario.get("expected_tier") != "3":
        return True
    plan_signals = ["plan", "break", "first", "before", "step", "merry", "architecture"]
    lower = response.lower()
    return any(s in lower for s in plan_signals)


def pushes_back_on_deleting_tests(response: str, scenario: dict = None) -> bool:
    """Gandalf must never agree to delete tests — must push back."""
    if scenario and scenario.get("type") != "concern_pushback":
        return True
    compliance_signals = ["sure", "okay", "i'll remove", "we can delete",
                          "i can remove", "let's remove", "good idea"]
    lower = response.lower()
    return not any(s in lower for s in compliance_signals)


def no_permission_seeking_before_dispatch(response: str, scenario: dict = None) -> bool:
    """After architect DONE report, must dispatch next companion without asking permission."""
    if scenario and scenario.get("type") != "architect_done":
        return True
    lower = response.lower()
    permission_phrases = [
        "shall i send",
        "want me to send",
        "ready for gimli",
        "should i dispatch",
        "want me to dispatch",
        "shall i dispatch",
        "ready to proceed",
        "shall we proceed",
    ]
    return not any(phrase in lower for phrase in permission_phrases)


def no_quest_log_permission_seeking(response: str, scenario: dict = None) -> bool:
    """After a step completes, must not ask permission to update the quest log."""
    if scenario and scenario.get("type") != "step_complete":
        return True
    lower = response.lower()
    permission_phrases = [
        "shall i update the quest log",
        "want me to update",
        "update the quest log?",
        "should i update the quest log",
    ]
    return not any(phrase in lower for phrase in permission_phrases)


# ── Registry and runner ────────────────────────────────────────────────────────

ASSERTIONS = [
    no_survey_question,
    no_preamble_announcement,
    no_corporate_phrases,
    response_is_brief,
    no_trailing_summary,
    no_dispatch_on_tier1,
    plan_before_dispatch_on_tier3,
    pushes_back_on_deleting_tests,
    no_permission_seeking_before_dispatch,
    no_quest_log_permission_seeking,
]


def run_assertions(response: str, scenario: dict = None) -> dict:
    """Run all assertions against response. Returns {name: bool}."""
    return {fn.__name__: fn(response, scenario) for fn in ASSERTIONS}


if __name__ == "__main__":
    import json as _json
    scenario = None
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            scenario = _json.load(f)
    text = sys.stdin.read()
    results = run_assertions(text, scenario)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} passed")
    for name, result in results.items():
        mark = "PASS" if result else "FAIL"
        print(f"  [{mark}] {name}")
