// Background script for Facebook Group Data Collector

// Import the storage module
importScripts('storage-module.js');

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background script received message:', message);
  
  if (message.action === 'saveData') {
    // Save data to storage using the storage module
    StorageModule.saveData(message.key, message.data).then(response => {
      sendResponse(response);
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'getData') {
    // Retrieve data from storage using the storage module
    StorageModule.getData(message.key).then(response => {
      sendResponse(response);
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'clearData') {
    // Clear specific data from storage using the storage module
    StorageModule.clearData(message.key).then(response => {
      sendResponse(response);
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'clearAllData') {
    // Clear all data from storage using the storage module
    StorageModule.clearAllData().then(response => {
      sendResponse(response);
    });
    return true; // Indicates async response
  }
});

// Listen for installation or update
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed or updated:', details.reason);
  
  // Initialize storage with empty values on install
  if (details.reason === 'install') {
    StorageModule.initializeStorage().then(() => {
      console.log('Storage initialized');
    });
  }
});// Background script for Facebook Group Data Collector

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background script received message:', message);
  
  if (message.action === 'saveData') {
    // Save data to storage
    chrome.storage.local.set({ [message.key]: message.data }, function() {
      console.log(`Data saved with key: ${message.key}`);
      sendResponse({ success: true });
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'getData') {
    // Retrieve data from storage
    chrome.storage.local.get(message.key, function(result) {
      console.log(`Data retrieved for key: ${message.key}`);
      sendResponse({ success: true, data: result[message.key] });
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'clearData') {
    // Clear specific data from storage
    chrome.storage.local.remove(message.key, function() {
      console.log(`Data cleared for key: ${message.key}`);
      sendResponse({ success: true });
    });
    return true; // Indicates async response
  }
  
  if (message.action === 'clearAllData') {
    // Clear all data from storage
    chrome.storage.local.clear(function() {
      console.log('All data cleared from storage');
      sendResponse({ success: true });
    });
    return true; // Indicates async response
  }
});

// Listen for installation or update
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed or updated:', details.reason);
  
  // Initialize storage with empty values on install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      selectedGroups: [],
      collectedData: [],
      postCount: 10
    }, function() {
      console.log('Storage initialized');
    });
  }
});