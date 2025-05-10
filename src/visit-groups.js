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
      
      // Visit each group
      for (let i = 0; i < groups.length; i++) {
        const groupUrl = groups[i];
        window.log(`Visiting group ${i + 1} of ${groups.length}: ${groupUrl}`, 'info');

        // Create a new tab for the group
        await chrome.tabs.create({
          url: groupUrl,
          active: false
        });

        // Wait for a short time before visiting next group
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Update status
      window.log('Finished visiting all groups successfully', 'info');

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