/**
 * Sample Browser Entry Point
 * Client-side application initialization
 */

// Application state
let appState = {
  initialized: false,
  data: null,
  ui: null
};

// Main initialization function
async function initializeApp() {
  console.log('Initializing application...');
  
  try {
    // Load initial data
    const data = await loadInitialData();
    appState.data = data;
    
    // Initialize UI
    const ui = await initializeUI();
    appState.ui = ui;
    
    // Set up event listeners
    setupEventListeners();
    
    // Mark as initialized
    appState.initialized = true;
    
    console.log('Application initialized successfully');
    
    // Trigger app ready event
    window.dispatchEvent(new CustomEvent('app-ready', { detail: appState }));
    
  } catch (error) {
    console.error('Application initialization failed:', error);
    showErrorMessage('Failed to initialize application');
  }
}

// Load initial data
async function loadInitialData() {
  console.log('Loading initial data...');
  
  try {
    const response = await fetch('/api/initial-data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to load initial data, using defaults');
    return {
      version: '1.0.0',
      features: ['basic'],
      settings: {}
    };
  }
}

// Initialize UI components
async function initializeUI() {
  console.log('Initializing UI...');
  
  const ui = {
    header: document.getElementById('header'),
    main: document.getElementById('main'),
    footer: document.getElementById('footer')
  };
  
  // Load and render components
  await Promise.all([
    renderHeader(ui.header),
    renderMain(ui.main),
    renderFooter(ui.footer)
  ]);
  
  return ui;
}

// Render header component
async function renderHeader(element) {
  if (!element) return;
  
  element.innerHTML = `
    <nav class="navbar">
      <div class="nav-brand">Guru Intelligence</div>
      <div class="nav-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#analyze">Analyze</a>
        <a href="#settings">Settings</a>
      </div>
    </nav>
  `;
}

// Render main content
async function renderMain(element) {
  if (!element) return;
  
  element.innerHTML = `
    <div class="main-content">
      <h1>Welcome to Guru Intelligence</h1>
      <p>AI-native code intelligence platform</p>
      <div id="dashboard">
        <div class="card">
          <h2>Recent Analysis</h2>
          <div id="recent-analysis"></div>
        </div>
        <div class="card">
          <h2>Quick Actions</h2>
          <div id="quick-actions">
            <button onclick="startAnalysis()">Start Analysis</button>
            <button onclick="viewResults()">View Results</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render footer
async function renderFooter(element) {
  if (!element) return;
  
  element.innerHTML = `
    <footer class="footer">
      <p>&copy; 2024 Guru Intelligence. All rights reserved.</p>
    </footer>
  `;
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  document.addEventListener('click', (event) => {
    if (event.target.matches('nav a')) {
      event.preventDefault();
      const target = event.target.getAttribute('href').substring(1);
      navigateToSection(target);
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'k':
          event.preventDefault();
          showCommandPalette();
          break;
        case 'n':
          event.preventDefault();
          startNewAnalysis();
          break;
      }
    }
  });
  
  // Window events
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

// Navigation handler
function navigateToSection(section) {
  console.log('Navigating to:', section);
  // Navigation logic here
}

// Command palette
function showCommandPalette() {
  console.log('Showing command palette...');
  // Command palette logic here
}

// Analysis functions
function startAnalysis() {
  console.log('Starting analysis...');
  // Analysis logic here
}

function startNewAnalysis() {
  console.log('Starting new analysis...');
  // New analysis logic here
}

function viewResults() {
  console.log('Viewing results...');
  // Results viewing logic here
}

// Utility functions
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function handleWindowResize() {
  // Handle responsive layout changes
  console.log('Window resized');
}

function handleBeforeUnload(event) {
  if (appState.initialized) {
    // Save any unsaved data
    console.log('Saving application state...');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Alternative initialization for different loading patterns
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Window load fallback
window.addEventListener('load', () => {
  if (!appState.initialized) {
    console.warn('App not initialized on DOMContentLoaded, trying on window load');
    initializeApp();
  }
});
