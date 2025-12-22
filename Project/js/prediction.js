// Soccer Match Predictor - Consolidated JavaScript
// ===============================================

// Global variables
let teamData = [];
let csvFile = null;
let selectedLeague = null;

// League names mapping
const LEAGUE_NAMES = {
    laliga: "La Liga",
    premierleague: "Premier League",
    seriea: "Serie A",
    bundesliga: "Bundesliga",
    custom: "Custom CSV"
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupFileUploads();
    updateWeightDisplay();
    setupLeagueSelection();
    
    // Load from localStorage if available
    loadFromLocalStorage();
    
    // Set up weight slider listener
    const modelWeight = document.getElementById('modelWeight');
    modelWeight.addEventListener('input', updateWeightDisplay);
    
    // Set up event listeners for buttons
    document.getElementById('processDataBtn').addEventListener('click', processCSVData);
    document.getElementById('predictBtn').addEventListener('click', generatePrediction);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    
    // Set up team selection listeners
    document.getElementById('homeTeam').addEventListener('change', updateTeamDisplays);
    document.getElementById('awayTeam').addEventListener('change', updateTeamDisplays);
});

// ======================
// UTILITY FUNCTIONS
// ======================

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
        <div style="position: fixed; top: 20px; right: 20px; background-color: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'}; 
                    color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    z-index: 1000; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
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

// ======================
// FILE UPLOAD FUNCTIONS
// ======================

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
            checkFileReady();
            showNotification('CSV file uploaded successfully', 'success');
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
                checkFileReady();
                showNotification('CSV file uploaded successfully', 'success');
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

// ======================
// LEAGUE SELECTION FUNCTIONS
// ======================

function setupLeagueSelection() {
    const leagueOptions = document.querySelectorAll('.league-option');
    
    leagueOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            leagueOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.querySelector('.league-check').style.display = 'none';
            });
            
            // Add active class to selected option
            option.classList.add('active');
            option.querySelector('.league-check').style.display = 'inline-block';
            
            // Set selected league
            selectedLeague = option.dataset.league;
            
            // Update league info display
            updateLeagueInfo();
            
            // Handle CSV upload visibility
            const csvUploadCard = document.getElementById('csvUploadCard');
            if (selectedLeague === 'custom') {
                csvUploadCard.style.display = 'block';
            } else {
                csvUploadCard.style.display = 'none';
            }
            
            // Check if button should be enabled
            checkFileReady();
        });
    });
    
    // Set custom as default
    const customOption = document.querySelector('.league-option[data-league="custom"]');
    if (customOption) {
        customOption.click();
    }
}

function updateLeagueInfo() {
    const leagueInfo = document.getElementById('leagueInfo');
    const leagueName = document.getElementById('selectedLeagueName');
    const leagueStats = document.getElementById('selectedLeagueStats');
    
    if (selectedLeague) {
        leagueInfo.style.display = 'flex';
        leagueName.textContent = LEAGUE_NAMES[selectedLeague];
        
        if (selectedLeague === 'custom') {
            leagueStats.textContent = 'Upload your own CSV file';
        } else {
            const fileMap = {
                laliga: 'laligateams.csv',
                premierleague: 'premierleagueteams.csv',
                seriea: 'serieateams.csv',
                bundesliga: 'bundesligateams.csv'
            };
            leagueStats.textContent = `Will load: ${fileMap[selectedLeague]}`;
        }
    } else {
        leagueInfo.style.display = 'none';
    }
}

function checkFileReady() {
    const processBtn = document.getElementById('processDataBtn');
    if (selectedLeague && selectedLeague !== 'custom') {
        // Pre-loaded league selected - enable button
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process League Data';
    } else if (selectedLeague === 'custom' && csvFile) {
        // Custom selected with file uploaded - enable button
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process CSV Data';
    } else {
        // Not ready - disable button
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
    }
}

// ======================
// DATA PROCESSING FUNCTIONS
// ======================

