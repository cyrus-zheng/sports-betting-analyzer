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
    
    // Set custom as default
    const customOption = document.querySelector('.league-option[data-league="custom"]');
    if (customOption) {
        customOption.click();
    }
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
        leagueStats.textContent = `${teamData.length} teams successfully loaded`;
        infoIcon.style.display = 'block';
        loadingSpinner.style.display = 'none';
        
        const leagueNameDisplay = selectedLeague === 'custom' ? 'Custom CSV' : LEAGUE_NAMES[selectedLeague];
        showNotification(`${leagueNameDisplay} data loaded successfully!`, 'success');
        
    } catch (error) {
        console.error('Error auto-processing league:', error);
        showNotification(`Error loading league data: ${error.message}`, 'error');
        
        // Reset league selection on error
        selectedLeague = null;
        updateLeagueInfo();
    }
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
            showNotification('CSV file uploaded successfully', 'success');
            
            // Auto-process if custom is selected
            if (selectedLeague === 'custom') {
                setTimeout(() => processSelectedLeague(), 500);
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

// ======================
// DATA PROCESSING FUNCTIONS
// ======================

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

// ======================
// ORGANIZED PREDICTION DISPLAY
// ======================

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
    
    // Create organized HTML structure
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
            
            <!-- Final Prediction Ranking -->
            <div class="final-prediction">
                <div class="final-prediction-title">
                    <i class="fas fa-trophy"></i>
                    Final Prediction
                </div>
                <div class="prediction-list">
    `;
    
    // Determine ranking order
    const predictions = [
        { team: homeTeam, percent: finalHome, type: 'home' },
        { team: 'Draw', percent: finalDraw, type: 'draw' },
        { team: awayTeam, percent: finalAway, type: 'away' }
    ];
    
    // Sort by percentage (highest first)
    predictions.sort((a, b) => b.percent - a.percent);
    
    // Add prediction items
    predictions.forEach((pred, index) => {
        html += `
                    <div class="prediction-item ${pred.type}">
                        <div class="prediction-rank">${index + 1}</div>
                        <div class="prediction-team">${pred.team}</div>
                        <div class="prediction-percent">${formatPercent(pred.percent)}</div>
                    </div>
        `;
    });
    
    html += `
                </div>
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
                    <tr>
                        <td>Matches Played</td>
                        <td>${homeStats.MP || '-'}</td>
                        <td>${awayStats.MP || '-'}</td>
                    </tr>
                    <tr>
                        <td>Wins</td>
                        <td>${homeStats.W || '-'}</td>
                        <td>${awayStats.W || '-'}</td>
                    </tr>
                    <tr>
                        <td>Draws</td>
                        <td>${homeStats.D || '-'}</td>
                        <td>${awayStats.D || '-'}</td>
                    </tr>
                    <tr>
                        <td>Losses</td>
                        <td>${homeStats.L || '-'}</td>
                        <td>${awayStats.L || '-'}</td>
                    </tr>
                    <tr>
                        <td>Goals For</td>
                        <td>${homeStats.GF || '-'}</td>
                        <td>${awayStats.GF || '-'}</td>
                    </tr>
                    <tr>
                        <td>Goals Against</td>
                        <td>${homeStats.GA || '-'}</td>
                        <td>${awayStats.GA || '-'}</td>
                    </tr>
                    <tr>
                        <td>Expected Goals (xG)</td>
                        <td>${homeStats.xG ? homeStats.xG.toFixed(1) : '-'}</td>
                        <td>${awayStats.xG ? awayStats.xG.toFixed(1) : '-'}</td>
                    </tr>
                    <tr>
                        <td>Expected Goals Against (xGA)</td>
                        <td>${homeStats.xGA ? homeStats.xGA.toFixed(1) : '-'}</td>
                        <td>${awayStats.xGA ? awayStats.xGA.toFixed(1) : '-'}</td>
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
                <p><span style="color: #13ec5b; font-weight: 600;">✓ Value Bet Detected:</span> 
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
    
    // Reset to custom option
    const customOption = document.querySelector('.league-option[data-league="custom"]');
    if (customOption) {
        customOption.classList.add('active');
        customOption.querySelector('.league-check').style.display = 'inline-block';
        selectedLeague = 'custom';
        document.getElementById('csvUploadCard').style.display = 'block';
    }
    
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
