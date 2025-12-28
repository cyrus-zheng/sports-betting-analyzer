// Soccer Match Predictor - Local Storage Functions
// =================================================

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