async function processCSVData() {
    console.log('=== PROCESS CSV DATA STARTED ===');
    console.log('Selected League:', selectedLeague);
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const processBtn = document.getElementById('processDataBtn');
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
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
                bundesliga: 'bundesligateams.csv'
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
        
        // Check for required columns
        const requiredColumns = ['Squad', 'xG', 'xGA'];
        const missingColumns = [];
        
        const sample = teamData[0];
        requiredColumns.forEach(col => {
            if (!(col in sample)) {
                missingColumns.push(col);
            }
        });
        
        if (missingColumns.length > 0) {
            showNotification(`Missing required columns: ${missingColumns.join(', ')}`, 'warning');
        }
        
        // Populate team dropdowns (both from the same data)
        populateTeamDropdowns();
        
        // Enable predict button
        document.getElementById('predictBtn').disabled = false;
        document.getElementById('homeTeam').disabled = false;
        document.getElementById('awayTeam').disabled = false;
        
        // Update data status
        updateDataStatus();
        
        // Save to localStorage
        saveToLocalStorage();
        
        const leagueName = selectedLeague === 'custom' ? fileName : LEAGUE_NAMES[selectedLeague];
        showNotification(`Successfully loaded ${teamData.length} teams from ${leagueName}`, 'success');
        
    } catch (error) {
        console.error('Error processing CSV data:', error);
        showNotification(`Error: ${error.message}`, 'error');
        
        // Reset state
        resetDataState();
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
        checkFileReady();
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
        if (row.Squad && row.Squad.trim() !== '') {
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
    
    result.push(current); // Add the last field
    return result;
}

function populateTeamDropdowns() {
    const homeTeamSelect = document.getElementById('homeTeam');
    const awayTeamSelect = document.getElementById('awayTeam');
    
    // Clear existing options
    homeTeamSelect.innerHTML = '<option value="">-- Select Home Team --</option>';
    awayTeamSelect.innerHTML = '<option value="">-- Select Away Team --</option>';
    
    // Add all teams to both dropdowns
    teamData.forEach(team => {
        if (team.Squad && team.Squad.trim() !== '') {
            // Add to home team dropdown
            const homeOption = document.createElement('option');
            homeOption.value = team.Squad;
            homeOption.textContent = team.Squad;
            homeTeamSelect.appendChild(homeOption);
            
            // Add to away team dropdown
            const awayOption = document.createElement('option');
            awayOption.value = team.Squad;
            awayOption.textContent = team.Squad;
            awayTeamSelect.appendChild(awayOption);
        }
    });
    
    // Update team displays
    updateTeamDisplays();
}

function updateDataStatus() {
    const dataStatus = document.getElementById('dataStatus');
    const dataStats = document.getElementById('dataStats');
    
    dataStatus.style.display = 'flex';
    dataStats.textContent = `${teamData.length} teams loaded`;
    
    // Update matchup display
    document.getElementById('homeTeamDisplay').querySelector('h3').textContent = 'Select Home Team';
    document.getElementById('awayTeamDisplay').querySelector('h3').textContent = 'Select Away Team';
}

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
    
    display.innerHTML = `
        <h3>${teamName}</h3>
        <div class="team-stats">
            <div class="stat-item">
                <div class="stat-value">${stats.xG ? stats.xG.toFixed(1) : '-'}</div>
                <div class="stat-label">xG</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.xGA ? stats.xGA.toFixed(1) : '-'}</div>
                <div class="stat-label">xGA</div>
            </div>
        </div>
    `;
}

function updateDetailedStats() {
    const homeTeam = document.getElementById('homeTeam').value;
    const awayTeam = document.getElementById('awayTeam').value;
    
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    if (homeStats) {
        document.getElementById('homeMP').textContent = homeStats.MP || '-';
        document.getElementById('homeW').textContent = homeStats.W || '-';
        document.getElementById('homeGF').textContent = homeStats.GF || '-';
        document.getElementById('homeGA').textContent = homeStats.GA || '-';
    }
    
    if (awayStats) {
        document.getElementById('awayMP').textContent = awayStats.MP || '-';
        document.getElementById('awayW').textContent = awayStats.W || '-';
        document.getElementById('awayGF').textContent = awayStats.GF || '-';
        document.getElementById('awayGA').textContent = awayStats.GA || '-';
    }
}

