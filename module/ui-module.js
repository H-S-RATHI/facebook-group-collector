// ui-module.js - Handles UI interactions for the popup

const UIModule = {
  /**
   * Initialize the UI
   * @param {Object} elements - Object containing DOM elements
   * @param {Object} handlers - Object containing event handlers
   */
  initializeUI: function(elements, handlers) {
    // Set up event listeners
    if (elements.fetchGroupsBtn && handlers.fetchGroups) {
      elements.fetchGroupsBtn.addEventListener('click', handlers.fetchGroups);
    }
    
    if (elements.confirmGroupsBtn && handlers.confirmGroups) {
      elements.confirmGroupsBtn.addEventListener('click', handlers.confirmGroups);
    }
    
    if (elements.startCollectionBtn && handlers.startCollection) {
      elements.startCollectionBtn.addEventListener('click', handlers.startCollection);
    }
    
    if (elements.exportDataBtn && handlers.exportData) {
      elements.exportDataBtn.addEventListener('click', handlers.exportData);
    }
    
    // Check if we have previously selected groups
    this.loadSavedState(elements);
  },
  
  /**
   * Load saved state from storage
   * @param {Object} elements - Object containing DOM elements
   */
  loadSavedState: function(elements) {
    chrome.storage.local.get(['selectedGroups', 'collectedData'], function(data) {
      if (data.selectedGroups && data.selectedGroups.length > 0) {
        // Display selected groups
        if (elements.selectedGroupsList) {
          elements.selectedGroupsList.innerHTML = '';
          data.selectedGroups.forEach(group => {
            const groupItem = document.createElement('div');
            groupItem.textContent = group.name;
            elements.selectedGroupsList.appendChild(groupItem);
          });
          
          if (elements.selectedGroupsList.parentElement) {
            elements.selectedGroupsList.parentElement.style.display = 'block';
          }
        }
        
        // Move to step 2
        if (elements.step2Div) {
          elements.step2Div.style.display = 'block';
        }
        
        if (elements.stepSelect) {
          elements.stepSelect.value = '2';
        }
      }
      
      if (data.collectedData && data.collectedData.length > 0 && elements.exportDataBtn) {
        elements.exportDataBtn.style.display = 'block';
      }
    });
  },
  
  /**
   * Display groups in the UI
   * @param {Array} groups - Array of group objects
   * @param {Object} elements - Object containing DOM elements
   * @returns {boolean} - Whether groups were displayed successfully
   */
  displayGroups: function(groups, elements) {
    if (!groups || groups.length === 0 || !elements.groupList) {
      if (elements.statusText) {
        elements.statusText.textContent = 'No groups found. Please try again.';
      }
      return false;
    }
    
    elements.groupList.innerHTML = '';
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
      
      elements.groupList.appendChild(groupItem);
    });
    
    elements.groupList.style.display = 'block';
    
    if (elements.confirmGroupsBtn) {
      elements.confirmGroupsBtn.style.display = 'block';
    }
    
    if (elements.statusDiv) {
      elements.statusDiv.style.display = 'none';
    }
    
    return true;
  },
  
  /**
   * Get selected groups from the UI
   * @param {HTMLElement} groupListElement - DOM element containing group items
   * @returns {Array} - Array of selected group objects
   */
  getSelectedGroups: function(groupListElement) {
    if (!groupListElement) return [];
    
    const selectedElements = groupListElement.querySelectorAll('.group-item.selected');
    
    if (selectedElements.length === 0) {
      return [];
    }
    
    return Array.from(selectedElements).map(el => ({
      id: el.dataset.id,
      name: el.dataset.name,
      url: el.dataset.url
    }));
  },
  
  /**
   * Display selected groups in the UI
   * @param {Array} groups - Array of group objects
   * @param {HTMLElement} container - Container element for the selected groups
   */
  displaySelectedGroups: function(groups, container) {
    if (!container) return;
    
    container.innerHTML = '';
    groups.forEach(group => {
      const groupItem = document.createElement('div');
      groupItem.textContent = group.name;
      container.appendChild(groupItem);
    });
    
    if (container.parentElement) {
      container.parentElement.style.display = 'block';
    }
  },
  
  /**
   * Update progress in the UI
   * @param {Object} progress - Progress information
   * @param {Object} elements - Object containing DOM elements
   */
  updateProgress: function(progress, elements) {
    if (!elements.statusText || !elements.progressBar) return;
    
    elements.statusText.textContent = `Collecting data from group: ${progress.currentGroup} (${progress.currentIndex + 1}/${progress.totalGroups})`;
    elements.progressBar.style.width = `${progress.progress}%`;
    elements.progressBar.textContent = `${progress.progress}%`;
    
    if (elements.statusDiv) {
      elements.statusDiv.style.display = 'block';
    }
  },
  
  /**
   * Show completion status in the UI
   * @param {Object} elements - Object containing DOM elements
   */
  showCompletion: function(elements) {
    if (!elements.statusText || !elements.progressBar) return;
    
    elements.statusText.textContent = 'Data collection completed!';
    elements.progressBar.style.width = '100%';
    elements.progressBar.textContent = '100%';
    
    if (elements.startCollectionBtn) {
      elements.startCollectionBtn.disabled = false;
    }
    
    if (elements.exportDataBtn) {
      elements.exportDataBtn.style.display = 'block';
    }
  }
};

// Export the module
window.UIModule = UIModule;