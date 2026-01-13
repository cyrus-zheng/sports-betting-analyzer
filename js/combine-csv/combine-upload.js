// File Upload Handling
// =================================================

function setupFileUploads() {
    // Setup individual file upload areas
    setupSingleUpload('overallUpload', 'overallStatsFile', 'overallFileList', (file) => {
        overallStatsFile = file;
        updateCombineButton();
    });
    
    setupSingleUpload('homeAwayUpload', 'homeAwayFile', 'homeAwayFileList', (file) => {
        homeAwayFile = file;
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
    
    setupSingleUpload('overallHomeAwayUpload', 'overallHomeAwayFile', 'overallHomeAwayFileList', (file) => {
        overallHomeAwayFile = file;
        updateCombineButton();
    });
}

function setupSingleUpload(uploadAreaId, fileInputId, fileListId, onSuccess) {
    const uploadArea = document.getElementById(uploadAreaId);
    const fileInput = document.getElementById(fileInputId);
    const fileList = document.getElementById(fileListId);
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            updateFileList(fileList, file);
            onSuccess(file);
        }
    });
    
    // Drag and drop
    setupDragAndDrop(uploadArea, fileInput, fileList, onSuccess);
}

function setupDragAndDrop(uploadArea, fileInput, fileList, onSuccess) {
    // Prevent default behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight on drag
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
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                updateFileList(fileList, file);
                onSuccess(file);
            } else {
                showStatus('Please upload a CSV file', 'error');
            }
        }
    }, false);
}

function updateFileList(fileListElement, file) {
    const fileSize = (file.size / 1024).toFixed(2);
    fileListElement.innerHTML = `
        <div class="file-item">
            <i class="fas fa-file-csv" style="color: #13ec5b;"></i>
            <div style="flex: 1;">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize} KB</div>
            </div>
            <i class="fas fa-check-circle" style="color: #13ec5b;"></i>
        </div>
    `;
}

function updateCombineButton() {
    const combineBtn = document.getElementById('combineBtn');
    const hasOverall = overallStatsFile !== null;
    const hasHomeAway = homeAwayFile !== null;
    const hasRecentForm = recentFormFile !== null;
    const hasRecentHome = recentHomeFile !== null;
    const hasRecentAway = recentAwayFile !== null;
    const hasOverallHomeAway = overallHomeAwayFile !== null;
    
    // Enable button if we have all required files
    const allFilesUploaded = hasOverall && hasHomeAway && hasRecentForm && 
                            hasRecentHome && hasRecentAway && hasOverallHomeAway;
    
    combineBtn.disabled = !allFilesUploaded;
    
    if (allFilesUploaded) {
        combineBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        combineBtn.classList.add('hover:bg-primary/90');
    } else {
        combineBtn.classList.add('opacity-50', 'cursor-not-allowed');
        combineBtn.classList.remove('hover:bg-primary/90');
    }
}
