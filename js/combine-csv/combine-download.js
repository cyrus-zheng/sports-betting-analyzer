// Download and Reset Functions
// =================================================

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            // Handle undefined/null
            if (value === undefined || value === null) value = '';
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
}

function downloadCombinedCSV() {
    // Combine the data again
    const combinedData = combineAllData(
        parsedData.overall,
        parsedData.home,
        parsedData.away,
        parsedData.recentForm,
        parsedData.recentHome,
        parsedData.recentAway
    );
    
    // Convert to CSV
    const csvContent = convertToCSV(combinedData);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'combined_team_stats.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('CSV file downloaded successfully!', 'success');
}

function resetTool() {
    // Reset file variables
    overallStatsFile = null;
    homeAwayFile = null;
    recentFormFile = null;
    recentHomeFile = null;
    recentAwayFile = null;
    overallHomeAwayFile = null;
    
    // Reset parsed data
    parsedData = {
        overall: [],
        home: [],
        away: [],
        recentForm: [],
        recentHome: [],
        recentAway: [],
        overallHomeAway: []
    };
    
    // Reset file inputs
    document.getElementById('overallStatsFile').value = '';
    document.getElementById('homeAwayFile').value = '';
    document.getElementById('recentFormFile').value = '';
    document.getElementById('recentHomeFile').value = '';
    document.getElementById('recentAwayFile').value = '';
    document.getElementById('overallHomeAwayFile').value = '';
    
    // Reset file lists
    document.querySelectorAll('.file-list').forEach(list => {
        list.innerHTML = '';
    });
    
    // Hide results
    document.getElementById('resultsSection').style.display = 'none';
    
    // Disable buttons
    document.getElementById('combineBtn').disabled = true;
    document.getElementById('downloadBtn').disabled = true;
    
    // Hide status
    document.getElementById('statusMessage').style.display = 'none';
    
    // Update combine button state
    updateCombineButton();
    
    showStatus('Tool reset successfully', 'info');
}
