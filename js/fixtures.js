// Soccer Match Predictor - Fixtures Page
// =================================================
// This file contains the EXACT SAME prediction logic from prediction.js
// The only difference is it automatically processes fixtures from fixtures.csv

// Global variables
let teamData = [];
let csvFile = null;
let selectedLeague = null;
let dynamicConfig = null;

/**
 * Calculate all model parameters dynamically from loaded team data
 * This replaces ALL hardcoded values with data-driven calculations
 */
function calculateDynamicConfiguration(teamData) {
    console.log('=== CALCULATING DYNAMIC CONFIGURATION ===');
    
    const config = {
        league: {
            name: selectedLeague,
            teamCount: teamData.length,
            avgGoalsPerGame: 0,
            avgGoalsPerTeam: 0,
            avgxGPerGame: 0,
            avgxGAPerGame: 0,
            totalMatches: 0
        },
        homeAdvantage: {
            homeAttackMultiplier: 1.25,
            homeDefenseMultiplier: 0.90,
            awayAttackMultiplier: 0.80,
            awayDefenseMultiplier: 1.10,
            calculatedFromData: false
        },
        formRating: {
            performanceThresholds: [],
            pointsThresholds: [],
            statusThresholds: {
                excellent: 7.5,
                good: 6.0,
                average: 4.0,
                poor: 2.5
            }
        },
        model: {
            dixonColesTau: -0.15,
            maxGoals: 10,
            minDrawProbability: 0.05,
            minGamesForSplit: 12,
            formFactorMin: 0.9,
            formFactorMax: 1.1
        }
    };
    
    // ========================================================================
    // 1. CALCULATE LEAGUE AVERAGES FROM ACTUAL DATA
    // ========================================================================
    let totalMatchesPlayed = 0;
    let totalGoalsScored = 0;
    let totalxG = 0;
    let totalxGA = 0;
    let validTeams = 0;
    
    teamData.forEach(team => {
        const matches = team.matches || team.MP || 0;
        if (matches > 0) {
            totalMatchesPlayed += matches;
            totalGoalsScored += (team.goals || team.GF || 0);
            totalxG += (team.xG || team.xg || 0);
            totalxGA += (team.xGA || team.xga || 0);
            validTeams++;
        }
    });
    
    const totalMatches = totalMatchesPlayed / 2;
    config.league.totalMatches = totalMatches;
    config.league.avgGoalsPerGame = totalMatches > 0 ? totalGoalsScored / totalMatches : 2.7;
    config.league.avgGoalsPerTeam = config.league.avgGoalsPerGame / 2;
    config.league.avgxGPerGame = validTeams > 0 ? totalxG / totalMatchesPlayed : 1.35;
    config.league.avgxGAPerGame = validTeams > 0 ? totalxGA / totalMatchesPlayed : 1.35;
    
    console.log('League Statistics:', {
        totalMatches: totalMatches.toFixed(0),
        avgGoalsPerGame: config.league.avgGoalsPerGame.toFixed(2),
        avgGoalsPerTeam: config.league.avgGoalsPerTeam.toFixed(2),
        avgxGPerGame: config.league.avgxGPerGame.toFixed(2),
        avgxGAPerGame: config.league.avgxGAPerGame.toFixed(2)
    });
    
    // ========================================================================
    // 2. CALCULATE HOME/AWAY MULTIPLIERS FROM ACTUAL DATA
    // ========================================================================
    let totalHomeXG = 0, totalHomeXGA = 0;
    let totalAwayXG = 0, totalAwayXGA = 0;
    let totalOverallXG = 0, totalOverallXGA = 0;
    let teamsWithSplits = 0;
    
    teamData.forEach(team => {
        const homeMP = team.Home_matches || team.Home_MP || 0;
        const awayMP = team.Away_matches || team.Away_MP || 0;
        const overallMP = team.matches || team.MP || 0;
        
        if (homeMP > 0 && awayMP > 0 && overallMP > 0) {
            totalHomeXG += (team.Home_xG || 0) / homeMP;
            totalHomeXGA += (team.Home_xGA || 0) / homeMP;
            totalAwayXG += (team.Away_xG || 0) / awayMP;
            totalAwayXGA += (team.Away_xGA || 0) / awayMP;
            totalOverallXG += (team.xG || team.xg || 0) / overallMP;
            totalOverallXGA += (team.xGA || team.xga || 0) / overallMP;
            teamsWithSplits++;
        }
    });
    
    if (teamsWithSplits > 0) {
        const avgHomeXG = totalHomeXG / teamsWithSplits;
        const avgHomeXGA = totalHomeXGA / teamsWithSplits;
        const avgAwayXG = totalAwayXG / teamsWithSplits;
        const avgAwayXGA = totalAwayXGA / teamsWithSplits;
        const avgOverallXG = totalOverallXG / teamsWithSplits;
        const avgOverallXGA = totalOverallXGA / teamsWithSplits;
        
        config.homeAdvantage.homeAttackMultiplier = Math.max(1.10, Math.min(1.45, avgHomeXG / avgOverallXG));
        config.homeAdvantage.homeDefenseMultiplier = Math.max(0.70, Math.min(1.00, avgHomeXGA / avgOverallXGA));
        config.homeAdvantage.awayAttackMultiplier = Math.max(0.65, Math.min(0.95, avgAwayXG / avgOverallXG));
        config.homeAdvantage.awayDefenseMultiplier = Math.max(1.00, Math.min(1.25, avgAwayXGA / avgOverallXGA));
        config.homeAdvantage.calculatedFromData = true;
        
        console.log('Home/Away Multipliers (calculated from data):', {
            homeAttack: config.homeAdvantage.homeAttackMultiplier.toFixed(3),
            homeDefense: config.homeAdvantage.homeDefenseMultiplier.toFixed(3),
            awayAttack: config.homeAdvantage.awayAttackMultiplier.toFixed(3),
            awayDefense: config.homeAdvantage.awayDefenseMultiplier.toFixed(3)
        });
    } else {
        console.log('No home/away splits available - using default multipliers');
    }
    
    // ========================================================================
    // 3. CALCULATE FORM RATING THRESHOLDS FROM DATA DISTRIBUTION
    // ========================================================================
    const performanceValues = [];
    const pointsPerMatchValues = [];
    
    teamData.forEach(team => {
        if (team.Recent_matches > 0) {
            const recentPerf = (team.Recent_xG || 0) / team.Recent_matches - 
                              (team.Recent_xGA || 0) / team.Recent_matches;
            performanceValues.push(recentPerf);
            
            if (team.Recent_points !== undefined) {
                pointsPerMatchValues.push(team.Recent_points / team.Recent_matches);
            }
        }
    });
    
    performanceValues.sort((a, b) => a - b);
    pointsPerMatchValues.sort((a, b) => a - b);
    
    if (performanceValues.length > 0) {
        const p75 = performanceValues[Math.floor(performanceValues.length * 0.75)];
        const p60 = performanceValues[Math.floor(performanceValues.length * 0.60)];
        const p40 = performanceValues[Math.floor(performanceValues.length * 0.40)];
        const p25 = performanceValues[Math.floor(performanceValues.length * 0.25)];
        
        config.formRating.performanceThresholds = [
            { name: 'excellent', min: p75, adjustment: 2 },
            { name: 'good', min: p60, max: p75, adjustment: 1 },
            { name: 'poor', min: p40, max: p25, adjustment: -1 },
            { name: 'veryPoor', max: p25, adjustment: -2 }
        ];
        
        console.log('Performance Thresholds:', {
            excellent: `>${p75.toFixed(2)}`,
            good: `${p60.toFixed(2)}-${p75.toFixed(2)}`,
            poor: `${p40.toFixed(2)}-${p25.toFixed(2)}`,
            veryPoor: `<${p25.toFixed(2)}`
        });
    }
    
    if (pointsPerMatchValues.length > 0) {
        const p75 = pointsPerMatchValues[Math.floor(pointsPerMatchValues.length * 0.75)];
        const p60 = pointsPerMatchValues[Math.floor(pointsPerMatchValues.length * 0.60)];
        const p40 = pointsPerMatchValues[Math.floor(pointsPerMatchValues.length * 0.40)];
        const p25 = pointsPerMatchValues[Math.floor(pointsPerMatchValues.length * 0.25)];
        
        config.formRating.pointsThresholds = [
            { name: 'excellent', min: p75, adjustment: 2 },
            { name: 'good', min: p60, max: p75, adjustment: 1 },
            { name: 'poor', max: p40, adjustment: -1 },
            { name: 'veryPoor', max: p25, adjustment: -2 }
        ];
        
        console.log('Points/Match Thresholds:', {
            excellent: `>${p75.toFixed(2)}`,
            good: `${p60.toFixed(2)}-${p75.toFixed(2)}`,
            poor: `<${p40.toFixed(2)}`,
            veryPoor: `<${p25.toFixed(2)}`
        });
    }
    
    // ========================================================================
    // 4. CALCULATE DIXON-COLES TAU FROM ACTUAL DRAW FREQUENCY
    // ========================================================================
    let totalDraws = 0;
    let totalGames = 0;
    
    teamData.forEach(team => {
        const matches = team.matches || team.MP || 0;
        const draws = team.draws || team.D || 0;
        if (matches > 0) {
            totalDraws += draws;
            totalGames += matches;
        }
    });
    
    const actualDrawRate = (totalDraws / 2) / (totalGames / 2);
    
    if (actualDrawRate > 0.30) {
        config.model.dixonColesTau = -0.18;
    } else if (actualDrawRate > 0.26) {
        config.model.dixonColesTau = -0.15;
    } else if (actualDrawRate > 0.22) {
        config.model.dixonColesTau = -0.13;
    } else {
        config.model.dixonColesTau = -0.10;
    }
    
    console.log('Dixon-Coles Parameter:', {
        actualDrawRate: (actualDrawRate * 100).toFixed(1) + '%',
        tau: config.model.dixonColesTau
    });
    
    // ========================================================================
    // 5. ADJUST MAX GOALS BASED ON LEAGUE SCORING
    // ========================================================================
    if (config.league.avgGoalsPerGame > 3.2) {
        config.model.maxGoals = 12;
    } else if (config.league.avgGoalsPerGame > 2.8) {
        config.model.maxGoals = 11;
    } else if (config.league.avgGoalsPerGame < 2.3) {
        config.model.maxGoals = 9;
    } else {
        config.model.maxGoals = 10;
    }
    
    // ========================================================================
    // 6. ADJUST FORM FACTOR RANGE BASED ON VARIANCE
    // ========================================================================
    if (performanceValues.length > 0) {
        const mean = performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length;
        const variance = performanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performanceValues.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev > 0.8) {
            config.model.formFactorMin = 0.85;
            config.model.formFactorMax = 1.15;
        } else if (stdDev > 0.5) {
            config.model.formFactorMin = 0.88;
            config.model.formFactorMax = 1.12;
        } else {
            config.model.formFactorMin = 0.90;
            config.model.formFactorMax = 1.10;
        }
        
        console.log('Form Factor Range:', {
            stdDev: stdDev.toFixed(3),
            range: `${config.model.formFactorMin.toFixed(2)}-${config.model.formFactorMax.toFixed(2)}`
        });
    }
    
    // ========================================================================
    // 7. CALCULATE MINIMUM GAMES FOR SPLIT CONFIDENCE
    // ========================================================================
    let avgHomeGames = 0;
    let teamsWithHome = 0;
    
    teamData.forEach(team => {
        const homeMP = team.Home_matches || team.Home_MP || 0;
        if (homeMP > 0) {
            avgHomeGames += homeMP;
            teamsWithHome++;
        }
    });
    
    avgHomeGames = teamsWithHome > 0 ? avgHomeGames / teamsWithHome : 10;
    config.model.minGamesForSplit = Math.max(5, Math.round(avgHomeGames * 0.6));
    
    console.log('Confidence Threshold:', {
        avgHomeGamesPlayed: avgHomeGames.toFixed(1),
        minGamesForFullConfidence: config.model.minGamesForSplit
    });
    
    console.log('=== DYNAMIC CONFIGURATION COMPLETE ===');
    return config;
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        
        const row = {};
        headers.forEach((header, index) => {
            if (index < values.length) {
                const value = values[index].trim().replace(/"/g, '');
                const numValue = parseFloat(value);
                row[header] = isNaN(numValue) ? value : numValue;
            }
        });
        
        const teamName = row.Squad || row.Team || row.team;
        if (teamName && teamName.trim() !== '' && teamName.trim() !== 'Team') {
            if (!row.Squad && teamName) {
                row.Squad = teamName;
            }
            data.push(row);
        }
    }
    
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function calculateTeamFormMetrics(teamDataArray) {
    const perfThresholds = dynamicConfig?.formRating.performanceThresholds || [
        { min: 0.5, adjustment: 2 },
        { min: 0.2, adjustment: 1 },
        { max: -0.2, adjustment: -1 },
        { max: -0.5, adjustment: -2 }
    ];
    
    const ptsThresholds = dynamicConfig?.formRating.pointsThresholds || [
        { min: 2.0, adjustment: 2 },
        { min: 1.5, adjustment: 1 },
        { max: 0.8, adjustment: -1 },
        { max: 0.5, adjustment: -2 }
    ];
    
    teamDataArray.forEach(team => {
        if (team.Recent_xG !== undefined && team.Recent_xGA !== undefined && 
            team.Recent_matches !== undefined && team.Recent_matches > 0) {
            
            team.Recent_xG_per_match = team.Recent_xG / team.Recent_matches;
            team.Recent_xGA_per_match = team.Recent_xGA / team.Recent_matches;
            team.Recent_form_performance = team.Recent_xG_per_match - team.Recent_xGA_per_match;
            
            if (team.Recent_points !== undefined) {
                team.Recent_points_per_match = team.Recent_points / team.Recent_matches;
            }
        }
        
        if (team.RecentHome_xG !== undefined && team.RecentHome_xGA !== undefined && 
            team.RecentHome_matches !== undefined && team.RecentHome_matches > 0) {
            team.RecentHome_xG_per_match = team.RecentHome_xG / team.RecentHome_matches;
            team.RecentHome_xGA_per_match = team.RecentHome_xGA / team.RecentHome_matches;
            team.RecentHome_form_performance = team.RecentHome_xG_per_match - team.RecentHome_xGA_per_match;
            
            if (team.RecentHome_points !== undefined) {
                team.RecentHome_points_per_match = team.RecentHome_points / team.RecentHome_matches;
            }
        }
        
        if (team.RecentAway_xG !== undefined && team.RecentAway_xGA !== undefined && 
            team.RecentAway_matches !== undefined && team.RecentAway_matches > 0) {
            team.RecentAway_xG_per_match = team.RecentAway_xG / team.RecentAway_matches;
            team.RecentAway_xGA_per_match = team.RecentAway_xGA / team.RecentAway_matches;
            team.RecentAway_form_performance = team.RecentAway_xG_per_match - team.RecentAway_xGA_per_match;
            
            if (team.RecentAway_points !== undefined) {
                team.RecentAway_points_per_match = team.RecentAway_points / team.RecentAway_matches;
            }
        }
        
        let formRating = 5.0;
        
        if (team.Recent_form_performance !== undefined) {
            for (const threshold of perfThresholds) {
                if (threshold.min !== undefined && team.Recent_form_performance >= threshold.min) {
                    formRating += threshold.adjustment;
                    break;
                } else if (threshold.max !== undefined && team.Recent_form_performance <= threshold.max) {
                    formRating += threshold.adjustment;
                    break;
                }
            }
        }
        
        if (team.Recent_points_per_match !== undefined) {
            for (const threshold of ptsThresholds) {
                if (threshold.min !== undefined && team.Recent_points_per_match >= threshold.min) {
                    formRating += threshold.adjustment;
                    break;
                } else if (threshold.max !== undefined && team.Recent_points_per_match <= threshold.max) {
                    formRating += threshold.adjustment;
                    break;
                }
            }
        }
        
        team.Form_rating = Math.max(0, Math.min(10, formRating));
        
        const statusThresholds = dynamicConfig?.formRating.statusThresholds || {
            excellent: 7.5,
            good: 6.0,
            average: 4.0,
            poor: 2.5
        };
        
        if (team.Form_rating >= statusThresholds.excellent) team.Form_status = 'Excellent';
        else if (team.Form_rating >= statusThresholds.good) team.Form_status = 'Good';
        else if (team.Form_rating >= statusThresholds.average) team.Form_status = 'Average';
        else if (team.Form_rating >= statusThresholds.poor) team.Form_status = 'Poor';
        else team.Form_status = 'Very Poor';
    });
    
    console.log('Calculated form metrics for all teams using dynamic thresholds');
}

