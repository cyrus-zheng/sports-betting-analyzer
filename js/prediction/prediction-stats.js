// Soccer Match Predictor - Team Stats and Display Functions
// =========================================================

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
    
    // Update team labels
    document.getElementById('homeTeamLabel').textContent = `${homeTeam} Stats`;
    document.getElementById('awayTeamLabel').textContent = `${awayTeam} Stats`;
    
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