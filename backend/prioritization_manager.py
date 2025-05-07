criteria_weights = {
    "impact": 0.4,
    "urgency": 0.3,
    "effort": 0.1,
    "confidence": 0.1,
    "risk": 0.1,
}


def calculate_priority_score(action, criteria_values, weights):
    """
    Calculates the priority score for an action based on criteria and weights.

    Args:
        action: The action being evaluated (can be a dictionary of relevant data).
        criteria_values: A dictionary of criteria values (e.g., {'impact': 0.8, 'urgency': 0.9, ...}).
        weights: A dictionary of weights for each criterion (e.g., {'impact': 0.4, 'urgency': 0.3, ...}).

    Returns:
        The priority score (a float).
    """
    score = 0
    for criterion, value in criteria_values.items():
        score += value * weights[criterion]
    return score