// Soccer Match Predictor - Combined JavaScript Files
// =================================================

// --------------------------------------------------------------------
// prediction-main.js - Main Entry Point
// --------------------------------------------------------------------

// Global variables
let teamData = [];
let csvFile = null;
let selectedLeague = null;

// ============================================================================
// DYNAMIC CONFIGURATION MODULE
// ============================================================================

// Global variable to store dynamically calculated configuration
let dynamicConfig = null;

// Dynamic Configuration Function
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
    
    // Each match involves 2 teams, so divide by 2 to get actual match count
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
        
        // Calculate multipliers with bounds
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
        console.log('Ã¢Å¡ Ã¯Â¸Â No home/away splits available - using default multipliers');
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
    
    // Calculate percentiles for thresholds
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
    
    // Each draw is counted twice (once per team)
    const actualDrawRate = (totalDraws / 2) / (totalGames / 2);
    
    // Adjust tau based on draw rate
    // Higher draw rates require more negative tau (reduces 0-0, 1-1 probability)
    // Lower draw rates require less negative tau
    if (actualDrawRate > 0.30) {
        config.model.dixonColesTau = -0.18; // High draw rate leagues
    } else if (actualDrawRate > 0.26) {
        config.model.dixonColesTau = -0.15; // Average
    } else if (actualDrawRate > 0.22) {
        config.model.dixonColesTau = -0.13; // Lower draw rate
    } else {
        config.model.dixonColesTau = -0.10; // Very low draw rate
    }
    
    console.log('Dixon-Coles Parameter:', {
        actualDrawRate: (actualDrawRate * 100).toFixed(1) + '%',
        tau: config.model.dixonColesTau
    });
    
    // ========================================================================
    // 5. ADJUST MAX GOALS BASED ON LEAGUE SCORING
    // ========================================================================
    if (config.league.avgGoalsPerGame > 3.2) {
        config.model.maxGoals = 12; // High scoring league
    } else if (config.league.avgGoalsPerGame > 2.8) {
        config.model.maxGoals = 11;
    } else if (config.league.avgGoalsPerGame < 2.3) {
        config.model.maxGoals = 9; // Low scoring league
    } else {
        config.model.maxGoals = 10; // Standard
    }
    
    // ========================================================================
    // 6. ADJUST FORM FACTOR RANGE BASED ON VARIANCE
    // ========================================================================
    if (performanceValues.length > 0) {
        const mean = performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length;
        const variance = performanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performanceValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Higher variance requires a wider form factor range
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
    // Based on average games played in home/away splits
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
    // Set threshold to 60% of average home games played
    config.model.minGamesForSplit = Math.max(5, Math.round(avgHomeGames * 0.6));
    
    console.log('Confidence Threshold:', {
        avgHomeGamesPlayed: avgHomeGames.toFixed(1),
        minGamesForFullConfidence: config.model.minGamesForSplit
    });
    
    console.log('=== DYNAMIC CONFIGURATION COMPLETE ===');
    return config;
}

// League names mapping
const LEAGUE_NAMES = {
    laliga: "La Liga",
    premierleague: "Premier League",
    seriea: "Serie A",
    bundesliga: "Bundesliga",
    ligue1: "Ligue 1",
    custom: "Custom CSV"
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupFileUploads();
    updateWeightDisplay();
    setupAutoProcessing();
    
    // Load from localStorage if available
    loadFromLocalStorage();
    
    // Set up weight slider listener
    const modelWeight = document.getElementById('modelWeight');
    modelWeight.addEventListener('input', updateWeightDisplay);
    
    document.getElementById('predictBtn').addEventListener('click', generatePrediction);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    
    // Set up team selection listeners
    document.getElementById('homeTeam').addEventListener('change', updateTeamDisplays);
    document.getElementById('awayTeam').addEventListener('change', updateTeamDisplays);
    
    // Set up file change listener for custom CSV
    document.getElementById('csvFile').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            csvFile = e.target.files[0];
            updateFileList(document.getElementById('fileList'), csvFile);
            
            if (selectedLeague === 'custom') {
                // Auto-process custom CSV file
                setTimeout(() => processSelectedLeague(), 500);
            }
        }
    });
});

// --------------------------------------------------------------------
// prediction-data.js - Data Processing Functions
// --------------------------------------------------------------------

