// Content script for Facebook Group Collector

// Function to extract usernames from posts
function extractUsernames() {
  try {
    // Try specific class for posts first, fallback to role="article"
    const posts = Array.from(document.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z, [role="article"]'));
    const usernames = [];
    
    for (const post of posts.slice(0, 10)) {
      try {
        // Try multiple selectors to find the username
        const selectors = [
          // Target span inside the specific class
          '.html-strong.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs.x1s688f span'
        ];
        
        let username = 'Unknown User';
        
        for (const selector of selectors) {
          const element = post.querySelector(selector);
          if (element) {
            const text = element.textContent.trim();
            // Skip if it's a timestamp or empty
            if (text && !/\d+(s|m|h|d|w|y) ago/i.test(text)) {
              username = text;
              break;
            }
          }
        }
        
        usernames.push(username);
      } catch (e) {
        console.error('Error processing post:', e);
        usernames.push('Error getting username');
      }
    }
    
    return { success: true, usernames };
  } catch (error) {
    console.error('Error in extractUsernames:', error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractUsernames') {
    const result = extractUsernames();
    sendResponse(result);
  }
  return true; // Required for async response
});

// Log when content script is loaded
console.log('Facebook Group Collector content script loaded');
