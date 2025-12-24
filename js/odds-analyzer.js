// Sports Betting Odds Analyzer - JavaScript File
// ============================================

// Bookmakers in fixed order
const bookmakers = ["FanDuel", "Bet365", "BetOnline", "Pinnacle"];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
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

// Calculate implied probability from decimal odds
function calculateImpliedProbability(decimalOdds) {
    if (decimalOdds > 0) {
        return (1.0 / decimalOdds) * 100.0;
    }
    return 0.0;
}

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

// Display analysis results
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
    }, 500); // Increased delay to ensure DOM is ready
    
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

// Add clickable copy functionality to average odds cells
// Make average odds copyable with nice tooltip
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

// Create implied probabilities section
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
