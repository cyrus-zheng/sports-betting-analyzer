// Sports Betting Odds Analyzer - Main Entry Point
// ===============================================

// Bookmakers in fixed order (shared globally - will be imported by other files)
const bookmakers = ["FanDuel", "Bet365", "BetOnline", "Pinnacle"];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});