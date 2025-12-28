// Soccer Match Predictor - Model Functions
// =========================================

// ======================
// CORRECT POISSON MODEL
// ======================

function applyDixonColesCorrection(homeExp, awayExp) {
    // Dixon-Coles τ parameter: typically -0.13 to -0.20 for soccer
    const tau = -0.15;
    
    // Calculate base Poisson probabilities
    const baseProbs = calculatePoissonProbabilities(homeExp, awayExp, 10);
    
    // Calculate adjustment factor for low-scoring games
    // The correction reduces probability of 0-0, 1-1, etc.
    const p00 = poissonPmf(0, homeExp) * poissonPmf(0, awayExp);
    const p01 = poissonPmf(0, homeExp) * poissonPmf(1, awayExp);
    const p10 = poissonPmf(1, homeExp) * poissonPmf(0, awayExp);
    const p11 = poissonPmf(1, homeExp) * poissonPmf(1, awayExp);
    
    // Apply correction
    const lambda = 1 - tau * homeExp * awayExp;
    
    // Adjust draw probability (0-0 and 1-1 are the main draws affected)
    const drawAdjustment = (p00 + p11) * tau * homeExp * awayExp;
    
    const correctedDraw = Math.max(0.05, baseProbs.draw + drawAdjustment);
    const drawChange = baseProbs.draw - correctedDraw;
    
    // Redistribute the change proportionally to home/away
    const totalNonDraw = baseProbs.home + baseProbs.away;
    const correctedHome = baseProbs.home + (drawChange * (baseProbs.home / totalNonDraw));
    const correctedAway = baseProbs.away + (drawChange * (baseProbs.away / totalNonDraw));
    
    // Normalize to ensure sum = 1.0
    const total = correctedHome + correctedDraw + correctedAway;
    
    return {
        home: correctedHome / total,
        draw: correctedDraw / total,
        away: correctedAway / total
    };
}

// Main model function with correct Poisson mathematics
function calculateModelProbabilities(homeTeam, awayTeam) {
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    if (!homeStats || !awayStats) {
        return { home: 0.33, draw: 0.33, away: 0.33, homeExp: 1.5, awayExp: 1.5 };
    }
    
    // 1. CALCULATE LEAGUE AVERAGES DYNAMICALLY
    const leagueStats = calculateLeagueAverages(teamData);
    const avgGoalsPerTeam = leagueStats.avgGoalsPerTeam;
    const avgxGPerGame = leagueStats.avgxGPerGame;
    const avgxGAPerGame = leagueStats.avgxGAPerGame;
    
    // 2. CONVERT SEASON TOTALS TO PER-GAME AVERAGES
    const homeMP = Math.max(homeStats.MP || 1, 1);
    const awayMP = Math.max(awayStats.MP || 1, 1);
    
    const homexGPerGame = (homeStats.xG || 0) / homeMP;
    const homexGAPerGame = (homeStats.xGA || 0) / homeMP;
    const awayxGPerGame = (awayStats.xG || 0) / awayMP;
    const awayxGAPerGame = (awayStats.xGA || 0) / awayMP;
    
    // 3. CALCULATE ATTACK/DEFENSE STRENGTHS RELATIVE TO LEAGUE AVERAGE
    // Attack strength: how much better/worse than average at scoring
    const homeAttackStrength = homexGPerGame / Math.max(avgxGPerGame, 0.1);
    const awayAttackStrength = awayxGPerGame / Math.max(avgxGPerGame, 0.1);
    
    // FIX: Defense weakness (higher = worse defense, more goals conceded)
    // This is the correct way to represent defensive ability
    const homeDefenseWeakness = homexGAPerGame / Math.max(avgxGAPerGame, 0.1);
    const awayDefenseWeakness = awayxGAPerGame / Math.max(avgxGAPerGame, 0.1);
    
    // 4. HOME ADVANTAGE FACTOR (empirically 1.20-1.30 depending on league)
    const homeAdvantage = 1.25; // 25% boost for home team
    const homeExp = avgGoalsPerTeam * homeAttackStrength * awayDefenseWeakness * homeAdvantage;
    const awayExp = avgGoalsPerTeam * awayAttackStrength * homeDefenseWeakness;
    
    console.log('=== CORRECTED Expected Goals Calculation ===');
    console.log(`Home ${homeTeam}:`);
    console.log(`  Formula: ${avgGoalsPerTeam.toFixed(2)} × ${homeAttackStrength.toFixed(2)} × ${awayDefenseWeakness.toFixed(2)} × ${homeAdvantage.toFixed(2)}`);
    console.log(`  Result: ${homeExp.toFixed(2)} xG`);
    console.log(`Away ${awayTeam}:`);
    console.log(`  Formula: ${avgGoalsPerTeam.toFixed(2)} × ${awayAttackStrength.toFixed(2)} × ${homeDefenseWeakness.toFixed(2)}`);
    console.log(`  Result: ${awayExp.toFixed(2)} xG`);
    
    // 6. CALCULATE BASE POISSON PROBABILITIES
    const baseProbs = calculatePoissonProbabilities(homeExp, awayExp, 10);
    
    // 7. APPLY DIXON-COLES CORRECTION (only this adjustment)
    const correctedProbs = applyDixonColesCorrection(homeExp, awayExp);
    
    console.log('Probabilities:', {
        base: {
            home: (baseProbs.home * 100).toFixed(1) + '%',
            draw: (baseProbs.draw * 100).toFixed(1) + '%',
            away: (baseProbs.away * 100).toFixed(1) + '%'
        },
        afterDixonColes: {
            home: (correctedProbs.home * 100).toFixed(1) + '%',
            draw: (correctedProbs.draw * 100).toFixed(1) + '%',
            away: (correctedProbs.away * 100).toFixed(1) + '%'
        }
    });
    
    return {
        home: correctedProbs.home,
        draw: correctedProbs.draw,
        away: correctedProbs.away,
        homeExp: homeExp,
        awayExp: awayExp,
        leagueAverages: leagueStats
    };
}

