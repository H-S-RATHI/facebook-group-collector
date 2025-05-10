// visit-groups.js - Handles visiting Facebook groups

class VisitGroups {
  constructor() {
    this.isRunning = false;
    this.currentGroupIndex = 0;
    this.groups = [];
    this.statusElement = document.getElementById('status-text');
    
    // Add event listener for start button
    document.getElementById('start-button').addEventListener('click', () => this.startVisiting());
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
      console.error('Error visiting group:', error);
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