function poissonPmf(k, lambda) {
    if (k === 0) {
        return Math.exp(-lambda);
    }
    
    let fact = 1;
    for (let i = 2; i <= k; i++) {
        fact *= i;
    }
    
    return Math.pow(lambda, k) * Math.exp(-lambda) / fact;
}

function calculatePoissonProbabilities(homeExp, awayExp, maxGoals = null) {
    if (maxGoals === null) {
        maxGoals = dynamicConfig?.model.maxGoals || 10;
    }
    
    const homeProbs = [];
    const awayProbs = [];
    
    for (let i = 0; i <= maxGoals; i++) {
        homeProbs[i] = poissonPmf(i, homeExp);
        awayProbs[i] = poissonPmf(i, awayExp);
    }
    
    let homeWin = 0, draw = 0, awayWin = 0;
    
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
    
    const total = homeWin + draw + awayWin;
    
    return {
        home: homeWin / total,
        draw: draw / total,
        away: awayWin / total
    };
}

function calculateFormWeight(recentMatches, minMatches = 5) {
    if (!recentMatches || recentMatches <= 0) return 0;
    return Math.min(1.0, Math.sqrt(recentMatches / minMatches));
}

function calculateLeagueAverages(teamDataArray) {
    if (dynamicConfig && dynamicConfig.league) {
        console.log('Using pre-calculated league averages from dynamic config');
        return {
            avgGoalsPerGame: dynamicConfig.league.avgGoalsPerGame,
            avgGoalsPerTeam: dynamicConfig.league.avgGoalsPerTeam,
            avgxGPerGame: dynamicConfig.league.avgxGPerGame,
            avgxGAPerGame: dynamicConfig.league.avgxGAPerGame
        };
    }
    
    if (!teamDataArray || teamDataArray.length === 0) {
        return {
            avgGoalsPerGame: 2.7,
            avgGoalsPerTeam: 1.35,
            avgxGPerGame: 1.5,
            avgxGAPerGame: 1.5
        };
    }
    
    const totalMatchesPlayed = teamDataArray.reduce((sum, team) => sum + (team.MP || team.matches || 0), 0);
    const totalMatches = totalMatchesPlayed / 2;
    const totalGoalsScored = teamDataArray.reduce((sum, team) => sum + (team.GF || team.goals || 0), 0);
    
    let totalxGPerGame = 0;
    let totalxGAPerGame = 0;
    let validTeams = 0;
    
    teamDataArray.forEach(team => {
        const matches = team.MP || team.matches || 0;
        if (matches > 0) {
            totalxGPerGame += (team.xG || team.xg || 0) / matches;
            totalxGAPerGame += (team.xGA || team.xga || 0) / matches;
            validTeams++;
        }
    });
    
    const avgGoalsPerGame = totalMatches > 0 ? totalGoalsScored / totalMatches : 2.7;
    const avgGoalsPerTeam = avgGoalsPerGame / 2;
    const avgxGPerGame = validTeams > 0 ? totalxGPerGame / validTeams : 1.35;
    const avgxGAPerGame = validTeams > 0 ? totalxGAPerGame / validTeams : 1.35;
    
    return {
        avgGoalsPerGame,
        avgGoalsPerTeam,
        avgxGPerGame,
        avgxGAPerGame
    };
}

