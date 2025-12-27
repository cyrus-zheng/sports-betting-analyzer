// Soccer Match Predictor - Results Display Functions
// ==================================================

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
    
    // Create organized HTML structure WITHOUT league statistics card
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