// Initialize BackgroundConsole
const BackgroundConsole = {
    async log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            message,
            level,
            timestamp
        };

        try {
            // Get existing logs
            const { extensionLogs = [] } = await chrome.storage.local.get('extensionLogs');
            
            // Add new log entry
            const newLogs = [...extensionLogs, logEntry];
            
            // Store logs (keep last 100 entries)
            await chrome.storage.local.set({
                extensionLogs: newLogs.slice(-100)
            });
        } catch (error) {
            console.error('Error storing log:', error);
        }
    },

    async info(message) {
        await this.log(message, 'info');
    },

    async warning(message) {
        await this.log(message, 'warning');
    },

    async error(message) {
        await this.log(message, 'error');
    },

    async debug(message) {
        await this.log(message, 'debug');
    }
};

// Handle port-based communication
chrome.runtime.onConnect.addListener((port) => {
    console.log('Connected:', port.name);
    
    port.onMessage.addListener(async (message) => {
        try {
            if (message && typeof message === 'object') {
                if (message.type === 'log' && message.entry) {
                    await BackgroundConsole.log(message.entry.message, message.entry.level);
                    port.postMessage({
                        type: 'logResponse',
                        message: 'Log received successfully'
                    });
                } else if (message.type === 'clearLogs') {
                    try {
                        // Remove the logs
                        await chrome.storage.local.remove('extensionLogs');
                        
                        // Send response
                        port.postMessage({
                            type: 'logResponse',
                            message: 'Logs cleared successfully'
                        });
                    } catch (error) {
                        console.error('Error clearing logs:', error);
                        port.postMessage({
                            type: 'logResponse',
                            message: 'Error clearing logs: ' + error.message
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling port message:', error);
            port.postMessage({
                type: 'logResponse',
                message: 'Error handling message: ' + error.message
            });
        }
    });
});

// Handle direct messages as fallback
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message && typeof message === 'object') {
            if (message.type === 'log' && message.entry) {
                BackgroundConsole.log(message.entry.message, message.entry.level);
            } else if (message.type === 'clearLogs') {
                chrome.storage.local.remove('extensionLogs');
            }
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

// Initialize logging when extension starts
chrome.runtime.onInstalled.addListener(() => {
    BackgroundConsole.info('Extension started');
    
    // Create context menu
    chrome.contextMenus.create({
        id: "viewLogs",
        title: "View Extension Logs",
        contexts: ["all"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "viewLogs") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/log-viewer.html")
        });
    }
});