from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class BudgetResult:
    team_cut_amount: float
    available_budget: float
    remaining: float
    remaining_percent: float
    budget_status: str


def clamp_score(value: int) -> int:
    return max(1, min(5, value))


def round_half_up(value: float) -> int:
    return int(value + 0.5)


def calculate_budget_status(
    overall: float,
    project: float,
    team_cut: float
) -> BudgetResult:
    """
    Cleans up budget handling by separating:
    - total budget
    - cut amount
    - available budget
    - remaining budget
    - remaining budget percentage
    - budget health status
    """
    if overall <= 0:
        raise ValueError("Overall budget must be greater than zero.")
    if project < 0:
        raise ValueError("Project cost cannot be negative.")
    if not 0 <= team_cut <= 100:
        raise ValueError("Team cut percentage must be between 0 and 100.")

    team_cut_amount = overall * (team_cut / 100.0)
    available_budget = overall - team_cut_amount
    remaining = available_budget - project
    remaining_percent = (remaining / overall) * 100

    if remaining < 0:
        budget_status = "critical"
    elif remaining_percent <= 20:
        budget_status = "warning"
    else:
        budget_status = "healthy"

    return BudgetResult(
        team_cut_amount=team_cut_amount,
        available_budget=available_budget,
        remaining=remaining,
        remaining_percent=remaining_percent,
        budget_status=budget_status,
    )


def calculate_schedule_scenarios(estimated_days: int) -> Dict[str, int]:
    """
    Returns optimistic, expected, and pessimistic schedule scenarios in days.
    """
    optimistic = max(1, round_half_up(estimated_days * 0.8))
    expected = estimated_days
    pessimistic = round_half_up(estimated_days * 1.25)

    return {
        "optimistic_days": optimistic,
        "expected_days": expected,
        "pessimistic_days": pessimistic,
    }


def calculate_schedule_pressure_rating(
    estimated_days: int, days_to_deadline: int
) -> Tuple[int, str, Dict[str, int]]:
    """
    Converts schedule pressure into a 1-5 matrix rating.
    Also returns schedule scenarios for display.
    """
    if days_to_deadline <= 0:
        scenarios = calculate_schedule_scenarios(estimated_days)
        return 5, "Deadline has already passed or no time remains.", scenarios

    scenarios = calculate_schedule_scenarios(estimated_days)
    pressure = estimated_days / days_to_deadline

    if pressure <= 0.60:
        rating = 1
        reason = (
            f"Low schedule pressure. Optimistic: {scenarios['optimistic_days']} days, "
            f"Expected: {scenarios['expected_days']} days, "
            f"Pessimistic: {scenarios['pessimistic_days']} days."
        )
    elif pressure <= 0.85:
        rating = 2
        reason = (
            f"Manageable schedule pressure. Optimistic: {scenarios['optimistic_days']} days, "
            f"Expected: {scenarios['expected_days']} days, "
            f"Pessimistic: {scenarios['pessimistic_days']} days."
        )
    elif pressure <= 1.00:
        rating = 3
        reason = (
            f"Tight schedule. Optimistic: {scenarios['optimistic_days']} days, "
            f"Expected: {scenarios['expected_days']} days, "
            f"Pessimistic: {scenarios['pessimistic_days']} days."
        )
    elif pressure <= 1.25:
        rating = 4
        reason = (
            f"Likely schedule overrun. Optimistic: {scenarios['optimistic_days']} days, "
            f"Expected: {scenarios['expected_days']} days, "
            f"Pessimistic: {scenarios['pessimistic_days']} days."
        )
    else:
        rating = 5
        reason = (
            f"Severe schedule pressure. Optimistic: {scenarios['optimistic_days']} days, "
            f"Expected: {scenarios['expected_days']} days, "
            f"Pessimistic: {scenarios['pessimistic_days']} days."
        )

    return rating, reason, scenarios


def calculate_budget_rating(remaining_budget: float, overall_budget: float) -> Tuple[int, str]:
    """
    Converts budget position into a 1-5 impact rating.
    Higher score = worse financial position / greater impact.
    """
    if overall_budget <= 0:
        return 5, "No valid overall budget available."

    remaining_pct = (remaining_budget / overall_budget) * 100

    if remaining_budget < 0:
        return 5, "Project is already over budget."
    elif remaining_pct < 5:
        return 4, "Very limited contingency remains."
    elif remaining_pct < 10:
        return 3, "Low contingency remains."
    elif remaining_pct < 20:
        return 2, "Moderate contingency remains."
    else:
        return 1, "Healthy budget contingency remains."


def calculate_expertise_rating(expertise: int) -> Tuple[int, str]:
    """
    Lower expertise should increase probability of risk.
    User input is 1-5, but the returned rating is risk-oriented.
    """
    mapping = {
        1: (5, "Very low team expertise increases likelihood of delivery issues."),
        2: (4, "Low team expertise increases likelihood of delivery issues."),
        3: (3, "Moderate team expertise gives a moderate likelihood of issues."),
        4: (2, "Good team expertise reduces likelihood of issues."),
        5: (1, "Strong team expertise significantly reduces likelihood of issues."),
    }
    return mapping.get(expertise, (3, "Expertise level is moderate."))


def calculate_complexity_rating(complexity: int) -> Tuple[int, str]:
    """
    Higher complexity increases both probability and impact.
    """
    mapping = {
        1: (1, "Low complexity limits risk severity."),
        2: (2, "Slight complexity adds limited risk."),
        3: (3, "Moderate complexity increases delivery risk."),
        4: (4, "High complexity increases delivery and operational risk."),
        5: (5, "Very high complexity can severely affect delivery and outcomes."),
    }
    return mapping.get(complexity, (3, "Complexity is moderate."))


