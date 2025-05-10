// visit-groups.js - Handles visiting Facebook groups

class VisitGroups {
  constructor() {
    this.isRunning = false;
    this.currentGroupIndex = 0;
    this.groups = [];
    this.statusElement = document.getElementById('status-text');
    
    // Add event listener for start button
    document.getElementById('start-button').addEventListener('click', () => this.startVisiting());
    
    // Initialize BackgroundConsole if not available
    if (!window.BackgroundConsole) {
      window.BackgroundConsole = {
        async log(message, level = 'info') {
          try {
            const timestamp = new Date().toISOString();
            const logEntry = {
              message,
              level,
              timestamp
            };

            const { extensionLogs = [] } = await chrome.storage.local.get('extensionLogs');
            const newLogs = [...extensionLogs, logEntry];
            await chrome.storage.local.set({
              extensionLogs: newLogs.slice(-100)
            });
          } catch (error) {
            await window.BackgroundConsole.error('Error storing log:', error);
          }
        },
        async info(message) { await this.log(message, 'info'); },
        async warning(message) { await this.log(message, 'warning'); },
        async error(message) { await this.log(message, 'error'); },
        async debug(message) { await this.log(message, 'debug'); }
      };
    }
  }

  // Start visiting groups
  async startVisiting() {
    if (this.isRunning) {
      alert('Already visiting groups!');
      return;
    }

    // Load groups from storage
    chrome.storage.local.get(['groups'], (result) => {
      this.groups = result.groups || [];
      if (this.groups.length === 0) {
        alert('No groups added yet! Please add some groups first.');
        return;
      }

      this.isRunning = true;
      this.currentGroupIndex = 0;
      this.updateStatus('Starting to visit groups...');
      
      // Start visiting groups
      this.visitNextGroup();
    });
  }

  // Visit the next group
  async visitNextGroup() {
    if (!this.isRunning || this.currentGroupIndex >= this.groups.length) {
      this.isRunning = false;
      this.updateStatus('Finished visiting all groups!');
      return;
    }

    const groupUrl = this.groups[this.currentGroupIndex];
    this.updateStatus(`Visiting group ${this.currentGroupIndex + 1}/${this.groups.length}: ${groupUrl}`);
    try {
      await window.BackgroundConsole.log(`Visiting group ${this.currentGroupIndex + 1}/${this.groups.length}: ${groupUrl}`);
    } catch (error) {
      await window.BackgroundConsole.error('Error logging message:', error);
    }

    try {
      // Create a new tab
      const tab = await chrome.tabs.create({ url: groupUrl });
      
      // Wait for the tab to load completely
      await new Promise((resolve) => {
        const checkTab = setInterval(() => {
          chrome.tabs.get(tab.id, (currentTab) => {
            if (currentTab.status === 'complete') {
              clearInterval(checkTab);
              resolve();
            }
          });
        }, 100);
      });
      
      // Wait for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close the tab
      await chrome.tabs.remove(tab.id);
      
      this.currentGroupIndex++;
      this.visitNextGroup();
    } catch (error) {
      try {
        await window.BackgroundConsole.error('Error visiting group: ' + error.message);
      } catch (logError) {
        await window.BackgroundConsole.error('Error logging:', logError);
      }
      this.currentGroupIndex++;
      this.visitNextGroup();
    }
  }

  // Update status text
  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  // Stop visiting groups
  stopVisiting() {
    this.isRunning = false;
    this.updateStatus('Stopped visiting groups');
  }
}

// Export the module
window.VisitGroups = new VisitGroups();
