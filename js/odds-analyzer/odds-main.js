// Sports Betting Odds Analyzer - Main Entry Point
// =======================================================

// Global variable to store parsed CSV data
let csvData = null;
let parsedMatches = null;

// Bookmakers in fixed order (shared globally)
const bookmakers = ["FanDuel", "Bet365", "BetOnline", "Pinnacle"];

// API Integration variables
let apiKey = localStorage.getItem('oddsApiKey') || '';
let availableSports = [];
let availableEvents = [];
let apiCreditsRemaining = null;
let apiCreditsUsed = null;
let apiCreditsLastCall = null;
const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const BOOKMAKER_KEYS = ['pinnacle', 'betonlineag', 'fanduel'];
const BOOKMAKER_MAP = {
    'pinnacle': 3,      // Pinnacle is index 3
    'betonlineag': 2,   // BetOnline is index 2
    'fanduel': 0        // FanDuel is index 0
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});
