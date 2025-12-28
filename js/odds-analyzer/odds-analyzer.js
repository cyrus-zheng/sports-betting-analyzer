// Sports Betting Odds Analyzer - Main Entry Point
// ===============================================

// Global variable to store parsed CSV data
let csvData = null;
let parsedMatches = null;

// Bookmakers in fixed order (shared globally - will be imported by other files)
const bookmakers = ["FanDuel", "Bet365", "BetOnline", "Pinnacle"];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});