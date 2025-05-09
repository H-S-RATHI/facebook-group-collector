// console-logger-module.js - Custom console logger that displays logs in a floating window

const ConsoleLoggerModule = {
  /**
   * Initialize the console logger
   * @param {boolean} showTimestamp - Whether to show timestamps in logs
   * @param {number} maxLogs - Maximum number of logs to keep
   */
  init: function(showTimestamp = true, maxLogs = 100) {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    this.showTimestamp = showTimestamp;
    this.maxLogs = maxLogs;
    this.logs = [];
    
    // Create the logger UI if it doesn't exist
    if (!document.getElementById('custom-console-logger')) {
      this.createLoggerUI();
    }
    
    // Override console methods
    this.overrideConsoleMethods();
    
    // Log initialization
    console.log('Custom console logger initialized');
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
   * Override the default console methods
   */
  overrideConsoleMethods: function() {
    const self = this;
    
    console.log = function() {
      self.originalConsole.log.apply(console, arguments);
      self.addLogEntry('log', Array.from(arguments));
    };
    
    console.info = function() {
      self.originalConsole.info.apply(console, arguments);
      self.addLogEntry('info', Array.from(arguments));
    };
    
    console.warn = function() {
      self.originalConsole.warn.apply(console, arguments);
      self.addLogEntry('warn', Array.from(arguments));
    };
    
    console.error = function() {
      self.originalConsole.error.apply(console, arguments);
      self.addLogEntry('error', Array.from(arguments));
    };
    
    console.debug = function() {
      self.originalConsole.debug.apply(console, arguments);
      self.addLogEntry('debug', Array.from(arguments));
    };
  },
  
  /**
   * Add a log entry to the logger
   * @param {string} type - The type of log (log, info, warn, error, debug)
   * @param {Array} args - The arguments passed to the console method
   */
  addLogEntry: function(type, args) {
    // Create log entry
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
      message: formattedArgs
    };
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Update UI
    this.updateLogDisplay();
    
    // Save to session storage
    this.saveState();
  },
  
  /**
   * Update the log display
   */
  updateLogDisplay: function() {
    if (!this.logContainer) return;
    
    // Clear current logs
    this.logContainer.innerHTML = '';
    
    // Add each log entry
    this.logs.forEach(log => {
      const logElement = document.createElement('div');
      logElement.className = `log-entry log-${log.type}`;
      
      // Set style based on log type
      let color = '#fff';
      switch (log.type) {
        case 'info':
          color = '#58a6ff';
          break;
        case 'warn':
          color = '#e3b341';
          break;
        case 'error':
          color = '#f85149';
          break;
        case 'debug':
          color = '#8b949e';
          break;
      }
      
      logElement.style.color = color;
      
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
    this.logs = [];
    this.updateLogDisplay();
    this.saveState();
  },
  
  /**
   * Toggle the visibility of the logger
   * @param {boolean} show - Whether to show or hide the logger
   */
  toggleVisibility: function(show) {
    if (!this.container || !this.showButton) return;
    
    if (show === undefined) {
      show = this.container.style.display === 'none';
    }
    
    this.container.style.display = show ? 'flex' : 'none';
    this.showButton.style.display = show ? 'none' : 'block';
    
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
window.ConsoleLoggerModule = ConsoleLoggerModule;