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
const ApiService_1 = require("../api/ApiService");
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
            return await ApiService_1.ApiService.getMetrics(code);
        }
        catch (error) {
            console.error('Error calculating metrics:', error);
            throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
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