function calculateDynamicMultipliers(teamDataArray) {
    if (dynamicConfig && dynamicConfig.homeAdvantage && dynamicConfig.homeAdvantage.calculatedFromData) {
        console.log('Using pre-calculated home/away multipliers from dynamic config');
        return {
            homeAttackMultiplier: dynamicConfig.homeAdvantage.homeAttackMultiplier,
            homeDefenseMultiplier: dynamicConfig.homeAdvantage.homeDefenseMultiplier,
            awayAttackMultiplier: dynamicConfig.homeAdvantage.awayAttackMultiplier,
            awayDefenseMultiplier: dynamicConfig.homeAdvantage.awayDefenseMultiplier
        };
    }
    
    let totalHomeXG = 0, totalHomeXGA = 0;
    let totalAwayXG = 0, totalAwayXGA = 0;
    let totalOverallXG = 0, totalOverallXGA = 0;
    let validTeams = 0;
    
    teamDataArray.forEach(team => {
        const homeMP = team.Home_MP || team.Home_matches || 0;
        const awayMP = team.Away_MP || team.Away_matches || 0;
        const overallMP = team.MP || team.matches || 0;
        
        if (homeMP > 0 && awayMP > 0 && overallMP > 0) {
            totalHomeXG += (team.Home_xG || 0) / homeMP;
            totalHomeXGA += (team.Home_xGA || 0) / homeMP;
            totalAwayXG += (team.Away_xG || 0) / awayMP;
            totalAwayXGA += (team.Away_xGA || 0) / awayMP;
            totalOverallXG += (team.xG || team.xg || 0) / overallMP;
            totalOverallXGA += (team.xGA || team.xga || 0) / overallMP;
            validTeams++;
        }
    });
    
    if (validTeams === 0) {
        console.log('No valid home/away split data - using default multipliers');
        return {
            homeAttackMultiplier: 1.25,
            homeDefenseMultiplier: 0.90,
            awayAttackMultiplier: 0.80,
            awayDefenseMultiplier: 1.10
        };
    }
    
    const avgHomeXG = totalHomeXG / validTeams;
    const avgHomeXGA = totalHomeXGA / validTeams;
    const avgAwayXG = totalAwayXG / validTeams;
    const avgAwayXGA = totalAwayXGA / validTeams;
    const avgOverallXG = totalOverallXG / validTeams;
    const avgOverallXGA = totalOverallXGA / validTeams;
    
    const bounded = {
        homeAttackMultiplier: Math.max(1.10, Math.min(1.45, avgHomeXG / avgOverallXG)),
        homeDefenseMultiplier: Math.max(0.70, Math.min(1.00, avgHomeXGA / avgOverallXGA)),
        awayAttackMultiplier: Math.max(0.65, Math.min(0.95, avgAwayXG / avgOverallXG)),
        awayDefenseMultiplier: Math.max(1.00, Math.min(1.25, avgAwayXGA / avgOverallXGA))
    };
    
    return bounded;
}

