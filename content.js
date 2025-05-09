// Content script for Facebook Group Data Collector

// First, load the global logger and console logger modules immediately
(function loadLoggers() {
  // Step 1: Load the global logger
  const globalLoggerScript = document.createElement('script');
  globalLoggerScript.src = chrome.runtime.getURL('module/global-logger.js');
  globalLoggerScript.onload = function() {
    this.remove();
    
    // Step 2: After global logger is loaded, load the console logger UI
    const consoleLoggerScript = document.createElement('script');
    consoleLoggerScript.src = chrome.runtime.getURL('module/console-logger-module.js');
    consoleLoggerScript.onload = function() {
      this.remove();
      
      // Initialize the console logger as soon as it's loaded
      if (window.ConsoleLoggerModule) {
        window.ConsoleLoggerModule.init(true, 200);
        window.ConsoleLoggerModule.loadState();
      }
      
      // Now that the loggers are initialized, we can log messages
      console.log('Facebook Group Data Collector content script loaded');
      console.info('This extension collects data from Facebook groups');
      console.warn('Please ensure you have permission to collect data from these groups');
      console.debug('Debug mode is enabled');
    };
    (document.head || document.documentElement).appendChild(consoleLoggerScript);
  };
  (document.head || document.documentElement).appendChild(globalLoggerScript);
})();

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  
  // Handle request to generate test logs
  if (message.action === 'GENERATE_TEST_LOGS') {
    console.log('Generating test logs from content script');
    console.info('This is an INFO message from the content script');
    console.warn('This is a WARNING message from the content script');
    console.error('This is an ERROR message from the content script');
    console.debug('This is a DEBUG message from the content script');
    
    // Log an object
    console.log('Content script logging an object:', { 
      source: 'content script', 
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Send response
    sendResponse({ success: true, message: 'Test logs generated' });
    return true;
  }
  
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
    'module/utility-module.js',
    'module/storage-module.js',
    'module/group-module.js',
    'module/data-collection-module.js'
    // Console logger is loaded separately to ensure it's available early
  ];
  
  let loadedCount = 0;
  
  modules.forEach(module => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(module);
    script.onload = function() {
      loadedCount++;
      this.remove();
      
      if (loadedCount === modules.length) {
        console.log('All modules loaded successfully');
      }
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// Load modules when content script is initialized
loadModules();