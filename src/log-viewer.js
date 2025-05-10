// Initialize port for communication with background script
let port = null;

// Try to establish a connection
try {
    port = chrome.runtime.connect({
        name: 'log-viewer'
    });
    
    // Listen for responses
    port.onMessage.addListener((response) => {
        if (response.type === 'logResponse') {
            console.log('Log response received:', response.message);
        }
    });
} catch (error) {
    console.error('Error connecting to background script:', error.message || 'Unknown error');
}

// Simple logging function for popup
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp}: ${message}`);
    
    // Try to send to background script if available
    try {
        if (port && port.postMessage) {
            port.postMessage({
                type: 'log',
                entry: {
                    message,
                    level,
                    timestamp
                }
            });
        }
    } catch (error) {
        console.error('Error sending log to background:', error.message || 'Unknown error');
    }
}

// Export logging functions
window.log = log;
window.info = (message) => log(message, 'info');
window.warning = (message) => log(message, 'warning');
window.error = (message) => log(message, 'error');
window.debug = (message) => log(message, 'debug');

document.addEventListener('DOMContentLoaded', function() {
    const logsContainer = document.getElementById('logs');
    const clearLogsButton = document.getElementById('clear-logs');
    let isTextSelected = false;

    // Add clear logs button functionality if button exists
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all logs?')) {
                try {
                    // Send clear logs message to background script via port
                    if (port && port.postMessage) {
                        port.postMessage({
                            type: 'clearLogs'
                        });
                    }
                    
                    // Clear the display
                    if (logsContainer) {
                        logsContainer.innerHTML = '';
                    }
                    
                    // Log the action
                    log('All logs cleared', 'info');
                } catch (error) {
                    console.error('Error clearing logs:', error);
                }
            }
        });
    }

    // Check if text is selected
    logsContainer.addEventListener('selectstart', () => {
        isTextSelected = true;
    });

    logsContainer.addEventListener('mouseup', () => {
        isTextSelected = false;
    });

    // Load and display logs
    chrome.storage.local.get('extensionLogs', function(data) {
        const logs = data.extensionLogs || [];
        displayLogs(logs);
    });

    // Update logs every 500ms
    setInterval(function() {
        if (!isTextSelected) {
            chrome.storage.local.get('extensionLogs', function(data) {
                const logs = data.extensionLogs || [];
                displayLogs(logs);
            });
        }
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