function calculateFormAdjustment(homeStats, awayStats) {
    const homeFormRating = homeStats.Form_rating || 5;
    const awayFormRating = awayStats.Form_rating || 5;
    
    const formMin = dynamicConfig?.model.formFactorMin || 0.9;
    const formMax = dynamicConfig?.model.formFactorMax || 1.1;
    const formRange = formMax - formMin;
    
    const homeRecentMatches = homeStats.Recent_matches || 0;
    const awayRecentMatches = awayStats.Recent_matches || 0;
    const homeFormWeight = calculateFormWeight(homeRecentMatches, 5);
    const awayFormWeight = calculateFormWeight(awayRecentMatches, 5);
    
    const baseFormFactor = 1.0;
    
    const homeAttackFormRaw = formMin + (homeFormRating / 10) * formRange;
    const awayAttackFormRaw = formMin + (awayFormRating / 10) * formRange;
    
    const homeDefenseFormRaw = formMax - ((homeFormRating / 10) * formRange);
    const awayDefenseFormRaw = formMax - ((awayFormRating / 10) * formRange);
    
    const homeAttackFactor = baseFormFactor + (homeAttackFormRaw - baseFormFactor) * homeFormWeight;
    const awayAttackFactor = baseFormFactor + (awayAttackFormRaw - baseFormFactor) * awayFormWeight;
    const homeDefenseFactor = baseFormFactor + (homeDefenseFormRaw - baseFormFactor) * homeFormWeight;
    const awayDefenseFactor = baseFormFactor + (awayDefenseFormRaw - baseFormFactor) * awayFormWeight;
    
    console.log('Form Adjustment (FIXED - attack AND defense):', {
        homeFormRating: homeFormRating.toFixed(1),
        awayFormRating: awayFormRating.toFixed(1),
        homeAttackFactor: homeAttackFactor.toFixed(3),
        awayAttackFactor: awayAttackFactor.toFixed(3),
        homeDefenseFactor: homeDefenseFactor.toFixed(3),
        awayDefenseFactor: awayDefenseFactor.toFixed(3)
    });
    
    return {
        homeAttackFactor,
        awayAttackFactor,
        homeDefenseFactor,
        awayDefenseFactor,
        homeFormWeight,
        awayFormWeight
    };
}

