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