// UI Event Handlers
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
