// Soccer Match Predictor - Main Entry Point
// =========================================

// Global variables
let teamData = [];
let csvFile = null;
let selectedLeague = null;

// League names mapping
const LEAGUE_NAMES = {
    laliga: "La Liga",
    premierleague: "Premier League",
    seriea: "Serie A",
    bundesliga: "Bundesliga",
    custom: "Custom CSV"
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupFileUploads();
    updateWeightDisplay();
    setupAutoProcessing();
    
    // Load from localStorage if available
    loadFromLocalStorage();
    
    // Set up weight slider listener
    const modelWeight = document.getElementById('modelWeight');
    modelWeight.addEventListener('input', updateWeightDisplay);
    
    document.getElementById('predictBtn').addEventListener('click', generatePrediction);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    
    // Set up team selection listeners
    document.getElementById('homeTeam').addEventListener('change', updateTeamDisplays);
    document.getElementById('awayTeam').addEventListener('change', updateTeamDisplays);
    
    // Set up file change listener for custom CSV
    document.getElementById('csvFile').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            csvFile = e.target.files[0];
            updateFileList(document.getElementById('fileList'), csvFile);
            
            if (selectedLeague === 'custom') {
                // Auto-process custom CSV file
                setTimeout(() => processSelectedLeague(), 500);
            }
        }
    });
});