function getDixonColesCorrection(homeGoals, awayGoals, homeExp, awayExp, tau) {
    if (homeGoals === 0 && awayGoals === 0) {
        return 1 - homeExp * awayExp * tau;
    } else if (homeGoals === 0 && awayGoals === 1) {
        return 1 + homeExp * tau;
    } else if (homeGoals === 1 && awayGoals === 0) {
        return 1 + awayExp * tau;
    } else if (homeGoals === 1 && awayGoals === 1) {
        return 1 - tau;
    }
    return 1;
}

function applyDixonColesCorrection(homeExp, awayExp) {
    const tau = dynamicConfig?.model.dixonColesTau || -0.15;
    const maxGoals = dynamicConfig?.model.maxGoals || 10;
    
    console.log(`Using Dixon-Coles tau = ${tau} (${dynamicConfig ? 'from dynamic config' : 'default'})`);
    
    let homeWin = 0, draw = 0, awayWin = 0;
    let totalProb = 0;
    
    for (let i = 0; i <= maxGoals; i++) {
        for (let j = 0; j <= maxGoals; j++) {
            const baseProb = poissonPmf(i, homeExp) * poissonPmf(j, awayExp);
            const correction = getDixonColesCorrection(i, j, homeExp, awayExp, tau);
            const correctedProb = baseProb * correction;
            
            totalProb += correctedProb;
            
            if (i > j) {
                homeWin += correctedProb;
            } else if (i < j) {
                awayWin += correctedProb;
            } else {
                draw += correctedProb;
            }
        }
    }
    
    const normalizedHome = homeWin / totalProb;
    const normalizedDraw = draw / totalProb;
    const normalizedAway = awayWin / totalProb;
    
    console.log('Dixon-Coles Correction Applied:', {
        homeWin: (normalizedHome * 100).toFixed(1) + '%',
        draw: (normalizedDraw * 100).toFixed(1) + '%',
        awayWin: (normalizedAway * 100).toFixed(1) + '%'
    });
    
    return {
        home: normalizedHome,
        draw: normalizedDraw,
        away: normalizedAway
    };
}