def calculate_clarity_rating(clarity: int) -> Tuple[int, str]:
    """
    Lower clarity increases both probability and impact.
    """
    mapping = {
        1: (5, "Requirements are very unclear, creating major risk."),
        2: (4, "Low clarity increases the chance of rework and issues."),
        3: (3, "Moderate clarity creates some uncertainty."),
        4: (2, "Good clarity reduces uncertainty."),
        5: (1, "Very clear requirements reduce delivery risk."),
    }
    return mapping.get(clarity, (3, "Clarity is moderate."))


def calculate_dependency_rating(dependency: int) -> Tuple[int, str]:
    """
    Higher dependency increases both probability and impact.
    """
    mapping = {
        1: (1, "Low dependency on third parties limits delivery risk."),
        2: (2, "Some dependencies exist but are manageable."),
        3: (3, "Moderate dependencies introduce risk."),
        4: (4, "High dependency increases delivery and operational risk."),
        5: (5, "Very high dependency can significantly affect delivery."),
    }
    return mapping.get(dependency, (3, "Dependency level is moderate."))


def risk_level_from_score(score: int) -> str:
    """
    Converts final display score (1-5) into a label.
    """
    if score == 1:
        return "Low risk"
    elif score == 2:
        return "Moderate risk"
    elif score == 3:
        return "Significant risk"
    elif score == 4:
        return "High risk"
    else:
        return "Critical risk"


def calculate_risk_score(
    *,
    overall_budget: float,
    remaining_budget: float,
    expertise: int,
    estimated_days: int,
    days_to_deadline: int,
    complexity: int,
    clarity: int,
    dependency: int,
) -> Dict[str, object]:
    """
    Consultancy-style Probability-Impact matrix model.
    """

    expertise_rating, expertise_reason = calculate_expertise_rating(expertise)
    schedule_rating, schedule_reason, schedule_scenarios = calculate_schedule_pressure_rating(
        estimated_days, days_to_deadline
    )
    complexity_rating, complexity_reason = calculate_complexity_rating(complexity)
    clarity_rating, clarity_reason = calculate_clarity_rating(clarity)
    dependency_rating, dependency_reason = calculate_dependency_rating(dependency)
    budget_rating, budget_reason = calculate_budget_rating(remaining_budget, overall_budget)

    probability_factors: Dict[str, Dict[str, object]] = {
        "expertise": {
            "rating": expertise_rating,
            "weight": 0.25,
            "reason": expertise_reason,
        },
        "schedule_pressure": {
            "rating": schedule_rating,
            "weight": 0.30,
            "reason": schedule_reason,
        },
        "clarity": {
            "rating": clarity_rating,
            "weight": 0.20,
            "reason": clarity_reason,
        },
        "dependency": {
            "rating": dependency_rating,
            "weight": 0.15,
            "reason": dependency_reason,
        },
        "complexity": {
            "rating": complexity_rating,
            "weight": 0.10,
            "reason": complexity_reason,
        },
    }

    probability_weighted = sum(
        factor["rating"] * factor["weight"] for factor in probability_factors.values()
    )
    probability_score = clamp_score(round_half_up(probability_weighted))

    probability_reasons: List[str] = [
        f"{name.replace('_', ' ').title()}: {data['reason']}"
        for name, data in probability_factors.items()
        if data["rating"] >= 3
    ]
    if not probability_reasons:
        probability_reasons.append("Overall probability remains low based on the factor matrix.")

    impact_factors: Dict[str, Dict[str, object]] = {
        "budget": {
            "rating": budget_rating,
            "weight": 0.30,
            "reason": budget_reason,
        },
        "complexity": {
            "rating": complexity_rating,
            "weight": 0.25,
            "reason": complexity_reason,
        },
        "clarity": {
            "rating": clarity_rating,
            "weight": 0.15,
            "reason": clarity_reason,
        },
        "dependency": {
            "rating": dependency_rating,
            "weight": 0.20,
            "reason": dependency_reason,
        },
        "schedule_impact": {
            "rating": schedule_rating,
            "weight": 0.10,
            "reason": schedule_reason,
        },
    }

    impact_weighted = sum(
        factor["rating"] * factor["weight"] for factor in impact_factors.values()
    )
    impact_score = clamp_score(round_half_up(impact_weighted))

    impact_reasons: List[str] = [
        f"{name.replace('_', ' ').title()}: {data['reason']}"
        for name, data in impact_factors.items()
        if data["rating"] >= 3
    ]
    if not impact_reasons:
        impact_reasons.append("Overall impact remains limited based on the factor matrix.")

    raw_risk_score = probability_score * impact_score
    overall_risk_score = round_half_up(raw_risk_score / 5)
    overall_risk_score = clamp_score(overall_risk_score)
    risk_level = risk_level_from_score(overall_risk_score)

    return {
        "probability_score": probability_score,
        "impact_score": impact_score,
        "raw_risk_score": raw_risk_score,
        "overall_risk_score": overall_risk_score,
        "risk_level": risk_level,
        "probability_reasons": probability_reasons,
        "impact_reasons": impact_reasons,
        "probability_factors": probability_factors,
        "impact_factors": impact_factors,
        "factor_ratings": {
            "expertise": expertise_rating,
            "schedule_pressure": schedule_rating,
            "budget": budget_rating,
            "complexity": complexity_rating,
            "clarity": clarity_rating,
            "dependency": dependency_rating,
        },
    }