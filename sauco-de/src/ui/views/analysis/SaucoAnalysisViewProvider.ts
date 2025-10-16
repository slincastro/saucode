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
          await this._applyImprovedCode();
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
          progress.report({ increment: 0 });

          const improvement = await ApiService.getCodeImprovement(fileContent);
          this._currentImprovement = improvement;

          progress.report({ increment: 100 });

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
  private async _applyImprovedCode(): Promise<void> {
    if (!this._currentImprovement || !this._currentFileName) {
      return;
    }

    try {
      const document = await vscode.workspace.openTextDocument(this._currentFileName);
      const edit = new vscode.WorkspaceEdit();
      
      // Replace the entire content of the file
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      
      edit.replace(document.uri, fullRange, this._currentImprovement.improvedCode);
      
      const success = await vscode.workspace.applyEdit(edit);
      
      if (success) {
        vscode.window.showInformationMessage(`Successfully applied improvements to ${this._currentFileName}`);
        this._clearContent();
      } else {
        vscode.window.showErrorMessage(`Failed to apply improvements to ${this._currentFileName}`);
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
          <h1 id="file-name">Select a file to analyze</h1>
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
