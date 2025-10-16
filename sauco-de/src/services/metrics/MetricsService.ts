import * as vscode from 'vscode';
import { ApiService } from '../api/ApiService';
import { Metrics, Metric } from '../../models/MetricModels';

/**
 * Service for calculating metrics for code
 */
export class MetricsService {
  /**
   * Calculates metrics for code
   * @param code The code to calculate metrics for
   * @returns The metrics
   */
  public static async calculateMetrics(code: string): Promise<Metrics> {
    try {
      return await ApiService.getMetrics(code);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the threshold for a metric
   * @param metricName The name of the metric
   * @returns The threshold
   */
  public static getThreshold(metricName: string): number {
    const config = vscode.workspace.getConfiguration('sauco-de.metrics');
    return config.get(`${metricName}.threshold`) as number || 0;
  }

  /**
   * Determines if a metric is good or bad
   * @param metric The metric
   * @returns Whether the metric is good or bad
   */
  public static isGoodMetric(metric: Metric): boolean {
    const threshold = this.getThreshold(metric.name);
    return metric.value <= threshold;
  }
}
