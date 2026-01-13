// Sports Betting Odds Analyzer - Combined JavaScript File
// =======================================================

// =================================================
// Main Entry Point (from odds-analyzer.js)
// =================================================

// Global variable to store parsed CSV data
let csvData = null;
let parsedMatches = null;

// Bookmakers in fixed order 
const bookmakers = ["FanDuel", "Bet365", "BetOnline", "Pinnacle"];

// API Integration variables
let apiKey = localStorage.getItem('oddsApiKey') || '';
let availableSports = [];
let availableEvents = [];
let apiCreditsRemaining = null;
let apiCreditsUsed = null;
let apiCreditsLastCall = null;
const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const BOOKMAKER_KEYS = ['pinnacle', 'betonlineag', 'fanduel'];
const BOOKMAKER_MAP = {
    'pinnacle': 3,      // Pinnacle is index 3
    'betonlineag': 2,   // BetOnline is index 2
    'fanduel': 0        // FanDuel is index 0
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// =================================================
// UI Event Handlers (from odds-ui.js)
// =================================================

// Set up all event listeners
function setupEventListeners() {
    // CSV file upload
    document.getElementById('csvFileInput').addEventListener('change', handleCsvUpload);

    // Match selection
    document.getElementById('matchSelector').addEventListener('change', handleMatchSelection);

    // Clear CSV
    document.getElementById('clearCsvBtn').addEventListener('click', clearCsvData);
    
    // Add outcome row
    document.getElementById('addOutcomeBtn').addEventListener('click', addOutcomeRow);
    
    // Remove outcome row (initial buttons)
    document.querySelectorAll('.remove-outcome').forEach(btn => {
        btn.addEventListener('click', function() {
            removeOutcomeRow(this);
        });
    });
    
    // Run odds analysis
    document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
    
    // Run demo analysis
    document.getElementById('runDemoBtn').addEventListener('click', runDemoAnalysis);
    
    // API Integration event listeners
    document.getElementById('saveApiKeyBtn').addEventListener('click', handleSaveApiKey);
    document.getElementById('sportSelector').addEventListener('change', handleSportSelection);
    document.getElementById('loadFromApiBtn').addEventListener('click', handleLoadFromApi);
    
    // Initialize API section if key exists
    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
        initializeApiSection();
    }
}

// Add a new outcome row
function addOutcomeRow() {
    const outcomesContainer = document.getElementById('outcomesContainer');
    const newRow = document.createElement('div');
    newRow.className = 'outcome-row';
    newRow.innerHTML = `
        <div class="outcome-name">
            <input type="text" class="outcome-input" placeholder="Outcome name" value="New Outcome">
        </div>
        <div class="bookmaker-odds">
            <input type="text" class="odds-input" placeholder="+150" data-bookmaker="0" value="">
            <input type="text" class="odds-input" placeholder="-110" data-bookmaker="1" value="">
            <input type="text" class="odds-input" placeholder="2.50" data-bookmaker="2" value="">
            <input type="text" class="odds-input" placeholder="N/A" data-bookmaker="3" value="">
        </div>
        <button class="btn btn-red remove-outcome"><i class="fas fa-trash"></i></button>
    `;
    outcomesContainer.appendChild(newRow);
    
    // Add event listener to the new remove button
    newRow.querySelector('.remove-outcome').addEventListener('click', function() {
        removeOutcomeRow(this);
    });
}

// Remove outcome row
function removeOutcomeRow(button) {
    const outcomesContainer = document.getElementById('outcomesContainer');
    if (outcomesContainer.children.length > 2) {
        button.parentElement.remove();
    } else {
        alert('You need at least 2 outcomes');
    }
}

// =================================================
// Analysis Engine Functions (from odds-analysis.js)
// =================================================

// Run odds analysis
function runAnalysis() {
    const eventName = document.getElementById('eventName').value;
    const marketType = document.getElementById('marketType').value;
    
    // Collect outcomes and odds
    const outcomes = collectOutcomesData();
    
    // Display results
    displayAnalysisResults(eventName, marketType, outcomes);
}

