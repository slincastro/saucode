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
exports.ApiService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Service for interacting with the Sauco API
 */
class ApiService {
    /**
     * Gets the API URL from the configuration
     * @returns The API URL
     */
    static getApiUrl() {
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl');
        if (!apiUrl) {
            throw new Error('API URL is not configured. Please configure it in the settings.');
        }
        return apiUrl;
    }
    /**
     * Tests the connection to the API
     * @param apiUrl The API URL to test
     * @returns The API connection response
     */
    static async testConnection(apiUrl) {
        try {
            var url = `${apiUrl}/health`;
            const response = await fetch(url);
            console.info(`calling... ${url}`);
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error testing API connection:', error);
            throw new Error(`Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Gets code improvement suggestions from the API
     * @param code The code to improve
     * @returns The code improvement
     */
    static async getCodeImprovement(code) {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/improve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Code: code })
            });
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            // Get the API response
            const apiResponse = await response.json();
            console.log('API Response:', apiResponse);
            // Map the API response to the expected CodeImprovement format
            const originalMetrics = {
                metrics: [],
                overallScore: 0
            };
            const improvedMetrics = {
                metrics: [],
                overallScore: 0
            };
            // If we have metrics from the API, convert them to our format
            if (apiResponse.metrics?.before) {
                const before = apiResponse.metrics.before;
                originalMetrics.metrics = [
                    {
                        name: 'Method Count',
                        value: before.method_number || 0,
                        description: 'Number of methods/functions in the code'
                    },
                    {
                        name: 'If Statements',
                        value: before.number_of_ifs || 0,
                        description: 'Number of if statements in the code'
                    },
                    {
                        name: 'Loops',
                        value: before.number_of_loops || 0,
                        description: 'Number of loops in the code'
                    },
                    {
                        name: 'Cyclomatic Complexity',
                        value: before.cyclomatic_complexity || 1,
                        description: 'Cyclomatic complexity of the code'
                    },
                    {
                        name: 'Average Method Size',
                        value: before.average_method_size || 0,
                        description: 'Average number of lines of code per method'
                    }
                ];
                // Calculate an overall score (simple average for now)
                const values = originalMetrics.metrics.map(m => m.value);
                originalMetrics.overallScore = values.length > 0 ?
                    values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            }
            // Do the same for improved metrics
            if (apiResponse.metrics?.after) {
                const after = apiResponse.metrics.after;
                improvedMetrics.metrics = [
                    {
                        name: 'Method Count',
                        value: after.method_number || 0,
                        description: 'Number of methods/functions in the code'
                    },
                    {
                        name: 'If Statements',
                        value: after.number_of_ifs || 0,
                        description: 'Number of if statements in the code'
                    },
                    {
                        name: 'Loops',
                        value: after.number_of_loops || 0,
                        description: 'Number of loops in the code'
                    },
                    {
                        name: 'Cyclomatic Complexity',
                        value: after.cyclomatic_complexity || 1,
                        description: 'Cyclomatic complexity of the code'
                    },
                    {
                        name: 'Average Method Size',
                        value: after.average_method_size || 0,
                        description: 'Average number of lines of code per method'
                    }
                ];
                // Calculate an overall score (simple average for now)
                const values = improvedMetrics.metrics.map(m => m.value);
                improvedMetrics.overallScore = values.length > 0 ?
                    values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            }
            const codeImprovement = {
                originalCode: code,
                improvedCode: apiResponse.Code || '',
                originalMetrics: originalMetrics,
                improvedMetrics: improvedMetrics,
                explanation: apiResponse.Analisis || ''
            };
            return codeImprovement;
        }
        catch (error) {
            console.error('Error getting code improvement:', error);
            throw new Error(`Failed to get code improvement: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=ApiService.js.map