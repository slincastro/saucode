import * as vscode from 'vscode';
import { ApiService } from '../../../services/api/ApiService';
import { MetricsService } from '../../../services/metrics/MetricsService';
import { ViewUtils } from '../../../utils/ViewUtils';
import { CodeImprovement } from '../../../models/ApiModels';

/**
 * Provides the webview content for the analysis view
 */
export class SaucoAnalysisViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'saucoAnalysisView';
  private _view?: vscode.WebviewView;
  private _currentFileName: string = '';
  private _currentImprovement?: CodeImprovement;

  /**
   * Gets the current file name
   */
  public get currentFileName(): string {
    return this._currentFileName;
  }

  /**
   * Gets the current improvement
   */
  public get currentImprovement(): CodeImprovement | undefined {
    return this._currentImprovement;
  }

  /**
   * Sets the current improvement
   * @param improvement The improvement to set
   */
  public setCurrentImprovement(improvement: CodeImprovement): void {
    console.log('Setting current improvement:', improvement);
    this._currentImprovement = improvement;
  }

  /**
   * Creates a new analysis view provider
   * @param extensionUri The URI of the extension
   */
  constructor(private readonly _extensionUri: vscode.Uri) {}

  /**
   * Resolves the webview view
   * @param webviewView The webview view to resolve
   * @param context The webview view context
   * @param token The cancellation token
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'applyCode':
          // Execute the sauco-de.applyCode command instead of calling the internal method
          await vscode.commands.executeCommand('sauco-de.applyCode');
          break;
        case 'closeImprovedCode':
          this._clearContent();
          break;
      }
    });
  }

  /**
   * Shows the metrics for a file
   * @param fileName The name of the file
   * @param fileContent The content of the file
   */
  public async showMetrics(fileName: string, fileContent: string): Promise<void> {
    if (!this._view) {
      return;
    }

    this._currentFileName = fileName;
    this._currentImprovement = undefined;

    try {
      const metrics = await MetricsService.calculateMetrics(fileContent);
      const metricsHtml = ViewUtils.formatMetricsAsHtml(metrics);

      this._view.webview.postMessage({
        type: 'updateMetricsContent',
        fileName: fileName,
        metricsHtml: metricsHtml
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      vscode.window.showErrorMessage(`Error calculating metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Shows the analysis for a file
   * @param fileName The name of the file
   * @param fileContent The content of the file
   */
  public async showAnalysis(fileName: string, fileContent: string): Promise<void> {
    if (!this._view) {
      return;
    }

    this._currentFileName = fileName;
    this._currentImprovement = undefined;

    try {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Analyzing ${fileName}...`,
          cancellable: false
        },
        async (progress) => {
          // Initialize progress at 0%
          progress.report({ increment: 0, message: "Starting analysis..." });
          
          // Set up animated progress updates
          let currentProgress = 0;
          const maxProgress = 90; // Leave room for the final 10% when we get the result
          const progressInterval = 300; // Update every 300ms
          const progressStep = 1; // Increment by 1% each time
          
          // Create an interval to animate the progress bar
          const progressTimer = setInterval(() => {
            if (currentProgress < maxProgress) {
              // Gradually slow down the progress as we approach maxProgress
              const increment = Math.max(0.5, progressStep * (1 - currentProgress / maxProgress));
              currentProgress += increment;
              
              // Update the progress message with different stages
              let message = "Starting analysis...";
              if (currentProgress > 10) message = "Analyzing code structure...";
              if (currentProgress > 30) message = "Identifying improvement opportunities...";
              if (currentProgress > 50) message = "Generating optimized code...";
              if (currentProgress > 70) message = "Calculating metrics...";
              
              progress.report({ 
                increment: increment,
                message: message
              });
            }
          }, progressInterval);
          
          try {
            // Make the actual API call
            const improvement = await ApiService.getCodeImprovement(fileContent);
            this._currentImprovement = improvement;
            
            // Clear the interval and complete the progress
            clearInterval(progressTimer);
            progress.report({ 
              increment: 100 - currentProgress,
              message: "Analysis complete!"
            });

            fileName = fileName.split(/[\\/]/).pop() || fileName;

            await this._openImprovedCodeInEditor(fileName, improvement.improvedCode);

            const content = `<p>Code improvement analysis for ${fileName}</p><p>${improvement.explanation || 'Analysis complete.'}</p>`;
            const metricsHtml = ViewUtils.formatMetricsComparisonAsHtml(improvement.originalMetrics, improvement.improvedMetrics);
            const chartHtml = ViewUtils.formatMetricsAsChartHtml(improvement.originalMetrics, improvement.improvedMetrics);
            const buttonsHtml = this._getButtonsHtml();

            console.log('Original metrics:', improvement.originalMetrics);
            console.log('Improved metrics:', improvement.improvedMetrics);

            this._view?.webview.postMessage({
              type: 'updateContent',
              fileName: fileName,
              content: content,
              metricsHtml: chartHtml + metricsHtml,
              buttonsHtml: buttonsHtml
            });
          } catch (error) {
            // Make sure to clear the interval if there's an error
            clearInterval(progressTimer);
            throw error;
          }
        }
      );
    } catch (error) {
      console.error('Error analyzing code:', error);
      vscode.window.showErrorMessage(`Error analyzing code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clears the content of the webview
   */
  private _clearContent(): void {
    if (!this._view) {
      return;
    }

    this._currentImprovement = undefined;
    this._currentFileName = '';

    this._view.webview.postMessage({
      type: 'updateContent',
      fileName: '',
      content: '<p>Select a file to analyze.</p>',
      metricsHtml: '',
      buttonsHtml: ''
    });
  }

  /**
   * Applies the improved code to the file
   */
  public async _applyImprovedCode(): Promise<void> {
    if (!this._currentImprovement) {
      return;
    }

    try {
      // First try to use the last analyzed document from global state
      const lastAnalyzedDocument = (global as any).lastAnalyzedDocument;

        console.log('Using last analyzed document:', lastAnalyzedDocument.fileName);
        
        try {
          // Create an edit for the last analyzed document
          const edit = new vscode.WorkspaceEdit();
          
          // Replace the entire content of the file
          const fullRange = new vscode.Range(
            lastAnalyzedDocument.positionAt(0),
            lastAnalyzedDocument.positionAt(lastAnalyzedDocument.getText().length)
          );
          
          edit.replace(lastAnalyzedDocument.uri, fullRange, this._currentImprovement.improvedCode);
          
          const success = await vscode.workspace.applyEdit(edit);
          
          if (success) {
            vscode.window.showInformationMessage(`Successfully applied improvements to ${lastAnalyzedDocument.fileName}`);
            this._clearContent();
            return; // Exit early if successful
          } else {
            console.error('Failed to apply edit to last analyzed document');
            // Continue to next approach
          }
        } catch (lastDocError) {
          console.error('Error applying to last analyzed document:', lastDocError);
          // Continue to next approach
        }
      
    } catch (error) {
      console.error('Error applying improved code:', error);
      vscode.window.showErrorMessage(`Error applying improved code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the HTML for the buttons
   * @returns The HTML for the buttons
   */
  private _getButtonsHtml(): string {
    return `
      <div class="action-buttons">
        <button class="apply-button">Apply Improvements</button>
        <button class="close-button">Close</button>
      </div>
    `;
  }

  /**
   * Gets the HTML for the webview
   * @param webview The webview
   * @returns The HTML
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to main script run in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'analysis', 'main.js')
    );

    // Get the local path to css styles
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'analysis', 'styles.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>Sauco Analysis</title>
      </head>
      <body>
        <div class="container">
          <h2 id="file-name">Select a file to analyze</h2>
          <div id="metrics" class="metrics"></div>
          <div id="buttons"></div>
          <div id="content" class="content">
            <p>Select a file to analyze.</p>
          </div>

        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  /**
   * Generates a nonce
   * @returns The nonce
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Opens the improved code in a new text editor
   * @param originalFileName The name of the original file
   * @param improvedCode The improved code
   */
  private async _openImprovedCodeInEditor(originalFileName: string, improvedCode: string): Promise<void> {
    try {
      // Create a new untitled document with the improved code
      const document = await vscode.workspace.openTextDocument({
        content: improvedCode,
        language: this._getLanguageIdFromFileName(originalFileName)
      });
      
      // Show the document in a new editor
      await vscode.window.showTextDocument(document, {
        preview: false,
        viewColumn: vscode.ViewColumn.Beside
      });
      
      // Set the document title to indicate it's the improved version
      const fileName = originalFileName.split('/').pop() || originalFileName;
      vscode.window.showInformationMessage(`Improved code for ${fileName} opened in a new editor`);
    } catch (error) {
      console.error('Error opening improved code in editor:', error);
      vscode.window.showErrorMessage(`Error opening improved code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the language ID from a file name
   * @param fileName The file name
   * @returns The language ID
   */
  private _getLanguageIdFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map file extensions to language IDs
    const extensionToLanguage: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascriptreact',
      'tsx': 'typescriptreact',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'rs': 'rust',
      'swift': 'swift',
      'md': 'markdown'
    };
    
    return extensionToLanguage[extension] || 'plaintext';
  }
}