async function processCSVData() {
    console.log('=== PROCESS CSV DATA STARTED ===');
    console.log('Selected League:', selectedLeague);
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        let csvText;
        let fileName = '';
        
        if (selectedLeague === 'custom') {
            // Read and parse the custom CSV file
            if (!csvFile) {
                throw new Error('No CSV file uploaded for custom data');
            }
            csvText = await readFile(csvFile);
            fileName = csvFile.name;
            console.log('Using custom CSV file:', fileName);
        } else {
            // Load CSV file from server based on selected league
            const fileMap = {
                laliga: 'laligateams.csv',
                premierleague: 'premierleagueteams.csv',
                seriea: 'serieateams.csv',
                bundesliga: 'bundesligateams.csv',
                ligue1: 'ligue1teams.csv'
            };
            
            fileName = fileMap[selectedLeague];
            if (!fileName) {
                throw new Error(`No CSV file configured for ${LEAGUE_NAMES[selectedLeague]}`);
            }
            
            console.log(`Fetching CSV file: ${fileName}`);
            // Fetch the CSV file from server
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}. Make sure:
                1. The file exists in the same folder
                2. You are running from a local server (not file://)
                3. File name is exactly: ${fileName}`);
            }
            csvText = await response.text();
            console.log(`Successfully loaded ${fileName}`);
        }
        
        teamData = parseCSV(csvText);
        console.log(`Parsed ${teamData.length} teams from ${fileName}`);
        
        // Validate data
        if (teamData.length === 0) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
        // Check for required columns - handle both 'Squad' and 'Team' columns
        const hasSquadColumn = teamData[0].Squad !== undefined;
        const hasTeamColumn = teamData[0].Team !== undefined;
        
        if (!hasSquadColumn && !hasTeamColumn) {
            throw new Error('CSV file must contain either "Squad" or "Team" column for team names');
        }
        
        // If we have Team column but not Squad, rename it
        if (!hasSquadColumn && hasTeamColumn) {
            teamData.forEach(team => {
                team.Squad = team.Team;
            });
            console.log('Renamed "Team" column to "Squad" for compatibility');
        }
        
        // Check for xG data
        const sampleTeam = teamData[0];
        const missingColumns = [];
        if (!sampleTeam.xG && !sampleTeam.xg) missingColumns.push('xG');
        if (!sampleTeam.xGA && !sampleTeam.xga) missingColumns.push('xGA');
        
        if (missingColumns.length > 0) {
            showNotification(`Warning: Missing expected columns: ${missingColumns.join(', ')}. Results may be inaccurate.`, 'warning');
        }
        
        // Calculate dynamic configuration from loaded data FIRST (must happen before form metrics)
        try {
            dynamicConfig = calculateDynamicConfiguration(teamData);
        } catch (error) {
            console.warn('Error calculating dynamic configuration:', error);
            // Use default configuration
            dynamicConfig = null;
        }

        // Calculate additional form metrics AFTER dynamic config is set
        calculateTeamFormMetrics();

        // Populate team dropdowns (both from the same data)
        populateTeamDropdowns();

        // Update data status
        updateDataStatus();
        
        // Enable predict button and dropdowns
        document.getElementById('predictBtn').disabled = false;
        document.getElementById('homeTeam').disabled = false;
        document.getElementById('awayTeam').disabled = false;
        
        // Update data status
        updateDataStatus();

        // Display dynamic configuration summary
        if (dynamicConfig) {
            console.log('=== ACTIVE CONFIGURATION ===');
            console.log('League:', dynamicConfig.league.name || 'Custom');
            console.log('Avg Goals/Game:', dynamicConfig.league.avgGoalsPerGame.toFixed(2));
            console.log('Dixon-Coles Tau:', dynamicConfig.model.dixonColesTau);
            console.log('Home Advantage:', {
                attack: (dynamicConfig.homeAdvantage.homeAttackMultiplier * 100 - 100).toFixed(1) + '%',
                defense: (100 - dynamicConfig.homeAdvantage.homeDefenseMultiplier * 100).toFixed(1) + '%'
            });
        }
        
        // Save to localStorage
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Error processing CSV data:', error);
        showNotification(`Error: ${error.message}`, 'error');
        
        // Reset state
        resetDataState();
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    }
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Handle different line endings and quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle quoted values with commas
        const values = parseCSVLine(line);
        
        const row = {};
        headers.forEach((header, index) => {
            if (index < values.length) {
                const value = values[index].trim().replace(/"/g, '');
                // Try to parse as number if possible
                const numValue = parseFloat(value);
                row[header] = isNaN(numValue) ? value : numValue;
            }
        });
        
        // Only add if we have at least a team name
        const teamName = row.Squad || row.Team || row.team;
        if (teamName && teamName.trim() !== '' && teamName.trim() !== 'Team') {
            // Ensure we have Squad column for consistency
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

function calculateTeamFormMetrics() {
    // Use dynamic config if available, otherwise use defaults
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
    
    teamData.forEach(team => {
        // Calculate recent form metrics
        if (team.Recent_xG !== undefined && team.Recent_xGA !== undefined && 
            team.Recent_matches !== undefined && team.Recent_matches > 0) {
            
            // Recent form xG/xGA per match
            team.Recent_xG_per_match = team.Recent_xG / team.Recent_matches;
            team.Recent_xGA_per_match = team.Recent_xGA / team.Recent_matches;
            
            // Recent form performance
            team.Recent_form_performance = team.Recent_xG_per_match - team.Recent_xGA_per_match;
            
            // Recent form momentum
            if (team.Recent_points !== undefined) {
                team.Recent_points_per_match = team.Recent_points / team.Recent_matches;
            }
        }
        
        // Calculate home recent form
        if (team.RecentHome_xG !== undefined && team.RecentHome_xGA !== undefined && 
            team.RecentHome_matches !== undefined && team.RecentHome_matches > 0) {
            team.RecentHome_xG_per_match = team.RecentHome_xG / team.RecentHome_matches;
            team.RecentHome_xGA_per_match = team.RecentHome_xGA / team.RecentHome_matches;
            team.RecentHome_form_performance = team.RecentHome_xG_per_match - team.RecentHome_xGA_per_match;
            
            if (team.RecentHome_points !== undefined) {
                team.RecentHome_points_per_match = team.RecentHome_points / team.RecentHome_matches;
            }
        }
        
        // Calculate away recent form
        if (team.RecentAway_xG !== undefined && team.RecentAway_xGA !== undefined && 
            team.RecentAway_matches !== undefined && team.RecentAway_matches > 0) {
            team.RecentAway_xG_per_match = team.RecentAway_xG / team.RecentAway_matches;
            team.RecentAway_xGA_per_match = team.RecentAway_xGA / team.RecentAway_matches;
            team.RecentAway_form_performance = team.RecentAway_xG_per_match - team.RecentAway_xGA_per_match;
            
            if (team.RecentAway_points !== undefined) {
                team.RecentAway_points_per_match = team.RecentAway_points / team.RecentAway_matches;
            }
        }
        
        // Calculate overall form rating using DYNAMIC thresholds
        let formRating = 5.0; // Base rating
        
        // Adjust based on recent performance - DYNAMIC
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
        
        // Adjust based on recent points - DYNAMIC
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
        
        // Cap rating between 0 and 10
        team.Form_rating = Math.max(0, Math.min(10, formRating));
        
        // Determine form status using DYNAMIC thresholds
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

// --------------------------------------------------------------------
// prediction-display.js - Results Display Functions
// --------------------------------------------------------------------

// ORGANIZED PREDICTION DISPLAY
function displayOrganizedPredictionResults(
    homeTeam, awayTeam, 
    modelHome, modelDraw, modelAway,
    betHome, betDraw, betAway,
    finalHome, finalDraw, finalAway,
    homeExp, awayExp,
    homeStats, awayStats,
    hasBettingOdds = false
) {
    const resultsDiv = document.getElementById('predictionContent');
    
    // Calculate form comparison
    const homeFormRating = homeStats.Form_rating || 5;
    const awayFormRating = awayStats.Form_rating || 5;
    const formAdvantage = homeFormRating - awayFormRating;
    
    // Determine final prediction
    let prediction, maxProb, confidenceColor;
    if (finalHome >= finalAway && finalHome >= finalDraw) {
        prediction = `${homeTeam} Win`;
        maxProb = finalHome;
        confidenceColor = '#13ec5b';
    } else if (finalAway >= finalHome && finalAway >= finalDraw) {
        prediction = `${awayTeam} Win`;
        maxProb = finalAway;
        confidenceColor = '#b71c1c';
    } else {
        prediction = "Draw";
        maxProb = finalDraw;
        confidenceColor = '#757575';
    }
    
    // Calculate confidence level
    let confidenceLevel = '';
    if (maxProb >= 0.7) confidenceLevel = 'High Confidence';
    else if (maxProb >= 0.5) confidenceLevel = 'Medium Confidence';
    else confidenceLevel = 'Low Confidence';
    
    // Format percentages
    const formatPercent = (value) => (value * 100).toFixed(1) + '%';
    
    // Create organized HTML structure with form analysis
    let html = `
        <!-- Match Header -->
        <div class="prediction-header">
            <div>
                <h3 class="prediction-title">${homeTeam} vs ${awayTeam}</h3>
                <p style="color: #a0a0a0; margin-top: 0.25rem;">Expected Goals: ${homeExp.toFixed(1)} - ${awayExp.toFixed(1)}</p>
            </div>
            <div class="prediction-confidence" style="background-color: ${confidenceColor}22; border: 1px solid ${confidenceColor}44;">
                ${formatPercent(maxProb)}
            </div>
        </div>
        
        <!-- Final Prediction -->
        <div class="prediction-card">
            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ffffff;">
                <i class="fas fa-bullseye" style="color: ${confidenceColor}; margin-right: 0.5rem;"></i>
                Final Prediction: ${prediction}
            </h4>
            <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                <span style="width: 100px; font-weight: 600; color: #ffffff;">Confidence:</span>
                <div style="flex: 1; background-color: rgba(255, 255, 255, 0.05); height: 20px; border-radius: 10px; overflow: hidden; margin: 0 1rem;">
                    <div style="width: ${maxProb * 100}%; height: 100%; position: relative; background-color: ${confidenceColor};">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: white; font-weight: 600; font-size: 0.85rem; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">${formatPercent(maxProb)}</span>
                    </div>
                </div>
                <span style="font-weight: 600; color: ${confidenceColor};">${confidenceLevel}</span>
            </div>
            <p style="color: #a0a0a0; font-size: 0.9rem; margin-top: 0.5rem;">
                Based on statistical analysis ${hasBettingOdds ? 'combined with market odds' : 'of team performance data'}.
            </p>
        </div>
        
        <!-- Recent Form Analysis -->
        <div class="prediction-card">
            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ffffff;">
                <i class="fas fa-chart-line" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                Recent Form Analysis (Last 5 Matches)
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center;">
                <!-- Home Team Recent Form -->
                <div>
                    <div style="font-weight: 600; color: #13ec5b; margin-bottom: 0.5rem;">${homeTeam}</div>
                    <div style="background-color: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Overall Form:</span>
                            <span style="font-weight: 600; color: ${getFormColor(homeStats.Form_rating)}">${homeStats.Form_status || 'Average'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent xG/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(homeStats.Recent_xG_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent xGA/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(homeStats.Recent_xGA_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent Points/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(homeStats.Recent_points_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #a0a0a0;">Form Rating:</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width: 60px; height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(homeStats.Form_rating || 5) * 10}%; height: 100%; background-color: ${getFormColor(homeStats.Form_rating)}; border-radius: 4px;"></div>
                                </div>
                                <span style="font-weight: 600; color: ${getFormColor(homeStats.Form_rating)}">${(homeStats.Form_rating || 5).toFixed(1)}/10</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Form Comparison -->
                <div style="text-align: center;">
                    <div style="font-weight: 600; color: #f59e0b; margin-bottom: 0.5rem;">Form Advantage</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${formAdvantage > 0 ? '#13ec5b' : formAdvantage < 0 ? '#b71c1c' : '#757575'};">
                        ${formAdvantage > 0 ? '+' : ''}${formAdvantage.toFixed(1)}
                    </div>
                    <div style="color: #a0a0a0; font-size: 0.8rem; margin-top: 0.25rem;">
                        ${formAdvantage > 0 ? homeTeam : formAdvantage < 0 ? awayTeam : 'Even'} in better form
                    </div>
                </div>
                
                <!-- Away Team Recent Form -->
                <div>
                    <div style="font-weight: 600; color: #b71c1c; margin-bottom: 0.5rem;">${awayTeam}</div>
                    <div style="background-color: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Overall Form:</span>
                            <span style="font-weight: 600; color: ${getFormColor(awayStats.Form_rating)}">${awayStats.Form_status || 'Average'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent xG/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(awayStats.Recent_xG_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent xGA/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(awayStats.Recent_xGA_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #a0a0a0;">Recent Points/match:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(awayStats.Recent_points_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #a0a0a0;">Form Rating:</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width: 60px; height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(awayStats.Form_rating || 5) * 10}%; height: 100%; background-color: ${getFormColor(awayStats.Form_rating)}; border-radius: 4px;"></div>
                                </div>
                                <span style="font-weight: 600; color: ${getFormColor(awayStats.Form_rating)}">${(awayStats.Form_rating || 5).toFixed(1)}/10</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Home/Away Form Split -->
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <h5 style="font-weight: 600; color: #ffffff; margin-bottom: 0.75rem;">Home/Away Form Split</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <!-- Home Team Home Form -->
                    <div style="background-color: rgba(19, 236, 91, 0.05); padding: 0.75rem; border-radius: 0.5rem;">
                        <div style="font-weight: 600; color: #13ec5b; font-size: 0.9rem; margin-bottom: 0.5rem;">${homeTeam} Home Form</div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="color: #a0a0a0;">xG:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(homeStats.RecentHome_xG_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 0.25rem;">
                            <span style="color: #a0a0a0;">xGA:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(homeStats.RecentHome_xGA_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 0.25rem;">
                            <span style="color: #a0a0a0;">Performance:</span>
                            <span style="font-weight: 600; color: ${(homeStats.RecentHome_form_performance || 0) > 0 ? '#13ec5b' : '#b71c1c'}">
                                ${(homeStats.RecentHome_form_performance || 0) > 0 ? '+' : ''}${(homeStats.RecentHome_form_performance || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Away Team Away Form -->
                    <div style="background-color: rgba(183, 28, 28, 0.05); padding: 0.75rem; border-radius: 0.5rem;">
                        <div style="font-weight: 600; color: #b71c1c; font-size: 0.9rem; margin-bottom: 0.5rem;">${awayTeam} Away Form</div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="color: #a0a0a0;">xG:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(awayStats.RecentAway_xG_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 0.25rem;">
                            <span style="color: #a0a0a0;">xGA:</span>
                            <span style="font-weight: 600; color: #ffffff;">${(awayStats.RecentAway_xGA_per_match || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 0.25rem;">
                            <span style="color: #a0a0a0;">Performance:</span>
                            <span style="font-weight: 600; color: ${(awayStats.RecentAway_form_performance || 0) > 0 ? '#13ec5b' : '#b71c1c'}">
                                ${(awayStats.RecentAway_form_performance || 0) > 0 ? '+' : ''}${(awayStats.RecentAway_form_performance || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    html += `
        <!-- Probability Breakdown -->
        <div class="prediction-card">
            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ffffff;">
                <i class="fas fa-chart-pie" style="color: #13ec5b; margin-right: 0.5rem;"></i>
                Probability Breakdown
            </h4>
            
            <!-- Probability Table -->
            <div class="probability-table-container">
                <div class="probability-table-title">
                    <i class="fas fa-table"></i>
                    Probability Breakdown
                </div>
                <table class="probability-table">
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>${homeTeam}</th>
                            <th>Draw</th>
                            <th>${awayTeam}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="model-row">
                            <td class="team-header">Model</td>
                            <td>${formatPercent(modelHome)}</td>
                            <td>${formatPercent(modelDraw)}</td>
                            <td>${formatPercent(modelAway)}</td>
                        </tr>
    `;
    
    // Add betting probabilities if available
    if (hasBettingOdds && betHome !== null && betDraw !== null && betAway !== null) {
        html += `
                        <tr class="betting-row">
                            <td class="team-header">Betting</td>
                            <td>${formatPercent(betHome)}</td>
                            <td>${formatPercent(betDraw)}</td>
                            <td>${formatPercent(betAway)}</td>
                        </tr>
        `;
    }
    
    html += `
                        <tr class="final-row">
                            <td class="team-header">Final</td>
                            <td>${formatPercent(finalHome)}</td>
                            <td>${formatPercent(finalDraw)}</td>
                            <td>${formatPercent(finalAway)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Team Statistics -->
        <div class="prediction-card">
            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ffffff;">
                <i class="fas fa-chart-bar" style="color: #13ec5b; margin-right: 0.5rem;"></i>
                Team Statistics Comparison
            </h4>
            
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Statistic</th>
                        <th>${homeTeam}</th>
                        <th>${awayTeam}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: rgba(19, 236, 91, 0.05);">
                        <td colspan="3" style="font-weight: 600; color: #13ec5b;">
                            <i class="fas fa-trophy" style="margin-right: 0.5rem;"></i>
                            Overall Season Statistics
                        </td>
                    </tr>
                    <tr>
                        <td>Matches Played</td>
                        <td>${homeStats.MP || homeStats.matches || '-'}</td>
                        <td>${awayStats.MP || awayStats.matches || '-'}</td>
                    </tr>
                    <tr>
                        <td>Wins</td>
                        <td>${homeStats.W || homeStats.wins || '-'}</td>
                        <td>${awayStats.W || awayStats.wins || '-'}</td>
                    </tr>
                    <tr>
                        <td>Draws</td>
                        <td>${homeStats.D || homeStats.draws || '-'}</td>
                        <td>${awayStats.D || awayStats.draws || '-'}</td>
                    </tr>
                    <tr>
                        <td>Losses</td>
                        <td>${homeStats.L || homeStats.loses || '-'}</td>
                        <td>${awayStats.L || awayStats.loses || '-'}</td>
                    </tr>
                    <tr>
                        <td>Goals For</td>
                        <td>${homeStats.GF || homeStats.goals || '-'}</td>
                        <td>${awayStats.GF || awayStats.goals || '-'}</td>
                    </tr>
                    <tr>
                        <td>Goals Against</td>
                        <td>${homeStats.GA || homeStats.ga || '-'}</td>
                        <td>${awayStats.GA || awayStats.ga || '-'}</td>
                    </tr>
                    <tr>
                        <td>Expected Goals (xG)</td>
                        <td>${homeStats.xG ? homeStats.xG.toFixed(1) : (homeStats.xg ? homeStats.xg.toFixed(1) : '-')}</td>
                        <td>${awayStats.xG ? awayStats.xG.toFixed(1) : (awayStats.xg ? awayStats.xg.toFixed(1) : '-')}</td>
                    </tr>
                    <tr>
                        <td>Expected Goals Against (xGA)</td>
                        <td>${homeStats.xGA ? homeStats.xGA.toFixed(1) : (homeStats.xga ? homeStats.xga.toFixed(1) : '-')}</td>
                        <td>${awayStats.xGA ? awayStats.xGA.toFixed(1) : (awayStats.xga ? awayStats.xga.toFixed(1) : '-')}</td>
                    </tr>
                    
                    <!-- Add Recent Form Statistics -->
                    <tr style="background-color: rgba(245, 158, 11, 0.05);">
                        <td colspan="3" style="font-weight: 600; color: #f59e0b;">
                            <i class="fas fa-chart-line" style="margin-right: 0.5rem;"></i>
                            Recent Form (Last 5 Matches)
                        </td>
                    </tr>
                    <tr>
                        <td>Recent Wins</td>
                        <td>${homeStats.Recent_wins || '-'}</td>
                        <td>${awayStats.Recent_wins || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent Draws</td>
                        <td>${homeStats.Recent_draws || '-'}</td>
                        <td>${awayStats.Recent_draws || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent Losses</td>
                        <td>${homeStats.Recent_loses || '-'}</td>
                        <td>${awayStats.Recent_loses || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent Goals</td>
                        <td>${homeStats.Recent_goals || '-'}</td>
                        <td>${awayStats.Recent_goals || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent Goals Against</td>
                        <td>${homeStats.Recent_ga || '-'}</td>
                        <td>${awayStats.Recent_ga || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent Points</td>
                        <td>${homeStats.Recent_points || '-'}</td>
                        <td>${awayStats.Recent_points || '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent xG</td>
                        <td>${homeStats.Recent_xG ? homeStats.Recent_xG.toFixed(1) : '-'}</td>
                        <td>${awayStats.Recent_xG ? awayStats.Recent_xG.toFixed(1) : '-'}</td>
                    </tr>
                    <tr>
                        <td>Recent xGA</td>
                        <td>${homeStats.Recent_xGA ? homeStats.Recent_xGA.toFixed(1) : '-'}</td>
                        <td>${awayStats.Recent_xGA ? awayStats.Recent_xGA.toFixed(1) : '-'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Insights Section -->
        <div class="prediction-card">
            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ffffff;">
                <i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                ${hasBettingOdds ? 'Betting Insights' : 'Statistical Analysis'}
            </h4>
            
            <div style="color: #a0a0a0; line-height: 1.6;">
    `;
    
    // Add form-based insights
    html += `
        <p><span style="color: #f59e0b; font-weight: 600;">Form Analysis:</span> `;
    
    if (formAdvantage > 1.5) {
        html += `${homeTeam} has significantly better recent form than ${awayTeam}. This could give them an edge in this match.`;
    } else if (formAdvantage > 0.5) {
        html += `${homeTeam} has slightly better recent form than ${awayTeam}.`;
    } else if (formAdvantage < -1.5) {
        html += `${awayTeam} has significantly better recent form than ${homeTeam}, which could overcome the home advantage.`;
    } else if (formAdvantage < -0.5) {
        html += `${awayTeam} has slightly better recent form than ${homeTeam}.`;
    } else {
        html += `Both teams have similar recent form. The match could be very competitive.`;
    }
    
    html += `</p>`;
    
    if (hasBettingOdds) {
        // Calculate value bet
        let valueBet = null;
        const homeOdds = document.getElementById('homeOdds').value || '';
        const drawOdds = document.getElementById('drawOdds').value || '';
        const awayOdds = document.getElementById('awayOdds').value || '';
        
        const homeImplied = homeOdds ? 1 / americanToDecimal(homeOdds) : 0;
        const drawImplied = drawOdds ? 1 / americanToDecimal(drawOdds) : 0;
        const awayImplied = awayOdds ? 1 / americanToDecimal(awayOdds) : 0;
        
        if (finalHome > homeImplied && homeImplied > 0) {
            valueBet = `${homeTeam} Win (Value: ${((finalHome/homeImplied - 1)*100).toFixed(1)}%)`;
        } else if (finalDraw > drawImplied && drawImplied > 0) {
            valueBet = `Draw (Value: ${((finalDraw/drawImplied - 1)*100).toFixed(1)}%)`;
        } else if (finalAway > awayImplied && awayImplied > 0) {
            valueBet = `${awayTeam} Win (Value: ${((finalAway/awayImplied - 1)*100).toFixed(1)}%)`;
        }
        
        if (valueBet) {
            html += `
                <p><span style="color: #13ec5b; font-weight: 600;">Value Bet Detected:</span> 
                Model suggests ${valueBet} offers positive expected value.</p>
            `;
        } else {
            html += `
                <p>Market odds appear efficient. No significant value bet detected.</p>
            `;
        }
        
        html += `
            <p style="margin-top: 1rem;">Model weight: ${(parseFloat(document.getElementById('modelWeight').value) * 100).toFixed(0)}% model, ${(100 - parseFloat(document.getElementById('modelWeight').value) * 100).toFixed(0)}% market odds</p>
            <p>Use the <a href="odds-analyzer.html" style="color: #13ec5b; font-weight: 600; text-decoration: none;">Odds Analyzer</a> to find the best available odds.</p>
        `;
    } else {
        html += `
            <p>This prediction is based purely on statistical analysis of team performance data using:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li>Poisson distribution for goal probabilities</li>
                <li>Expected Goals (xG) data analysis</li>
                <li>Recent form analysis from last 5 matches</li>
                <li>Team strength differential calculations</li>
                <li>Historical performance weighting</li>
            </ul>
            <p style="margin-top: 1rem;"><span style="color: #f59e0b; font-weight: 600;">Tip:</span> 
            Add betting odds to combine statistical model with market data for hybrid predictions.</p>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    document.getElementById('predictionResults').style.display = 'block';
    
    // Scroll to results smoothly
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Helper function to get color based on form rating
function getFormColor(rating) {
    if (!rating) return '#757575';
    if (rating >= 7.5) return '#13ec5b'; // Excellent - Green
    if (rating >= 6.0) return '#10b981'; // Good - Teal
    if (rating >= 4.0) return '#f59e0b'; // Average - Yellow
    if (rating >= 2.5) return '#f97316'; // Poor - Orange
    return '#ef4444'; // Very Poor - Red
}

// --------------------------------------------------------------------
// prediction-file.js - File Upload Functions
// --------------------------------------------------------------------

// Setup file upload functionality
function setupFileUploads() {
    // CSV upload
    const uploadArea = document.getElementById('csvUpload');
    const fileInput = document.getElementById('csvFile');
    const fileList = document.getElementById('fileList');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            csvFile = e.target.files[0];
            updateFileList(fileList, csvFile);
            showNotification('CSV file uploaded successfully', 'success');
            
            if (selectedLeague === 'custom') {
                // Auto-process custom CSV file
                setTimeout(() => processSelectedLeague(), 500);
            } else {
                // If a league is already selected, allow processing
                showNotification('Click "Generate Prediction" to process the uploaded file', 'info');
            }
        }
    });
    
    // Drag and drop functionality
    setupDragAndDrop(uploadArea, fileList);
}

function setupDragAndDrop(uploadArea, fileList) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                csvFile = file;
                updateFileList(fileList, file);
                showNotification('CSV file uploaded successfully', 'success');
                
                if (selectedLeague === 'custom') {
                    // Auto-process custom CSV file
                    setTimeout(() => processSelectedLeague(), 500);
                }
            } else {
                showNotification('Please upload a CSV file', 'error');
            }
        }
    }
}

function updateFileList(fileListElement, file) {
    const fileSize = (file.size / 1024).toFixed(2);
    fileListElement.innerHTML = `
        <div class="file-item">
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize} KB</div>
            </div>
            <i class="fas fa-check file-success"></i>
        </div>
    `;
}

// --------------------------------------------------------------------
// prediction-math.js - Math/Calculation Functions
// --------------------------------------------------------------------

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
        return num > 1 ? num : null;
    }
}

// Calculate Poisson probabilities
    function calculatePoissonProbabilities(homeExp, awayExp, maxGoals = null) {
    // Use dynamic maxGoals if not provided
    if (maxGoals === null) {
        maxGoals = dynamicConfig?.model.maxGoals || 10;
    }
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
// REGRESSION TO THE MEAN
// ======================

/**
 * Calculate weight for recent form based on sample size
 * Small samples get less weight to avoid overreacting to noise
 * @param {number} recentMatches - Number of recent matches
 * @param {number} minMatches - Minimum matches for full confidence (default: 5)
 * @returns {number} Weight between 0 and 1
 */
function calculateFormWeight(recentMatches, minMatches = 5) {
    if (!recentMatches || recentMatches <= 0) return 0;
    
    // Use square root to give some credit to small samples
    // but still regress significantly toward the mean
    return Math.min(1.0, Math.sqrt(recentMatches / minMatches));
}

// ======================
// LEAGUE STATS CALCULATION
// ======================

function calculateLeagueAverages(teamData) {
    // If dynamic config exists, use those values
    if (dynamicConfig && dynamicConfig.league) {
        console.log('Using pre-calculated league averages from dynamic config');
        return {
            avgGoalsPerGame: dynamicConfig.league.avgGoalsPerGame,
            avgGoalsPerTeam: dynamicConfig.league.avgGoalsPerTeam,
            avgxGPerGame: dynamicConfig.league.avgxGPerGame,
            avgxGAPerGame: dynamicConfig.league.avgxGAPerGame
        };
    }
    
    // Fallback calculation if dynamic config not available
    if (!teamData || teamData.length === 0) {
        return {
            avgGoalsPerGame: 2.7,
            avgGoalsPerTeam: 1.35,
            avgxGPerGame: 1.5,
            avgxGAPerGame: 1.5
        };
    }
    
    const totalMatchesPlayed = teamData.reduce((sum, team) => sum + (team.MP || team.matches || 0), 0);
    const totalMatches = totalMatchesPlayed / 2;
    const totalGoalsScored = teamData.reduce((sum, team) => sum + (team.GF || team.goals || 0), 0);
    
    let totalxGPerGame = 0;
    let totalxGAPerGame = 0;
    let validTeams = 0;
    
    teamData.forEach(team => {
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

// ======================
// CALCULATE DYNAMIC HOME ADVANTAGE FROM DATA
// ======================

function calculateDynamicMultipliers(teamData) {
    // If dynamic config exists, use those values
    if (dynamicConfig && dynamicConfig.homeAdvantage && dynamicConfig.homeAdvantage.calculatedFromData) {
        console.log('Using pre-calculated home/away multipliers from dynamic config');
        return {
            homeAttackMultiplier: dynamicConfig.homeAdvantage.homeAttackMultiplier,
            homeDefenseMultiplier: dynamicConfig.homeAdvantage.homeDefenseMultiplier,
            awayAttackMultiplier: dynamicConfig.homeAdvantage.awayAttackMultiplier,
            awayDefenseMultiplier: dynamicConfig.homeAdvantage.awayDefenseMultiplier
        };
    }
    
    // Fallback calculation if dynamic config not available
    let totalHomeXG = 0, totalHomeXGA = 0;
    let totalAwayXG = 0, totalAwayXGA = 0;
    let totalOverallXG = 0, totalOverallXGA = 0;
    let validTeams = 0;
    
    teamData.forEach(team => {
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

// ======================
// CALCULATE FORM-BASED ADJUSTMENT
// ======================

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
    
    // Attack form factors (high rating = better attack)
    const homeAttackFormRaw = formMin + (homeFormRating / 10) * formRange;
    const awayAttackFormRaw = formMin + (awayFormRating / 10) * formRange;
    
    // FIXED: Defense form factors (high rating = better defense = LOWER weakness)
    const homeDefenseFormRaw = formMax - ((homeFormRating / 10) * formRange);
    const awayDefenseFormRaw = formMax - ((awayFormRating / 10) * formRange);
    
    // Apply regression to mean for all factors
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

// --------------------------------------------------------------------
// prediction-model.js - Model Functions
// --------------------------------------------------------------------

// ======================
// CORRECT POISSON MODEL
// ======================

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

// Apply Dixon-Coles correction properly per scoreline
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

// Calculate team xG without double-counting home advantage
function calculateTeamExpectedGoalsFixed(team, isHome, teamData) {
    const stats = teamData.find(t => t.Squad === team);
    if (!stats) return { xGPerGame: 1.35, xGAPerGame: 1.35, confidence: 0 };
    
    const MIN_GAMES_FOR_FULL_SPLIT = dynamicConfig?.model.minGamesForSplit || 12;
    const multipliers = calculateDynamicMultipliers(teamData);
    
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

// 2. GET HOME/AWAY SPECIFIC DATA WITHOUT DOUBLE-COUNTING (FIXED)
    const homeData = calculateTeamExpectedGoalsFixed(homeTeam, true, teamData);
    const awayData = calculateTeamExpectedGoalsFixed(awayTeam, false, teamData);
    
    console.log(`Home ${homeTeam} (confidence: ${(homeData.confidence * 100).toFixed(0)}%):`);
    console.log(`  xG/game: ${homeData.xGPerGame.toFixed(2)}, xGA/game: ${homeData.xGAPerGame.toFixed(2)}`);
    console.log(`Away ${awayTeam} (confidence: ${(awayData.confidence * 100).toFixed(0)}%):`);
    console.log(`  xG/game: ${awayData.xGPerGame.toFixed(2)}, xGA/game: ${awayData.xGAPerGame.toFixed(2)}`);
    
    // 3. CALCULATE FORM-BASED ADJUSTMENT FOR ATTACK AND DEFENSE (FIXED)
    const formAdjustment = calculateFormAdjustment(homeStats, awayStats);
    
    // 4. CALCULATE ATTACK/DEFENSE STRENGTHS WITH FORM (FIXED)
    const homeAttackStrength = (homeData.xGPerGame / Math.max(avgxGPerGame, 0.1)) * 
                               formAdjustment.homeAttackFactor;
    const awayAttackStrength = (awayData.xGPerGame / Math.max(avgxGPerGame, 0.1)) * 
                               formAdjustment.awayAttackFactor;
    
    const homeDefenseWeakness = (homeData.xGAPerGame / Math.max(avgxGAPerGame, 0.1)) * 
                                formAdjustment.homeDefenseFactor;
    const awayDefenseWeakness = (awayData.xGAPerGame / Math.max(avgxGAPerGame, 0.1)) * 
                                formAdjustment.awayDefenseFactor;
    
    // 5. CALCULATE EXPECTED GOALS
    // Home advantage is already baked into Home_xG and Away_xG data, so no multiplier needed
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
    
    // 6. CALCULATE BASE POISSON PROBABILITIES
    const baseProbs = calculatePoissonProbabilities(homeExp, awayExp, 10);
    
    // 7. APPLY DIXON-COLES CORRECTION
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
    const homeHasXG = homeStats.xG || homeStats.xg;
    const homeHasXGA = homeStats.xGA || homeStats.xga;
    const awayHasXG = awayStats.xG || awayStats.xg;
    const awayHasXGA = awayStats.xGA || awayStats.xga;
    
    if (!homeHasXG || !homeHasXGA || !awayHasXG || !awayHasXGA) {
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

// --------------------------------------------------------------------
// prediction-stats.js - Team Stats and Display Functions
// --------------------------------------------------------------------

// ======================
// TEAM DISPLAY FUNCTIONS
// ======================

function updateTeamDisplays() {
    const homeTeam = document.getElementById('homeTeam').value;
    const awayTeam = document.getElementById('awayTeam').value;
    
    // Prevent selecting the same team for both home and away
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
        showNotification('Home and away teams cannot be the same. Please select different teams.', 'error');
        document.getElementById('awayTeam').value = '';
        return;
    }
    
    if (homeTeam) {
        const homeStats = teamData.find(t => t.Squad === homeTeam);
        if (homeStats) {
            updateTeamDisplay('home', homeTeam, homeStats);
        }
    }
    
    if (awayTeam) {
        const awayStats = teamData.find(t => t.Squad === awayTeam);
        if (awayStats) {
            updateTeamDisplay('away', awayTeam, awayStats);
        }
    }
    
    // Show team stats if both teams selected
    if (homeTeam && awayTeam) {
        document.getElementById('teamStats').style.display = 'block';
        updateDetailedStats();
    } else {
        document.getElementById('teamStats').style.display = 'none';
    }
}

function updateTeamDisplay(side, teamName, stats) {
    const display = document.getElementById(`${side}TeamDisplay`);
    
    // Determine which stats to show based on side
    const relevantXG = side === 'home' ? (stats.Home_xG || stats.xG || stats.xg) : (stats.Away_xG || stats.xG || stats.xg);
    const relevantXGA = side === 'home' ? (stats.Home_xGA || stats.xGA || stats.xga) : (stats.Away_xGA || stats.xGA || stats.xga);
    const relevantMP = side === 'home' ? (stats.Home_MP || stats.Home_matches || stats.MP || stats.matches) : (stats.Away_MP || stats.Away_matches || stats.MP || stats.matches);
    
    // Calculate per-game averages
    const xgPerGame = relevantMP > 0 ? (relevantXG / relevantMP).toFixed(2) : '-';
    const xgaPerGame = relevantMP > 0 ? (relevantXGA / relevantMP).toFixed(2) : '-';
    
    // Get recent form data
    const recentForm = stats.Form_status || 'Average';
    const recentFormColor = getFormColor(stats.Form_rating);
    
    const sideLabel = side === 'home' ? 'Home' : 'Away';
    const sideIcon = side === 'home' ? 'fa-home' : 'fa-plane-departure';
    
    display.innerHTML = `
        <h3>${teamName}</h3>
        <p style="color: #a0a0a0; font-size: 0.85rem; margin-top: 0.25rem;">
            <i class="fas ${sideIcon}" style="margin-right: 0.25rem;"></i>
            ${sideLabel} Stats
        </p>
        <div class="team-stats flex justify-center gap-6">
            <div class="stat-item text-center">
                <div class="stat-value text-primary text-2xl font-bold">${relevantXG ? relevantXG.toFixed(1) : '-'}</div>
                <div class="stat-label text-slate-600 dark:text-slate-400 text-sm">${sideLabel} xG</div>
                <div style="color: #a0a0a0; font-size: 0.75rem; margin-top: 0.25rem;">${xgPerGame}/game</div>
            </div>
            <div class="stat-item text-center">
                <div class="stat-value text-primary text-2xl font-bold">${relevantXGA ? relevantXGA.toFixed(1) : '-'}</div>
                <div class="stat-label text-slate-600 dark:text-slate-400 text-sm">${sideLabel} xGA</div>
                <div style="color: #a0a0a0; font-size: 0.75rem; margin-top: 0.25rem;">${xgaPerGame}/game</div>
            </div>
        </div>
        <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <span style="font-size: 0.8rem; color: #a0a0a0;">Recent Form:</span>
                <span style="font-weight: 600; font-size: 0.8rem; color: ${recentFormColor};">${recentForm}</span>
                <div style="width: 40px; height: 4px; background-color: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${(stats.Form_rating || 5) * 10}%; height: 100%; background-color: ${recentFormColor}; border-radius: 2px;"></div>
                </div>
            </div>
        </div>
    `;
}

function updateDetailedStats() {
    const homeTeam = document.getElementById('homeTeam').value;
    const awayTeam = document.getElementById('awayTeam').value;
    
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    // Update team labels
    document.getElementById('homeTeamLabel').textContent = `${homeTeam} Stats`;
    document.getElementById('awayTeamLabel').textContent = `${awayTeam} Stats`;
    
    if (homeStats) {
        document.getElementById('homeMP').textContent = homeStats.MP || homeStats.matches || '-';
        document.getElementById('homeW').textContent = homeStats.W || homeStats.wins || '-';
        document.getElementById('homeGF').textContent = homeStats.GF || homeStats.goals || '-';
        document.getElementById('homeGA').textContent = homeStats.GA || homeStats.ga || '-';
    }
    
    if (awayStats) {
        document.getElementById('awayMP').textContent = awayStats.MP || awayStats.matches || '-';
        document.getElementById('awayW').textContent = awayStats.W || awayStats.wins || '-';
        document.getElementById('awayGF').textContent = awayStats.GF || awayStats.goals || '-';
        document.getElementById('awayGA').textContent = awayStats.GA || awayStats.ga || '-';
    }
}

// ======================
// AUTO-PROCESSING FUNCTIONS
// ======================

function setupAutoProcessing() {
    const leagueOptions = document.querySelectorAll('.league-option');
    
    leagueOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const league = option.dataset.league;
            
            // Remove active class from all options
            leagueOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.querySelector('.league-check').style.display = 'none';
            });
            
            // Add active class to selected option
            option.classList.add('active');
            option.querySelector('.league-check').style.display = 'inline-block';
            
            // Set selected league
            selectedLeague = league;
            
            // Update league info with loading state
            updateLeagueInfo(league);
            
            // Handle CSV upload visibility
            const csvUploadCard = document.getElementById('csvUploadCard');
            if (selectedLeague === 'custom') {
                csvUploadCard.style.display = 'block';
                showNotification('Upload a CSV file to proceed', 'info');
            } else {
                csvUploadCard.style.display = 'none';
                // Auto-process the league data
                await processSelectedLeague();
            }
        });
    });
    
    // Initialize with no league selected 
    updateLeagueInfo();
}

// Update league info with loading state
function updateLeagueInfo(league = null) {
    const leagueInfo = document.getElementById('leagueInfo');
    const leagueName = document.getElementById('selectedLeagueName');
    const leagueStats = document.getElementById('selectedLeagueStats');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const infoIcon = document.getElementById('infoIcon');
    
    if (league) {
        leagueInfo.style.display = 'flex';
        
        if (league === 'custom') {
            leagueName.textContent = 'Custom CSV Selected';
            leagueStats.textContent = 'Upload a CSV file with team statistics';
            infoIcon.style.display = 'block';
            loadingSpinner.style.display = 'none';
        } else {
            leagueName.textContent = `Loading ${LEAGUE_NAMES[league]}...`;
            leagueStats.textContent = 'Processing CSV data...';
            infoIcon.style.display = 'none';
            loadingSpinner.style.display = 'block';
        }
    } else {
        leagueInfo.style.display = 'none';
    }
}

// Function to auto-process selected league
async function processSelectedLeague() {
    console.log(`Auto-processing league: ${selectedLeague}`);
    
    // Update league info to show loading
    updateLeagueInfo(selectedLeague);
    
    try {
        // Call the existing processCSVData function
        await processCSVData();
        
        // Update league info to show success
        const leagueInfo = document.getElementById('leagueInfo');
        const leagueName = document.getElementById('selectedLeagueName');
        const leagueStats = document.getElementById('selectedLeagueStats');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const infoIcon = document.getElementById('infoIcon');
        
        if (selectedLeague === 'custom') {
            leagueName.textContent = 'Custom CSV Loaded';
        } else {
            leagueName.textContent = `${LEAGUE_NAMES[selectedLeague]} Loaded`;
        }
        leagueStats.textContent = `${teamData.length} teams successfully loaded with recent form data`;
        infoIcon.style.display = 'block';
        loadingSpinner.style.display = 'none';
        
        const leagueNameDisplay = selectedLeague === 'custom' ? 'Custom CSV' : LEAGUE_NAMES[selectedLeague];
        showNotification(`${leagueNameDisplay} data loaded successfully with form analysis!`, 'success');
        
    } catch (error) {
        console.error('Error auto-processing league:', error);
        showNotification(`Error loading league data: ${error.message}`, 'error');
        
        // Reset league selection on error
        selectedLeague = null;
        updateLeagueInfo();
    }
}

function populateTeamDropdowns() {
    const homeTeamSelect = document.getElementById('homeTeam');
    const awayTeamSelect = document.getElementById('awayTeam');
    
    // Clear existing options
    homeTeamSelect.innerHTML = '<option value="">-- Select Home Team --</option>';
    awayTeamSelect.innerHTML = '<option value="">-- Select Away Team --</option>';
    
    // Add all teams to both dropdowns
    teamData.forEach(team => {
        const teamName = team.Squad || team.Team || team.team;
        if (teamName && teamName.trim() !== '') {
            // Add to home team dropdown
            const homeOption = document.createElement('option');
            homeOption.value = teamName;
            homeOption.textContent = teamName;
            homeTeamSelect.appendChild(homeOption);
            
            // Add to away team dropdown
            const awayOption = document.createElement('option');
            awayOption.value = teamName;
            awayOption.textContent = teamName;
            awayTeamSelect.appendChild(awayOption);
        }
    });
    
    // Update team displays
    updateTeamDisplays();
}

// --------------------------------------------------------------------
// prediction-storage.js - Local Storage Functions
// --------------------------------------------------------------------

// ======================
// DATA MANAGEMENT FUNCTIONS
// ======================

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all uploaded data?')) {
        resetDataState();
        clearLocalStorage();
        showNotification('All data cleared successfully', 'info');
    }
}

function resetDataState() {
    // Reset file variables
    csvFile = null;
    selectedLeague = null;
    
    // Reset data arrays
    teamData = [];
    
    // Reset UI
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('dataStatus').style.display = 'none';
    document.getElementById('predictBtn').disabled = true;
    document.getElementById('homeTeam').disabled = true;
    document.getElementById('awayTeam').disabled = true;
    document.getElementById('teamStats').style.display = 'none';
    document.getElementById('predictionResults').style.display = 'none';
    document.getElementById('csvUploadCard').style.display = 'none';
    
    // Reset league selection
    const leagueOptions = document.querySelectorAll('.league-option');
    leagueOptions.forEach(option => {
        option.classList.remove('active');
        option.querySelector('.league-check').style.display = 'none';
    });
    
    // Don't auto-select any option on reset
    updateLeagueInfo();
    
    // Reset dropdowns
    document.getElementById('homeTeam').innerHTML = '<option value="">-- Upload or select data first --</option>';
    document.getElementById('awayTeam').innerHTML = '<option value="">-- Upload or select data first --</option>';
    
    // Reset team displays
    document.getElementById('homeTeamDisplay').innerHTML = `
        <h3>Select Home Team</h3>
        <div class="team-stats">
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">xG</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">xGA</div>
            </div>
        </div>
    `;
    
    document.getElementById('awayTeamDisplay').innerHTML = `
        <h3>Select Away Team</h3>
        <div class="team-stats">
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">xG</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">xGA</div>
            </div>
        </div>
    `;
}

// ======================
// LOCAL STORAGE FUNCTIONS
// ======================

function saveToLocalStorage() {
    const data = {
        teamData: teamData,
        selectedLeague: selectedLeague,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('soccerPredictionData', JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save data to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('soccerPredictionData');
        if (savedData) {
            const data = JSON.parse(savedData);
            teamData = data.teamData || [];
            selectedLeague = data.selectedLeague || null;
            
            // Restore league selection UI if we have data
            if (selectedLeague && teamData.length > 0) {
                const leagueOption = document.querySelector(`.league-option[data-league="${selectedLeague}"]`);
                if (leagueOption) {
                    document.querySelectorAll('.league-option').forEach(opt => {
                        opt.classList.remove('active');
                        opt.querySelector('.league-check').style.display = 'none';
                    });
                    leagueOption.classList.add('active');
                    leagueOption.querySelector('.league-check').style.display = 'inline-block';
                    
                    // Update CSV upload card visibility
                    const csvUploadCard = document.getElementById('csvUploadCard');
                    if (selectedLeague === 'custom') {
                        csvUploadCard.style.display = 'block';
                    } else {
                        csvUploadCard.style.display = 'none';
                    }
                }
                
                populateTeamDropdowns();
                updateDataStatus();
                document.getElementById('predictBtn').disabled = false;
                document.getElementById('homeTeam').disabled = false;
                document.getElementById('awayTeam').disabled = false;
                
                showNotification(`Loaded ${teamData.length} teams from previous session`, 'info');
            }
            
            updateLeagueInfo(selectedLeague);
        }
    } catch (e) {
        console.warn('Could not load data from localStorage:', e);
        clearLocalStorage();
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('soccerPredictionData');
    } catch (e) {
        console.warn('Could not clear localStorage:', e);
    }
}

// --------------------------------------------------------------------
// prediction-utils.js - Utility Functions
// --------------------------------------------------------------------

// Update weight display
function updateWeightDisplay() {
    const weightValue = document.getElementById('weightValue');
    const modelWeight = document.getElementById('modelWeight');
    weightValue.textContent = modelWeight.value;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background-color: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : type === 'success' ? '#4CAF50' : '#2196f3'}; 
                    color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    z-index: 1000; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function updateDataStatus() {
    const dataStatus = document.getElementById('dataStatus');
    const dataStats = document.getElementById('dataStats');
    
    if (dataStatus && dataStats) {
        dataStatus.style.display = 'flex';
        dataStats.textContent = `${teamData.length} teams loaded with recent form data`;
        
        // Update matchup display
        const homeDisplay = document.getElementById('homeTeamDisplay');
        const awayDisplay = document.getElementById('awayTeamDisplay');
        
        if (homeDisplay) {
            const homeTitle = homeDisplay.querySelector('h3');
            if (homeTitle) homeTitle.textContent = 'Select Home Team';
        }
        
        if (awayDisplay) {
            const awayTitle = awayDisplay.querySelector('h3');
            if (awayTitle) awayTitle.textContent = 'Select Away Team';
        }
    }
}