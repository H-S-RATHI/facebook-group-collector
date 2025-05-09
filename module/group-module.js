// group-module.js - Handles fetching and processing Facebook groups

const GroupModule = {
  /**
   * Fetch Facebook groups from the user's profile
   * @returns {Promise} - Resolves with an array of group objects
   */
  fetchGroups: async function() {
    console.log('Fetching Facebook groups...');
    
    // Wait for the page to load
    await UtilityModule.waitForElement('a[href*="/groups/"]');
    
    // Scroll down a few times to load more groups
    for (let i = 0; i < 5; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await UtilityModule.sleep(1000);
    }
    
    // Find all group links
    const groups = [];
    const groupElements = document.querySelectorAll('a[href*="/groups/"]');
    
    groupElements.forEach(element => {
      const href = element.getAttribute('href');
      
      // Skip if not a valid group link
      if (!href || href.includes('/groups/feed/') || href === '/groups/' || groups.some(g => g.url === href)) {
        return;
      }
      
      // Extract group ID from URL
      const match = href.match(/\/groups\/([^/?]+)/);
      if (match && match[1]) {
        const groupId = match[1];
        const groupName = element.textContent.trim();
        
        if (groupName && !groups.some(g => g.id === groupId)) {
          groups.push({
            id: groupId,
            name: groupName,
            url: 'https://www.facebook.com' + href
          });
        }
      }
    });
    
    console.log(`Found ${groups.length} groups`);
    return groups;
  },
  
  /**
   * Display groups in the popup UI
   * @param {Array} groups - Array of group objects
   * @param {HTMLElement} groupListElement - DOM element to display groups in
   * @param {HTMLElement} confirmButton - Button to show when groups are displayed
   */
  displayGroups: function(groups, groupListElement, confirmButton) {
    if (!groups || groups.length === 0) {
      return false;
    }
    
    groupListElement.innerHTML = '';
    groups.forEach(group => {
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      groupItem.dataset.id = group.id;
      groupItem.dataset.name = group.name;
      groupItem.dataset.url = group.url;
      groupItem.textContent = group.name;
      
      groupItem.addEventListener('click', function() {
        this.classList.toggle('selected');
      });
      
      groupListElement.appendChild(groupItem);
    });
    
    groupListElement.style.display = 'block';
    confirmButton.style.display = 'block';
    return true;
  },
  
  /**
   * Get selected groups from the UI
   * @param {HTMLElement} groupListElement - DOM element containing group items
   * @returns {Array} - Array of selected group objects
   */
  getSelectedGroups: function(groupListElement) {
    const selectedElements = groupListElement.querySelectorAll('.group-item.selected');
    
    if (selectedElements.length === 0) {
      return [];
    }
    
    return Array.from(selectedElements).map(el => ({
      id: el.dataset.id,
      name: el.dataset.name,
      url: el.dataset.url
    }));
  }
};

// Export the module
window.GroupModule = GroupModule;