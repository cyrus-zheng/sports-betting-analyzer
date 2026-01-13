// Event Listeners Setup
// =================================================

function setupEventListeners() {
    // Combine button
    document.getElementById('combineBtn').addEventListener('click', combineCSVFiles);
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadCombinedCSV);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetTool);
}

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.style.display = 'block';
    statusDiv.className = `status-message ${type}`;
    statusDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}
