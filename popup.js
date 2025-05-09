// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup initialized');
  
  // Store the selected groups and collected data
  let selectedGroups = [];
  let collectedData = [];
  
  // DOM Elements
  const elements = {
    fetchGroupsBtn: document.getElementById('fetch-groups'),
    confirmGroupsBtn: document.getElementById('confirm-groups'),
    startCollectionBtn: document.getElementById('start-collection'),
    exportDataBtn: document.getElementById('export-data'),
    groupList: document.getElementById('groupList'),
    selectedGroupsList: document.getElementById('selectedGroupsList'),
    step1Div: document.getElementById('step1'),
    step2Div: document.getElementById('step2'),
    stepSelect: document.getElementById('step'),
    postCountInput: document.getElementById('postCount'),
    statusDiv: document.getElementById('status'),
    statusText: document.getElementById('statusText'),
    progressBar: document.getElementById('progressBar')
  };
  
  // Event handlers
  const handlers = {
    fetchGroups: fetchFacebookGroups,
    confirmGroups: confirmSelectedGroups,
    startCollection: startDataCollection,
    exportData: exportCollectedData
  };
  
  // Load modules
  loadModules().then(() => {
    // Initialize UI
    if (window.UIModule) {
      window.UIModule.initializeUI(elements, handlers);
    } else {
      // Fallback if modules aren't loaded
      setupEventListeners();
      loadSavedState();
    }
  });
  
  // Fallback function to set up event listeners
  function setupEventListeners() {
    elements.fetchGroupsBtn.addEventListener('click', fetchFacebookGroups);
    elements.confirmGroupsBtn.addEventListener('click', confirmSelectedGroups);
    elements.startCollectionBtn.addEventListener('click', startDataCollection);
    elements.exportDataBtn.addEventListener('click', exportCollectedData);
  }
  
  // Fallback function to load saved state
  function loadSavedState() {
    chrome.storage.local.get(['selectedGroups', 'collectedData'], function(data) {
      if (data.selectedGroups && data.selectedGroups.length > 0) {
        selectedGroups = data.selectedGroups;
        
        // Display selected groups
        elements.selectedGroupsList.innerHTML = '';
        selectedGroups.forEach(group => {
          const groupItem = document.createElement('div');
          groupItem.textContent = group.name;
          elements.selectedGroupsList.appendChild(groupItem);
        });
        
        elements.selectedGroupsList.parentElement.style.display = 'block';
        elements.step2Div.style.display = 'block';
        elements.stepSelect.value = '2';
      }
      
      if (data.collectedData && data.collectedData.length > 0) {
        collectedData = data.collectedData;
        elements.exportDataBtn.style.display = 'block';
      }
    });
  }
  
  // Function to load modules
  function loadModules() {
    return new Promise((resolve) => {
      // Load modules in sequence
      const modules = [
        'module/utility-module.js',
        'module/storage-module.js',
        'module/group-module.js',
        'module/data-collection-module.js',
        'module/ui-module.js'
      ];
      
      let loadedCount = 0;
      
      modules.forEach(module => {
        const script = document.createElement('script');
        script.src = module;
        script.onload = function() {
          loadedCount++;
          if (loadedCount === modules.length) {
            resolve();
          }
        };
        script.onerror = function() {
          console.error(`Failed to load module: ${module}`);
          loadedCount++;
          if (loadedCount === modules.length) {
            resolve();
          }
        };
        document.head.appendChild(script);
      });
      
      // Resolve after a timeout in case some modules fail to load
      setTimeout(resolve, 2000);
    });
  }
  
  // Function to fetch Facebook groups
  function fetchFacebookGroups() {
    console.log('Fetching Facebook groups...');
    elements.statusText.textContent = 'Navigating to Facebook Groups page...';
    elements.statusDiv.style.display = 'block';
    
    // Create a new tab with Facebook Groups page
    chrome.tabs.create({ url: 'https://www.facebook.com/groups/feed/' }, function(tab) {
      // Wait for the page to load before injecting the content script
      setTimeout(function() {
        // Send message to content script to fetch groups
        chrome.tabs.sendMessage(tab.id, { action: 'fetchGroups' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            
            // Try executing script directly if messaging fails
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: function() {
                // This will call the fetchGroups function in the content script context
                if (window.GroupModule) {
                  return window.GroupModule.fetchGroups();
                } else {
                  // Fallback if module isn't loaded
                  console.error('GroupModule not found');
                  return [];
                }
              }
            }, function(results) {
              handleGroupResults(results, tab);
            });
          } else if (response && response.success) {
            displayGroups(response.groups);
            chrome.tabs.remove(tab.id); // Close the Facebook tab
          } else {
            elements.statusText.textContent = 'Error fetching groups. Please try again.';
          }
        });
      }, 5000); // Wait 5 seconds for the page to load
    });
  }
  
  // Function to handle group results
  function handleGroupResults(results, tab) {
    if (results && results[0] && results[0].result) {
      const groups = results[0].result;
      displayGroups(groups);
    } else {
      elements.statusText.textContent = 'Error fetching groups. Please try again.';
    }
    
    // Close the Facebook tab
    chrome.tabs.remove(tab.id);
  }
  
  // Function to display the fetched groups
  function displayGroups(groups) {
    // Use UI module if available
    if (window.UIModule) {
      window.UIModule.displayGroups(groups, elements);
    } else {
      // Fallback implementation
      if (!groups || groups.length === 0) {
        elements.statusText.textContent = 'No groups found. Please try again.';
        return;
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
      elements.confirmGroupsBtn.style.display = 'block';
      elements.statusDiv.style.display = 'none';
    }
  }
  
  // Function to confirm selected groups
  function confirmSelectedGroups() {
    // Get selected groups
    let selectedGroupsArray;
    
    if (window.UIModule) {
      selectedGroupsArray = window.UIModule.getSelectedGroups(elements.groupList);
    } else {
      const selectedElements = elements.groupList.querySelectorAll('.group-item.selected');
      
      if (selectedElements.length === 0) {
        alert('Please select at least one group.');
        return;
      }
      
      selectedGroupsArray = Array.from(selectedElements).map(el => ({
        id: el.dataset.id,
        name: el.dataset.name,
        url: el.dataset.url
      }));
    }
    
    if (!selectedGroupsArray || selectedGroupsArray.length === 0) {
      alert('Please select at least one group.');
      return;
    }
    
    selectedGroups = selectedGroupsArray;
    
    // Display selected groups
    if (window.UIModule) {
      window.UIModule.displaySelectedGroups(selectedGroups, elements.selectedGroupsList);
    } else {
      elements.selectedGroupsList.innerHTML = '';
      selectedGroups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.textContent = group.name;
        elements.selectedGroupsList.appendChild(groupItem);
      });
    }
    
    // Save selected groups to storage
    if (window.StorageModule) {
      window.StorageModule.saveData('selectedGroups', selectedGroups);
    } else {
      chrome.storage.local.set({ selectedGroups: selectedGroups }, function() {
        console.log('Selected groups saved:', selectedGroups);
      });
    }
    
    // Move to step 2
    elements.groupList.style.display = 'none';
    elements.confirmGroupsBtn.style.display = 'none';
    elements.selectedGroupsList.parentElement.style.display = 'block';
    elements.step2Div.style.display = 'block';
    elements.stepSelect.value = '2';
  }
  
  // Function to start data collection
  function startDataCollection() {
    const postCount = parseInt(elements.postCountInput.value);
    
    if (isNaN(postCount) || postCount < 1) {
      alert('Please enter a valid number of posts to collect.');
      return;
    }
    
    if (selectedGroups.length === 0) {
      // Try to load from storage
      if (window.StorageModule) {
        window.StorageModule.getData('selectedGroups').then(response => {
          if (response.success && response.data && response.data.length > 0) {
            selectedGroups = response.data;
            proceedWithCollection(postCount);
          } else {
            alert('No groups selected. Please go back to step 1.');
          }
        });
      } else {
        chrome.storage.local.get('selectedGroups', function(data) {
          if (data.selectedGroups && data.selectedGroups.length > 0) {
            selectedGroups = data.selectedGroups;
            proceedWithCollection(postCount);
          } else {
            alert('No groups selected. Please go back to step 1.');
          }
        });
      }
    } else {
      proceedWithCollection(postCount);
    }
  }
  
  // Function to proceed with data collection
  function proceedWithCollection(postCount) {
    elements.statusDiv.style.display = 'block';
    elements.statusText.textContent = 'Starting data collection...';
    elements.startCollectionBtn.disabled = true;
    
    // Save the post count to storage
    if (window.StorageModule) {
      window.StorageModule.saveData('postCount', postCount);
    } else {
      chrome.storage.local.set({ postCount: postCount }, function() {
        console.log('Post count saved:', postCount);
      });
    }
    
    // Use DataCollectionModule if available
    if (window.DataCollectionModule) {
      window.DataCollectionModule.processGroups(selectedGroups, postCount, progress => {
        if (window.UIModule) {
          window.UIModule.updateProgress(progress, elements);
        } else {
          updateProgress(progress);
        }
      }).then(data => {
        collectedData = data;
        if (window.UIModule) {
          window.UIModule.showCompletion(elements);
        } else {
          showCompletion();
        }
      });
    } else {
      // Fallback to legacy implementation
      processNextGroup(0, postCount);
    }
  }
  
  // Legacy function to process groups sequentially
  function processNextGroup(index, postCount) {
    if (index >= selectedGroups.length) {
      // All groups processed
      elements.statusText.textContent = 'Data collection completed!';
      elements.progressBar.style.width = '100%';
      elements.progressBar.textContent = '100%';
      elements.startCollectionBtn.disabled = false;
      elements.exportDataBtn.style.display = 'block';
      return;
    }
    
    const group = selectedGroups[index];
    elements.statusText.textContent = `Collecting data from group: ${group.name} (${index + 1}/${selectedGroups.length})`;
    
    // Update progress bar
    const progress = Math.round((index / selectedGroups.length) * 100);
    elements.progressBar.style.width = `${progress}%`;
    elements.progressBar.textContent = `${progress}%`;
    
    // Create a new tab for the group
    chrome.tabs.create({ url: group.url, active: false }, function(tab) {
      // Wait for the page to load
      setTimeout(function() {
        // Send message to content script to collect data
        chrome.tabs.sendMessage(tab.id, { 
          action: 'collectData',
          postCount: postCount
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            
            // Try executing script directly if messaging fails
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: function(postCount, groupName) {
                // This will call the collectData function in the content script context
                if (window.DataCollectionModule) {
                  return window.DataCollectionModule.collectData(postCount);
                } else {
                  console.error('DataCollectionModule not found');
                  return [];
                }
              },
              args: [postCount, group.name]
            }, function(results) {
              handleCollectionResults(results, group, tab, index, postCount);
            });
          } else if (response && response.success) {
            const groupData = response.data;
            saveAndProcessNextGroup(groupData, group, tab, index, postCount);
          } else {
            // Error collecting data, move to next group
            chrome.tabs.remove(tab.id, function() {
              processNextGroup(index + 1, postCount);
            });
          }
        });
      }, 5000); // Wait 5 seconds for the page to load
    });
  }
  
  // Function to handle collection results
  function handleCollectionResults(results, group, tab, index, postCount) {
    if (results && results[0] && results[0].result) {
      const groupData = results[0].result;
      saveAndProcessNextGroup(groupData, group, tab, index, postCount);
    } else {
      // Error collecting data, move to next group
      chrome.tabs.remove(tab.id, function() {
        processNextGroup(index + 1, postCount);
      });
    }
  }
  
  // Function to save data and process next group
  function saveAndProcessNextGroup(groupData, group, tab, index, postCount) {
    // Add the collected data to our array
    collectedData = collectedData.concat(groupData);
    
    // Save the collected data to storage
    if (window.StorageModule) {
      window.StorageModule.saveData('collectedData', collectedData);
    } else {
      chrome.storage.local.set({ collectedData: collectedData }, function() {
        console.log('Data saved for group:', group.name);
      });
    }
    
    // Close the tab and process the next group
    chrome.tabs.remove(tab.id, function() {
      processNextGroup(index + 1, postCount);
    });
  }
  
  // Legacy function to update progress
  function updateProgress(progress) {
    elements.statusText.textContent = `Collecting data from group: ${progress.currentGroup} (${progress.currentIndex + 1}/${progress.totalGroups})`;
    elements.progressBar.style.width = `${progress.progress}%`;
    elements.progressBar.textContent = `${progress.progress}%`;
  }
  
  // Legacy function to show completion
  function showCompletion() {
    elements.statusText.textContent = 'Data collection completed!';
    elements.progressBar.style.width = '100%';
    elements.progressBar.textContent = '100%';
    elements.startCollectionBtn.disabled = false;
    elements.exportDataBtn.style.display = 'block';
  }
  
  // Function to export collected data
  function exportCollectedData() {
    // If we don't have data in memory, try to load from storage
    if (collectedData.length === 0) {
      if (window.StorageModule) {
        window.StorageModule.getData('collectedData').then(response => {
          if (response.success && response.data && response.data.length > 0) {
            if (window.DataCollectionModule) {
              window.DataCollectionModule.exportToCSV(response.data);
            } else {
              exportData(response.data);
            }
          } else {
            alert('No data to export. Please collect data first.');
          }
        });
      } else {
        chrome.storage.local.get('collectedData', function(data) {
          if (data.collectedData && data.collectedData.length > 0) {
            exportData(data.collectedData);
          } else {
            alert('No data to export. Please collect data first.');
          }
        });
      }
    } else {
      if (window.DataCollectionModule) {
        window.DataCollectionModule.exportToCSV(collectedData);
      } else {
        exportData(collectedData);
      }
    }
  }
  
  // Legacy function to export data
  function exportData(data) {
    // Create CSV content
    let csvContent = "Group,Post ID,Poster Name,Date,Time,Post Content,Comment ID,Commenter Name,Comment Text\n";
    
    data.forEach(item => {
      const groupName = item.groupName.replace(/,/g, ' ');
      const posterId = item.posterId.replace(/,/g, ' ');
      const posterName = item.posterName.replace(/,/g, ' ');
      const postDate = item.date;
      const postTime = item.time;
      const postContent = item.content.replace(/,/g, ' ').replace(/\n/g, ' ');
      
      if (item.comments && item.comments.length > 0) {
        item.comments.forEach(comment => {
          const commenterId = comment.commenterId.replace(/,/g, ' ');
          const commenterName = comment.commenterName.replace(/,/g, ' ');
          const commentText = comment.text.replace(/,/g, ' ').replace(/\n/g, ' ');
          
          csvContent += `"${groupName}","${posterId}","${posterName}","${postDate}","${postTime}","${postContent}","${commenterId}","${commenterName}","${commentText}"\n`;
        });
      } else {
        // Include posts without comments
        csvContent += `"${groupName}","${posterId}","${posterName}","${postDate}","${postTime}","${postContent}","","",""\n`;
      }
    });
    
    // Create a blob and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'facebook_group_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
