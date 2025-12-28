// Soccer Match Predictor - Utility Functions
// ===========================================

// Update weight display
function updateWeightDisplay() {
    const weightValue = document.getElementById('weightValue');
    const modelWeight = document.getElementById('modelWeight');
    weightValue.textContent = modelWeight.value;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background-color: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : type === 'success' ? '#4CAF50' : '#2196f3'}; 
                    color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    z-index: 1000; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}