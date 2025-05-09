// Load loggers immediately
(function loadLoggers() {
  // Step 1: Load the global logger
  const globalLoggerScript = document.createElement('script');
  globalLoggerScript.src = 'module/global-logger.js';
  globalLoggerScript.onload = function() {
    console.log('Global logger loaded in popup');
    
    // Step 2: After global logger is loaded, load the console logger UI
    const consoleLoggerScript = document.createElement('script');
    consoleLoggerScript.src = 'module/console-logger-module.js';
    consoleLoggerScript.onload = function() {
      if (window.ConsoleLoggerModule) {
        window.ConsoleLoggerModule.init(true, 200);
        window.ConsoleLoggerModule.loadState();
        console.log('Console logger UI initialized in popup');
      }
    };
    document.head.appendChild(consoleLoggerScript);
  };
  document.head.appendChild(globalLoggerScript);
})();

// Function to generate test logs
function generateTestLogs() {
  console.log('Generating test logs to verify console logger functionality');
  console.info('This is an INFO message - blue color');
  console.warn('This is a WARNING message - yellow color');
  console.error('This is an ERROR message - red color');
  console.debug('This is a DEBUG message - gray color');
  
  // Log an object
  console.log('Logging an object:', { name: 'Test Object', value: 42, nested: { key: 'value' } });
  
  // Log an array
  console.log('Logging an array:', [1, 2, 3, 'test', true]);
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup initialized');
  
  // Generate test logs after a short delay
  setTimeout(generateTestLogs, 1000);
  
  // Store the selected groups and collected data
  let selectedGroups = [];
  let collectedData = [];
  
  // DOM Elements
  const elements = {
    fetchGroupsBtn: document.getElementById('fetch-groups'),
    confirmGroupsBtn: document.getElementById('confirm-groups'),
    startCollectionBtn: document.getElementById('start-collection'),
    exportDataBtn: document.getElementById('export-data'),
    toggleConsoleBtn: document.getElementById('toggle-console'),
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
    exportData: exportCollectedData,
    toggleConsole: toggleConsoleLogger
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
  
});