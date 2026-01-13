// Odds Utility Functions
// =================================================

// Parse odds input (supports American and decimal formats)
function parseOdds(oddsStr) {
    if (!oddsStr || oddsStr.trim() === '') {
        return 0;
    }
    
    oddsStr = oddsStr.trim();
    
    try {
        // Check if it's in American format (+150, -110)
        if (oddsStr.startsWith("+") || oddsStr.startsWith("-")) {
            const americanOdds = parseFloat(oddsStr);
            
            // Convert American to decimal odds
            if (americanOdds > 0) {
                // Positive odds: +100 → 2.00, +200 → 3.00
                return (americanOdds / 100.0) + 1.0;
            } else {
                // Negative odds: -110 → 1.909, -200 → 1.50
                return (100.0 / Math.abs(americanOdds)) + 1.0;
            }
        } else {
            // Already in decimal format (e.g., 2.50)
            return parseFloat(oddsStr);
        }
    } catch (e) {
        console.error("Error parsing odds:", oddsStr, e);
        return 0;
    }
}

// Convert decimal odds back to American format for display
function formatAmericanOdds(decimalOdds) {
    if (decimalOdds >= 2.0) {
        // Positive American odds
        const american = (decimalOdds - 1.0) * 100.0;
        return "+" + Math.round(american);
    } else if (decimalOdds > 1.0) {
        // Negative American odds
        const american = 100.0 / (decimalOdds - 1.0);
        return "-" + Math.round(american);
    } else {
        return "N/A";
    }
}
