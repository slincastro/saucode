import * as vscode from 'vscode';
import { Metric, Metrics } from '../models/MetricModels';
import { MetricsService } from '../services/metrics/MetricsService';

/**
 * Utility functions for views
 */
export class ViewUtils {
  /**
   * Formats metrics as HTML
   * @param metrics The metrics to format
   * @returns The HTML
   */
  public static formatMetricsAsHtml(metrics: Metrics): string {
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
      const threshold = MetricsService.getThreshold(metric.name);
      const isGood = MetricsService.isGoodMetric(metric);
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
  public static formatImprovedCodeAsHtml(code: string): string {
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
  public static createSideBySideComparison(originalCode: string, improvedCode: string): string {
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
  public static formatMetricsComparisonAsHtml(originalMetrics: Metrics, improvedMetrics: Metrics): string {
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
    const metricNames = new Set<string>();
    originalMetrics.metrics.forEach(m => metricNames.add(m.name));
    improvedMetrics.metrics.forEach(m => metricNames.add(m.name));

    // Create a map for easier lookup
    const originalMetricsMap = new Map<string, Metric>();
    const improvedMetricsMap = new Map<string, Metric>();

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
