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

def format_factor_name(name: str) -> str:
    mapping = {
        "expertise": "Team expertise",
        "schedule_pressure": "Schedule pressure",
        "schedule_impact": "Schedule impact",
        "clarity": "Requirements clarity",
        "dependency": "External dependency",
        "complexity": "Project complexity",
        "budget": "Budget position",
    }
    return mapping.get(name, name.replace("_", " ").title())

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
        return 5, "The deadline has already passed, or no delivery time remains, creating an immediate schedule risk.", scenarios

    scenarios = calculate_schedule_scenarios(estimated_days)
    pressure = estimated_days / days_to_deadline

    if pressure <= 0.60:
        rating = 1
        reason = (
            f"Schedule pressure is low. The expected delivery time of {scenarios['expected_days']} days remains comfortably within the available timeframe."
        )
    elif pressure <= 0.85:
        rating = 2
        reason = (
            f"Schedule pressure is manageable. The expected delivery time of {scenarios['expected_days']} days is within the deadline, although flexibility is reduced."
        )
    elif pressure <= 1.00:
        rating = 3
        reason = (
            f"The schedule is tight. The expected delivery time of {scenarios['expected_days']} days is close to the available deadline, leaving limited room for delays."
        )
    elif pressure <= 1.25:
        rating = 4
        reason = (
            f"The schedule is under significant pressure. The expected delivery time of {scenarios['expected_days']} days is likely to exceed the available timeframe."
        )
    else:
        rating = 5
        reason = (
            f"The schedule is under severe pressure. The expected delivery time of {scenarios['expected_days']} days substantially exceeds the available deadline."
        )

    return rating, reason, scenarios


def calculate_budget_rating(remaining_budget: float, overall_budget: float) -> Tuple[int, str]:
    """
    Converts budget position into a 1-5 impact rating.
    Higher score = worse financial position / greater impact.
    """
    if overall_budget <= 0:
        return 5, "No valid overall budget is available, so financial impact cannot be assessed reliably."

    remaining_pct = (remaining_budget / overall_budget) * 100

    if remaining_budget < 0:
        return 5, "The project is already over budget, which creates a severe financial impact and reduces flexibility in delivery."
    elif remaining_pct < 5:
        return 4, "Very little budget contingency remains, so even small issues may have a significant impact on delivery."
    elif remaining_pct < 10:
        return 3, "Budget contingency is low, which limits flexibility if costs increase or unexpected work is required."
    elif remaining_pct < 20:
        return 2, "A moderate budget contingency remains, which provides some protection against additional cost pressure."
    else:
        return 1, "A healthy budget contingency remains, which reduces the likely financial impact of project issues."


def calculate_expertise_rating(expertise: int) -> Tuple[int, str]:
    """
    Lower expertise should increase probability of risk.
    User input is 1-5, but the returned rating is risk-oriented.
    """
    mapping = {
        1: (5, "The team has very limited relevant expertise, which greatly increases the likelihood of delays, errors, or delivery issues."),
        2: (4, "The team has low relevant expertise, which increases the chance of delivery problems and reliance on additional support."),
        3: (3, "The team has moderate expertise, so delivery appears feasible but some capability risk remains."),
        4: (2, "The team has good expertise, which reduces the likelihood of delivery issues."),
        5: (1, "The team has strong expertise, which significantly reduces the likelihood of delivery problems."),
    }
    return mapping.get(expertise, (3, "The team has moderate expertise, so some capability risk remains."))


def calculate_complexity_rating(complexity: int) -> Tuple[int, str]:
    """
    Higher complexity increases both probability and impact.
    """
    mapping = {
        1: (
            1,
            "The project has low complexity, so it is unlikely to create a significant delivery or operational impact."
        ),
        2: (
            2,
            "The project has a relatively low level of complexity, which adds only limited delivery risk."
        ),
        3: (
            3,
            "The project has a moderate level of complexity, which may increase the likelihood of delays during development, coordination, or testing."
        ),
        4: (
            4,
            "The project has high complexity, which increases the risk of delivery delays, integration issues, and operational challenges."
        ),
        5: (
            5,
            "The project has very high complexity, which could significantly affect delivery timelines, implementation quality, and overall project outcomes."
        ),
    }
    return mapping.get(
        complexity,
        (
            3,
            "The project has a moderate level of complexity, which may increase delivery risk."
        ),
    )


def calculate_clarity_rating(clarity: int) -> Tuple[int, str]:
    """
    Lower clarity increases both probability and impact.
    """
    mapping = {
        1: (
            5,
            "Requirements are very unclear, creating a strong risk of scope changes, rework, and misalignment during delivery."
        ),
        2: (
            4,
            "Requirements have low clarity, which increases the chance of misunderstandings, rework, and delays."
        ),
        3: (
            3,
            "Requirements are only moderately clear, so some uncertainty remains and may affect delivery efficiency."
        ),
        4: (
            2,
            "Requirements are mostly clear, which helps reduce uncertainty and supports more controlled delivery."
        ),
        5: (
            1,
            "Requirements are very clear, which reduces uncertainty and lowers delivery risk."
        ),
    }
    return mapping.get(
        clarity,
        (
            3,
            "Requirements are moderately clear, so some uncertainty remains."
        ),
    )


def calculate_dependency_rating(dependency: int) -> Tuple[int, str]:
    """
    Higher dependency increases both probability and impact.
    """
    mapping = {
        1: (
            1,
            "The project has minimal reliance on external parties, so dependency risk is low."
        ),
        2: (
            2,
            "The project includes a small number of external dependencies, but these are likely to be manageable."
        ),
        3: (
            3,
            "The project has a moderate level of dependency on external inputs, which may affect delivery if approvals, suppliers, or third-party actions are delayed."
        ),
        4: (
            4,
            "The project relies heavily on external parties, increasing the risk of delays and operational disruption."
        ),
        5: (
            5,
            "The project has very high external dependency, which could significantly affect delivery timelines and final outcomes."
        ),
    }
    return mapping.get(
        dependency,
        (
            3,
            "The project has a moderate level of dependency on external inputs."
        ),
    )


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
f"{format_factor_name(name)}: {data['reason']}"
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
f"{format_factor_name(name)}: {data['reason']}"
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