function calculateTeamExpectedGoalsFixed(team, isHome, teamDataArray) {
    const stats = teamDataArray.find(t => t.Squad === team);
    if (!stats) return { xGPerGame: 1.35, xGAPerGame: 1.35, confidence: 0 };
    
    const MIN_GAMES_FOR_FULL_SPLIT = dynamicConfig?.model.minGamesForSplit || 12;
    const multipliers = calculateDynamicMultipliers(teamDataArray);
    
    const totalMP = Math.max(stats.MP || stats.matches || 1, 1);
    const overallxG = (stats.xG || stats.xg || 0) / totalMP;
    const overallxGA = (stats.xGA || stats.xga || 0) / totalMP;
    
    if (isHome) {
        const homeMP = Math.max(stats.Home_MP || stats.Home_matches || 0, 0);
        const homeConfidence = Math.min(homeMP / MIN_GAMES_FOR_FULL_SPLIT, 1.0);
        
        const homexG_home = homeMP > 0 ? (stats.Home_xG || 0) / homeMP : overallxG;
        const homexGA_home = homeMP > 0 ? (stats.Home_xGA || 0) / homeMP : overallxGA;
        
        let adjustedHomexG, adjustedHomexGA;
        
        if (homeConfidence >= 0.8) {
            adjustedHomexG = homexG_home;
            adjustedHomexGA = homexGA_home;
        } else {
            const multiplierEffect = 1 - homeConfidence;
            adjustedHomexG = homeConfidence * homexG_home + 
                           (1 - homeConfidence) * overallxG * 
                           (1 + (multipliers.homeAttackMultiplier - 1) * multiplierEffect);
            adjustedHomexGA = homeConfidence * homexGA_home + 
                            (1 - homeConfidence) * overallxGA * 
                            (1 + (multipliers.homeDefenseMultiplier - 1) * multiplierEffect);
        }
        
        return {
            xGPerGame: adjustedHomexG,
            xGAPerGame: adjustedHomexGA,
            confidence: homeConfidence
        };
    } else {
        const awayMP = Math.max(stats.Away_MP || stats.Away_matches || 0, 0);
        const awayConfidence = Math.min(awayMP / MIN_GAMES_FOR_FULL_SPLIT, 1.0);
        
        const awayxG_away = awayMP > 0 ? (stats.Away_xG || 0) / awayMP : overallxG;
        const awayxGA_away = awayMP > 0 ? (stats.Away_xGA || 0) / awayMP : overallxGA;
        
        let adjustedAwayxG, adjustedAwayxGA;
        
        if (awayConfidence >= 0.8) {
            adjustedAwayxG = awayxG_away;
            adjustedAwayxGA = awayxGA_away;
        } else {
            const multiplierEffect = 1 - awayConfidence;
            adjustedAwayxG = awayConfidence * awayxG_away + 
                           (1 - awayConfidence) * overallxG * 
                           (1 + (multipliers.awayAttackMultiplier - 1) * multiplierEffect);
            adjustedAwayxGA = awayConfidence * awayxGA_away + 
                            (1 - awayConfidence) * overallxGA * 
                            (1 + (multipliers.awayDefenseMultiplier - 1) * multiplierEffect);
        }
        
        return {
            xGPerGame: adjustedAwayxG,
            xGAPerGame: adjustedAwayxGA,
            confidence: awayConfidence
        };
    }
}

function calculateModelProbabilities(homeTeam, awayTeam, teamDataArray) {
    const homeStats = teamDataArray.find(t => t.Squad === homeTeam);
    const awayStats = teamDataArray.find(t => t.Squad === awayTeam);
    
    if (!homeStats || !awayStats) {
        return { home: 0.33, draw: 0.33, away: 0.33, homeExp: 1.5, awayExp: 1.5 };
    }
    
    const leagueStats = calculateLeagueAverages(teamDataArray);
    const avgGoalsPerTeam = leagueStats.avgGoalsPerTeam;
    const avgxGPerGame = leagueStats.avgxGPerGame;
    const avgxGAPerGame = leagueStats.avgxGAPerGame;

    const homeData = calculateTeamExpectedGoalsFixed(homeTeam, true, teamDataArray);
    const awayData = calculateTeamExpectedGoalsFixed(awayTeam, false, teamDataArray);
    
    console.log(`Home ${homeTeam} (confidence: ${(homeData.confidence * 100).toFixed(0)}%):`);
    console.log(`  xG/game: ${homeData.xGPerGame.toFixed(2)}, xGA/game: ${homeData.xGAPerGame.toFixed(2)}`);
    console.log(`Away ${awayTeam} (confidence: ${(awayData.confidence * 100).toFixed(0)}%):`);
    console.log(`  xG/game: ${awayData.xGPerGame.toFixed(2)}, xGA/game: ${awayData.xGAPerGame.toFixed(2)}`);
    
    const formAdjustment = calculateFormAdjustment(homeStats, awayStats);
    
    const homeAttackStrength = (homeData.xGPerGame / Math.max(avgxGPerGame, 0.1)) * 
                               formAdjustment.homeAttackFactor;
    const awayAttackStrength = (awayData.xGPerGame / Math.max(avgxGPerGame, 0.1)) * 
                               formAdjustment.awayAttackFactor;
    
    const homeDefenseWeakness = (homeData.xGAPerGame / Math.max(avgxGAPerGame, 0.1)) * 
                                formAdjustment.homeDefenseFactor;
    const awayDefenseWeakness = (awayData.xGAPerGame / Math.max(avgxGAPerGame, 0.1)) * 
                                formAdjustment.awayDefenseFactor;
    
    const homeExp = avgGoalsPerTeam * homeAttackStrength * awayDefenseWeakness;
    const awayExp = avgGoalsPerTeam * awayAttackStrength * homeDefenseWeakness;
    
    console.log('=== FIXED Expected Goals Calculation ===');
    console.log(`Home ${homeTeam}:`);
    console.log(`  Attack: ${homeAttackStrength.toFixed(3)} (form: ${formAdjustment.homeAttackFactor.toFixed(3)})`);
    console.log(`  vs Away Defense: ${awayDefenseWeakness.toFixed(3)} (form: ${formAdjustment.awayDefenseFactor.toFixed(3)})`);
    console.log(`  Result: ${homeExp.toFixed(2)} xG`);
    
    console.log(`Away ${awayTeam}:`);
    console.log(`  Attack: ${awayAttackStrength.toFixed(3)} (form: ${formAdjustment.awayAttackFactor.toFixed(3)})`);
    console.log(`  vs Home Defense: ${homeDefenseWeakness.toFixed(3)} (form: ${formAdjustment.homeDefenseFactor.toFixed(3)})`);
    console.log(`  Result: ${awayExp.toFixed(2)} xG`);
    
    const baseProbs = calculatePoissonProbabilities(homeExp, awayExp, 10);
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

function getFormColor(rating) {
    if (!rating) return '#757575';
    if (rating >= 7.5) return '#13ec5b';
    if (rating >= 6.0) return '#10b981';
    if (rating >= 4.0) return '#f59e0b';
    if (rating >= 2.5) return '#f97316';
    return '#ef4444';
}

// ============================================================================
// COPIED FROM prediction.js - END
// ============================================================================

// ============================================================================
// FIXTURES-SPECIFIC CODE
// ============================================================================

// Store league data for multiple leagues
const leagueDataStore = {};

// Initialize fixtures page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== FIXTURES PAGE INITIALIZED ===');
    await loadAndProcessFixtures();
});

