import * as vscode from 'vscode';
import { CodeImprovement, ApiConnectionResponse } from '../../models/ApiModels';
import { Metrics } from '../../models/MetricModels';

/**
 * Interface for the metrics in the API response
 */
interface ApiMetrics {
  method_number: number;
  number_of_ifs: number;
  number_of_loops: number;
  cyclomatic_complexity: number;
  average_method_size: number;
}

/**
 * Interface for the API response from the improve endpoint
 */
interface ImproveApiResponse {
  Analisis: string;
  Code: string;
  RetrievedContext: Array<{
    score: number;
    page?: number;
    chunk_id?: string;
    text: string;
  }>;
  metrics?: {
    before: ApiMetrics;
    after: ApiMetrics;
  };
}

/**
 * Service for interacting with the Sauco API
 */
export class ApiService {
  /**
   * Gets the API URL from the configuration
   * @returns The API URL
   */
  private static getApiUrl(): string {
    const config = vscode.workspace.getConfiguration('sauco-de');
    const apiUrl = config.get('apiUrl') as string;

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
  public static async testConnection(apiUrl: string): Promise<ApiConnectionResponse> {
    try {
      var url = `${apiUrl}/health`;
      const response = await fetch(url);
      console.info(`calling... ${url}`)
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      return await response.json() as ApiConnectionResponse;
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw new Error(`Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets code improvement suggestions from the API
   * @param code The code to improve
   * @returns The code improvement
   */
  public static async getCodeImprovement(code: string): Promise<CodeImprovement> {
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
      const apiResponse = await response.json() as ImproveApiResponse;
      console.log('API Response:', apiResponse);
      
      // Map the API response to the expected CodeImprovement format
      const originalMetrics: Metrics = {
        metrics: [],
        overallScore: 0
      };
      
      const improvedMetrics: Metrics = {
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
      
      const codeImprovement: CodeImprovement = {
        originalCode: code,
        improvedCode: apiResponse.Code || '',
        originalMetrics: originalMetrics,
        improvedMetrics: improvedMetrics,
        explanation: apiResponse.Analisis || ''
      };
      
      return codeImprovement;
    } catch (error) {
      console.error('Error getting code improvement:', error);
      throw new Error(`Failed to get code improvement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

}
