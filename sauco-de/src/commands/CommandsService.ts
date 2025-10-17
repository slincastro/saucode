import * as vscode from 'vscode';
import * as path from 'path';
import { ApiService } from '../services/api/ApiService';
import { ViewUtils } from '../utils/ViewUtils';
import { CodeImprovement } from '../models/ApiModels';

/**
 * Service for handling extension commands
 */
export class CommandsService {
  /**
   * Registers all commands for the extension
   * @param context The extension context
   * @param analysisViewProvider The analysis view provider
   */
  public static registerCommands(
    context: vscode.ExtensionContext, 
    analysisViewProvider: any
  ): void {
    // Configure command
    const configureDisposable = vscode.commands.registerCommand('sauco-de.configure', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
      await vscode.commands.executeCommand('saucoConfigView.focus');
    });

    // Analyze code command
    const analyzeCodeDisposable = vscode.commands.registerCommand('sauco-de.analyzeCode', async () => {
      await this.analyzeCode(analysisViewProvider);
    });

    // Show metrics command
    const showMetricsDisposable = vscode.commands.registerCommand('sauco-de.showMetrics', async () => {
      await this.showMetrics(analysisViewProvider);
    });

    // Apply code command
    const applyCodeDisposable = vscode.commands.registerCommand('sauco-de.applyCode', async () => {
      await this.applyImprovedCode(analysisViewProvider);
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
      configureDisposable, 
      analyzeCodeDisposable,
      showMetricsDisposable,
      applyCodeDisposable
    );
  }

  /**
   * Analyzes the code in the active editor
   * @param analysisViewProvider The analysis view provider
   */
  private static async analyzeCode(analysisViewProvider: any): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found. Please open a file to analyze.');
      return;
    }

    // Get selected text or entire document if no selection
    const selection = editor.selection;
    const code = selection.isEmpty 
      ? editor.document.getText() 
      : editor.document.getText(selection);
    
    const fileName = editor.document.fileName;
    
    // Show what's being analyzed
    console.log('Analyzing code selection:', selection.isEmpty ? 'Entire document' : 'Selected text');
    
    // Check if API URL is configured
    const config = vscode.workspace.getConfiguration('sauco-de');
    const apiUrl = config.get('apiUrl') as string;
    
    if (!apiUrl) {
      vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
      await vscode.commands.executeCommand('sauco-de.configure');
      return;
    }

    try {
      // Show the analysis view
      await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
      await vscode.commands.executeCommand('saucoAnalysisView.focus');
      
      // Show the analysis in the view
      await analysisViewProvider.showAnalysis(fileName, code);
    } catch (error) {
      console.error('Error analyzing code:', error);
      
      let errorMessage = '';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Failed to connect to the API server. Please check that:
        1. The API server is running
        2. The API URL is correct (${apiUrl})
        3. There are no network issues or firewalls blocking the connection`;
      } else {
        errorMessage = `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      vscode.window.showErrorMessage(errorMessage);
    }
  }

  /**
   * Shows metrics for the code in the active editor
   * @param analysisViewProvider The analysis view provider
   */
  private static async showMetrics(analysisViewProvider: any): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found. Please open a file to analyze metrics.');
      return;
    }

    // Get selected text or entire document if no selection
    const selection = editor.selection;
    const code = selection.isEmpty 
      ? editor.document.getText() 
      : editor.document.getText(selection);
    
    const fileName = editor.document.fileName;
    
    // Show what's being analyzed
    console.log('Calculating metrics for:', selection.isEmpty ? 'Entire document' : 'Selected text');
    
    // Check if API URL is configured
    const config = vscode.workspace.getConfiguration('sauco-de');
    const apiUrl = config.get('apiUrl') as string;
    
    if (!apiUrl) {
      vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
      await vscode.commands.executeCommand('sauco-de.configure');
      return;
    }

    try {
      // Show the analysis view
      await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
      await vscode.commands.executeCommand('saucoAnalysisView.focus');
      
      // Show the metrics in the view
      await analysisViewProvider.showMetrics(fileName, code);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      
      let errorMessage = '';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Failed to connect to the API server. Please check that:
        1. The API server is running
        2. The API URL is correct (${apiUrl})
        3. There are no network issues or firewalls blocking the connection`;
      } else {
        errorMessage = `Error calculating metrics: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      vscode.window.showErrorMessage(errorMessage);
    }
  }

  /**
   * Applies the improved code to the current file
   * @param analysisViewProvider The analysis view provider
   */
  private static async applyImprovedCode(analysisViewProvider: any): Promise<void> {
    try {
      // Log the current state for debugging
      console.log('Current improvement:', analysisViewProvider.currentImprovement);
      console.log('Current file name:', analysisViewProvider.currentFileName);
      
      // Check if there's a current improvement
      if (!analysisViewProvider.currentImprovement) {
        vscode.window.showInformationMessage('No code improvements available. Please analyze code first.');
        return;
      }
      
      if (!analysisViewProvider.currentFileName) {
        vscode.window.showInformationMessage('No file selected for improvement. Please analyze a file first.');
        return;
      }

      // Call the internal method to apply the improved code
      await analysisViewProvider._applyImprovedCode();
    } catch (error) {
      console.error('Error applying improved code:', error);
      vscode.window.showErrorMessage(`Error applying improved code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
