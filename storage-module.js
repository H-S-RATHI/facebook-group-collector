// storage-module.js - Handles all storage-related operations

const StorageModule = {
  /**
   * Save data to Chrome's local storage
   * @param {string} key - The key to store the data under
   * @param {any} data - The data to store
   * @returns {Promise} - Resolves when data is saved
   */
  saveData: function(key, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, function() {
        console.log(`Data saved with key: ${key}`);
        resolve({ success: true });
      });
    });
  },

  /**
   * Retrieve data from Chrome's local storage
   * @param {string} key - The key to retrieve data for
   * @returns {Promise} - Resolves with the retrieved data
   */
  getData: function(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, function(result) {
        console.log(`Data retrieved for key: ${key}`);
        resolve({ success: true, data: result[key] });
      });
    });
  },

  /**
   * Clear specific data from Chrome's local storage
   * @param {string} key - The key to clear data for
   * @returns {Promise} - Resolves when data is cleared
   */
  clearData: function(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, function() {
        console.log(`Data cleared for key: ${key}`);
        resolve({ success: true });
      });
    });
  },

  /**
   * Clear all data from Chrome's local storage
   * @returns {Promise} - Resolves when all data is cleared
   */
  clearAllData: function() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(function() {
        console.log('All data cleared from storage');
        resolve({ success: true });
      });
    });
  },

  /**
   * Initialize storage with default values
   * @returns {Promise} - Resolves when storage is initialized
   */
  initializeStorage: function() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        selectedGroups: [],
        collectedData: [],
        postCount: 10
      }, function() {
        console.log('Storage initialized');
        resolve({ success: true });
      });
    });
  }
};

// Export the module
window.StorageModule = StorageModule;