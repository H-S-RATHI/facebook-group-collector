// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup initialized');
    
    // Get the start button element
    const startButton = document.getElementById('start-button');
    
    // Add click event listener to the button
    startButton.addEventListener('click', function() {
      console.log('Start button clicked, navigating to Facebook...');
      
      // Create a new tab with Facebook Groups page
      chrome.tabs.create({ url: 'https://www.facebook.com/groups/feed/' }, function(tab) {
        // Wait for the page to load before injecting the content script
        setTimeout(function() {
          // Execute a content script to count the groups
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: countFacebookGroups
          }, function(results) {
            if (chrome.runtime.lastError) {
              console.error('Error executing script:', chrome.runtime.lastError);
            } else if (results && results[0]) {
              const groupCount = results[0].result;
              // Display the result in an alert
              alert(`You are a member of ${groupCount} Facebook groups.`);
            }
          });
        }, 5000); // Wait 5 seconds for the page to load
      });
    });
  });
