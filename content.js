// Content script for Facebook Group Data Collector
console.log('Facebook Group Data Collector content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  
  if (message.action === 'fetchGroups') {
    GroupModule.fetchGroups().then(groups => {
      sendResponse({ success: true, groups: groups });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'collectData') {
    DataCollectionModule.collectData(message.postCount).then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response
  }
});

// Load modules
function loadModules() {
  // Create script elements for each module
  const modules = [
    'utility-module.js',
    'storage-module.js',
    'group-module.js',
    'data-collection-module.js'
  ];
  
  modules.forEach(module => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(module);
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// Load modules when content script is initialized
loadModules();// Content script for Facebook Group Data Collector
console.log('Facebook Group Data Collector content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  
  if (message.action === 'fetchGroups') {
    fetchGroups().then(groups => {
      sendResponse({ success: true, groups: groups });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'collectData') {
    collectData(message.postCount).then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response
  }
});

// Function to fetch Facebook groups
async function fetchGroups() {
  console.log('Fetching Facebook groups...');
  
  // Wait for the page to load
  await waitForElement('a[href*="/groups/"]');
  
  // Scroll down a few times to load more groups
  for (let i = 0; i < 5; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(1000);
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
}

// Function to collect data from posts and comments
async function collectData(postCount) {
  console.log(`Collecting data for ${postCount} posts...`);
  
  // Get the current group name
  const groupNameElement = document.querySelector('h1');
  const groupName = groupNameElement ? groupNameElement.textContent.trim() : 'Unknown Group';
  
  // Wait for posts to load
  await waitForElement('[data-pagelet^="FeedUnit_"]');
  
  // Scroll down to load more posts
  for (let i = 0; i < Math.min(postCount * 2, 20); i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(1000);
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
        await sleep(500);
      }
    }
    
    // Click "View more comments" buttons
    const viewMoreCommentsButtons = post.querySelectorAll('div[role="button"]');
    for (const button of viewMoreCommentsButtons) {
      if (button.textContent.includes('View') && button.textContent.includes('comment')) {
        button.click();
        await sleep(1000);
      }
    }
    
    // Extract post data
    const postData = extractPostData(post, groupName);
    collectedPosts.push(postData);
  }
  
  console.log(`Collected data for ${collectedPosts.length} posts`);
  return collectedPosts;
}

// Function to extract data from a post element
function extractPostData(postElement, groupName) {
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
}

// Helper function to wait for an element to appear in the DOM
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Helper function to sleep for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}