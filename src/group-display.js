// group-display.js - Displays added Facebook groups

class GroupDisplay {
  constructor() {
    this.groups = [];
    this.container = document.createElement('div');
    this.container.id = 'group-list-container';
    
    // Add remove all button
    const removeAllButton = document.createElement('button');
    removeAllButton.textContent = 'Remove All Groups';
    removeAllButton.onclick = () => this.removeAllGroups();
    this.container.appendChild(removeAllButton);
    
    // Add groups list
    this.groupsList = document.createElement('div');
    this.groupsList.id = 'groups-list';
    this.groupsList.style.maxHeight = '200px';
    this.groupsList.style.overflowY = 'auto';
    this.groupsList.style.border = '1px solid #ddd';
    this.groupsList.style.borderRadius = '4px';
    this.groupsList.style.marginTop = '10px';
    this.container.appendChild(this.groupsList);
    
    // Load groups and update display
    this.loadGroups();
  }

  // Load groups from storage
  loadGroups() {
    chrome.storage.local.get(['groups'], (result) => {
      this.groups = result.groups || [];
      this.updateDisplay();
    });
  }

  // Update the display with current groups
  updateDisplay() {
    this.groupsList.innerHTML = '';
    
    if (this.groups.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No groups added yet';
      emptyMessage.style.padding = '10px';
      emptyMessage.style.color = '#666';
      this.groupsList.appendChild(emptyMessage);
      return;
    }

    this.groups.forEach((groupUrl, index) => {
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      groupItem.style.display = 'flex';
      groupItem.style.justifyContent = 'space-between';
      groupItem.style.alignItems = 'center';
      groupItem.style.padding = '8px';
      groupItem.style.borderBottom = '1px solid #eee';
      
      // Group URL
      const urlElement = document.createElement('div');
      urlElement.textContent = groupUrl;
      urlElement.style.flex = '1';
      urlElement.style.overflow = 'hidden';
      urlElement.style.textOverflow = 'ellipsis';
      
      // Remove button
      const removeButton = document.createElement('button');
      removeButton.textContent = '×';
      removeButton.style.background = 'none';
      removeButton.style.border = 'none';
      removeButton.style.fontSize = '16px';
      removeButton.style.cursor = 'pointer';
      removeButton.style.padding = '0 5px';
      removeButton.onclick = () => this.removeGroup(groupUrl);
      
      groupItem.appendChild(urlElement);
      groupItem.appendChild(removeButton);
      this.groupsList.appendChild(groupItem);
    });
  }

  // Remove a single group
  removeGroup(url) {
    const index = this.groups.indexOf(url);
    if (index > -1) {
      this.groups.splice(index, 1);
      chrome.storage.local.set({ groups: this.groups }, () => {
        this.updateDisplay();
      });
    }
  }

  // Remove all groups
  removeAllGroups() {
    if (confirm('Are you sure you want to remove all groups?')) {
      this.groups = [];
      chrome.storage.local.set({ groups: [] }, () => {
        this.updateDisplay();
      });
    }
  }

  // Get the container element
  getContainer() {
    return this.container;
  }
}

// Export the module
window.GroupDisplay = new GroupDisplay();
