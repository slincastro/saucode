// Disable TypeScript checking for this file
// @ts-nocheck

(function () {
  // Get VS Code API
  const vscode = acquireVsCodeApi();

  // DOM elements
  const apiUrlInput = document.getElementById('apiUrl');
  const saveButton = document.getElementById('saveButton');
  const testButton = document.getElementById('testButton');
  const statusElement = document.getElementById('status');

  // Add event listeners
  if (saveButton) {
    saveButton.addEventListener('click', saveConfig);
  }

  if (testButton) {
    testButton.addEventListener('click', testConnection);
  }

  // Handle messages from the extension
  window.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
      case 'loadConfig':
        loadConfig(message);
        break;
      case 'saveResult':
        showResult(message);
        break;
      case 'testResult':
        showResult(message);
        break;
    }
  });

  /**
   * Loads the configuration from the extension
   * @param {any} message The message from the extension
   */
  function loadConfig(message) {
    if (apiUrlInput) {
      apiUrlInput.value = message.apiUrl || '';
    }
  }

  /**
   * Saves the configuration to the extension
   */
  function saveConfig() {
    if (!apiUrlInput) {
      return;
    }

    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showResult({
        success: false,
        message: 'API URL cannot be empty.'
      });
      return;
    }

    vscode.postMessage({
      type: 'saveConfig',
      apiUrl: apiUrl
    });
  }

  /**
   * Tests the connection to the API
   */
  function testConnection() {
    if (!apiUrlInput) {
      return;
    }

    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showResult({
        success: false,
        message: 'API URL cannot be empty.'
      });
      return;
    }

    // Show loading status
    if (statusElement) {
      statusElement.className = 'status info';
      statusElement.textContent = 'Testing connection...';
      statusElement.style.display = 'block';
    }

    vscode.postMessage({
      type: 'testConnection',
      apiUrl: apiUrl
    });
  }

  /**
   * Shows the result of an operation
   * @param {any} message The message from the extension
   */
  function showResult(message) {
    if (!statusElement) {
      return;
    }

    statusElement.className = message.success ? 'status success' : 'status error';
    statusElement.textContent = message.message || '';
    statusElement.style.display = 'block';

    // Hide the status after 5 seconds if it's a success
    if (message.success) {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
})();
