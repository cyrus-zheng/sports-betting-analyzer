// CSV Handling Functions
// =================================================

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
