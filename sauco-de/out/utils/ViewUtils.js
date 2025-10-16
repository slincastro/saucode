"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewUtils = void 0;
const MetricsService_1 = require("../services/metrics/MetricsService");
/**
 * Utility functions for views
 */
class ViewUtils {
    /**
     * Formats metrics as a chart HTML
     * @param originalMetrics The original metrics
     * @param improvedMetrics The improved metrics
     * @returns The HTML for the chart
     */
    static formatMetricsAsChartHtml(originalMetrics, improvedMetrics) {
        // Create a metrics data object similar to the one used in the original implementation
        const metricsData = {
            before: {},
            after: {}
        };
        // Create a map for easier lookup
        const originalMetricsMap = new Map();
        const improvedMetricsMap = new Map();
        originalMetrics.metrics.forEach(m => originalMetricsMap.set(m.name, m));
        improvedMetrics.metrics.forEach(m => improvedMetricsMap.set(m.name, m));
        // Add common metrics to the data object
        const commonMetrics = [
            { name: 'Cyclomatic Complexity', key: 'cyclomatic_complexity' },
            { name: 'Method Count', key: 'method_number' },
            { name: 'If Statements', key: 'number_of_ifs' },
            { name: 'Loops', key: 'number_of_loops' },
            { name: 'Avg Method Size', key: 'average_method_size' }
        ];
        // Populate the metrics data object
        for (const metric of commonMetrics) {
            const originalMetric = originalMetricsMap.get(metric.name);
            const improvedMetric = improvedMetricsMap.get(metric.name);
            if (originalMetric) {
                metricsData.before[metric.key] = originalMetric.value;
            }
            if (improvedMetric) {
                metricsData.after[metric.key] = improvedMetric.value;
            }
        }
        // If we don't have the specific metrics, use the first 5 metrics we find
        if (Object.keys(metricsData.before).length === 0 || Object.keys(metricsData.after).length === 0) {
            const metricNames = new Set();
            originalMetrics.metrics.forEach(m => metricNames.add(m.name));
            improvedMetrics.metrics.forEach(m => metricNames.add(m.name));
            const metricArray = Array.from(metricNames).slice(0, 5);
            metricArray.forEach((name, index) => {
                const originalMetric = originalMetricsMap.get(name);
                const improvedMetric = improvedMetricsMap.get(name);
                if (originalMetric) {
                    metricsData.before[`metric_${index}`] = originalMetric.value;
                }
                if (improvedMetric) {
                    metricsData.after[`metric_${index}`] = improvedMetric.value;
                }
            });
        }
        return `
      <div id="metrics-chart-container">
        <h2>Metrics Comparison</h2>
        <div class="chart-container">
          <canvas id="metricsChart"></canvas>
        </div>
        <script>
          // Use an immediately invoked function expression (IIFE) to initialize the chart
          (function() {
            // Wait for the DOM to be fully loaded
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initChart);
            } else {
              // DOM already loaded, initialize chart immediately
              initChart();
            }
            
            function initChart() {
              try {
                console.log('Initializing chart...');
                const metricsData = ${JSON.stringify(metricsData)};
                
                // Wait a small amount of time to ensure the canvas is in the DOM
                setTimeout(function() {
                  const canvas = document.getElementById('metricsChart');
                  if (!canvas) {
                    console.error('Canvas element not found');
                    return;
                  }
                  
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    console.error('Could not get 2d context from canvas');
                    return;
                  }
                  
                  // Create labels and datasets
                  const labels = ['Methods', 'If Statements', 'Loops', 'Cyclomatic Complexity', 'Avg Method Size'];
                  const beforeData = [
                    metricsData.before.method_number || 0,
                    metricsData.before.number_of_ifs || 0,
                    metricsData.before.number_of_loops || 0,
                    metricsData.before.cyclomatic_complexity || 0,
                    metricsData.before.average_method_size || 0
                  ];
                  const afterData = [
                    metricsData.after.method_number || 0,
                    metricsData.after.number_of_ifs || 0,
                    metricsData.after.number_of_loops || 0,
                    metricsData.after.cyclomatic_complexity || 0,
                    metricsData.after.average_method_size || 0
                  ];
                  
                  console.log('Chart data:', { labels, beforeData, afterData });
                  
                  // Check if Chart is available
                  if (typeof Chart === 'undefined') {
                    console.error('Chart.js is not loaded');
                    return;
                  }
                  
                  // Create the chart
                  const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                      labels: labels,
                      datasets: [
                        {
                          label: 'Before',
                          data: beforeData,
                          backgroundColor: 'rgba(255, 99, 132, 0.5)',
                          borderColor: 'rgba(255, 99, 132, 1)',
                          borderWidth: 1
                        },
                        {
                          label: 'After',
                          data: afterData,
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
                }, 100);
              } catch (error) {
                console.error('Error creating chart:', error);
              }
            }
          })();
        </script>
      </div>
    `;
    }
    /**
     * Formats metrics as HTML
     * @param metrics The metrics to format
     * @returns The HTML
     */
    static formatMetricsAsHtml(metrics) {
        let html = `
      <div class="metrics-container">
        <h2>Metrics</h2>
        <p>Overall Score: ${metrics.overallScore.toFixed(2)}</p>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
        for (const metric of metrics.metrics) {
            const threshold = MetricsService_1.MetricsService.getThreshold(metric.name);
            const isGood = MetricsService_1.MetricsService.isGoodMetric(metric);
            const statusClass = isGood ? 'better' : 'worse';
            const statusText = isGood ? 'Good' : 'Needs Improvement';
            html += `
        <tr>
          <td>${metric.name}</td>
          <td>${metric.value}</td>
          <td>${threshold}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
        }
        html += `
          </tbody>
        </table>
      </div>
    `;
        return html;
    }
    /**
     * Formats improved code as HTML
     * @param code The code to format
     * @returns The HTML
     */
    static formatImprovedCodeAsHtml(code) {
        // Escape HTML special characters
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return `
      <div class="code-container">
        <h2>Improved Code</h2>
        <pre><code>${escapedCode}</code></pre>
      </div>
    `;
    }
    /**
     * Creates a side-by-side comparison of original and improved code
     * @param originalCode The original code
     * @param improvedCode The improved code
     * @returns The HTML
     */
    static createSideBySideComparison(originalCode, improvedCode) {
        // Escape HTML special characters
        const escapedOriginalCode = originalCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        const escapedImprovedCode = improvedCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return `
      <div class="comparison-container">
        <div class="original-code">
          <h3>Original Code</h3>
          <pre><code>${escapedOriginalCode}</code></pre>
        </div>
        <div class="improved-code">
          <h3>Improved Code</h3>
          <pre><code>${escapedImprovedCode}</code></pre>
        </div>
      </div>
    `;
    }
    /**
     * Formats metrics comparison as HTML
     * @param originalMetrics The original metrics
     * @param improvedMetrics The improved metrics
     * @returns The HTML
     */
    static formatMetricsComparisonAsHtml(originalMetrics, improvedMetrics) {
        let html = `
      <div class="metrics-comparison">
        <h2>Metrics Comparison</h2>
        <p>Overall Score: ${originalMetrics.overallScore.toFixed(2)} → ${improvedMetrics.overallScore.toFixed(2)}</p>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Original</th>
              <th>Improved</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
    `;
        // Combine metrics from both sets
        const metricNames = new Set();
        originalMetrics.metrics.forEach(m => metricNames.add(m.name));
        improvedMetrics.metrics.forEach(m => metricNames.add(m.name));
        // Create a map for easier lookup
        const originalMetricsMap = new Map();
        const improvedMetricsMap = new Map();
        originalMetrics.metrics.forEach(m => originalMetricsMap.set(m.name, m));
        improvedMetrics.metrics.forEach(m => improvedMetricsMap.set(m.name, m));
        // Add rows for each metric
        for (const name of metricNames) {
            const originalMetric = originalMetricsMap.get(name);
            const improvedMetric = improvedMetricsMap.get(name);
            if (!originalMetric || !improvedMetric) {
                continue;
            }
            const originalValue = originalMetric.value;
            const improvedValue = improvedMetric.value;
            const change = improvedValue - originalValue;
            const isGood = change <= 0; // Lower is better for most metrics
            const statusClass = isGood ? 'better' : 'worse';
            const changeText = `${change > 0 ? '+' : ''}${change.toFixed(2)}`;
            html += `
        <tr>
          <td>${name}</td>
          <td>${originalValue}</td>
          <td>${improvedValue}</td>
          <td class="${statusClass}">${changeText}</td>
        </tr>
      `;
        }
        html += `
          </tbody>
        </table>
      </div>
    `;
        return html;
    }
}
exports.ViewUtils = ViewUtils;
//# sourceMappingURL=ViewUtils.js.map