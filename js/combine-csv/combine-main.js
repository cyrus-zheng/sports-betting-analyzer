// CSV Combiner Tool - Main Entry Point
// =================================================

// Global variables
let overallStatsFile = null;
let homeAwayFile = null;
let recentFormFile = null;
let recentHomeFile = null;
let recentAwayFile = null;
let overallHomeAwayFile = null;

let parsedData = {
    overall: [],
    home: [],
    away: [],
    recentForm: [],
    recentHome: [],
    recentAway: [],
    overallHomeAway: []
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupFileUploads();
    setupEventListeners();
    updateCombineButton();
});
