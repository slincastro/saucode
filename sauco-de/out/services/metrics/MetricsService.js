"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Service for calculating metrics for code
 */
class MetricsService {
    /**
     * Calculates metrics for code
     * @param code The code to calculate metrics for
     * @returns The metrics
     */
    static async calculateMetrics(code) {
        try {
            // Calculate metrics locally
            const metrics = [
                {
                    name: 'Method Count',
                    value: this.countMethods(code),
                    description: 'Number of methods/functions in the code'
                },
                {
                    name: 'If Statements',
                    value: this.countIfStatements(code),
                    description: 'Number of if statements in the code'
                },
                {
                    name: 'Loops',
                    value: this.countLoops(code),
                    description: 'Number of loops in the code'
                },
                {
                    name: 'Cyclomatic Complexity',
                    value: this.calculateCyclomaticComplexity(code),
                    description: 'Cyclomatic complexity of the code'
                },
                {
                    name: 'Average Method Size',
                    value: this.calculateAverageMethodSize(code),
                    description: 'Average number of lines of code per method'
                }
            ];
            // Calculate overall score (simple average for now)
            const values = metrics.map(m => m.value);
            const overallScore = values.length > 0 ?
                values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            // Add isGood property to each metric
            metrics.forEach(metric => {
                metric.threshold = this.getThreshold(metric.name);
                metric.isGood = this.isGoodMetric(metric);
            });
            return {
                metrics,
                overallScore
            };
        }
        catch (error) {
            console.error('Error calculating metrics:', error);
            throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Counts the number of methods in code
     * @param code The code to analyze
     * @returns The number of methods
     */
    static countMethods(code) {
        // Simple regex to count function declarations
        const functionRegex = /function\s+\w+\s*\(|class\s+\w+|def\s+\w+\s*\(|\w+\s*=\s*function\s*\(|\w+\s*=\s*\(.*\)\s*=>/g;
        const matches = code.match(functionRegex);
        return matches ? matches.length : 0;
    }
    /**
     * Counts the number of if statements in code
     * @param code The code to analyze
     * @returns The number of if statements
     */
    static countIfStatements(code) {
        // Simple regex to count if statements
        const ifRegex = /\bif\s*\(|\bif\s+|else\s+if\s*\(|else\s+if\s+|\belif\s+/g;
        const matches = code.match(ifRegex);
        return matches ? matches.length : 0;
    }
    /**
     * Counts the number of loops in code
     * @param code The code to analyze
     * @returns The number of loops
     */
    static countLoops(code) {
        // Simple regex to count loops
        const loopRegex = /\bfor\s*\(|\bfor\s+|\bwhile\s*\(|\bwhile\s+|\bdo\s*{|\bforeach\s*\(|\bforeach\s+/g;
        const matches = code.match(loopRegex);
        return matches ? matches.length : 0;
    }
    /**
     * Calculates the cyclomatic complexity of code
     * @param code The code to analyze
     * @returns The cyclomatic complexity
     */
    static calculateCyclomaticComplexity(code) {
        // Simple calculation: 1 + number of decision points
        const decisionRegex = /\bif\s*\(|\bif\s+|else\s+if\s*\(|else\s+if\s+|\belif\s+|\bfor\s*\(|\bfor\s+|\bwhile\s*\(|\bwhile\s+|\bdo\s*{|\bcatch\s*\(|\bcatch\s+|\bcase\s+|\bdefault\s*:|&&|\|\|/g;
        const matches = code.match(decisionRegex);
        return 1 + (matches ? matches.length : 0);
    }
    /**
     * Calculates the average method size in code
     * @param code The code to analyze
     * @returns The average method size
     */
    static calculateAverageMethodSize(code) {
        // This is a very rough approximation
        const lines = code.split('\n').length;
        const methodCount = this.countMethods(code);
        if (methodCount === 0) {
            return 0;
        }
        return lines / methodCount;
    }
    /**
     * Gets the threshold for a metric
     * @param metricName The name of the metric
     * @returns The threshold
     */
    static getThreshold(metricName) {
        const config = vscode.workspace.getConfiguration('sauco-de.metrics');
        return config.get(`${metricName}.threshold`) || 0;
    }
    /**
     * Determines if a metric is good or bad
     * @param metric The metric
     * @returns Whether the metric is good or bad
     */
    static isGoodMetric(metric) {
        const threshold = this.getThreshold(metric.name);
        return metric.value <= threshold;
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=MetricsService.js.map