// Collect data from all outcome rows
function collectOutcomesData() {
    const outcomes = [];
    
    document.querySelectorAll('.outcome-row').forEach(row => {
        const outcomeName = row.querySelector('.outcome-input').value;
        const oddsInputs = row.querySelectorAll('.odds-input');
        const outcome = {
            name: outcomeName,
            odds: [],
            available: []
        };
        
        for (let i = 0; i < 4; i++) {
            const oddsValue = parseOdds(oddsInputs[i].value);
            outcome.odds.push(oddsValue);
            outcome.available.push(oddsValue > 0);
        }
        
        // Calculate average odds
        calculateAverageOdds(outcome);
        
        // Calculate best odds
        calculateBestOdds(outcome);
        
        outcomes.push(outcome);
    });
    
    return outcomes;
}

// Run demo analysis
function runDemoAnalysis() {
    // Fill with demo data
    document.getElementById('eventName').value = "Real Madrid vs Barcelona";
    document.getElementById('marketType').value = "Moneyline";
    
    // Clear and recreate outcomes for demo
    const outcomesContainer = document.getElementById('outcomesContainer');
    outcomesContainer.innerHTML = '';
    
    const demoOutcomes = [
        { name: "Real Madrid", odds: ["+150", "+155", "+145", ""] },
        { name: "Barcelona", odds: ["+170", "+165", "+175", "+160"] },
        { name: "Draw", odds: ["+240", "+235", "+230", ""] }
    ];
    
    demoOutcomes.forEach((outcome, idx) => {
        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.innerHTML = `
            <div class="outcome-name">
                <input type="text" class="outcome-input" placeholder="Outcome name" value="${outcome.name}">
            </div>
            <div class="bookmaker-odds">
                <input type="text" class="odds-input" placeholder="+150" data-bookmaker="0" value="${outcome.odds[0]}">
                <input type="text" class="odds-input" placeholder="-110" data-bookmaker="1" value="${outcome.odds[1]}">
                <input type="text" class="odds-input" placeholder="2.50" data-bookmaker="2" value="${outcome.odds[2]}">
                <input type="text" class="odds-input" placeholder="N/A" data-bookmaker="3" value="${outcome.odds[3]}">
            </div>
            <button class="btn btn-red remove-outcome"><i class="fas fa-trash"></i></button>
        `;
        outcomesContainer.appendChild(row);
        
        // Add event listener to remove button
        row.querySelector('.remove-outcome').addEventListener('click', function() {
            removeOutcomeRow(this);
        });
    });
    
    // Trigger analysis after a short delay
    setTimeout(() => {
        document.getElementById('analyzeBtn').click();
    }, 300);
}

// Handle CSV file upload
function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCsvData(text);
    };
    reader.readAsText(file);
}

// Parse CSV data
function parseCsvData(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['Bookmaker', 'home_team', 'away_team', 'label', 'price'];
    const hasAllHeaders = requiredHeaders.every(h => headers.includes(h));
    
    if (!hasAllHeaders) {
        alert('Invalid CSV format. Required columns: Bookmaker, home_team, away_team, label, price');
        return;
    }
    
    // Parse data rows
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        csvData.push(row);
    }
    
    // Group data by matches
    groupMatchData();
    
    // Show match selector
    document.getElementById('matchSelectionContainer').style.display = 'block';
    document.getElementById('clearCsvBtn').style.display = 'block';
    
    // Populate match selector
    populateMatchSelector();
}

// Group CSV data by matches
function groupMatchData() {
    parsedMatches = {};
    
    csvData.forEach(row => {
        const matchKey = `${row.home_team} vs ${row.away_team}`;
        
        if (!parsedMatches[matchKey]) {
            parsedMatches[matchKey] = {
                home_team: row.home_team,
                away_team: row.away_team,
                outcomes: {}
            };
        }
        
        // Initialize outcome if not exists
        if (!parsedMatches[matchKey].outcomes[row.label]) {
            parsedMatches[matchKey].outcomes[row.label] = {
                name: row.label,
                odds: ['', '', '', ''] // FanDuel, Bet365, BetOnline, Pinnacle
            };
        }
        
        // Map bookmaker to index
        const bookmakerMap = {
            'FanDuel': 0,
            'Bet365': 1,
            'BetOnline.ag': 2,
            'BetOnline': 2,
            'Pinnacle': 3
        };
        
        const bookmakerIndex = bookmakerMap[row.Bookmaker];
        if (bookmakerIndex !== undefined) {
            // Format odds with + sign if positive
            let formattedPrice = row.price;
            if (!formattedPrice.startsWith('-') && !formattedPrice.startsWith('+')) {
                formattedPrice = '+' + formattedPrice;
            }
            parsedMatches[matchKey].outcomes[row.label].odds[bookmakerIndex] = formattedPrice;
        }
    });
}

