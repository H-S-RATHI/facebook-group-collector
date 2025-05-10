document.addEventListener('DOMContentLoaded', function() {
    const logsContainer = document.getElementById('logs');
    
    // Load and display logs
    chrome.storage.local.get('extensionLogs', function(data) {
        const logs = data.extensionLogs || [];
        displayLogs(logs);
    });

    // Update logs every 500ms
    setInterval(function() {
        chrome.storage.local.get('extensionLogs', function(data) {
            const logs = data.extensionLogs || [];
            displayLogs(logs);
        });
    }, 500);

    function displayLogs(logs) {
        logsContainer.innerHTML = '';
        logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = `log-item log-${log.level}`;
            logDiv.innerHTML = `
                <span class="timestamp">[${log.timestamp}]</span>
                <span class="message">${log.message}</span>
            `;
            logsContainer.appendChild(logDiv);
        });
    }
});
