// CSV Combiner Tool - Updated for Premier League Format
// ======================================================

// File storage for 6 files
let overallFile = null;
let homeFile = null;
let awayFile = null;
let recentFormFile = null;
let recentHomeFile = null;
let recentAwayFile = null;
let combinedData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Premier League CSV Combiner initializing...');
    setupFileUploads();
    setupEventListeners();
});

// Setup all 6 file uploads
function setupFileUploads() {
    console.log('Setting up 6 file uploads...');
    
    // Setup each file upload
    setupSingleUpload('overallUpload', 'overallFile', 'overallFileList', (file) => {
        overallFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('homeUpload', 'homeFile', 'homeFileList', (file) => {
        homeFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('awayUpload', 'awayFile', 'awayFileList', (file) => {
        awayFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('recentFormUpload', 'recentFormFile', 'recentFormFileList', (file) => {
        recentFormFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('recentHomeUpload', 'recentHomeFile', 'recentHomeFileList', (file) => {
        recentHomeFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('recentAwayUpload', 'recentAwayFile', 'recentAwayFileList', (file) => {
        recentAwayFile = file;
        updateCombineButton();
    });
}

// Simple upload setup
function setupSingleUpload(uploadAreaId, fileInputId, fileListId, onSuccess) {
    const uploadArea = document.getElementById(uploadAreaId);
    const fileInput = document.getElementById(fileInputId);
    const fileList = document.getElementById(fileListId);
    
    if (!uploadArea || !fileInput || !fileList) {
        console.error(`Missing elements for ${uploadAreaId}`);
        return;
    }
    
    // Click on upload area or file input triggers file selection
    uploadArea.addEventListener('click', (e) => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Validate it's a CSV file
            if (file.name.toLowerCase().endsWith('.csv')) {
                updateFileList(fileList, file);
                onSuccess(file);
                showStatus(`✓ ${file.name} uploaded`, 'success');
            } else {
                showStatus('Please select a CSV file (.csv extension)', 'error');
                e.target.value = ''; // Clear invalid selection
            }
        }
    });
    
    // Add drag and drop
    setupDragAndDrop(uploadArea, fileInput, fileList, onSuccess);
}

// Setup drag and drop
function setupDragAndDrop(uploadArea, fileInput, fileList, onSuccess) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Add visual feedback
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });
    
    // Handle drop
    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Update file input
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            } else {
                showStatus('Please drop a CSV file (.csv extension)', 'error');
            }
        }
    }, false);
}

// Update file list display
function updateFileList(fileListElement, file) {
    const fileSize = (file.size / 1024).toFixed(2);
    fileListElement.innerHTML = `
        <div class="file-item">
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize} KB</div>
            </div>
            <i class="fas fa-check file-success"></i>
        </div>
    `;
}

// Update combine button state
function updateCombineButton() {
    const combineBtn = document.getElementById('combineBtn');
    const allFilesUploaded = overallFile && homeFile && awayFile && 
                           recentFormFile && recentHomeFile && recentAwayFile;
    
    if (allFilesUploaded) {
        combineBtn.disabled = false;
        combineBtn.innerHTML = '<i class="fas fa-magic"></i> Combine 6 CSV Files';
        combineBtn.classList.remove('opacity-50');
        showStatus('✓ All 6 files uploaded! Ready to combine.', 'success');
    } else {
        combineBtn.disabled = true;
        const uploadedCount = [overallFile, homeFile, awayFile, recentFormFile, recentHomeFile, recentAwayFile]
            .filter(f => f).length;
        combineBtn.innerHTML = `<i class="fas fa-clock"></i> Upload All 6 Files (${uploadedCount}/6)`;
        combineBtn.classList.add('opacity-50');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Combine button
    const combineBtn = document.getElementById('combineBtn');
    if (combineBtn) {
        combineBtn.addEventListener('click', combineCSVFiles);
    }
    
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCombinedCSV);
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTool);
    }
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) return;
    
    // Clear existing classes
    statusDiv.className = '';
    statusDiv.classList.add(type);
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
}

// Read CSV file
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Parse CSV text (handles semicolon delimiter as in your files)
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Remove BOM if present
    if (lines[0].charCodeAt(0) === 0xFEFF) {
        lines[0] = lines[0].substring(1);
    }
    
    // Check delimiter - your files use semicolon
    const firstLine = lines[0];
    const hasSemicolon = firstLine.includes(';');
    const delimiter = hasSemicolon ? ';' : ',';
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line, delimiter);
        
        const row = {};
        headers.forEach((header, index) => {
            if (index < values.length) {
                const value = values[index].trim().replace(/"/g, '');
                // Try to convert to number if possible
                const numValue = parseFloat(value);
                row[header] = isNaN(numValue) ? value : numValue;
            }
        });
        
        // Only add if we have a team name
        if (row.team || row.Squad) {
            data.push(row);
        }
    }
    
    return data;
}

