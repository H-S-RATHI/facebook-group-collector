// visit-groups.js - Group visiting implementation

class VisitGroups {
  constructor() {
    // Add event listener for start button
    document.getElementById('start-button').addEventListener('click', () => {
      this.startVisitingGroups();
    });
  }

  async startVisitingGroups() {
    try {
      // Get stored groups
      const { groups = [] } = await chrome.storage.local.get('groups');
      
      if (groups.length === 0) {
        window.log('No groups found to visit', 'warning');
        return;
      }

      // Update status
      const statusText = document.getElementById('status-text');
      statusText.textContent = 'Visiting groups...';
      
      // Visit each group sequentially
      for (let i = 0; i < groups.length; i++) {
        const groupUrl = groups[i];
        window.log(`Visiting group ${i + 1} of ${groups.length}: ${groupUrl}`, 'info');

        // Create a new window for the group
        const windowId = await new Promise((resolve, reject) => {
          chrome.windows.create(
            {
              url: groupUrl,
              focused: true,
              width: 1200,
              height: 800
            },
            (window) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(window.id);
              }
            }
          );
        });

        // Wait for the page to load
        await new Promise((resolve) => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
            if (changeInfo.status === 'complete' && tab.windowId === windowId) {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });

        // Wait for 5 seconds after page load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Close the window
        await chrome.windows.remove(windowId);

        // Wait a bit before opening next group
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update status
      window.log('Finished visiting all groups successfully', 'info');
      statusText.textContent = 'Finished visiting all groups';

    } catch (error) {
      window.log('Error visiting groups: ' + error.message, 'error');
      const statusText = document.getElementById('status-text');
      statusText.textContent = 'Error: ' + error.message;
    }
  }
}

// Ensure VisitGroups is properly initialized
if (!window.VisitGroups) {
  window.VisitGroups = new VisitGroups();
} else {
  // If it already exists, remove existing event listeners
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.removeEventListener('click', window.VisitGroups.startVisitingGroups);
  }
  // Reinitialize with new instance
  window.VisitGroups = new VisitGroups();
}