// Populate match selector dropdown
function populateMatchSelector() {
    const selector = document.getElementById('matchSelector');
    selector.innerHTML = '<option value="">-- Select a match --</option>';
    
    Object.keys(parsedMatches).forEach(matchKey => {
        const option = document.createElement('option');
        option.value = matchKey;
        option.textContent = matchKey;
        selector.appendChild(option);
    });
}

// Handle match selection
function handleMatchSelection(event) {
    const matchKey = event.target.value;
    if (!matchKey || !parsedMatches[matchKey]) return;
    
    const match = parsedMatches[matchKey];
    
    // Set event name
    document.getElementById('eventName').value = matchKey;
    
    // Set market type to Moneyline (most common for match odds)
    document.getElementById('marketType').value = 'Moneyline';
    
    // Clear existing outcomes
    const outcomesContainer = document.getElementById('outcomesContainer');
    outcomesContainer.innerHTML = '';
    
    // Create outcome rows for each label in the match
    const outcomes = Object.values(match.outcomes);
    outcomes.forEach((outcome, index) => {
        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.innerHTML = `
            <div class="outcome-name flex-1">
                <input type="text" class="outcome-input w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg" placeholder="Outcome Name" value="${outcome.name}">
            </div>
            <div class="bookmaker-odds flex gap-2">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="FanDuel" data-bookmaker="0" value="${outcome.odds[0]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Bet365" data-bookmaker="1" value="${outcome.odds[1]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="BetOnline" data-bookmaker="2" value="${outcome.odds[2]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Pinnacle" data-bookmaker="3" value="${outcome.odds[3]}">
            </div>
            <button class="remove-outcome px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        outcomesContainer.appendChild(row);
        
        // Add event listener to remove button
        row.querySelector('.remove-outcome').addEventListener('click', function() {
            removeOutcomeRow(this);
        });
    });
    
    // Show success message
    const infoBox = document.createElement('div');
    infoBox.className = 'bg-primary/10 border border-primary/20 rounded-lg p-4 text-primary text-sm mb-4';
    infoBox.innerHTML = '<span class="material-symbols-outlined float-left mr-2">check_circle</span>Match data loaded successfully! Click "Analyze Odds" to see the results.';
    
    // Insert info box before the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.parentElement.insertBefore(infoBox, analyzeBtn);
    
    // Remove info box after 3 seconds
    setTimeout(() => {
        infoBox.remove();
    }, 3000);
}

// Clear CSV data
function clearCsvData() {
    csvData = null;
    parsedMatches = null;
    document.getElementById('csvFileInput').value = '';
    document.getElementById('matchSelector').innerHTML = '<option value="">-- Select a match --</option>';
    document.getElementById('matchSelectionContainer').style.display = 'none';
    document.getElementById('clearCsvBtn').style.display = 'none';
    
    // Optionally clear the form
    document.getElementById('eventName').value = '';
    const outcomesContainer = document.getElementById('outcomesContainer');
    outcomesContainer.innerHTML = '';
    
    // Add back default rows
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.innerHTML = `
            <div class="outcome-name flex-1">
                <input type="text" class="outcome-input w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg" placeholder="Outcome Name" value="${i === 1 ? 'Draw' : ''}">
            </div>
            <div class="bookmaker-odds flex gap-2">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="FanDuel" data-bookmaker="0">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Bet365" data-bookmaker="1">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="BetOnline" data-bookmaker="2">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Pinnacle" data-bookmaker="3">
            </div>
            <button class="remove-outcome px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        outcomesContainer.appendChild(row);
        
        row.querySelector('.remove-outcome').addEventListener('click', function() {
            removeOutcomeRow(this);
        });
    }
}

// =================================================
// API Integration Functions
// =================================================

// Handle saving API key
async function handleSaveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const btn = document.getElementById('saveApiKeyBtn');
    const key = input.value.trim();
    
    if (!key) {
        alert('Please enter an API key');
        return;
    }
    
    // Show loading state
    btn.textContent = 'Verifying...';
    btn.disabled = true;
    
    try {
        // Test the API key by fetching sports
        const response = await fetch(`${API_BASE_URL}/sports/?apiKey=${key}`);
        
        if (!response.ok) {
            throw new Error('Invalid API key');
        }
        
        // Save the key
        apiKey = key;
        localStorage.setItem('oddsApiKey', key);
        
        // Show success
        btn.textContent = '✓ Saved';
        btn.classList.remove('bg-primary/20', 'text-primary');
        btn.classList.add('bg-green-500/20', 'text-green-500');
        
        // Initialize the API section
        await initializeApiSection();
        
        // Reset button after delay
        setTimeout(() => {
            btn.textContent = 'Save';
            btn.classList.remove('bg-green-500/20', 'text-green-500');
            btn.classList.add('bg-primary/20', 'text-primary');
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('API key validation error:', error);
        alert('Invalid API key. Please check and try again.');
        btn.textContent = 'Save';
        btn.disabled = false;
    }
}

// Initialize API section after key is saved
async function initializeApiSection() {
    try {
        // Show loading message
        const sportSelector = document.getElementById('sportSelector');
        sportSelector.innerHTML = '<option value="">-- Loading sports... --</option>';
        
        // Fetch available sports
        const response = await fetch(`${API_BASE_URL}/sports/?apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch sports');
        }
        
        availableSports = await response.json();
        
        // Filter to only show active sports
        availableSports = availableSports.filter(sport => sport.active);
        
        // Populate sport selector
        sportSelector.innerHTML = '<option value="">-- Select a sport --</option>';
        availableSports.forEach(sport => {
            const option = document.createElement('option');
            option.value = sport.key;
            option.textContent = `${sport.title} (${sport.group})`;
            sportSelector.appendChild(option);
        });
        
        // Show the sport selection container
        document.getElementById('sportSelectionContainer').style.display = 'block';
        document.getElementById('marketSelectionContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Error initializing API section:', error);
        alert('Failed to load sports. Please check your API key.');
    }
}

// Handle sport selection
async function handleSportSelection() {
    const sportKey = document.getElementById('sportSelector').value;
    
    if (!sportKey) {
        document.getElementById('eventSelectionContainer').style.display = 'none';
        document.getElementById('loadFromApiBtn').style.display = 'none';
        return;
    }
    
    try {
        // Show loading message
        const eventSelector = document.getElementById('eventSelector');
        eventSelector.innerHTML = '<option value="">-- Loading events... --</option>';
        document.getElementById('eventSelectionContainer').style.display = 'block';
        
        // Get selected markets
        const marketKey = document.getElementById('marketSelector').value;
        
        // Fetch events with odds
        const bookmakerParam = BOOKMAKER_KEYS.join(',');
        const url = `${API_BASE_URL}/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us,us2&markets=${marketKey}&bookmakers=${bookmakerParam}&oddsFormat=american`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        
        availableEvents = await response.json();
        
        // Capture API credit information from headers
        apiCreditsRemaining = response.headers.get('x-requests-remaining');
        apiCreditsUsed = response.headers.get('x-requests-used');
        apiCreditsLastCall = response.headers.get('x-requests-last');
        
        // Display API credits info
        displayApiCreditsInfo();
        
        // Populate event selector
        eventSelector.innerHTML = '<option value="">-- Select a game --</option>';
        
        if (availableEvents.length === 0) {
            eventSelector.innerHTML = '<option value="">-- No events available --</option>';
        } else {
            availableEvents.forEach((event, index) => {
                const option = document.createElement('option');
                option.value = index;
                const date = new Date(event.commence_time);
                option.textContent = `${event.away_team} @ ${event.home_team} (${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`;
                eventSelector.appendChild(option);
            });
            
            // Show load button
            document.getElementById('loadFromApiBtn').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error fetching events:', error);
        alert('Failed to load events. Please try again.');
    }
}

// Handle loading odds from API
function handleLoadFromApi() {
    const eventIndex = document.getElementById('eventSelector').value;
    
    if (eventIndex === '') {
        alert('Please select a game');
        return;
    }
    
    const event = availableEvents[eventIndex];
    const marketKey = document.getElementById('marketSelector').value;
    
    // Set event name
    document.getElementById('eventName').value = `${event.away_team} @ ${event.home_team}`;
    
    // Set market type based on selection
    const marketTypeMap = {
        'h2h': 'Moneyline',
        'spreads': 'Spread',
        'totals': 'Total',
        'h2h,spreads': 'Moneyline',
        'h2h,totals': 'Moneyline'
    };
    document.getElementById('marketType').value = marketTypeMap[marketKey] || 'Moneyline';
    
    // Clear existing outcomes
    const outcomesContainer = document.getElementById('outcomesContainer');
    outcomesContainer.innerHTML = '';
    
    // Process markets
    const markets = marketKey.split(',');
    const processedOutcomes = {};
    
    // Collect odds from all bookmakers
    event.bookmakers.forEach(bookmaker => {
        const bookmakerIndex = BOOKMAKER_MAP[bookmaker.key];
        if (bookmakerIndex === undefined) return;
        
        bookmaker.markets.forEach(market => {
            // Process each market type
            market.outcomes.forEach(outcome => {
                let outcomeName = outcome.name;
                
                // For spreads and totals, include the point in the outcome name
                if (market.key === 'spreads' && outcome.point) {
                    outcomeName = `${outcome.name} (${outcome.point > 0 ? '+' : ''}${outcome.point})`;
                } else if (market.key === 'totals') {
                    outcomeName = `${outcome.name} ${outcome.point}`;
                }
                
                // Initialize outcome if it doesn't exist
                if (!processedOutcomes[outcomeName]) {
                    processedOutcomes[outcomeName] = {
                        name: outcomeName,
                        odds: ['', '', '', ''] // FanDuel, Bet365, BetOnline, Pinnacle
                    };
                }
                
                // Store the odds with proper formatting
                let formattedPrice = outcome.price.toString();
                if (!formattedPrice.startsWith('-') && !formattedPrice.startsWith('+')) {
                    formattedPrice = '+' + formattedPrice;
                }
                processedOutcomes[outcomeName].odds[bookmakerIndex] = formattedPrice;
            });
        });
    });
    
    // Create outcome rows
    Object.values(processedOutcomes).forEach((outcome, index) => {
        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.innerHTML = `
            <div class="outcome-name flex-1">
                <input type="text" class="outcome-input w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg" placeholder="Outcome Name" value="${outcome.name}">
            </div>
            <div class="bookmaker-odds flex gap-2">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="FanDuel" data-bookmaker="0" value="${outcome.odds[0]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Bet365" data-bookmaker="1" value="${outcome.odds[1]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="BetOnline" data-bookmaker="2" value="${outcome.odds[2]}">
                <input type="text" class="odds-input w-20 px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded text-center text-xs" placeholder="Pinnacle" data-bookmaker="3" value="${outcome.odds[3]}">
            </div>
            <button class="remove-outcome px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        outcomesContainer.appendChild(row);
        
        // Add event listener to remove button
        row.querySelector('.remove-outcome').addEventListener('click', function() {
            removeOutcomeRow(this);
        });
    });
    
    // Show success message with API credit info
    const infoBox = document.createElement('div');
    infoBox.className = 'bg-primary/10 border border-primary/20 rounded-lg p-4 text-primary text-sm mb-4';
    
    let successMessage = '<span class="material-symbols-outlined float-left mr-2">check_circle</span>';
    successMessage += '<div><strong>Live odds loaded successfully!</strong> Click "Analyze Odds" to see the results.';
    
    // Add credit information if available
    if (apiCreditsLastCall !== null && apiCreditsRemaining !== null) {
        successMessage += `<br><span class="text-xs mt-1 inline-block">📊 API Credits Used: <strong>${apiCreditsLastCall}</strong> | Remaining: <strong>${parseInt(apiCreditsRemaining).toLocaleString()}</strong></span>`;
    }
    
    successMessage += '</div>';
    infoBox.innerHTML = successMessage;
    
    // Insert info box before the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.parentElement.insertBefore(infoBox, analyzeBtn);
    
    // Remove info box after 5 seconds
    setTimeout(() => {
        infoBox.remove();
    }, 5000);
    
    // Scroll to outcomes
    outcomesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display API credits information
function displayApiCreditsInfo() {
    // Remove any existing credit info boxes
    const existingInfo = document.getElementById('apiCreditsInfo');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Only show if we have credit information
    if (!apiCreditsRemaining && !apiCreditsUsed) {
        return;
    }
    
    // Create the info box
    const infoBox = document.createElement('div');
    infoBox.id = 'apiCreditsInfo';
    infoBox.className = 'bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm mb-4';
    infoBox.style.cssText = 'margin-top: 10px;';
    
    let html = '<div class="flex items-start gap-2">';
    html += '<span class="material-symbols-outlined text-blue-400" style="font-size: 20px;">info</span>';
    html += '<div class="flex-1">';
    html += '<div class="font-bold text-blue-400 mb-2">API Usage Information</div>';
    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">';
    
    // Credits remaining
    if (apiCreditsRemaining !== null) {
        const remaining = parseInt(apiCreditsRemaining);
        const colorClass = remaining > 1000 ? 'text-green-400' : remaining > 100 ? 'text-yellow-400' : 'text-red-400';
        html += `<div class="flex flex-col">
            <span class="text-xs text-slate-400">Credits Remaining</span>
            <span class="text-lg font-bold ${colorClass}">${remaining.toLocaleString()}</span>
        </div>`;
    }
    
    // Credits used
    if (apiCreditsUsed !== null) {
        html += `<div class="flex flex-col">
            <span class="text-xs text-slate-400">Total Used This Month</span>
            <span class="text-lg font-bold text-blue-400">${parseInt(apiCreditsUsed).toLocaleString()}</span>
        </div>`;
    }
    
    // Last call cost
    if (apiCreditsLastCall !== null) {
        html += `<div class="flex flex-col">
            <span class="text-xs text-slate-400">Last Request Cost</span>
            <span class="text-lg font-bold text-orange-400">${parseInt(apiCreditsLastCall).toLocaleString()}</span>
        </div>`;
    }
    
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    infoBox.innerHTML = html;
    
    // Insert after the event selector container
    const eventContainer = document.getElementById('eventSelectionContainer');
    if (eventContainer && eventContainer.style.display !== 'none') {
        eventContainer.parentNode.insertBefore(infoBox, eventContainer.nextSibling);
    }
}

// =================================================
// Odds Calculation Functions (from odds-calculations.js)
// =================================================

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

// =================================================
// Odds Utility Functions (from odds-utils.js)
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

// =================================================
// Results Display Functions (from odds-display.js)
// =================================================

// Display analysis results
function displayAnalysisResults(eventName, marketType, outcomes) {
    const resultsDiv = document.getElementById('resultsContent');
    let html = `
        <h3>${eventName} | ${marketType}</h3>
        <div class="info-box">
            <i class="fas fa-info-circle"></i> Analysis based on odds from ${bookmakers.join(', ')}
        </div>
    `;
    
    // Add comprehensive odds table
    html += createOddsTable(outcomes);
    
    // Add best value bets section
    html += createBestValueBetsSection(outcomes);
    
    // Add bookmaker performance section
    html += createBookmakerPerformanceSection(outcomes);
    
    // Add implied probabilities section
    html += createImpliedProbabilitiesSection(outcomes);
    
    resultsDiv.innerHTML = html;
    document.getElementById('analysisResults').style.display = 'block';
    
    // Make average odds copyable - call with a delay
    setTimeout(() => {
        makeAverageOddsCopyable();
    }, 500);
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create comprehensive odds table
function createOddsTable(outcomes) {
    let html = `
        <h4>Comprehensive Odds Table</h4>
        <table>
            <thead>
                <tr>
                    <th>Outcome</th>
                    ${bookmakers.map(b => `<th>${b}</th>`).join('')}
                    <th>Average</th>
                    <th>Best</th>
                    <th>Best Bookmaker</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    outcomes.forEach(outcome => {
        html += `<tr>`;
        html += `<td><strong>${outcome.name}</strong></td>`;
        
        // Bookmaker odds
        for (let i = 0; i < 4; i++) {
            if (outcome.available[i]) {
                html += `<td>${formatAmericanOdds(outcome.odds[i])}</td>`;
            } else {
                html += `<td>-</td>`;
            }
        }
        
        // Average odds
        html += `<td><strong>${formatAmericanOdds(outcome.averageOdds)}</strong></td>`;
        
        // Best odds
        html += `<td class="positive"><strong>${formatAmericanOdds(outcome.bestOdds)}</strong></td>`;
        
        // Best bookmaker
        if (outcome.bestIndex >= 0) {
            html += `<td><span class="bookmaker-tag">${bookmakers[outcome.bestIndex]}</span></td>`;
        } else {
            html += `<td>N/A</td>`;
        }
        
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    return html;
}

// Make average odds copyable with nice tooltip
function makeAverageOddsCopyable() {
    setTimeout(() => {
        const averageCells = document.querySelectorAll('table tbody tr td:nth-child(6)');
        
        averageCells.forEach(cell => {
            const oddsValue = cell.textContent.trim();
            
            // Skip if empty or special values
            if (!oddsValue || oddsValue === '-' || oddsValue === 'N/A' || 
                oddsValue === 'Average' || oddsValue === 'Copied!') return;
            
            // Add copy functionality if not already added
            if (!cell.classList.contains('copy-enabled')) {
                cell.classList.add('copy-enabled');
                
                // Store original content in a span
                const contentSpan = document.createElement('span');
                contentSpan.textContent = oddsValue;
                contentSpan.className = 'odds-value';
                cell.innerHTML = '';
                cell.appendChild(contentSpan);
                
                // Create the nice tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'copy-tooltip';
                tooltip.textContent = '📋 Click to copy';
                
                // Add tooltip styles
                tooltip.style.cssText = `
                    position: absolute;
                    top: -40px;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    background: linear-gradient(135deg, #1e293b, #334155);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1000;
                    pointer-events: none;
                    font-family: 'Lexend', sans-serif;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                `;
                
                // Add tooltip arrow
                const arrow = document.createElement('div');
                arrow.style.cssText = `
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid #1e293b;
                `;
                tooltip.appendChild(arrow);
                
                // Add dark mode support
                if (document.documentElement.classList.contains('dark')) {
                    tooltip.style.background = 'linear-gradient(135deg, #13ec5b, #0fa848)';
                    tooltip.style.color = '#102216';
                    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    arrow.style.borderTopColor = '#13ec5b';
                }
                
                cell.appendChild(tooltip);
                
                // Store original value
                const cleanValue = oddsValue.replace(/[^\d\+\-\.]/g, '');
                
                // Click to copy
                cell.addEventListener('click', async function() {
                    try {
                        await navigator.clipboard.writeText(cleanValue);
                        
                        // Show success - update the content span, not the whole cell
                        contentSpan.textContent = '✓ Copied!';
                        contentSpan.style.color = '#13ec5b';
                        contentSpan.style.fontWeight = 'bold';
                        
                        // Update tooltip to show success
                        tooltip.textContent = '✓ Copied!';
                        tooltip.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        tooltip.style.color = 'white';
                        arrow.style.borderTopColor = '#10b981';
                        
                        // Keep tooltip visible
                        tooltip.style.opacity = '1';
                        tooltip.style.visibility = 'visible';
                        
                        // Reset after 1.5 seconds
                        setTimeout(() => {
                            // Restore original odds value
                            contentSpan.textContent = oddsValue;
                            contentSpan.style.color = '';
                            contentSpan.style.fontWeight = '';
                            
                            // Restore tooltip
                            tooltip.textContent = '📋 Click to copy';
                            tooltip.style.background = document.documentElement.classList.contains('dark') 
                                ? 'linear-gradient(135deg, #13ec5b, #0fa848)' 
                                : 'linear-gradient(135deg, #1e293b, #334155)';
                            tooltip.style.color = document.documentElement.classList.contains('dark') 
                                ? '#102216' : 'white';
                            arrow.style.borderTopColor = document.documentElement.classList.contains('dark') 
                                ? '#13ec5b' : '#1e293b';
                            
                            // Hide tooltip until hover
                            tooltip.style.opacity = '0';
                            tooltip.style.visibility = 'hidden';
                        }, 1500);
                        
                    } catch (err) {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = cleanValue;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Still show success
                        contentSpan.textContent = '✓ Copied!';
                        contentSpan.style.color = '#13ec5b';
                        
                        setTimeout(() => {
                            contentSpan.textContent = oddsValue;
                            contentSpan.style.color = '';
                        }, 1500);
                    }
                });
                
                // Hover effects
                cell.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = 'rgba(19, 236, 91, 0.15)';
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                    tooltip.style.transform = 'translateX(-50%) translateY(0)';
                });
                
                cell.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '';
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.transform = 'translateX(-50%) translateY(10px)';
                });
            }
        });
    }, 100);
}

// Create best value bets section
function createBestValueBetsSection(outcomes) {
    let html = `<h4>Best Value Bets</h4>`;
    let foundValue = false;
    
    outcomes.forEach(outcome => {
        if (outcome.bestOdds > outcome.averageOdds && outcome.bestIndex >= 0) {
            const valuePercentage = ((outcome.bestOdds - outcome.averageOdds) / outcome.averageOdds) * 100.0;
            html += `
                <div style="margin: 10px 0; padding: 10px; background-color: #f0f8ff; border-radius: 5px;">
                    <strong>✅ ${outcome.name}:</strong> ${bookmakers[outcome.bestIndex]} offers ${formatAmericanOdds(outcome.bestOdds)}
                    <div style="font-size: 0.9rem; color: #555;">
                        Average: ${formatAmericanOdds(outcome.averageOdds)} | Edge: <span class="positive">+${valuePercentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;
            foundValue = true;
        }
    });
    
    if (!foundValue) {
        html += `<p>No odds found significantly above the market average.</p>`;
    }
    
    return html;
}

// Create bookmaker performance section
function createBookmakerPerformanceSection(outcomes) {
    let html = `<h4>Bookmaker Performance</h4>`;
    const bestCount = [0, 0, 0, 0];
    let totalComparisons = 0;
    
    outcomes.forEach(outcome => {
        if (outcome.bestIndex >= 0) {
            bestCount[outcome.bestIndex]++;
            totalComparisons++;
        }
    });
    
    if (totalComparisons > 0) {
        html += `<table>
            <thead>
                <tr>
                    <th>Bookmaker</th>
                    <th>Best Odds Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>`;
        
        for (let i = 0; i < 4; i++) {
            const percentage = (bestCount[i] / totalComparisons) * 100;
            html += `
                <tr>
                    <td><strong>${bookmakers[i]}</strong></td>
                    <td>${bestCount[i]}/${totalComparisons}</td>
                    <td><span class="${percentage > 25 ? 'positive' : 'negative'}">${percentage.toFixed(1)}%</span></td>
                </tr>
            `;
        }
        
        html += `</tbody></table>`;
    }
    
    return html;
}

// Create implied probabilities section with no-vig fair odds
function createImpliedProbabilitiesSection(outcomes) {
    let html = `<h4>Implied Probabilities & Market Efficiency</h4>`;
    let totalProbability = 0;
    
    // Calculate raw implied probabilities
    const rawProbabilities = outcomes.map(outcome => {
        const probability = calculateImpliedProbability(outcome.averageOdds);
        return probability;
    });
    
    // Calculate total probability
    totalProbability = rawProbabilities.reduce((sum, prob) => sum + prob, 0);
    
    // Calculate no-vig probabilities
    const noVigProbabilities = rawProbabilities.map(prob => {
        return (prob / totalProbability) * 100;
    });
    
    // Convert no-vig probabilities back to fair odds
    const fairOdds = noVigProbabilities.map(prob => {
        if (prob > 0) {
            // Convert percentage back to decimal odds
            const decimalOdds = 100 / prob;
            return formatAmericanOdds(decimalOdds);
        }
        return "N/A";
    });
    
    html += `<table>
        <thead>
            <tr>
                <th>Outcome</th>
                <th>Avg Odds</th>
                <th>Implied Probability</th>
                <th>Fair Odds (No Vig)</th>
                <th>Fair Probability</th>
            </tr>
        </thead>
        <tbody>`;
    
    outcomes.forEach((outcome, index) => {
        const probability = rawProbabilities[index];
        const fairProb = noVigProbabilities[index];
        const fairOdd = fairOdds[index];
        
        html += `
            <tr>
                <td>${outcome.name}</td>
                <td>${formatAmericanOdds(outcome.averageOdds)}</td>
                <td>${probability.toFixed(1)}%</td>
                <td><strong class="positive">${fairOdd}</strong></td>
                <td><strong class="positive">${fairProb.toFixed(1)}%</strong></td>
            </tr>
        `;
    });
    
    html += `
        <tr style="background-color: rgba(19, 236, 91, 0.1);">
            <td><strong>Total</strong></td>
            <td></td>
            <td><strong>${totalProbability.toFixed(1)}%</strong></td>
            <td></td>
            <td><strong>${noVigProbabilities.reduce((sum, prob) => sum + prob, 0).toFixed(1)}%</strong></td>
        </tr>
    `;
    
    html += `</tbody></table>`;
    
    const margin = totalProbability - 100;
    const vigPercentage = ((totalProbability - 100) / totalProbability) * 100;
    
    let marginComment = '';
    
    if (margin > 5) {
        marginComment = '<div class="warning-box">⚠️ High margin market (>5%) - odds may not be efficient</div>';
    } else if (margin > 2) {
        marginComment = '<div class="info-box">ℹ️ Moderate margin market (2-5%) - typical for sports betting</div>';
    } else {
        marginComment = '<div class="info-box">✓ Low margin market (<2%) - highly efficient odds</div>';
    }
    
    html += `<p style="margin-top: 10px;"><strong>Sportsbook Margin (Vig):</strong> <span class="${margin > 0 ? 'negative' : 'positive'}">${margin.toFixed(1)}%</span></p>`;
    html += marginComment;
    
    return html;
}