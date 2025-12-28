// Soccer Match Predictor - File Upload Functions
// ===============================================

// Setup file upload functionality
function setupFileUploads() {
    // CSV upload
    const uploadArea = document.getElementById('csvUpload');
    const fileInput = document.getElementById('csvFile');
    const fileList = document.getElementById('fileList');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            csvFile = e.target.files[0];
            updateFileList(fileList, csvFile);
            showNotification('CSV file uploaded successfully', 'success');
            
            // Auto-process if custom is selected
            if (selectedLeague === 'custom') {
                setTimeout(() => processSelectedLeague(), 500);
            }
        }
    });
    
    // Drag and drop functionality
    setupDragAndDrop(uploadArea, fileList);
}

function setupDragAndDrop(uploadArea, fileList) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                csvFile = file;
                updateFileList(fileList, file);
                showNotification('CSV file uploaded successfully', 'success');
                
                if (selectedLeague === 'custom') {
                    // Auto-process custom CSV file
                    setTimeout(() => processSelectedLeague(), 500);
                }
            } else {
                showNotification('Please upload a CSV file', 'error');
            }
        }
    }
}

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