async function loadAndProcessFixtures() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const fixturesContainer = document.getElementById('fixturesContainer');
    const noFixtures = document.getElementById('noFixtures');
    
    loadingIndicator.style.display = 'block';
    errorDisplay.style.display = 'none';
    fixturesContainer.innerHTML = '';
    noFixtures.style.display = 'none';
    
    try {
        // 1. Load fixtures.csv
        console.log('Loading fixtures.csv...');
        const fixturesResponse = await fetch('fixtures.csv');
        if (!fixturesResponse.ok) {
            throw new Error('Could not load fixtures.csv');
        }
        const fixturesText = await fixturesResponse.text();
        const fixtures = parseFixturesCSV(fixturesText);
        
        console.log(`Loaded ${fixtures.length} fixtures`);
        
        if (fixtures.length === 0) {
            noFixtures.style.display = 'block';
            loadingIndicator.style.display = 'none';
            return;
        }
        
        // 2. Identify unique leagues
        const uniqueLeagues = [...new Set(fixtures.map(f => f.league))];
        console.log('Unique leagues:', uniqueLeagues);
        
        // 3. Load data for each league
        for (const league of uniqueLeagues) {
            await loadLeagueData(league);
        }
        
        // 4. Generate predictions for each fixture
        for (const fixture of fixtures) {
            await generateFixturePrediction(fixture, fixturesContainer);
        }
        
        loadingIndicator.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading fixtures:', error);
        errorDisplay.style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message;
        loadingIndicator.style.display = 'none';
    }
}

function parseFixturesCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const fixtures = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        
        if (values.length >= 3) {
            const league = values[0].trim().replace(/"/g, '').toLowerCase().replace(/\s+/g, '');
            const homeTeam = values[1].trim().replace(/"/g, '');
            const awayTeam = values[2].trim().replace(/"/g, '');
            
            if (league && homeTeam && awayTeam) {
                fixtures.push({ league, homeTeam, awayTeam });
            }
        }
    }
    
    return fixtures;
}

async function loadLeagueData(league) {
    if (leagueDataStore[league]) {
        console.log(`League data for ${league} already loaded`);
        return;
    }
    
    const leagueFileMap = {
        'bundesliga': 'bundesligateams.csv',
        'premierleague': 'premierleagueteams.csv',
        'seriea': 'serieateams.csv',
        'laliga': 'laligateams.csv',
        'ligue1': 'ligue1teams.csv'
    };
    
    const filename = leagueFileMap[league];
    if (!filename) {
        throw new Error(`No CSV file configured for league: ${league}`);
    }
    
    console.log(`Loading ${filename}...`);
    const response = await fetch(filename);
    if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
    }
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    console.log(`Parsed ${data.length} teams from ${filename}`);
    
    // Calculate dynamic configuration FIRST (must happen before form metrics)
    selectedLeague = league;
    dynamicConfig = calculateDynamicConfiguration(data);
    
    // Calculate form metrics AFTER dynamic config is set
    calculateTeamFormMetrics(data);
    
    // Store in league data store
    leagueDataStore[league] = {
        teams: data,
        config: dynamicConfig
    };
    
    console.log(`League data for ${league} loaded and configured`);
}

async function generateFixturePrediction(fixture, container) {
    const { league, homeTeam, awayTeam } = fixture;
    
    // Get league data
    const leagueData = leagueDataStore[league];
    if (!leagueData) {
        console.error(`No data found for league: ${league}`);
        return;
    }
    
    // Set the global variables for this prediction
    teamData = leagueData.teams;
    dynamicConfig = leagueData.config;
    
    // Find team stats
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    if (!homeStats || !awayStats) {
        console.error(`Could not find team stats for ${homeTeam} vs ${awayTeam}`);
        return;
    }
    
    // Calculate prediction using exact same logic
    const modelResult = calculateModelProbabilities(homeTeam, awayTeam, teamData);
    
    // Create fixture card
    const fixtureCard = createFixtureCard(
        league,
        homeTeam,
        awayTeam,
        homeStats,
        awayStats,
        modelResult
    );
    
    container.appendChild(fixtureCard);
}

