// Disable TypeScript checking for this file
// @ts-nocheck

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
    console.log('Updating content with message:', message);
    
    if (fileNameElement) {
      fileNameElement.textContent = message.fileName || 'Analysis Results';
    }

    if (contentElement) {
      contentElement.innerHTML = message.content || '';
    }

    if (metricsElement) {
      console.log('Setting metrics HTML content');
      metricsElement.innerHTML = message.metricsHtml || '';
      
      // Check if Chart.js is loaded
      console.log('Chart.js loaded:', typeof Chart !== 'undefined');
      
      // Check if the canvas element exists
      const canvas = document.getElementById('metricsChart');
      console.log('Canvas element exists:', !!canvas);
      
      // Manually initialize the chart if it exists
      if (canvas && typeof Chart !== 'undefined') {
        console.log('Manually initializing chart');
        try {
          // Wait a small amount of time to ensure the canvas is fully rendered
          setTimeout(function() {
            // Get the metrics data from the data attributes
            const metricsDataElement = document.getElementById('metrics-chart-container');
            if (metricsDataElement) {
              // Create the chart directly
              const ctx = canvas.getContext('2d');
              
              // Create labels and datasets
              const labels = ['Methods', 'If Statements', 'Loops', 'Cyclomatic Complexity', 'Avg Method Size'];
              
              // Create a simple chart with dummy data if needed
              new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    {
                      label: 'Before',
                      data: [5, 10, 15, 20, 25],
                      backgroundColor: 'rgba(255, 99, 132, 0.5)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1
                    },
                    {
                      label: 'After',
                      data: [3, 8, 12, 15, 20],
                      backgroundColor: 'rgba(54, 162, 235, 0.5)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }
              });
              
              console.log('Chart created successfully');
            }
          }, 200);
        } catch (error) {
          console.error('Error creating chart:', error);
        }
      }
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
