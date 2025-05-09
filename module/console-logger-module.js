// console-logger-module.js - Custom console logger that displays logs in a floating window

const ConsoleLoggerModule = {
  /**
   * Initialize the console logger
   * @param {boolean} showTimestamp - Whether to show timestamps in logs
   * @param {number} maxLogs - Maximum number of logs to keep
   */
  init: function(showTimestamp = true, maxLogs = 100) {
    this.showTimestamp = showTimestamp;
    this.maxLogs = maxLogs;
    
    // Create the logger UI if it doesn't exist
    if (!document.getElementById('custom-console-logger')) {
      this.createLoggerUI();
    }
    
    // Register as a listener for global logs
    if (window.GlobalLogger) {
      // Get existing logs
      this.logs = window.GlobalLogger.getLogs();
      
      // Add listener for new logs
      window.GlobalLogger.addListener(this.handleNewLogEntry.bind(this));
      
      console.log('Console logger UI initialized and connected to global logger');
    } else {
      console.error('Global logger not found. Console logger will not work properly.');
      this.logs = [];
    }
    
    // Force an update of the log display
    this.updateLogDisplay();
    
    // Make sure the logger is visible by default
    if (this.container) {
      this.container.style.display = 'flex';
      if (this.showButton) {
        this.showButton.style.display = 'none';
      }
    }
  },
  
  /**
   * Handle a new log entry from the global logger
   * @param {Object} logEntry - The log entry object
   */
  handleNewLogEntry: function(logEntry) {
    if (logEntry.type === 'clear') {
      this.logs = [];
    } else {
      this.logs.push(logEntry);
      
      // Trim logs if exceeding max
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }
    
    // Update the display
    this.updateLogDisplay();
  },
  
  /**
   * Create the logger UI
   */
  createLoggerUI: function() {
    // Create container
    const container = document.createElement('div');
    container.id = 'custom-console-logger';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'logger-header';
    
    const title = document.createElement('div');
    title.textContent = 'Console Logger';
    title.className = 'logger-title';
    
    const controls = document.createElement('div');
    controls.className = 'logger-controls';
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = () => this.clearLogs();
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.className = 'close-btn';
    closeBtn.onclick = () => this.toggleVisibility();
    
    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    // Create log container
    const logContainer = document.createElement('div');
    logContainer.id = 'custom-console-logs';
    
    // Create footer with filter options
    const footer = document.createElement('div');
    footer.className = 'logger-footer';
    
    const filterLabel = document.createElement('span');
    filterLabel.textContent = 'Filter: ';
    
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Filter logs...';
    filterInput.oninput = (e) => this.filterLogs(e.target.value);
    
    const showBtn = document.createElement('button');
    showBtn.textContent = 'Show Console';
    showBtn.id = 'show-console-logger';
    showBtn.style.display = 'none';
    showBtn.onclick = () => this.toggleVisibility(true);
    
    footer.appendChild(filterLabel);
    footer.appendChild(filterInput);
    
    // Assemble the UI
    container.appendChild(header);
    container.appendChild(logContainer);
    container.appendChild(footer);
    document.body.appendChild(container);
    document.body.appendChild(showBtn);
    
    // Make the logger draggable
    this.makeDraggable(container, header);
    
    // Store references
    this.container = container;
    this.logContainer = logContainer;
    this.showButton = showBtn;
    
    // Save to session storage to persist across page refreshes
    this.saveState();
  },
  
  /**
   * Make an element draggable
   * @param {HTMLElement} element - The element to make draggable
   * @param {HTMLElement} handle - The handle element for dragging
   */
  makeDraggable: function(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // Get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // Call a function whenever the cursor moves
      document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // Set the element's new position
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }
    
    function closeDragElement() {
      // Stop moving when mouse button is released
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },
  
  /**
   * Add a log entry directly (for internal use)
   * @param {string} type - The type of log (log, info, warn, error, debug)
   * @param {string} message - The message to log
   */
  addInternalLogEntry: function(type, message) {
    if (window.GlobalLogger) {
      // Use the global logger
      switch (type) {
        case 'log':
          window.GlobalLogger.log(message);
          break;
        case 'info':
          window.GlobalLogger.info(message);
          break;
        case 'warn':
          window.GlobalLogger.warn(message);
          break;
        case 'error':
          window.GlobalLogger.error(message);
          break;
        case 'debug':
          window.GlobalLogger.debug(message);
          break;
      }
    } else {
      // Fallback if global logger is not available
      const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
      const logEntry = {
        type,
        timestamp,
        message
      };
      
      this.logs.push(logEntry);
      
      // Trim logs if exceeding max
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      // Update UI immediately
      this.updateLogDisplay();
    }
  },
  
  /**
   * Update the log display
   */
  updateLogDisplay: function() {
    if (!this.logContainer) {
      if (this.originalConsole) {
        this.originalConsole.warn('Log container not found, cannot update display');
      }
      return;
    }
    
    try {
      // Clear current logs
      this.logContainer.innerHTML = '';
      
      if (this.logs.length === 0) {
        // Add a placeholder message if no logs
        const placeholderElement = document.createElement('div');
        placeholderElement.className = 'log-entry log-info';
        placeholderElement.textContent = 'No logs to display yet. Actions will be logged here.';
        this.logContainer.appendChild(placeholderElement);
        return;
      }
      
      // Add each log entry
      this.logs.forEach(log => {
        const logElement = document.createElement('div');
        logElement.className = `log-entry log-${log.type}`;
        
        // Add timestamp if enabled
        let logText = '';
        if (this.showTimestamp) {
          logText += `[${log.timestamp}] `;
        }
        
        // Add message
        logText += log.message;
        
        logElement.textContent = logText;
        this.logContainer.appendChild(logElement);
      });
      
      // Scroll to bottom
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    } catch (e) {
      if (this.originalConsole) {
        this.originalConsole.error('Error updating log display:', e);
      }
    }
  },
  
  /**
   * Filter logs based on search text
   * @param {string} filterText - Text to filter logs by
   */
  filterLogs: function(filterText) {
    if (!this.logContainer) return;
    
    const logEntries = this.logContainer.querySelectorAll('.log-entry');
    
    if (!filterText) {
      // Show all logs if filter is empty
      logEntries.forEach(entry => {
        entry.style.display = 'block';
      });
      return;
    }
    
    // Filter logs
    const lowerFilter = filterText.toLowerCase();
    logEntries.forEach(entry => {
      if (entry.textContent.toLowerCase().includes(lowerFilter)) {
        entry.style.display = 'block';
      } else {
        entry.style.display = 'none';
      }
    });
  },
  
  /**
   * Clear all logs
   */
  clearLogs: function() {
    if (window.GlobalLogger) {
      window.GlobalLogger.clearLogs();
    } else {
      this.logs = [];
      this.updateLogDisplay();
    }
    this.saveState();
  },
  
  /**
   * Toggle the visibility of the logger
   * @param {boolean} show - Whether to show or hide the logger
   */
  toggleVisibility: function(show) {
    if (!this.container || !this.showButton) {
      this.addInternalLogEntry('warn', 'Container or show button not found, cannot toggle visibility');
      return;
    }
    
    if (show === undefined) {
      show = this.container.style.display === 'none';
    }
    
    this.container.style.display = show ? 'flex' : 'none';
    this.showButton.style.display = show ? 'none' : 'block';
    
    // Log the visibility change
    this.addInternalLogEntry('info', `Console logger is now ${show ? 'visible' : 'hidden'}`);
    
    // Save state
    this.saveState();
  },
  
  /**
   * Save the current state to session storage
   */
  saveState: function() {
    try {
      sessionStorage.setItem('consoleLoggerLogs', JSON.stringify(this.logs));
      sessionStorage.setItem('consoleLoggerVisible', this.container.style.display !== 'none');
      
      // Save position if dragged
      if (this.container.style.top) {
        sessionStorage.setItem('consoleLoggerPosition', JSON.stringify({
          top: this.container.style.top,
          left: this.container.style.left
        }));
      }
    } catch (e) {
      // Ignore storage errors
    }
  },
  
  /**
   * Load the state from session storage
   */
  loadState: function() {
    try {
      // Load logs
      const savedLogs = sessionStorage.getItem('consoleLoggerLogs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
        this.updateLogDisplay();
      }
      
      // Load visibility
      const visible = sessionStorage.getItem('consoleLoggerVisible');
      if (visible !== null) {
        this.toggleVisibility(visible === 'true');
      }
      
      // Load position
      const position = sessionStorage.getItem('consoleLoggerPosition');
      if (position && this.container) {
        const { top, left } = JSON.parse(position);
        this.container.style.top = top;
        this.container.style.left = left;
        this.container.style.bottom = 'auto';
        this.container.style.right = 'auto';
      }
    } catch (e) {
      // Ignore storage errors
    }
  }
};

// Export the module
window.ConsoleLoggerModule = ConsoleLoggerModule;// console-logger-module.js - Custom console logger that displays logs in a floating window

