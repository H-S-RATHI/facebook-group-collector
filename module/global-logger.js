// global-logger.js - A global logger that captures console logs across all contexts

// Create a global object to store logs
window.globalLoggerData = window.globalLoggerData || {
  logs: [],
  maxLogs: 200,
  listeners: [],
  contextId: Math.random().toString(36).substring(2, 15) // Generate a unique ID for this context
};

// Function to add a log entry
function addGlobalLogEntry(type, args) {
  const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
  const formattedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  
  const logEntry = {
    type,
    timestamp,
    message: formattedArgs,
    contextId: window.globalLoggerData.contextId
  };
  
  // Add to global logs array
  window.globalLoggerData.logs.push(logEntry);
  
  // Trim logs if exceeding max
  if (window.globalLoggerData.logs.length > window.globalLoggerData.maxLogs) {
    window.globalLoggerData.logs.shift();
  }
  
  // Notify all listeners
  window.globalLoggerData.listeners.forEach(listener => {
    try {
      listener(logEntry);
    } catch (e) {
      console.error('Error in log listener:', e);
    }
  });
  
  // Send log to other contexts via message passing
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'LOG_ENTRY',
        logEntry: logEntry
      });
    }
  } catch (e) {
    // Ignore errors in message passing
  }
  
  return logEntry;
}

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Override console methods if not already done
if (!window._consoleOverridden) {
  window._consoleOverridden = true;
  
  console.log = function() {
    originalConsole.log.apply(console, arguments);
    addGlobalLogEntry('log', Array.from(arguments));
  };
  
  console.info = function() {
    originalConsole.info.apply(console, arguments);
    addGlobalLogEntry('info', Array.from(arguments));
  };
  
  console.warn = function() {
    originalConsole.warn.apply(console, arguments);
    addGlobalLogEntry('warn', Array.from(arguments));
  };
  
  console.error = function() {
    originalConsole.error.apply(console, arguments);
    addGlobalLogEntry('error', Array.from(arguments));
  };
  
  console.debug = function() {
    originalConsole.debug.apply(console, arguments);
    addGlobalLogEntry('debug', Array.from(arguments));
  };
  
  // Log that we've overridden the console
  originalConsole.log('Global console logger initialized');
}

// Export functions for other scripts to use
window.GlobalLogger = {
  // Add a listener for new log entries
  addListener: function(callback) {
    if (typeof callback === 'function' && !window.globalLoggerData.listeners.includes(callback)) {
      window.globalLoggerData.listeners.push(callback);
    }
  },
  
  // Remove a listener
  removeListener: function(callback) {
    const index = window.globalLoggerData.listeners.indexOf(callback);
    if (index !== -1) {
      window.globalLoggerData.listeners.splice(index, 1);
    }
  },
  
  // Get all logs
  getLogs: function() {
    return window.globalLoggerData.logs.slice();
  },
  
  // Clear all logs
  clearLogs: function() {
    window.globalLoggerData.logs = [];
    // Notify listeners of clear
    window.globalLoggerData.listeners.forEach(listener => {
      try {
        listener({ type: 'clear', timestamp: new Date().toISOString().split('T')[1].split('Z')[0], message: 'Logs cleared' });
      } catch (e) {
        console.error('Error in log listener:', e);
      }
    });
  },
  
  // Log a message directly
  log: function(message) {
    console.log(message);
  },
  
  info: function(message) {
    console.info(message);
  },
  
  warn: function(message) {
    console.warn(message);
  },
  
  error: function(message) {
    console.error(message);
  },
  
  debug: function(message) {
    console.debug(message);
  }
};

// Set up message listener for logs from other contexts
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'LOG_ENTRY' && message.logEntry) {
      // Only process logs from other contexts
      if (message.logEntry.contextId !== window.globalLoggerData.contextId) {
        const logEntry = message.logEntry;
        
        // Add to global logs array
        window.globalLoggerData.logs.push(logEntry);
        
        // Trim logs if exceeding max
        if (window.globalLoggerData.logs.length > window.globalLoggerData.maxLogs) {
          window.globalLoggerData.logs.shift();
        }
        
        // Notify all listeners
        window.globalLoggerData.listeners.forEach(listener => {
          try {
            listener(logEntry);
          } catch (e) {
            originalConsole.error('Error in log listener:', e);
          }
        });
      }
    }
  });
}

// Log a test message
console.log('Global logger is ready');