// ======================
// PREDICTION GENERATION
// ======================

function generatePrediction() {
    console.log('=== GENERATE PREDICTION STARTED ===');
    console.log('Home Team:', document.getElementById('homeTeam').value);
    console.log('Away Team:', document.getElementById('awayTeam').value);
    console.log('Home Odds:', document.getElementById('homeOdds').value);
    console.log('Draw Odds:', document.getElementById('drawOdds').value);
    console.log('Away Odds:', document.getElementById('awayOdds').value);
    console.log('Weight:', document.getElementById('modelWeight').value);
    
    const homeTeam = document.getElementById('homeTeam').value;
    const awayTeam = document.getElementById('awayTeam').value;
    
    if (!homeTeam || !awayTeam) {
        showNotification('Please select both home and away teams', 'error');
        return;
    }
    
    if (homeTeam === awayTeam) {
        showNotification('Home and away teams cannot be the same', 'error');
        return;
    }
    
    const homeOdds = document.getElementById('homeOdds').value;
    const drawOdds = document.getElementById('drawOdds').value;
    const awayOdds = document.getElementById('awayOdds').value;
    const weight = parseFloat(document.getElementById('modelWeight').value);
    
    // Get stats for selected teams
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    if (!homeStats || !awayStats) {
        showNotification('Could not find team statistics', 'error');
        return;
    }
    
    // Check if teams have xG data
    if (!homeStats.xG || !homeStats.xGA || !awayStats.xG || !awayStats.xGA) {
        showNotification('Team statistics missing xG data. Results may be inaccurate.', 'warning');
    }
    
    // Calculate model probabilities
    const modelResult = calculateModelProbabilities(homeTeam, awayTeam);
    const modelProbs = {
        home: modelResult.home,
        draw: modelResult.draw,
        away: modelResult.away
    };

    // Get expected goals for display
    const adjustedHomeExp = modelResult.homeExp;
    const adjustedAwayExp = modelResult.awayExp;
    const leagueStats = modelResult.leagueAverages; // Get the league averages
    
    // Try to calculate betting probabilities
    let bettingProbs = calculateBettingProbabilities(homeOdds, drawOdds, awayOdds);
    let useBettingOdds = bettingProbs !== null;
    
    console.log('Betting probabilities:', bettingProbs);
    console.log('Use betting odds:', useBettingOdds);
    
    let finalHome, finalDraw, finalAway;
    
    if (useBettingOdds && weight < 1) {
        // Calculate hybrid probabilities
        const hybridHome = modelProbs.home * weight + bettingProbs.home * (1 - weight);
        const hybridDraw = modelProbs.draw * weight + bettingProbs.draw * (1 - weight);
        const hybridAway = modelProbs.away * weight + bettingProbs.away * (1 - weight);
        
        // Normalize
        const hybridTotal = hybridHome + hybridDraw + hybridAway;
        finalHome = hybridHome / hybridTotal;
        finalDraw = hybridDraw / hybridTotal;
        finalAway = hybridAway / hybridTotal;
        
        showNotification(`Using hybrid prediction (${weight * 100}% model, ${(1-weight) * 100}% betting odds)`, 'info');
    } else {
        // Use model only
        finalHome = modelProbs.home;
        finalDraw = modelProbs.draw;
        finalAway = modelProbs.away;
        
        if (!useBettingOdds) {
            showNotification('Using statistical model only (no valid betting odds provided)', 'info');
        } else if (weight === 1) {
            showNotification('Using statistical model only (weight set to 1.0)', 'info');
        }
    }
    
    // Prepare betting probabilities for display (use null if not available)
    const displayBetHome = useBettingOdds ? bettingProbs.home : null;
    const displayBetDraw = useBettingOdds ? bettingProbs.draw : null;
    const displayBetAway = useBettingOdds ? bettingProbs.away : null;
    
    // Display organized results
    displayOrganizedPredictionResults(
        homeTeam, awayTeam, 
        modelProbs.home, modelProbs.draw, modelProbs.away,
        displayBetHome, displayBetDraw, displayBetAway,
        finalHome, finalDraw, finalAway,
        adjustedHomeExp, adjustedAwayExp,
        homeStats, awayStats,
        useBettingOdds
    );
}