// CSV Parsing Functions
// =================================================

function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return { headers: [], data: [] };
    
    // Parse headers (using semicolon delimiter)
    const headers = parseCSVLine(lines[0], ';').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line, ';');
        
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
        const teamName = row.Squad || row.Team || row.team;
        if (teamName && teamName.trim() !== '' && teamName.trim() !== 'Team' && teamName.trim() !== 'Squad') {
            // Standardize team name
            row.Squad = standardizeTeamName(teamName);
            data.push(row);
        }
    }
    
    return { headers, data };
}

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
    
    result.push(current); // Add the last field
    return result;
}

function standardizeTeamName(name) {
    if (!name) return name;
    
    // Mapping for common variations
    const teamMappings = {
        // Premier League
        'Manchester Utd': 'Manchester United',
        'Man United': 'Manchester United',
        'Man Utd': 'Manchester United',
        'Newcastle Utd': 'Newcastle United',
        'Nott\'ham Forest': 'Nottingham Forest',
        'Nottingham': 'Nottingham Forest',
        'West Ham': 'West Ham United',
        'Tottenham': 'Tottenham Hotspur',
        'Spurs': 'Tottenham Hotspur',
        'Brighton': 'Brighton and Hove Albion',
        'Wolves': 'Wolverhampton Wanderers',
        
        // Serie A
        'Internazionale': 'Inter',
        'AC Milan': 'Milan',
        
        // La Liga
        'Athletic': 'Athletic Club',
        'Betis': 'Real Betis',
        'Sociedad': 'Real Sociedad',
        
        // Bundesliga
        'M\'Gladbach': 'Borussia Mönchengladbach',
        'Mönchengladbach': 'Borussia Mönchengladbach',
        'Bayern': 'Bayern Munich',
        'Bayern München': 'Bayern Munich',
        
        // Ligue 1
        'Paris S-G': 'Paris Saint-Germain',
        'Paris SG': 'Paris Saint-Germain',
        'PSG': 'Paris Saint-Germain'
    };
    
    // Check if there's a mapping
    return teamMappings[name] || name;
}
