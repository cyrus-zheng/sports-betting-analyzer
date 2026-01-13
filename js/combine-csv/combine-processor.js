// Data Processing and Combination
// =================================================

function calculateAdvancedMetrics(teamData) {
    // Calculate xG differential
    if (teamData.xG !== undefined && teamData.xGA !== undefined) {
        teamData.xGDiff = teamData.xG - teamData.xGA;
    }
    
    // Calculate xG per 90
    if (teamData.xG !== undefined && teamData.MP !== undefined && teamData.MP > 0) {
        teamData.xGPer90 = (teamData.xG / teamData.MP).toFixed(2);
    }
    
    // Calculate xGA per 90
    if (teamData.xGA !== undefined && teamData.MP !== undefined && teamData.MP > 0) {
        teamData.xGAPer90 = (teamData.xGA / teamData.MP).toFixed(2);
    }
    
    return teamData;
}

async function combineCSVFiles() {
    showStatus('Processing files...', 'info');
    
    try {
        // Read all files
        const overallText = await readCSVFile(overallStatsFile);
        const homeAwayText = await readCSVFile(homeAwayFile);
        const recentFormText = await readCSVFile(recentFormFile);
        const recentHomeText = await readCSVFile(recentHomeFile);
        const recentAwayText = await readCSVFile(recentAwayFile);
        const overallHomeAwayText = await readCSVFile(overallHomeAwayFile);
        
        // Parse all CSVs
        const overall = parseCSV(overallText);
        const homeAway = parseCSV(homeAwayText);
        const recentForm = parseCSV(recentFormText);
        const recentHome = parseCSV(recentHomeText);
        const recentAway = parseCSV(recentAwayText);
        const overallHomeAway = parseCSV(overallHomeAwayText);
        
        // Store parsed data
        parsedData.overall = overall.data;
        parsedData.home = homeAway.data;
        parsedData.away = homeAway.data; // Same file contains both
        parsedData.recentForm = recentForm.data;
        parsedData.recentHome = recentHome.data;
        parsedData.recentAway = recentAway.data;
        parsedData.overallHomeAway = overallHomeAway.data;
        
        // Combine all data
        const combinedData = combineAllData(
            parsedData.overall,
            parsedData.home,
            parsedData.away,
            parsedData.recentForm,
            parsedData.recentHome,
            parsedData.recentAway
        );
        
        // Show results
        showStatus(`Successfully combined data for ${combinedData.length} teams!`, 'success');
        updateFileDetails(combinedData);
        showDataPreview(combinedData);
        
        // Enable download button
        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('downloadBtn').classList.remove('opacity-50', 'cursor-not-allowed');
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error combining files:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

function combineAllData(overallData, homeData, awayData, recentFormData, recentHomeData, recentAwayData) {
    const combinedData = [];
    
    // Use overall data as base
    overallData.forEach(team => {
        const teamName = team.Squad;
        
        // Start with overall stats
        const combined = {
            Squad: teamName,
            // Overall season stats
            MP: team.MP || team.matches,
            W: team.W || team.wins,
            D: team.D || team.draws,
            L: team.L || team.loses,
            GF: team.GF || team.goals,
            GA: team.GA || team.ga,
            GD: team.GD || team.gd,
            Pts: team.Pts || team.points,
            xG: team.xG || team.xg,
            xGA: team.xGA || team.xga,
            xGD: team.xGD || team.xgd
        };
        
        // Add home stats
        const homeStats = homeData.find(t => standardizeTeamName(t.Squad || t.Team) === teamName);
        if (homeStats) {
            combined.Home_MP = homeStats.MP || homeStats.matches || 0;
            combined.Home_W = homeStats.W || homeStats.wins || 0;
            combined.Home_D = homeStats.D || homeStats.draws || 0;
            combined.Home_L = homeStats.L || homeStats.loses || 0;
            combined.Home_GF = homeStats.GF || homeStats.goals || 0;
            combined.Home_GA = homeStats.GA || homeStats.ga || 0;
            combined.Home_xG = homeStats.xG || homeStats.xg || 0;
            combined.Home_xGA = homeStats.xGA || homeStats.xga || 0;
        }
        
        // Add away stats
        const awayStats = awayData.find(t => standardizeTeamName(t.Squad || t.Team) === teamName);
        if (awayStats) {
            combined.Away_MP = awayStats.MP || awayStats.matches || 0;
            combined.Away_W = awayStats.W || awayStats.wins || 0;
            combined.Away_D = awayStats.D || awayStats.draws || 0;
            combined.Away_L = awayStats.L || awayStats.loses || 0;
            combined.Away_GF = awayStats.GF || awayStats.goals || 0;
            combined.Away_GA = awayStats.GA || awayStats.ga || 0;
            combined.Away_xG = awayStats.xG || awayStats.xg || 0;
            combined.Away_xGA = awayStats.xGA || awayStats.xga || 0;
        }
        
        // Add recent form (overall)
        const recentForm = recentFormData.find(t => standardizeTeamName(t.Squad || t.Team) === teamName);
        if (recentForm) {
            combined.Recent_matches = recentForm.MP || recentForm.matches || 0;
            combined.Recent_wins = recentForm.W || recentForm.wins || 0;
            combined.Recent_draws = recentForm.D || recentForm.draws || 0;
            combined.Recent_loses = recentForm.L || recentForm.loses || 0;
            combined.Recent_goals = recentForm.GF || recentForm.goals || 0;
            combined.Recent_ga = recentForm.GA || recentForm.ga || 0;
            combined.Recent_points = recentForm.Pts || recentForm.points || 0;
            combined.Recent_xG = recentForm.xG || recentForm.xg || 0;
            combined.Recent_xGA = recentForm.xGA || recentForm.xga || 0;
        }
        
        // Add recent home form
        const recentHome = recentHomeData.find(t => standardizeTeamName(t.Squad || t.Team) === teamName);
        if (recentHome) {
            combined.RecentHome_matches = recentHome.MP || recentHome.matches || 0;
            combined.RecentHome_wins = recentHome.W || recentHome.wins || 0;
            combined.RecentHome_draws = recentHome.D || recentHome.draws || 0;
            combined.RecentHome_loses = recentHome.L || recentHome.loses || 0;
            combined.RecentHome_goals = recentHome.GF || recentHome.goals || 0;
            combined.RecentHome_ga = recentHome.GA || recentHome.ga || 0;
            combined.RecentHome_points = recentHome.Pts || recentHome.points || 0;
            combined.RecentHome_xG = recentHome.xG || recentHome.xg || 0;
            combined.RecentHome_xGA = recentHome.xGA || recentHome.xga || 0;
        }
        
        // Add recent away form
        const recentAway = recentAwayData.find(t => standardizeTeamName(t.Squad || t.Team) === teamName);
        if (recentAway) {
            combined.RecentAway_matches = recentAway.MP || recentAway.matches || 0;
            combined.RecentAway_wins = recentAway.W || recentAway.wins || 0;
            combined.RecentAway_draws = recentAway.D || recentAway.draws || 0;
            combined.RecentAway_loses = recentAway.L || recentAway.loses || 0;
            combined.RecentAway_goals = recentAway.GF || recentAway.goals || 0;
            combined.RecentAway_ga = recentAway.GA || recentAway.ga || 0;
            combined.RecentAway_points = recentAway.Pts || recentAway.points || 0;
            combined.RecentAway_xG = recentAway.xG || recentAway.xg || 0;
            combined.RecentAway_xGA = recentAway.xGA || recentAway.xga || 0;
        }
        
        // Calculate advanced metrics
        calculateAdvancedMetrics(combined);
        
        combinedData.push(combined);
    });
    
    return combinedData;
}

function updateFileDetails(data) {
    document.getElementById('teamCount').textContent = data.length;
    document.getElementById('columnCount').textContent = Object.keys(data[0] || {}).length;
}

function showDataPreview(data) {
    const previewTable = document.getElementById('previewTable');
    
    if (data.length === 0) {
        previewTable.innerHTML = '<p>No data to preview</p>';
        return;
    }
    
    // Get headers from first row
    const headers = Object.keys(data[0]);
    
    // Build table HTML
    let html = '<table class="preview-table"><thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Show first 5 rows
    const previewRows = data.slice(0, 5);
    previewRows.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            html += `<td>${value !== undefined && value !== null ? value : '-'}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (data.length > 5) {
        html += `<p style="margin-top: 10px; color: #a0a0a0; font-size: 0.9rem;">Showing 5 of ${data.length} teams</p>`;
    }
    
    previewTable.innerHTML = html;
}
