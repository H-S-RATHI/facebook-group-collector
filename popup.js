document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const groupUrlInput = document.getElementById('groupUrl');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');

  // Function to show status message
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = isError ? 'error' : 'success';
    statusDiv.style.display = 'block';
  }

  // Function to validate Facebook group URL
  function isValidFacebookGroupUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('facebook.com') && 
             (urlObj.pathname.includes('/groups/') || urlObj.pathname.includes('/groups/permalink/'));
    } catch (e) {
      return false;
    }
  }

  // Function to extract usernames
  async function extractUsernames() {
    const groupUrl = groupUrlInput.value.trim();
    
    if (!groupUrl) {
      showStatus('Please enter a Facebook group URL', true);
      return;
    }

    if (!isValidFacebookGroupUrl(groupUrl)) {
      showStatus('Please enter a valid Facebook group URL', true);
      return;
    }

    try {
      showStatus('Opening group in new tab...');
      
      // Open the group in a new active tab
      const tab = await chrome.tabs.create({ 
        url: groupUrl, 
        active: true 
      });
      
      // Wait for the page to be fully loaded
      await new Promise(resolve => {
        const listener = (tabId, changeInfo) => {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
      
      // Wait an additional moment for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Scroll to load more posts
      showStatus('Loading more posts...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          // Scroll down multiple times to load more content
          for (let i = 0; i < 5; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      });
      
      // Wait a bit more after scrolling
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Send message to content script to extract usernames
      showStatus('Extracting usernames...');
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractUsernames'
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to extract usernames');
      }

      const usernames = response.usernames.filter(Boolean);
      
      if (usernames.length > 0) {
        resultsDiv.innerHTML = `
          <h3>Found ${usernames.length} usernames:</h3>
          <ul>
            ${usernames.map(username => `<li>${username}</li>`).join('')}
          </ul>
        `;
        showStatus('Usernames extracted successfully!');
      } else {
        showStatus('No usernames found on this page', true);
      }
      
      // Close the tab when done
      await chrome.tabs.remove(tab.id);
      
    } catch (error) {
      console.error('Error:', error);
      showStatus('An error occurred while extracting usernames', true);
    }
  }

  // Add click event listener to the extract button
  extractBtn.addEventListener('click', extractUsernames);
  
  // Also allow pressing Enter in the input field
  groupUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      extractUsernames();
    }
  });
});
