import * as vscode from 'vscode';
import { CodeImprovement, ApiConnectionResponse } from '../../models/ApiModels';
import { Metrics } from '../../models/MetricModels';

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
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      return await response.json() as CodeImprovement;
    } catch (error) {
      console.error('Error getting code improvement:', error);
      throw new Error(`Failed to get code improvement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets metrics for code from the API
   * @param code The code to get metrics for
   * @returns The metrics
   */
  public static async getMetrics(code: string): Promise<Metrics> {
    try {
      const apiUrl = this.getApiUrl();
      
      const response = await fetch(`${apiUrl}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      return await response.json() as Metrics;
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw new Error(`Failed to get metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
