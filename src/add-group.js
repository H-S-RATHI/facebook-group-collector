// add-group.js - Handles adding Facebook groups

class AddGroup {
  constructor() {
    this.groups = [];
    this.loadGroups();
  }

  // Load groups from storage
  loadGroups() {
    chrome.storage.local.get(['groups'], (result) => {
      this.groups = result.groups || [];
    });
  }

  // Add a new group
  addGroup(url) {
    // Validate the URL
    if (!this.isValidGroupUrl(url)) {
      alert('Please enter a valid Facebook group URL');
      return false;
    }

    // Check if group already exists
    if (this.groups.includes(url)) {
      alert('This group is already added');
      return false;
    }

    // Add the group
    this.groups.push(url);
    
    // Save to storage
    chrome.storage.local.set({ groups: this.groups }, () => {
      alert('Group added successfully!');
    });

    return true;
  }

  // Validate Facebook group URL
  isValidGroupUrl(url) {
    url = url.trim();
    return url.startsWith('https://facebook.com/groups/') ||
           url.startsWith('https://www.facebook.com/groups/');
  }
}

// Export the module
window.AddGroup = new AddGroup();
