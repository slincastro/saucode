// @ts-check

(function () {
  // Get VS Code API
  const vscode = acquireVsCodeApi();

  // DOM elements
  const fileNameElement = document.getElementById('file-name');
  const contentElement = document.getElementById('content');
  const metricsElement = document.getElementById('metrics');
  const buttonsElement = document.getElementById('buttons');

  // Handle messages from the extension
  window.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
      case 'updateContent':
        updateContent(message);
        break;
      case 'updateMetricsContent':
        updateMetricsContent(message);
        break;
    }
  });

  /**
   * Updates the content of the webview with analysis results
   * @param {any} message The message from the extension
   */
  function updateContent(message) {
    if (fileNameElement) {
      fileNameElement.textContent = message.fileName || 'Analysis Results';
    }

    if (contentElement) {
      contentElement.innerHTML = message.content || '';
    }

    if (metricsElement) {
      metricsElement.innerHTML = message.metricsHtml || '';
    }

    if (buttonsElement) {
      buttonsElement.innerHTML = message.buttonsHtml || '';
      
      // Add event listeners to buttons
      const applyButton = document.querySelector('.apply-button');
      if (applyButton) {
        applyButton.addEventListener('click', () => {
          vscode.postMessage({ type: 'applyCode' });
        });
      }

      const closeButton = document.querySelector('.close-button');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          vscode.postMessage({ type: 'closeImprovedCode' });
        });
      }
    }
  }

  /**
   * Updates the metrics content of the webview
   * @param {any} message The message from the extension
   */
  function updateMetricsContent(message) {
    if (fileNameElement) {
      fileNameElement.textContent = message.fileName || 'Metrics Results';
    }

    if (contentElement) {
      contentElement.innerHTML = '<p>Metrics for the selected file:</p>';
    }

    if (metricsElement) {
      metricsElement.innerHTML = message.metricsHtml || '';
    }

    if (buttonsElement) {
      buttonsElement.innerHTML = '';
    }
  }
})();