function createFixtureCard(league, homeTeam, awayTeam, homeStats, awayStats, modelResult) {
    const card = document.createElement('div');
    card.className = 'fixture-card';
    
    const homeFormRating = homeStats.Form_rating || 5;
    const awayFormRating = awayStats.Form_rating || 5;
    const formAdvantage = homeFormRating - awayFormRating;
    
    // Determine winner
    let winner = 'draw';
    let maxProb = modelResult.draw;
    if (modelResult.home > maxProb) {
        winner = 'home';
        maxProb = modelResult.home;
    }
    if (modelResult.away > maxProb) {
        winner = 'away';
        maxProb = modelResult.away;
    }
    
    let confidenceLevel = '';
    if (maxProb >= 0.7) confidenceLevel = 'High Confidence';
    else if (maxProb >= 0.5) confidenceLevel = 'Medium Confidence';
    else confidenceLevel = 'Low Confidence';
    
    const leagueNames = {
        'bundesliga': 'Bundesliga',
        'premierleague': 'Premier League',
        'seriea': 'Serie A',
        'laliga': 'La Liga',
        'ligue1': 'Ligue 1'
    };
    
    // Determine prediction text
    let predictionText = '';
    if (winner === 'home') {
        predictionText = `${(maxProb * 100).toFixed(1)}%<br>${homeTeam} Win`;
    } else if (winner === 'away') {
        predictionText = `${(maxProb * 100).toFixed(1)}%<br>${awayTeam} Win`;
    } else {
        predictionText = `${(maxProb * 100).toFixed(1)}%<br>Draw`;
    }
    
    card.innerHTML = `
        <!-- Header with League and Prediction -->
        <div class="fixture-header">
            <span class="league-badge league-${league}">
                <i class="fas fa-trophy"></i>
                ${leagueNames[league] || league}
            </span>
            <span class="prediction-badge">
                ${predictionText}
            </span>
        </div>
        
        <!-- Match Content -->
        <div class="fixture-content">
            <!-- Match Title -->
            <div class="match-title">${homeTeam} vs ${awayTeam}</div>
            
            <!-- Expected Goals -->
            <div class="expected-goals-display">
                <div class="expected-goals-label">Expected Goals:</div>
                <div class="expected-goals-value">${modelResult.homeExp.toFixed(1)} - ${modelResult.awayExp.toFixed(1)}</div>
            </div>
            
            <!-- Probabilities -->
            <div class="probabilities-grid">
                <div class="probability-item ${winner === 'home' ? 'winner' : ''}">
                    <div class="probability-label">${homeTeam} Win</div>
                    <div class="probability-value">${(modelResult.home * 100).toFixed(1)}%</div>
                </div>
                
                <div class="probability-item ${winner === 'draw' ? 'winner' : ''}">
                    <div class="probability-label">Draw</div>
                    <div class="probability-value">${(modelResult.draw * 100).toFixed(1)}%</div>
                </div>
                
                <div class="probability-item ${winner === 'away' ? 'winner' : ''}">
                    <div class="probability-label">${awayTeam} Win</div>
                    <div class="probability-value">${(modelResult.away * 100).toFixed(1)}%</div>
                </div>
            </div>
            
            <!-- Prediction Outcome -->
            <div class="prediction-outcome">
                <div class="outcome-text">
                    Prediction: ${winner === 'home' ? `${homeTeam} Win` : winner === 'away' ? `${awayTeam} Win` : 'Draw'}
                </div>
                <div class="confidence-text">${confidenceLevel} • ${(maxProb * 100).toFixed(1)}% Probability</div>
            </div>
        </div>
        
        <!-- Recent Form Section -->
        <div class="form-section">
            <div class="form-title">
                <i class="fas fa-chart-line"></i>
                Recent Form (Last 5 Matches)
            </div>
            
            <div class="form-comparison">
                <!-- Home Team Form -->
                <div class="form-team home">
                    <div class="form-team-name">${homeTeam}</div>
                    <div class="form-stat">
                        <span class="form-stat-label">Form:</span>
                        <span class="form-stat-value form-${(homeStats.Form_status || 'Average').toLowerCase().replace(' ', '-')}">${homeStats.Form_status || 'Average'}</span>
                    </div>
                    <div class="form-stat">
                        <span class="form-stat-label">xG/match:</span>
                        <span class="form-stat-value">${(homeStats.Recent_xG_per_match || 0).toFixed(2)}</span>
                    </div>
                    <div class="form-stat">
                        <span class="form-stat-label">xGA/match:</span>
                        <span class="form-stat-value">${(homeStats.Recent_xGA_per_match || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- VS Divider with Form Advantage -->
                <div class="vs-divider">
                    <div class="vs-text">VS</div>
                    <div class="form-advantage-box">
                        <div class="form-advantage-value ${formAdvantage > 0 ? 'positive' : formAdvantage < 0 ? 'negative' : 'neutral'}">
                            ${formAdvantage > 0 ? '+' : ''}${formAdvantage.toFixed(1)}
                        </div>
                    </div>
                </div>
                
                <!-- Away Team Form -->
                <div class="form-team away">
                    <div class="form-team-name">${awayTeam}</div>
                    <div class="form-stat">
                        <span class="form-stat-label">Form:</span>
                        <span class="form-stat-value form-${(awayStats.Form_status || 'Average').toLowerCase().replace(' ', '-')}">${awayStats.Form_status || 'Average'}</span>
                    </div>
                    <div class="form-stat">
                        <span class="form-stat-label">xG/match:</span>
                        <span class="form-stat-value">${(awayStats.Recent_xG_per_match || 0).toFixed(2)}</span>
                    </div>
                    <div class="form-stat">
                        <span class="form-stat-label">xGA/match:</span>
                        <span class="form-stat-value">${(awayStats.Recent_xGA_per_match || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}
