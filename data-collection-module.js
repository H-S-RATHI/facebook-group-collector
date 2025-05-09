// data-collection-module.js - Handles collecting data from Facebook groups

const DataCollectionModule = {
  /**
   * Collect data from a Facebook group
   * @param {number} postCount - Number of posts to collect
   * @returns {Promise} - Resolves with an array of post data objects
   */
  collectData: async function(postCount) {
    console.log(`Collecting data for ${postCount} posts...`);
    
    // Get the current group name
    const groupNameElement = document.querySelector('h1');
    const groupName = groupNameElement ? groupNameElement.textContent.trim() : 'Unknown Group';
    
    // Wait for posts to load
    await UtilityModule.waitForElement('[data-pagelet^="FeedUnit_"]');
    
    // Scroll down to load more posts
    for (let i = 0; i < Math.min(postCount * 2, 20); i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await UtilityModule.sleep(1000);
    }
    
    // Find all post elements
    const postElements = document.querySelectorAll('[data-pagelet^="FeedUnit_"]');
    const collectedPosts = [];
    
    // Process each post
    for (let i = 0; i < Math.min(postElements.length, postCount); i++) {
      const post = postElements[i];
      
      // Click "See more" buttons in the post to expand content
      const seeMoreButtons = post.querySelectorAll('div[role="button"]');
      for (const button of seeMoreButtons) {
        if (button.textContent.includes('See more')) {
          button.click();
          await UtilityModule.sleep(500);
        }
      }
      
      // Click "View more comments" buttons
      const viewMoreCommentsButtons = post.querySelectorAll('div[role="button"]');
      for (const button of viewMoreCommentsButtons) {
        if (button.textContent.includes('View') && button.textContent.includes('comment')) {
          button.click();
          await UtilityModule.sleep(1000);
        }
      }
      
      // Extract post data
      const postData = this.extractPostData(post, groupName);
      collectedPosts.push(postData);
    }
    
    console.log(`Collected data for ${collectedPosts.length} posts`);
    return collectedPosts;
  },
  
  /**
   * Extract data from a post element
   * @param {HTMLElement} postElement - DOM element of the post
   * @param {string} groupName - Name of the group
   * @returns {Object} - Post data object
   */
  extractPostData: function(postElement, groupName) {
    // Find the post author
    const authorElement = postElement.querySelector('a[role="link"][tabindex="0"]');
    const posterName = authorElement ? authorElement.textContent.trim() : 'Unknown User';
    
    // Try to get poster ID from the href attribute
    const posterHref = authorElement ? authorElement.getAttribute('href') : '';
    const posterId = posterHref ? posterHref.split('?')[0].split('/').filter(Boolean).pop() : 'unknown';
    
    // Find the timestamp
    const timestampElement = postElement.querySelector('a[href*="/permalink/"] span, a[href*="/posts/"] span');
    let dateTime = timestampElement ? timestampElement.textContent.trim() : '';
    
    // Parse date and time
    let date = 'Unknown';
    let time = 'Unknown';
    
    if (dateTime) {
      // Handle different date formats
      if (dateTime.includes(' at ')) {
        const parts = dateTime.split(' at ');
        date = parts[0];
        time = parts[1];
      } else if (dateTime.includes(':')) {
        // For formats like "Yesterday at 2:30 PM" or "July 10 at 3:45 PM"
        const timeMatch = dateTime.match(/(\d+:\d+(?:\s?[AP]M)?)/);
        if (timeMatch) {
          time = timeMatch[1];
          date = dateTime.replace(timeMatch[1], '').replace(' at ', '').trim();
        }
      }
    }
    
    // Find the post content
    const contentElement = postElement.querySelector('[data-ad-preview="message"], [data-ad-comet-preview="message"]');
    const content = contentElement ? contentElement.textContent.trim() : '';
    
    // Find comments
    const commentElements = postElement.querySelectorAll('[aria-label="Comment"]');
    const comments = [];
    
    commentElements.forEach(commentEl => {
      const commenterEl = commentEl.querySelector('a[role="link"]');
      const commentTextEl = commentEl.querySelector('[data-ad-comet-preview="message"]');
      
      if (commenterEl && commentTextEl) {
        const commenterHref = commenterEl.getAttribute('href');
        const commenterId = commenterHref ? commenterHref.split('?')[0].split('/').filter(Boolean).pop() : 'unknown';
        const commenterName = commenterEl.textContent.trim();
        const commentText = commentTextEl.textContent.trim();
        
        comments.push({
          commenterId,
          commenterName,
          text: commentText
        });
      }
    });
    
    return {
      groupName,
      posterId,
      posterName,
      date,
      time,
      content,
      comments
    };
  },
  
  /**
   * Process groups sequentially for data collection
   * @param {Array} groups - Array of group objects
   * @param {number} postCount - Number of posts to collect per group
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise} - Resolves with collected data
   */
  processGroups: async function(groups, postCount, progressCallback) {
    const allData = [];
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      
      // Update progress
      if (progressCallback) {
        progressCallback({
          currentGroup: group.name,
          currentIndex: i,
          totalGroups: groups.length,
          progress: Math.round((i / groups.length) * 100)
        });
      }
      
      // Create a new tab for the group
      const tab = await new Promise(resolve => {
        chrome.tabs.create({ url: group.url, active: false }, tab => resolve(tab));
      });
      
      // Wait for the page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Execute content script to collect data
      const results = await new Promise(resolve => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: (postCount, groupName) => {
            // This will call the collectData function in the content script context
            return window.DataCollectionModule.collectData(postCount);
          },
          args: [postCount, group.name]
        }, results => {
          if (chrome.runtime.lastError) {
            console.error('Error executing script:', chrome.runtime.lastError);
            resolve([]);
          } else if (results && results[0]) {
            resolve(results[0].result || []);
          } else {
            resolve([]);
          }
        });
      });
      
      // Add the collected data to our array
      allData.push(...results);
      
      // Save the collected data to storage
      await StorageModule.saveData('collectedData', allData);
      
      // Close the tab
      await new Promise(resolve => {
        chrome.tabs.remove(tab.id, resolve);
      });
    }
    
    return allData;
  },
  
  /**
   * Export collected data to CSV
   * @param {Array} data - Array of post data objects
   */
  exportToCSV: function(data) {
    if (!data || data.length === 0) {
      alert('No data to export. Please collect data first.');
      return;
    }
    
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
};

// Export the module
window.DataCollectionModule = DataCollectionModule;