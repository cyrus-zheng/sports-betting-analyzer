// Analysis Engine Functions
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
