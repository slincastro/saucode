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
    
    // Get analysis data command
    const getAnalysisDataDisposable = vscode.commands.registerCommand('sauco-de.getAnalysisData', async () => {
      await this.getAnalysisData();
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
      configureDisposable, 
      analyzeCodeDisposable,
      showMetricsDisposable,
      applyCodeDisposable,
      getAnalysisDataDisposable
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
    
    // Store the document reference for the analyze command
    // This ensures lastAnalyzedDocument is only updated when analyze is executed
    (global as any).lastAnalyzedDocument = editor.document;
    
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
      
      // Get the global provider and store
      const globalAnalysisViewProvider = (global as any).saucoAnalysisViewProvider;
      const globalStore = (global as any).saucoGlobalStore;
      
      // Show the analysis in the view
      await analysisViewProvider.showAnalysis(fileName, code);
      
      // Get the improvement directly from the API
      try {
        const improvement = await ApiService.getCodeImprovement(code);
        console.log('Got improvement directly from API:', improvement);
        
        // Set the improvement on both providers to ensure it's available
        if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
          globalAnalysisViewProvider.setCurrentImprovement(improvement);
        }
        
        if (analysisViewProvider.setCurrentImprovement) {
          analysisViewProvider.setCurrentImprovement(improvement);
        }
        
        // Store in global store if available (as a backup to the storage in SaucoAnalysisViewProvider)
        if (globalStore) {
          const displayFileName = fileName.split(/[\\/]/).pop() || fileName;
          globalStore.addAnalysisData(
            fileName,
            displayFileName,
            improvement,
            editor.document.uri
          );
          console.log(`Stored analysis data for ${displayFileName} in global store from CommandsService`);
        }
      } catch (innerError) {
        console.error('Error getting improvement directly:', innerError);
      }
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
      // Use the global variable instead of the passed parameter
      const globalAnalysisViewProvider = (global as any).saucoAnalysisViewProvider;
      const lastAnalyzedDocument = (global as any).lastAnalyzedDocument;
      const globalStore = (global as any).saucoGlobalStore;
      
      // Enhanced debugging
      console.log('Global analysis provider exists:', !!globalAnalysisViewProvider);
      console.log('Passed analysis provider exists:', !!analysisViewProvider);
      console.log('Last analyzed document exists:', !!lastAnalyzedDocument);
      console.log('Global store exists:', !!globalStore);
      
      // Compare the two providers
      console.log('Are providers the same object?', globalAnalysisViewProvider === analysisViewProvider);
      
      // Log all properties of the global provider
      console.log('Global provider properties:', Object.keys(globalAnalysisViewProvider));
      
      // Log the current state for debugging
      console.log('Current improvement (global):', globalAnalysisViewProvider._currentImprovement);
      console.log('Current file name (global):', globalAnalysisViewProvider._currentFileName);
      console.log('Current improvement (passed):', analysisViewProvider._currentImprovement);
      console.log('Current file name (passed):', analysisViewProvider._currentFileName);
      
      // Try both providers
      const provider = globalAnalysisViewProvider || analysisViewProvider;
      
      // If we don't have an improvement, try to get it from the global store, last analyzed document, or active editor
      if (!provider._currentImprovement) {
        // First try to get the improvement from the global store
        if (globalStore && lastAnalyzedDocument) {
          const filePath = lastAnalyzedDocument.fileName;
          const analysisData = globalStore.getAnalysisDataByPath(filePath);
          
          if (analysisData) {
            console.log('Found analysis data in global store for:', filePath);
            
            // Set the improvement on both providers
            if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
              globalAnalysisViewProvider.setCurrentImprovement(analysisData.improvement);
              globalAnalysisViewProvider._currentFileName = analysisData.fileName;
            }
            
            if (analysisViewProvider.setCurrentImprovement) {
              analysisViewProvider.setCurrentImprovement(analysisData.improvement);
              analysisViewProvider._currentFileName = analysisData.fileName;
            }
            
            // Update the provider reference
            provider._currentImprovement = analysisData.improvement;
            provider._currentFileName = analysisData.fileName;
          } else {
            // If not found in global store, try to use the last analyzed document
            try {
              const code = lastAnalyzedDocument.getText();
              const fileName = lastAnalyzedDocument.fileName;
              
              console.log('Trying to get improvement for last analyzed file:', fileName);
              
              // Get the improvement directly from the API
              const improvement = await ApiService.getCodeImprovement(code);
              console.log('Got improvement directly from API for last analyzed document:', improvement);
              
              // Store in global store
              if (globalStore) {
                globalStore.addAnalysisData(
                  fileName,
                  fileName.split(/[\\/]/).pop() || fileName,
                  improvement,
                  lastAnalyzedDocument.uri
                );
              }
              
              // Set the improvement on both providers
              if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
                globalAnalysisViewProvider.setCurrentImprovement(improvement);
                globalAnalysisViewProvider._currentFileName = fileName;
              }
              
              if (analysisViewProvider.setCurrentImprovement) {
                analysisViewProvider.setCurrentImprovement(improvement);
                analysisViewProvider._currentFileName = fileName;
              }
              
              // Update the provider reference
              provider._currentImprovement = improvement;
              provider._currentFileName = fileName;
            } catch (innerError) {
              console.error('Error getting improvement for last analyzed file:', innerError);
              // Fall back to active editor if last analyzed document fails
              await this._tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider);
            }
          }
        } else if (lastAnalyzedDocument) {
          // If no global store but we have last analyzed document
          try {
            const code = lastAnalyzedDocument.getText();
            const fileName = lastAnalyzedDocument.fileName;
            
            console.log('Trying to get improvement for last analyzed file:', fileName);
            
            // Get the improvement directly from the API
            const improvement = await ApiService.getCodeImprovement(code);
            console.log('Got improvement directly from API for last analyzed document:', improvement);
            
            // Set the improvement on both providers
            if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
              globalAnalysisViewProvider.setCurrentImprovement(improvement);
              globalAnalysisViewProvider._currentFileName = fileName;
            }
            
            if (analysisViewProvider.setCurrentImprovement) {
              analysisViewProvider.setCurrentImprovement(improvement);
              analysisViewProvider._currentFileName = fileName;
            }
            
            // Update the provider reference
            provider._currentImprovement = improvement;
            provider._currentFileName = fileName;
          } catch (innerError) {
            console.error('Error getting improvement for last analyzed file:', innerError);
            // Fall back to active editor if last analyzed document fails
            await this._tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider);
          }
        } else {
          // Fall back to active editor if no last analyzed document
          await this._tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider);
        }
      }
      
      if (!provider._currentFileName) {
        vscode.window.showInformationMessage('No file selected for improvement. Please analyze a file first.');
        return;
      }

      // Try to use both methods to apply the code
      try {
        // First try the global provider
        console.log('Attempting to apply code with global provider...');
        await globalAnalysisViewProvider._applyImprovedCode();
      } catch (innerError) {
        console.error('Error with global provider, trying passed provider:', innerError);
        // If that fails, try the passed provider
        await analysisViewProvider._applyImprovedCode();
      }
    } catch (error) {
      console.error('Error applying improved code:', error);
      vscode.window.showErrorMessage(`Error applying improved code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tries to get an improvement from the active editor
   * @param provider The provider to update
   * @param globalAnalysisViewProvider The global analysis view provider
   * @param analysisViewProvider The passed analysis view provider
   * @returns A promise that resolves when the operation is complete
   */
  /**
   * Retrieves analysis data from the global store
   * Allows searching by file name or path
   */
  private static async getAnalysisData(): Promise<void> {
    const globalStore = (global as any).saucoGlobalStore;
    
    if (!globalStore) {
      vscode.window.showErrorMessage('Global store not available.');
      return;
    }
    
    // Define the interface for the file analysis data based on the global store
    interface FileAnalysisData {
      filePath: string;
      fileName: string;
      improvement: CodeImprovement;
      documentUri?: vscode.Uri;
      improvedCodeDocumentUri?: vscode.Uri;
      timestamp: number;
    }
    
    // Get all analysis data
    const allData = globalStore.getAllAnalysisData() as FileAnalysisData[];
    
    if (allData.length === 0) {
      vscode.window.showInformationMessage('No analysis data found. Please analyze some files first.');
      return;
    }
    
    // Create a list of file names for the quick pick
    const fileItems = allData.map((data: FileAnalysisData) => ({
      label: data.fileName,
      description: data.filePath,
      detail: `Analyzed: ${new Date(data.timestamp).toLocaleString()}`,
      data: data
    }));
    
    // Define the interface for the quick pick item
    interface FileQuickPickItem extends vscode.QuickPickItem {
      data: FileAnalysisData;
    }
    
    // Show quick pick to select a file
    const selectedItem = await vscode.window.showQuickPick(fileItems, {
      placeHolder: 'Select a file to view analysis data',
      matchOnDescription: true,
      matchOnDetail: true
    }) as FileQuickPickItem | undefined;
    
    if (!selectedItem) {
      return; // User cancelled
    }
    
    // Show the analysis data in a new untitled document
    const analysisData = selectedItem.data;
    
    // Create a formatted string with the analysis data
    const content = [
      `# Analysis Data for ${analysisData.fileName}`,
      ``,
      `## File Information`,
      `- File Path: ${analysisData.filePath}`,
      `- Analyzed: ${new Date(analysisData.timestamp).toLocaleString()}`,
      ``,
      `## Original Code`,
      '```',
      analysisData.improvement.originalCode,
      '```',
      ``,
      `## Improved Code`,
      '```',
      analysisData.improvement.improvedCode,
      '```',
      ``,
      `## Explanation`,
      analysisData.improvement.explanation,
      ``,
      `## Original Metrics`,
      `- Overall Score: ${analysisData.improvement.originalMetrics.overallScore}`,
      ...analysisData.improvement.originalMetrics.metrics.map((m) => 
        `- ${m.name}: ${m.value} (${m.isGood ? 'Good' : 'Needs Improvement'})`
      ),
      ``,
      `## Improved Metrics`,
      `- Overall Score: ${analysisData.improvement.improvedMetrics.overallScore}`,
      ...analysisData.improvement.improvedMetrics.metrics.map((m) => 
        `- ${m.name}: ${m.value} (${m.isGood ? 'Good' : 'Needs Improvement'})`
      )
    ].join('\n');
    
    // Create a new untitled document with the analysis data
    const document = await vscode.workspace.openTextDocument({
      content: content,
      language: 'markdown'
    });
    
    // Show the document
    await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: vscode.ViewColumn.Active
    });
    
    vscode.window.showInformationMessage(`Analysis data for ${analysisData.fileName} opened in a new document.`);
  }

  private static async _tryGetImprovementFromActiveEditor(
    provider: any, 
    globalAnalysisViewProvider: any, 
    analysisViewProvider: any
  ): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      try {
        const code = editor.document.getText();
        const fileName = editor.document.fileName;
        const globalStore = (global as any).saucoGlobalStore;
        
        console.log('Trying to get improvement for current file:', fileName);
        
        // First check if we have this file in the global store
        if (globalStore) {
          const analysisData = globalStore.getAnalysisDataByPath(fileName);
          
          if (analysisData) {
            console.log('Found analysis data in global store for active editor:', fileName);
            
            // Set the improvement on both providers
            if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
              globalAnalysisViewProvider.setCurrentImprovement(analysisData.improvement);
              globalAnalysisViewProvider._currentFileName = analysisData.fileName;
            }
            
            if (analysisViewProvider.setCurrentImprovement) {
              analysisViewProvider.setCurrentImprovement(analysisData.improvement);
              analysisViewProvider._currentFileName = analysisData.fileName;
            }
            
            // Update the provider reference
            provider._currentImprovement = analysisData.improvement;
            provider._currentFileName = analysisData.fileName;
            
            return; // Exit early if found in global store
          }
        }
        
        // If not found in global store, get the improvement directly from the API
        const improvement = await ApiService.getCodeImprovement(code);
        console.log('Got improvement directly from API:', improvement);
        
        // Store in global store if available
        if (globalStore) {
          globalStore.addAnalysisData(
            fileName,
            fileName.split(/[\\/]/).pop() || fileName,
            improvement,
            editor.document.uri
          );
        }
        
        // Set the improvement on both providers
        if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
          globalAnalysisViewProvider.setCurrentImprovement(improvement);
          globalAnalysisViewProvider._currentFileName = fileName;
        }
        
        if (analysisViewProvider.setCurrentImprovement) {
          analysisViewProvider.setCurrentImprovement(improvement);
          analysisViewProvider._currentFileName = fileName;
        }
        
        // Update the provider reference
        provider._currentImprovement = improvement;
        provider._currentFileName = fileName;
      } catch (innerError) {
        console.error('Error getting improvement for current file:', innerError);
        vscode.window.showInformationMessage('No code improvements available. Please analyze code first.');
        throw innerError; // Re-throw to signal failure
      }
    } else {
      vscode.window.showInformationMessage('No code improvements available. Please analyze code first.');
      throw new Error('No active editor available');
    }
  }
}
