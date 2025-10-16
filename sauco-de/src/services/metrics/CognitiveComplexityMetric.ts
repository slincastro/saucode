import * as vscode from 'vscode';
import { Metric } from '../../models/MetricModels';

/**
 * Metric for calculating cognitive complexity
 */
export const CognitiveComplexityMetric: Metric = {
  name: 'CognitiveComplexity',
  value: 0,
  description: 'Measures the cognitive complexity of code',
  threshold: 15,
  isGood: true
};