// ======================
// PREDICTION ENGINE FUNCTIONS
// ======================

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

// Improved model with better home/away balance
function calculateModelProbabilities(homeTeam, awayTeam) {
    const homeStats = teamData.find(t => t.Squad === homeTeam);
    const awayStats = teamData.find(t => t.Squad === awayTeam);
    
    if (!homeStats || !awayStats) {
        return { home: 0.33, draw: 0.33, away: 0.33, homeExp: 1.5, awayExp: 1.5 };
    }
    
    // 1. BASE EXPECTED GOALS - More aggressive matchup
    const homeAttack = homeStats.xG || 1.5;
    const homeDefense = homeStats.xGA || 1.5;
    const awayAttack = awayStats.xG || 1.5;
    const awayDefense = awayStats.xGA || 1.5;
    
    // More aggressive weighting - stronger teams should dominate more
    // Home advantage factor (0.2 goals on average)
    const homeAdvantage = 0.2;
    const baseHomeExp = (homeAttack * 0.7) + (awayDefense * 0.3) + homeAdvantage;
    const baseAwayExp = (awayAttack * 0.7) + (homeDefense * 0.3);
    
    // 2. STRENGTH DIFFERENTIAL CALCULATION
    // Calculate team strength scores
    const homeStrength = (
        (homeStats['Pts/MP'] || 1.5) * 0.4 +
        ((homeStats.xG || 1.5) / Math.max(homeStats.xGA || 1.5, 0.1)) * 0.3 +
        ((homeStats.GF || 1) / Math.max(homeStats.GA || 1, 0.1)) * 0.3
    );
    
    const awayStrength = (
        (awayStats['Pts/MP'] || 1.5) * 0.4 +
        ((awayStats.xG || 1.5) / Math.max(awayStats.xGA || 1.5, 0.1)) * 0.3 +
        ((awayStats.GF || 1) / Math.max(awayStats.GA || 1, 0.1)) * 0.3
    );
    
    // Strength differential impact
    const strengthDiff = homeStrength - awayStrength;
    
    // 3. WIN/DRAW RATES (but don't over-weight draws)
    const homeWinRate = (homeStats.W || 0) / Math.max(homeStats.MP || 1, 1);
    const homeDrawRate = (homeStats.D || 0) / Math.max(homeStats.MP || 1, 1);
    const awayWinRate = (awayStats.W || 0) / Math.max(awayStats.MP || 1, 1);
    const awayDrawRate = (awayStats.D || 0) / Math.max(awayStats.MP || 1, 1);
    
    // Reduce draw influence from historical data
    const avgDrawRate = (homeDrawRate + awayDrawRate) / 2;
    
    // 4. ADJUST EXPECTED GOALS BASED ON STRENGTH DIFFERENTIAL
    // Stronger team gets a bigger boost
    const strengthImpact = Math.abs(strengthDiff) * 0.5; // How much to adjust
    
    let homeExpFinal, awayExpFinal;
    
    if (strengthDiff > 0) {
        // Home is stronger
        homeExpFinal = baseHomeExp * (1 + strengthImpact * 0.3);
        awayExpFinal = baseAwayExp * (1 - strengthImpact * 0.2);
    } else {
        // Away is stronger
        homeExpFinal = baseHomeExp * (1 - Math.abs(strengthImpact) * 0.2);
        awayExpFinal = baseAwayExp * (1 + Math.abs(strengthImpact) * 0.3);
    }
    
    // Ensure minimum expected goals
    homeExpFinal = Math.max(0.5, homeExpFinal);
    awayExpFinal = Math.max(0.5, awayExpFinal);
    
    // 5. POISSON PROBABILITIES with higher max goals for better resolution
    const poissonProbs = calculatePoissonProbabilities(homeExpFinal, awayExpFinal, 10);
    
    // 6. REDUCE DRAW BIAS IN POISSON
    // Draws are overestimated in Poisson, especially for low-scoring matches
    let adjustedHome = poissonProbs.home;
    let adjustedDraw = poissonProbs.draw;
    let adjustedAway = poissonProbs.away;
    
    // Reduce draw probability based on expected goals difference
    const expectedDiff = homeExpFinal - awayExpFinal;
    const diffFactor = Math.min(Math.abs(expectedDiff) * 0.5, 0.3); // Max 30% reduction
    
    if (Math.abs(expectedDiff) > 0.5) { // Only reduce draws if there's a clear favorite
        adjustedDraw *= (1 - diffFactor);
        
        // Redistribute the reduced draw probability to the favorite
        if (expectedDiff > 0) {
            adjustedHome += (poissonProbs.draw * diffFactor * 0.7);
            adjustedAway += (poissonProbs.draw * diffFactor * 0.3);
        } else {
            adjustedHome += (poissonProbs.draw * diffFactor * 0.3);
            adjustedAway += (poissonProbs.draw * diffFactor * 0.7);
        }
    }
    
    // 7. APPLY HISTORICAL PERFORMANCE WITH MINIMAL DRAW INFLUENCE
    const historicalWeight = 0.15;
    const modelWeight = 0.85;
    
    // Use win rates more than draw rates
    let finalHome = (adjustedHome * modelWeight) + 
                   (homeWinRate * historicalWeight * 0.8 + (1 - awayWinRate) * historicalWeight * 0.2);
    
    let finalAway = (adjustedAway * modelWeight) + 
                   (awayWinRate * historicalWeight * 0.8 + (1 - homeWinRate) * historicalWeight * 0.2);
    
    let finalDraw = (adjustedDraw * modelWeight) + 
                   (avgDrawRate * historicalWeight * 0.5); // Reduced draw influence
    
    // 8. STRENGTH-BASED FINAL ADJUSTMENT
    // If one team is clearly stronger, reduce draw probability further
    const clearFavoriteThreshold = 0.3; // 30% strength difference
    
    if (Math.abs(strengthDiff) > clearFavoriteThreshold) {
        const favoriteBoost = Math.min((Math.abs(strengthDiff) - clearFavoriteThreshold) * 0.4, 0.2);
        const drawReduction = finalDraw * favoriteBoost;
        
        if (strengthDiff > 0) {
            // Home is clear favorite
            finalHome += (drawReduction * 0.8);
            finalAway += (drawReduction * 0.2);
            finalDraw -= drawReduction;
        } else {
            // Away is clear favorite
            finalHome += (drawReduction * 0.2);
            finalAway += (drawReduction * 0.8);
            finalDraw -= drawReduction;
        }
    }
    
    // Normalize to ensure sum = 1
    const total = finalHome + finalDraw + finalAway;
    
    return {
        home: finalHome / total,
        draw: finalDraw / total,
        away: finalAway / total,
        homeExp: homeExpFinal,
        awayExp: awayExpFinal
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
    
    // Display results
    displayPredictionResults(
        homeTeam, awayTeam, 
        modelProbs.home, modelProbs.draw, modelProbs.away,
        displayBetHome, displayBetDraw, displayBetAway,
        finalHome, finalDraw, finalAway,
        adjustedHomeExp, adjustedAwayExp,
        homeStats, awayStats,
        useBettingOdds
    );
}

// Display prediction results
function displayPredictionResults(
    homeTeam, awayTeam, 
    modelHome, modelDraw, modelAway,
    betHome, betDraw, betAway,
    finalHome, finalDraw, finalAway,
    homeExp, awayExp,
    homeStats, awayStats,
    hasBettingOdds = false
) {
    const resultsDiv = document.getElementById('predictionContent');
    
    // Determine final prediction
    let prediction, maxProb, predictionClass;
    if (finalHome >= finalAway && finalHome >= finalDraw) {
        prediction = `${homeTeam} win`;
        maxProb = finalHome;
        predictionClass = 'home-fill';
    } else if (finalAway >= finalHome && finalAway >= finalDraw) {
        prediction = `${awayTeam} win`;
        maxProb = finalAway;
        predictionClass = 'away-fill';
    } else {
        prediction = "Draw";
        maxProb = finalDraw;
        predictionClass = 'draw-fill';
    }
    
    // Calculate expected score based on expected goals
    const expectedHomeGoals = homeExp.toFixed(1);
    const expectedAwayGoals = awayExp.toFixed(1);
    
    // Build the probability table
    let probabilityTable = `
        <h4>Probability Breakdown</h4>
        <table>
            <thead>
                <tr>
                    <th>Source</th>
                    <th>${homeTeam}</th>
                    <th>Draw</th>
                    <th>${awayTeam}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Model</strong></td>
                    <td>${(modelHome * 100).toFixed(1)}%</td>
                    <td>${(modelDraw * 100).toFixed(1)}%</td>
                    <td>${(modelAway * 100).toFixed(1)}%</td>
                </tr>
    `;
    
    if (hasBettingOdds && betHome !== null && betDraw !== null && betAway !== null) {
        probabilityTable += `
                <tr>
                    <td><strong>Betting</strong></td>
                    <td>${(betHome * 100).toFixed(1)}%</td>
                    <td>${(betDraw * 100).toFixed(1)}%</td>
                    <td>${(betAway * 100).toFixed(1)}%</td>
                </tr>
        `;
    }
    
    probabilityTable += `
                <tr style="background-color: #f8f9fa;">
                    <td><strong>Final</strong></td>
                    <td><strong>${(finalHome * 100).toFixed(1)}%</strong></td>
                    <td><strong>${(finalDraw * 100).toFixed(1)}%</strong></td>
                    <td><strong>${(finalAway * 100).toFixed(1)}%</strong></td>
                </tr>
            </tbody>
        </table>
    `;
    
    let html = `
        <h3>${homeTeam} vs ${awayTeam}</h3>
        <div class="info-box">
            <i class="fas fa-info-circle"></i> 
            <strong>Expected goals:</strong> ${homeTeam} ${expectedHomeGoals} - ${awayTeam} ${expectedAwayGoals}
        </div>
        
        <h4>Team Statistics</h4>
        <table>
            <thead>
                <tr>
                    <th>Team</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>xG</th>
                    <th>xGA</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>${homeTeam}</strong></td>
                    <td>${homeStats.MP || '-'}</td>
                    <td>${homeStats.W || '-'}</td>
                    <td>${homeStats.D || '-'}</td>
                    <td>${homeStats.L || '-'}</td>
                    <td>${homeStats.GF || '-'}</td>
                    <td>${homeStats.GA || '-'}</td>
                    <td>${homeStats.xG ? homeStats.xG.toFixed(1) : '-'}</td>
                    <td>${homeStats.xGA ? homeStats.xGA.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                    <td><strong>${awayTeam}</strong></td>
                    <td>${awayStats.MP || '-'}</td>
                    <td>${awayStats.W || '-'}</td>
                    <td>${awayStats.D || '-'}</td>
                    <td>${awayStats.L || '-'}</td>
                    <td>${awayStats.GF || '-'}</td>
                    <td>${awayStats.GA || '-'}</td>
                    <td>${awayStats.xG ? awayStats.xG.toFixed(1) : '-'}</td>
                    <td>${awayStats.xGA ? awayStats.xGA.toFixed(1) : '-'}</td>
                </tr>
            </tbody>
        </table>
        
        ${probabilityTable}
        
        <h4>Final Prediction</h4>
        <div class="probability-bar">
            <div class="probability-fill ${predictionClass}" style="width: ${maxProb * 100}%"></div>
            <div class="probability-label">${prediction} (${(maxProb * 100).toFixed(1)}%)</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <div class="probability-bar" style="width: 32%; height: 15px;">
                <div class="probability-fill home-fill" style="width: ${finalHome * 100}%"></div>
            </div>
            <div class="probability-bar" style="width: 32%; height: 15px;">
                <div class="probability-fill draw-fill" style="width: ${finalDraw * 100}%"></div>
            </div>
            <div class="probability-bar" style="width: 32%; height: 15px;">
                <div class="probability-fill away-fill" style="width: ${finalAway * 100}%"></div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.9rem; color: #666;">
            <div>${homeTeam}</div>
            <div>Draw</div>
            <div>${awayTeam}</div>
        </div>
    `;
    
    // Add betting advice only if betting odds were used
    if (hasBettingOdds) {
        html += `
        <div class="info-box" style="margin-top: 1.5rem;">
            <h4><i class="fas fa-lightbulb"></i> How to Use This Prediction</h4>
            <p>1. Compare the final probabilities with actual betting odds</p>
            <p>2. Look for discrepancies where model predictions differ from market odds</p>
            <p>3. Use the <a href="odds-analyzer.html" style="color: #2e7d32; font-weight: 600;">Odds Analyzer</a> to find the best available odds for your bet</p>
        </div>
        `;
    } else {
        html += `
        <div class="info-box" style="margin-top: 1.5rem;">
            <h4><i class="fas fa-lightbulb"></i> Pure Statistical Prediction</h4>
            <p>This prediction is based purely on statistical team data (xG, goals, points, etc.).</p>
            <p>For betting insights, add American format odds (e.g., +150, +220, +140) to combine model with market data.</p>
        </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
    document.getElementById('predictionResults').style.display = 'block';
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
    document.getElementById('processDataBtn').disabled = true;
    document.getElementById('processDataBtn').innerHTML = '<i class="fas fa-cogs"></i> Process Data';
    document.getElementById('predictBtn').disabled = true;
    document.getElementById('homeTeam').disabled = true;
    document.getElementById('awayTeam').disabled = true;
    document.getElementById('teamStats').style.display = 'none';
    document.getElementById('predictionResults').style.display = 'none';
    document.getElementById('csvUploadCard').style.display = 'block';
    
    // Reset league selection
    const leagueOptions = document.querySelectorAll('.league-option');
    leagueOptions.forEach(option => {
        option.classList.remove('active');
        option.querySelector('.league-check').style.display = 'none';
    });
    
    // Reset to custom option
    const customOption = document.querySelector('.league-option[data-league="custom"]');
    if (customOption) {
        customOption.classList.add('active');
        customOption.querySelector('.league-check').style.display = 'inline-block';
        selectedLeague = 'custom';
    }
    
    updateLeagueInfo();
    
    // Reset dropdowns
    document.getElementById('homeTeam').innerHTML = '<option value="">-- Upload CSV data first --</option>';
    document.getElementById('awayTeam').innerHTML = '<option value="">-- Upload CSV data first --</option>';
    
    // Reset team displays
    document.getElementById('homeTeamDisplay').innerHTML = `
        <h3>Upload Data First</h3>
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
        <h3>Upload Data First</h3>
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
            selectedLeague = data.selectedLeague || 'custom';
            
            // Restore league selection UI
            if (selectedLeague) {
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
            }
            
            if (teamData.length > 0) {
                populateTeamDropdowns();
                updateDataStatus();
                document.getElementById('predictBtn').disabled = false;
                document.getElementById('homeTeam').disabled = false;
                document.getElementById('awayTeam').disabled = false;
                
                showNotification(`Loaded ${teamData.length} teams from previous session`, 'info');
            }
            
            updateLeagueInfo();
            checkFileReady();
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