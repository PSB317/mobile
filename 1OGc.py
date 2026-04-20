# risk/risk_model.py
from typing import Dict, List, Tuple

RISK_WEIGHTS: Dict[str, int] = {
    "expertise_low": 1,
    "budget_negative": 1,
    "schedule_pressure": 1,
    "high_schedule_pressure": 1,
    "high_complexity": 1,
    "low_clarity": 1,
    "high_dependency": 1,
}


def calculate_risk_score(
    *,
    remaining_budget: float,
    expertise: int,
    estimated_days: int,
    days_to_deadline: int,
    complexity: int,
    clarity: int,
    dependency: int,
) -> Tuple[int, str, List[str]]:
    score = 1
    reasons: List[str] = []

    if expertise <= 3:
        score += RISK_WEIGHTS["expertise_low"]
        reasons.append("Lower team expertise.")

    if days_to_deadline <= 0:
        score += RISK_WEIGHTS["schedule_pressure"] + RISK_WEIGHTS[
            "high_schedule_pressure"]
        reasons.append("No time remaining to deadline.")
    else:
        pressure = estimated_days / days_to_deadline
        if pressure > 1.0:
            score += RISK_WEIGHTS["schedule_pressure"]
            reasons.append("Schedule pressure (overrun).")
        if pressure > 1.25:
            score += RISK_WEIGHTS["high_schedule_pressure"]
            reasons.append("High schedule pressure.")

    if remaining_budget < 0:
        score += RISK_WEIGHTS["budget_negative"]
        reasons.append("Over budget.")

    if complexity >= 3:
        score += RISK_WEIGHTS["high_complexity"]
        reasons.append("High complexity.")

    if clarity <= 2:
        score += RISK_WEIGHTS["low_clarity"]
        reasons.append("Low clarity.")

    if dependency >= 3:
        score += RISK_WEIGHTS["high_dependency"]
        reasons.append("High dependency.")

    score = max(1, min(5, score))

    if score <= 2:
        level = "Low risk"
    elif score == 3:
        level = "Medium risk"
    else:
        level = "High risk"

    return score, level, reasons
