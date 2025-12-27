// Soccer Match Predictor - Math/Calculation Functions
// ===================================================

// Calculate Poisson PMF with factorial optimization
function poissonPmf(k, lambda) {
    // For k=0, factorial is 1
    if (k === 0) {
        return Math.exp(-lambda);
    }
    
    // Calculate factorial more efficiently
    let fact = 1;
    for (let i = 2; i <= k; i++) {
        fact *= i;
    }
    
    return Math.pow(lambda, k) * Math.exp(-lambda) / fact;
}

// Convert American odds to decimal with better error handling
function americanToDecimal(odds) {
    if (!odds || typeof odds !== 'string') return null;
    
    const cleanOdds = odds.trim();
    
    // Handle empty string
    if (cleanOdds === '') return null;
    
    // Remove any + or - signs for parsing
    const sign = cleanOdds.charAt(0);
    const numStr = cleanOdds.substring(1);
    
    // Try to parse the number
    const num = parseFloat(numStr);
    
    if (isNaN(num)) {
        // Try parsing without sign (might be decimal odds)
        const decimalOdds = parseFloat(cleanOdds);
        return !isNaN(decimalOdds) && decimalOdds > 1 ? decimalOdds : null;
    }
    
    if (sign === '+') {
        return num / 100.0 + 1;
    } else if (sign === '-') {
        if (num === 0) return null; // Prevent division by zero
        return 100.0 / Math.abs(num) + 1;
    } else {
        // No sign, assume it's already decimal odds
        return num > 1 ? num : null;
    }
}

// Calculate Poisson probabilities
function calculatePoissonProbabilities(homeExp, awayExp, maxGoals = 10) {
    // Pre-calculate Poisson probabilities for efficiency
    const homeProbs = [];
    const awayProbs = [];
    
    for (let i = 0; i <= maxGoals; i++) {
        homeProbs[i] = poissonPmf(i, homeExp);
        awayProbs[i] = poissonPmf(i, awayExp);
    }
    
    let homeWin = 0, draw = 0, awayWin = 0;
    
    // Calculate probabilities for each scoreline
    for (let i = 0; i <= maxGoals; i++) {
        for (let j = 0; j <= maxGoals; j++) {
            const pScoreline = homeProbs[i] * awayProbs[j];
            
            if (i > j) {
                homeWin += pScoreline;
            } else if (i < j) {
                awayWin += pScoreline;
            } else {
                draw += pScoreline;
            }
        }
    }
    
    // Normalize probabilities (they should sum to approximately 1)
    const total = homeWin + draw + awayWin;
    
    return {
        home: homeWin / total,
        draw: draw / total,
        away: awayWin / total
    };
}

// Calculate betting probabilities from odds
function calculateBettingProbabilities(homeOdds, drawOdds, awayOdds) {
    // Check if we have at least one odds value
    const hasHomeOdds = homeOdds.trim() !== '';
    const hasDrawOdds = drawOdds.trim() !== '';
    const hasAwayOdds = awayOdds.trim() !== '';
    
    // If no odds provided at all, return null
    if (!hasHomeOdds && !hasDrawOdds && !hasAwayOdds) {
        return null;
    }
    
    // Try to convert each odds
    const homeDec = hasHomeOdds ? americanToDecimal(homeOdds) : null;
    const drawDec = hasDrawOdds ? americanToDecimal(drawOdds) : null;
    const awayDec = hasAwayOdds ? americanToDecimal(awayOdds) : null;
    
    // Check if we have at least one valid decimal odds
    const validOddsCount = [homeDec, drawDec, awayDec].filter(odds => odds !== null && odds > 1).length;
    
    if (validOddsCount === 0) {
        return null;
    }
    
    // Calculate implied probabilities
    const homeProb = homeDec ? 1.0 / homeDec : 0;
    const drawProb = drawDec ? 1.0 / drawDec : 0;
    const awayProb = awayDec ? 1.0 / awayDec : 0;
    
    const total = homeProb + drawProb + awayProb;
    
    // If total is 0 or very small, return null
    if (total <= 0.001) {
        return null;
    }
    
    // Normalize to remove bookmaker margin
    return {
        home: homeProb / total,
        draw: drawProb / total,
        away: awayProb / total
    };
}

// ======================
// LEAGUE STATS CALCULATION
// ======================

function calculateLeagueAverages(teamData) {
    if (!teamData || teamData.length === 0) {
        return {
            avgGoalsPerGame: 2.7,
            avgGoalsPerTeam: 1.35,
            avgxGPerGame: 1.5,
            avgxGAPerGame: 1.5
        };
    }
    
    // Calculate total matches and goals
    const totalMatchesPlayed = teamData.reduce((sum, team) => sum + (team.MP || 0), 0);
    const totalMatches = totalMatchesPlayed / 2;
    
    // Calculate total goals
    const totalGoalsScored = teamData.reduce((sum, team) => sum + (team.GF || 0), 0);
    
    // Calculate average xG and xGA per team per game
    let totalxGPerGame = 0;
    let totalxGAPerGame = 0;
    let validTeams = 0;
    
    teamData.forEach(team => {
        if (team.MP && team.MP > 0) {
            totalxGPerGame += (team.xG || 0) / team.MP;
            totalxGAPerGame += (team.xGA || 0) / team.MP;
            validTeams++;
        }
    });
    
    const avgGoalsPerGame = totalMatches > 0 ? totalGoalsScored / totalMatches : 2.7;
    const avgGoalsPerTeam = avgGoalsPerGame / 2;
    const avgxGPerGame = validTeams > 0 ? totalxGPerGame / validTeams : 1.35;
    const avgxGAPerGame = validTeams > 0 ? totalxGAPerGame / validTeams : 1.35;
    
    console.log('League Averages:', {
        totalMatches: totalMatches.toFixed(0),
        avgGoalsPerGame: avgGoalsPerGame.toFixed(2),
        avgGoalsPerTeam: avgGoalsPerTeam.toFixed(2),
        avgxGPerGame: avgxGPerGame.toFixed(2),
        avgxGAPerGame: avgxGAPerGame.toFixed(2)
    });
    
    return {
        avgGoalsPerGame,
        avgGoalsPerTeam,
        avgxGPerGame,
        avgxGAPerGame
    };
}