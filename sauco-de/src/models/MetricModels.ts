/**
 * Represents a metric for code quality
 */
export interface Metric {
  /**
   * The name of the metric
   */
  name: string;

  /**
   * The value of the metric
   */
  value: number;

  /**
   * The description of the metric
   */
  description: string;

  /**
   * The threshold for the metric
   */
  threshold?: number;

  /**
   * Whether the metric is good or bad
   */
  isGood?: boolean;
}

/**
 * Represents a collection of metrics for code quality
 */
export interface Metrics {
  /**
   * The metrics
   */
  metrics: Metric[];

  /**
   * The overall score
   */
  overallScore: number;
}
