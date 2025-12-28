// Odds Calculation Functions
// ===========================

// Calculate implied probability from decimal odds
function calculateImpliedProbability(decimalOdds) {
    if (decimalOdds > 0) {
        return (1.0 / decimalOdds) * 100.0;
    }
    return 0.0;
}

// Calculate average odds for an outcome
function calculateAverageOdds(outcome) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < 4; i++) {
        if (outcome.available[i]) {
            sum += outcome.odds[i];
            count++;
        }
    }
    outcome.averageOdds = count > 0 ? sum / count : 0;
}

// Calculate best odds for an outcome
function calculateBestOdds(outcome) {
    let bestOdds = 0;
    let bestIndex = -1;
    for (let i = 0; i < 4; i++) {
        if (outcome.available[i] && outcome.odds[i] > bestOdds) {
            bestOdds = outcome.odds[i];
            bestIndex = i;
        }
    }
    outcome.bestOdds = bestOdds;
    outcome.bestIndex = bestIndex;
}