// Parse CSV line with custom delimiter
function parseCSVLine(line, delimiter = ';') {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Standardize team names (handle variations like "Manchester Utd" vs "Manchester United")
function standardizeTeamName(name) {
    if (!name) return '';
    
    const nameLower = name.toLowerCase().trim();
    
    // Common team name variations
    const nameMap = {
        'arsenal': 'Arsenal',
        'manchester city': 'Manchester City',
        'aston villa': 'Aston Villa',
        'liverpool': 'Liverpool',
        'chelsea': 'Chelsea',
        'manchester united': 'Manchester United',
        'manchester utd': 'Manchester United',
        'brentford': 'Brentford',
        'sunderland': 'Sunderland',
        'newcastle united': 'Newcastle United',
        'newcastle utd': 'Newcastle United',
        'brighton': 'Brighton',
        'fulham': 'Fulham',
        'everton': 'Everton',
        'tottenham': 'Tottenham',
        'crystal palace': 'Crystal Palace',
        'bournemouth': 'Bournemouth',
        'leeds': 'Leeds',
        'leeds united': 'Leeds',
        'nottingham forest': 'Nottingham Forest',
        "nott'ham forest": 'Nottingham Forest',
        'west ham': 'West Ham',
        'burnley': 'Burnley',
        'wolverhampton wanderers': 'Wolverhampton Wanderers',
        'wolves': 'Wolverhampton Wanderers'
    };
    
    return nameMap[nameLower] || name;
}

// Calculate advanced metrics
function calculateAdvancedMetrics(teamData) {
    const metrics = {};
    
    // Calculate per match averages
    if (teamData.matches && teamData.matches > 0) {
        metrics.xG_per_match = teamData.xG / teamData.matches;
        metrics.xGA_per_match = teamData.xGA / teamData.matches;
        metrics.GF_per_match = teamData.goals / teamData.matches;
        metrics.GA_per_match = teamData.ga / teamData.matches;
        metrics.PTS_per_match = teamData.points / teamData.matches;
        metrics.xPTS_per_match = teamData.xPTS / teamData.matches;
        
        // Calculate efficiency ratios
        metrics.xG_efficiency = teamData.goals / teamData.xG;
        metrics.xGA_efficiency = teamData.ga / teamData.xGA;
        metrics.PTS_efficiency = teamData.points / teamData.xPTS;
        
        // Win percentage
        metrics.win_pct = (teamData.wins / teamData.matches) * 100;
        metrics.draw_pct = (teamData.draws / teamData.matches) * 100;
        metrics.loss_pct = (teamData.loses / teamData.matches) * 100;
    }
    
    // Goal difference
    metrics.GD = teamData.goals - teamData.ga;
    metrics.xGD = teamData.xG - teamData.xGA;
    
    return metrics;
}

// Combine all 6 CSV files
async function combineCSVFiles() {
    console.log('Starting CSV combination for 6 files...');
    
    // Show loading
    document.getElementById('loadingIndicator').style.display = 'block';
    const combineBtn = document.getElementById('combineBtn');
    combineBtn.disabled = true;
    combineBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing 6 files...';
    
    try {
        // Read all 6 files
        const [overallText, homeText, awayText, recentFormText, recentHomeText, recentAwayText] = await Promise.all([
            readCSVFile(overallFile),
            readCSVFile(homeFile),
            readCSVFile(awayFile),
            readCSVFile(recentFormFile),
            readCSVFile(recentHomeFile),
            readCSVFile(recentAwayFile)
        ]);
        
        // Parse CSV data
        const overallData = parseCSV(overallText);
        const homeData = parseCSV(homeText);
        const awayData = parseCSV(awayText);
        const recentFormData = parseCSV(recentFormText);
        const recentHomeData = parseCSV(recentHomeText);
        const recentAwayData = parseCSV(recentAwayText);
        
        console.log(`Loaded data: 
            Overall=${overallData.length}, 
            Home=${homeData.length}, 
            Away=${awayData.length}, 
            RecentForm=${recentFormData.length},
            RecentHome=${recentHomeData.length},
            RecentAway=${recentAwayData.length}`);
        
        // Combine data
        combinedData = combineAllData(overallData, homeData, awayData, recentFormData, recentHomeData, recentAwayData);
        
        // Show success
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('downloadSection').style.display = 'block';
        document.getElementById('previewSection').style.display = 'block';
        
        // Update file details
        updateFileDetails(combinedData);
        
        // Show preview
        showDataPreview(combinedData);
        
        showStatus('✓ All 6 CSV files combined successfully!', 'success');
        
    } catch (error) {
        console.error('Error combining CSV files:', error);
        document.getElementById('loadingIndicator').style.display = 'none';
        combineBtn.disabled = false;
        combineBtn.innerHTML = '<i class="fas fa-magic"></i> Combine 6 CSV Files';
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Combine all 6 datasets
function combineAllData(overallData, homeData, awayData, recentFormData, recentHomeData, recentAwayData) {
    const combined = [];
    
    // Create maps for quick lookup with standardized names
    const overallMap = new Map();
    const homeMap = new Map();
    const awayMap = new Map();
    const recentFormMap = new Map();
    const recentHomeMap = new Map();
    const recentAwayMap = new Map();
    
    // Populate maps with standardized team names
    [overallData, homeData, awayData, recentFormData, recentHomeData, recentAwayData].forEach((data, index) => {
        const map = [overallMap, homeMap, awayMap, recentFormMap, recentHomeMap, recentAwayMap][index];
        
        data.forEach(team => {
            const teamName = team.team || team.Squad || '';
            const standardizedName = standardizeTeamName(teamName);
            if (standardizedName) {
                map.set(standardizedName, team);
            }
        });
    });
    
    // Get all unique team names
    const allTeamNames = new Set([
        ...overallMap.keys(),
        ...homeMap.keys(),
        ...awayMap.keys(),
        ...recentFormMap.keys(),
        ...recentHomeMap.keys(),
        ...recentAwayMap.keys()
    ]);
    
    console.log(`Found ${allTeamNames.size} unique teams`);
    
    // Combine for each team
    allTeamNames.forEach(teamName => {
        const overallTeam = overallMap.get(teamName) || {};
        const homeTeam = homeMap.get(teamName) || {};
        const awayTeam = awayMap.get(teamName) || {};
        const recentFormTeam = recentFormMap.get(teamName) || {};
        const recentHomeTeam = recentHomeMap.get(teamName) || {};
        const recentAwayTeam = recentAwayMap.get(teamName) || {};
        
        // Start with overall data
        const combinedTeam = {
            Team: teamName,
            ...overallTeam
        };
        
        // Add home data (prefix with Home_)
        if (Object.keys(homeTeam).length > 0) {
            combinedTeam.Home_matches = homeTeam.matches || 0;
            combinedTeam.Home_wins = homeTeam.wins || 0;
            combinedTeam.Home_draws = homeTeam.draws || 0;
            combinedTeam.Home_loses = homeTeam.loses || 0;
            combinedTeam.Home_goals = homeTeam.goals || 0;
            combinedTeam.Home_ga = homeTeam.ga || 0;
            combinedTeam.Home_points = homeTeam.points || 0;
            combinedTeam.Home_xG = homeTeam.xG || 0;
            combinedTeam.Home_xGA = homeTeam.xGA || 0;
            combinedTeam.Home_xPTS = homeTeam.xPTS || 0;
        }
        
        // Add away data (prefix with Away_)
        if (Object.keys(awayTeam).length > 0) {
            combinedTeam.Away_matches = awayTeam.matches || 0;
            combinedTeam.Away_wins = awayTeam.wins || 0;
            combinedTeam.Away_draws = awayTeam.draws || 0;
            combinedTeam.Away_loses = awayTeam.loses || 0;
            combinedTeam.Away_goals = awayTeam.goals || 0;
            combinedTeam.Away_ga = awayTeam.ga || 0;
            combinedTeam.Away_points = awayTeam.points || 0;
            combinedTeam.Away_xG = awayTeam.xG || 0;
            combinedTeam.Away_xGA = awayTeam.xGA || 0;
            combinedTeam.Away_xPTS = awayTeam.xPTS || 0;
        }
        
        // Add recent form data (prefix with Recent_)
        if (Object.keys(recentFormTeam).length > 0) {
            combinedTeam.Recent_matches = recentFormTeam.matches || 0;
            combinedTeam.Recent_wins = recentFormTeam.wins || 0;
            combinedTeam.Recent_draws = recentFormTeam.draws || 0;
            combinedTeam.Recent_loses = recentFormTeam.loses || 0;
            combinedTeam.Recent_goals = recentFormTeam.goals || 0;
            combinedTeam.Recent_ga = recentFormTeam.ga || 0;
            combinedTeam.Recent_points = recentFormTeam.points || 0;
            combinedTeam.Recent_xG = recentFormTeam.xG || 0;
            combinedTeam.Recent_xGA = recentFormTeam.xGA || 0;
            combinedTeam.Recent_xPTS = recentFormTeam.xPTS || 0;
            
            // Calculate recent form per match metrics
            if (combinedTeam.Recent_matches > 0) {
                combinedTeam.Recent_xG_per_match = combinedTeam.Recent_xG / combinedTeam.Recent_matches;
                combinedTeam.Recent_xGA_per_match = combinedTeam.Recent_xGA / combinedTeam.Recent_matches;
                combinedTeam.Recent_goals_per_match = combinedTeam.Recent_goals / combinedTeam.Recent_matches;
                combinedTeam.Recent_ga_per_match = combinedTeam.Recent_ga / combinedTeam.Recent_matches;
                combinedTeam.Recent_points_per_match = combinedTeam.Recent_points / combinedTeam.Recent_matches;
                
                // Form momentum (1 = perfect form, -1 = terrible form)
                const maxPoints = combinedTeam.Recent_matches * 3;
                const ptsEfficiency = maxPoints > 0 ? combinedTeam.Recent_points / maxPoints : 0;
                combinedTeam.Recent_form_momentum = (ptsEfficiency - 0.5) * 2;
            }
        }
        
        // Add recent home data (prefix with RecentHome_)
        if (Object.keys(recentHomeTeam).length > 0) {
            combinedTeam.RecentHome_matches = recentHomeTeam.matches || 0;
            combinedTeam.RecentHome_wins = recentHomeTeam.wins || 0;
            combinedTeam.RecentHome_draws = recentHomeTeam.draws || 0;
            combinedTeam.RecentHome_loses = recentHomeTeam.loses || 0;
            combinedTeam.RecentHome_goals = recentHomeTeam.goals || 0;
            combinedTeam.RecentHome_ga = recentHomeTeam.ga || 0;
            combinedTeam.RecentHome_points = recentHomeTeam.points || 0;
            combinedTeam.RecentHome_xG = recentHomeTeam.xG || 0;
            combinedTeam.RecentHome_xGA = recentHomeTeam.xGA || 0;
            combinedTeam.RecentHome_xPTS = recentHomeTeam.xPTS || 0;
        }
        
        // Add recent away data (prefix with RecentAway_)
        if (Object.keys(recentAwayTeam).length > 0) {
            combinedTeam.RecentAway_matches = recentAwayTeam.matches || 0;
            combinedTeam.RecentAway_wins = recentAwayTeam.wins || 0;
            combinedTeam.RecentAway_draws = recentAwayTeam.draws || 0;
            combinedTeam.RecentAway_loses = recentAwayTeam.loses || 0;
            combinedTeam.RecentAway_goals = recentAwayTeam.goals || 0;
            combinedTeam.RecentAway_ga = recentAwayTeam.ga || 0;
            combinedTeam.RecentAway_points = recentAwayTeam.points || 0;
            combinedTeam.RecentAway_xG = recentAwayTeam.xG || 0;
            combinedTeam.RecentAway_xGA = recentAwayTeam.xGA || 0;
            combinedTeam.RecentAway_xPTS = recentAwayTeam.xPTS || 0;
        }
        
        // Calculate overall advanced metrics
        const overallMetrics = calculateAdvancedMetrics(overallTeam);
        Object.assign(combinedTeam, overallMetrics);
        
        // Calculate home/away strength
        if (combinedTeam.Home_points !== undefined && combinedTeam.Away_points !== undefined) {
            combinedTeam.Home_strength = combinedTeam.Home_matches > 0 ? 
                (combinedTeam.Home_points / (combinedTeam.Home_matches * 3)) * 100 : 0;
            combinedTeam.Away_strength = combinedTeam.Away_matches > 0 ? 
                (combinedTeam.Away_points / (combinedTeam.Away_matches * 3)) * 100 : 0;
            combinedTeam.Home_Away_difference = combinedTeam.Home_strength - combinedTeam.Away_strength;
        }
        
        combined.push(combinedTeam);
    });
    
    console.log(`Combined ${combined.length} teams with complete data`);
    return combined;
}

// Update file details display
function updateFileDetails(data) {
    document.getElementById('teamCount').textContent = data.length;
    
    // Count columns
    const sampleRow = data[0];
    const totalColumns = Object.keys(sampleRow).length;
    
    document.getElementById('columnCount').textContent = totalColumns;
    
    // Calculate file size (approximate)
    const csvString = convertToCSV(data);
    const sizeKB = (new Blob([csvString]).size / 1024).toFixed(2);
    document.getElementById('fileSize').textContent = `${sizeKB} KB`;
    
    document.getElementById('fileDetails').textContent = 
        `${data.length} teams • ${totalColumns} columns • ${sizeKB} KB`;
}

// Show data preview
function showDataPreview(data) {
    const previewDiv = document.getElementById('dataPreview');
    if (!previewDiv) return;
    
    const previewRows = data.slice(0, 3); // Show first 3 rows
    
    if (previewRows.length === 0) {
        previewDiv.textContent = 'No data to preview';
        return;
    }
    
    let previewHTML = '<div class="text-sm">';
    
    // Show key columns for preview
    const keyColumns = ['Team', 'matches', 'wins', 'draws', 'loses', 'points', 
                       'Recent_points', 'Recent_form_momentum', 'Home_strength', 'Away_strength'];
    
    // Header
    previewHTML += '<div class="text-primary font-bold mb-2">Preview of Combined Data:</div>';
    previewHTML += '<div class="mb-4 text-slate-400 text-xs">';
    previewHTML += keyColumns.join(' | ');
    previewHTML += '</div>';
    
    // Sample data
    previewRows.forEach(row => {
        previewHTML += '<div class="mb-3 p-2 bg-slate-800/30 rounded">';
        previewHTML += `<div class="font-bold text-green-400 mb-1">${row.Team}</div>`;
        
        const stats = [
            `Overall: ${row.matches || 0} matches, ${row.wins || 0}W-${row.draws || 0}D-${row.loses || 0}L, ${row.points || 0} pts`,
            `Recent: ${row.Recent_points || 0} pts (${row.Recent_form_momentum ? row.Recent_form_momentum.toFixed(2) : 'N/A'} momentum)`,
            `Home: ${row.Home_strength ? row.Home_strength.toFixed(1) : '0'}% | Away: ${row.Away_strength ? row.Away_strength.toFixed(1) : '0'}%`
        ];
        
        previewHTML += '<div class="text-xs text-slate-300">' + stats.join('<br>') + '</div>';
        previewHTML += '</div>';
    });
    
    previewHTML += '</div>';
    previewDiv.innerHTML = previewHTML;
}

// Convert data to CSV string
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
            
            // Handle undefined/null
            if (value === undefined || value === null) {
                return '';
            }
            
            // Handle strings with commas or quotes
            if (typeof value === 'string') {
                // Escape quotes
                value = value.replace(/"/g, '""');
                // Wrap in quotes if contains comma, semicolon, or quotes
                if (value.includes(',') || value.includes(';') || value.includes('"')) {
                    return `"${value}"`;
                }
                return value;
            }
            
            // Format numbers
            if (typeof value === 'number') {
                // Round to reasonable decimals
                if (value % 1 !== 0) {
                    return value.toFixed(3);
                }
                return value.toString();
            }
            
            return value;
        }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

// Download combined CSV
function downloadCombinedCSV() {
    if (!combinedData) {
        showStatus('No data to download. Please combine files first.', 'error');
        return;
    }
    
    const csvString = convertToCSV(combinedData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `league_table_stats${timestamp}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✓ Combined CSV file downloaded!', 'success');
}

// Reset the tool
function resetTool() {
    console.log('Resetting tool...');
    
    // Clear file variables
    overallFile = null;
    homeFile = null;
    awayFile = null;
    recentFormFile = null;
    recentHomeFile = null;
    recentAwayFile = null;
    combinedData = null;
    
    // Clear all 6 file inputs
    ['overallFile', 'homeFile', 'awayFile', 'recentFormFile', 'recentHomeFile', 'recentAwayFile'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    // Clear all file lists
    ['overallFileList', 'homeFileList', 'awayFileList', 'recentFormFileList', 'recentHomeFileList', 'recentAwayFileList'].forEach(id => {
        const list = document.getElementById(id);
        if (list) list.innerHTML = '';
    });
    
    // Hide sections
    document.getElementById('downloadSection').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    
    // Reset combine button
    const combineBtn = document.getElementById('combineBtn');
    combineBtn.disabled = true;
    combineBtn.innerHTML = '<i class="fas fa-clock"></i> Upload All 6 Files (0/6)';
    combineBtn.classList.add('opacity-50');
    
    // Hide loading
    document.getElementById('loadingIndicator').style.display = 'none';
    
    // Clear preview
    const previewDiv = document.getElementById('dataPreview');
    if (previewDiv) previewDiv.innerHTML = '';
    
    showStatus('Tool reset. Upload 6 new files to combine.', 'info');
}