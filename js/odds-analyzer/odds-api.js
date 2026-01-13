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
