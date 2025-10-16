import { Metrics } from './MetricModels';

/**
 * Represents the response from the API for code improvement
 */
export interface CodeImprovement {
  /**
   * The original code
   */
  originalCode: string;

  /**
   * The improved code
   */
  improvedCode: string;

  /**
   * The metrics for the original code
   */
  originalMetrics: Metrics;

  /**
   * The metrics for the improved code
   */
  improvedMetrics: Metrics;

  /**
   * The explanation of the improvements
   */
  explanation: string;
}

/**
 * Represents the response from the API for testing the connection
 */
export interface ApiConnectionResponse {
  /**
   * The name of the API
   */
  api: string;

  /**
   * The version of the API
   */
  version: string;
}
