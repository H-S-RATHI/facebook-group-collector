// utility-module.js - Utility functions for the extension

const UtilityModule = {
  /**
   * Wait for an element to appear in the DOM
   * @param {string} selector - CSS selector for the element
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise} - Resolves with the element or null if timeout
   */
  waitForElement: function(selector, timeout = 10000) {
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
  },
  
  /**
   * Sleep for a specified time
   * @param {number} ms - Time to sleep in milliseconds
   * @returns {Promise} - Resolves after the specified time
   */
  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Format a date string
   * @param {string} dateStr - Date string to format
   * @returns {string} - Formatted date string
   */
  formatDate: function(dateStr) {
    if (!dateStr || dateStr === 'Unknown') return dateStr;
    
    // Handle relative dates like "Yesterday", "Today", etc.
    const today = new Date();
    
    if (dateStr.toLowerCase().includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday.toLocaleDateString();
    }
    
    if (dateStr.toLowerCase().includes('today')) {
      return today.toLocaleDateString();
    }
    
    // Try to parse the date
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    
    return dateStr;
  },
  
  /**
   * Show a notification in the UI
   * @param {string} message - Message to display
   * @param {string} type - Type of notification (info, success, error)
   * @param {HTMLElement} element - Element to display the notification in
   */
  showNotification: function(message, type, element) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `notification ${type}`;
    element.style.display = 'block';
    
    // Hide after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        element.style.display = 'none';
      }, 5000);
    }
  },
  
  /**
   * Update progress bar
   * @param {number} percent - Percentage complete (0-100)
   * @param {HTMLElement} progressBar - Progress bar element
   */
  updateProgress: function(percent, progressBar) {
    if (!progressBar) return;
    
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
  }
};

// Export the module
window.UtilityModule = UtilityModule;