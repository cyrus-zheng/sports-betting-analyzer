// Soccer Match Predictor - Data Processing Functions
// ==================================================

async function processCSVData() {
    console.log('=== PROCESS CSV DATA STARTED ===');
    console.log('Selected League:', selectedLeague);
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        let csvText;
        let fileName = '';
        
        if (selectedLeague === 'custom') {
            // Read and parse the custom CSV file
            if (!csvFile) {
                throw new Error('No CSV file uploaded for custom data');
            }
            csvText = await readFile(csvFile);
            fileName = csvFile.name;
            console.log('Using custom CSV file:', fileName);
        } else {
            // Load CSV file from server based on selected league
            const fileMap = {
                laliga: 'laligateams.csv',
                premierleague: 'premierleagueteams.csv',
                seriea: 'serieateams.csv',
                bundesliga: 'bundesligateams.csv'
            };
            
            fileName = fileMap[selectedLeague];
            if (!fileName) {
                throw new Error(`No CSV file configured for ${LEAGUE_NAMES[selectedLeague]}`);
            }
            
            console.log(`Fetching CSV file: ${fileName}`);
            // Fetch the CSV file from server
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}. Make sure:
                1. The file exists in the same folder
                2. You are running from a local server (not file://)
                3. File name is exactly: ${fileName}`);
            }
            csvText = await response.text();
            console.log(`Successfully loaded ${fileName}`);
        }
        
        teamData = parseCSV(csvText);
        console.log(`Parsed ${teamData.length} teams from ${fileName}`);
        
        // Validate data
        if (teamData.length === 0) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
        // Check for required columns
        const requiredColumns = ['Squad', 'xG', 'xGA'];
        const missingColumns = [];
        
        const sample = teamData[0];
        requiredColumns.forEach(col => {
            if (!(col in sample)) {
                missingColumns.push(col);
            }
        });
        
        if (missingColumns.length > 0) {
            showNotification(`Missing required columns: ${missingColumns.join(', ')}`, 'warning');
        }
        
        // Populate team dropdowns (both from the same data)
        populateTeamDropdowns();
        
        // Enable predict button
        document.getElementById('predictBtn').disabled = false;
        document.getElementById('homeTeam').disabled = false;
        document.getElementById('awayTeam').disabled = false;
        
        // Update data status
        updateDataStatus();
        
        // Save to localStorage
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Error processing CSV data:', error);
        showNotification(`Error: ${error.message}`, 'error');
        
        // Reset state
        resetDataState();
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    }
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Handle different line endings and quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle quoted values with commas
        const values = parseCSVLine(line);
        
        const row = {};
        headers.forEach((header, index) => {
            if (index < values.length) {
                const value = values[index].trim().replace(/"/g, '');
                // Try to parse as number if possible
                const numValue = parseFloat(value);
                row[header] = isNaN(numValue) ? value : numValue;
            }
        });
        
        // Only add if we have at least a team name
        if (row.Squad && row.Squad.trim() !== '') {
            data.push(row);
        }
    }
    
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current); // Add the last field
    return result;
}

function updateDataStatus() {
    const dataStatus = document.getElementById('dataStatus');
    const dataStats = document.getElementById('dataStats');
    
    dataStatus.style.display = 'flex';
    dataStats.textContent = `${teamData.length} teams loaded`;
    
    // Update matchup display
    document.getElementById('homeTeamDisplay').querySelector('h3').textContent = 'Select Home Team';
    document.getElementById('awayTeamDisplay').querySelector('h3').textContent = 'Select Away Team';
}