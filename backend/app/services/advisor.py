import re
from dataclasses import dataclass

from app.services.my_version import OptionResult, compare_option

LABELS = {"cost": "lowest monthly cost", "time": "least travel time", "co2": "lowest CO₂"}
METRIC = {"cost": "monthly_cost", "time": "monthly_minutes", "co2": "monthly_co2_kg"}

CO2_WORDS = re.compile(r"co2|co₂|carbon|emission|\bgreen\b|\beco\b|environment", re.I)
TIME_WORDS = re.compile(
    r"\b(?:fast|faster|fastest|quick|quickest|shortest|hurry)\b|least time|save time",
    re.I,
)
NUMBER = r"(\d+(?:[.,]\d+)?)"
CURRENCY_AFTER = re.compile(NUMBER + r"\s*(?:pln|zł|zl|zloty)", re.I)
KEYWORD_BEFORE = re.compile(
    r"(?:under|below|max(?:imum)?|up to|at most|budget(?: of)?|spend)\s+(?:of\s+)?(?:about\s+)?"
    + NUMBER,
    re.I,
)


@dataclass
class Preferences:
    priority: str = "cost"
    max_budget: float | None = None


@dataclass
class Advice:
    option: object | None
    result: OptionResult | None
    explanation: str
    considered: int
    within_budget: int


def parse_request(text: str) -> Preferences:
    """Turn a sentence into a priority and an optional monthly budget (PLN)."""
    if CO2_WORDS.search(text):
        priority = "co2"
    elif TIME_WORDS.search(text):
        priority = "time"
    else:
        priority = "cost"

    match = CURRENCY_AFTER.search(text) or KEYWORD_BEFORE.search(text)
    budget = float(match.group(1).replace(",", ".")) if match else None
    return Preferences(priority, budget)


def _gap_text(priority: str, best: OptionResult, runner: OptionResult) -> str:
    if priority == "cost":
        gap, unit = runner.monthly_cost - best.monthly_cost, "PLN a month"
    elif priority == "time":
        gap, unit = (runner.monthly_minutes - best.monthly_minutes) / 60, "h a month"
    else:
        gap, unit = runner.monthly_co2_kg - best.monthly_co2_kg, "kg CO₂ a month"
    if gap <= 0:
        return ""
    return f" That is {gap:.1f} {unit} better than the {runner.mode}."


def advise(plan, options, prefs: Preferences) -> Advice:
    pairs = [
        (
            o,
            compare_option(
                o.mode, o.price_per_trip, o.duration_min, plan.distance_km,
                plan.trips_per_week, o.monthly_pass_price, o.riders,
            ),
        )
        for o in options
    ]
    if not pairs:
        return Advice(None, None, "Add at least one travel option to this plan first.", 0, 0)

    affordable = [
        p for p in pairs
        if prefs.max_budget is None or p[1].monthly_cost <= prefs.max_budget
    ]
    if not affordable:
        cheapest = min(pairs, key=lambda p: p[1].monthly_cost)[1]
        text = (
            f"Nothing fits a budget of {prefs.max_budget:g} PLN a month. "
            f"The cheapest option is the {cheapest.mode} at {cheapest.monthly_cost:g} PLN."
        )
        return Advice(None, None, text, len(pairs), 0)

    ranked = sorted(affordable, key=lambda p: getattr(p[1], METRIC[prefs.priority]))
    option, best = ranked[0]

    text = (
        f"I recommend the {best.mode}: {best.monthly_cost:g} PLN a month, "
        f"about {best.monthly_minutes / 60:.0f} h of travelling and "
        f"{best.monthly_co2_kg:g} kg CO₂. It has the {LABELS[prefs.priority]}"
    )
    if prefs.max_budget is not None:
        text += f" among the options within your {prefs.max_budget:g} PLN budget"
    text += "."
    if best.uses_pass:
        text += " The monthly pass is cheaper than single tickets at your number of trips."
    if len(ranked) > 1:
        text += _gap_text(prefs.priority, best, ranked[1][1])

    return Advice(option, best, text, len(pairs), len(affordable))