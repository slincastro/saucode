import * as vscode from 'vscode';
import { ApiService } from '../../../services/api/ApiService';

/**
 * Provides the webview content for the configuration view
 */
export class SaucoConfigViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'saucoConfigView';
  private _view?: vscode.WebviewView;

  /**
   * Creates a new configuration view provider
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
        case 'saveConfig':
          await this._saveConfig(data.apiUrl);
          break;
        case 'testConnection':
          await this._testConnection(data.apiUrl);
          break;
      }
    });

    // Load current configuration
    this._loadConfig();
  }

  /**
   * Loads the current configuration
   */
  private _loadConfig(): void {
    if (!this._view) {
      return;
    }

    const config = vscode.workspace.getConfiguration('sauco-de');
    const apiUrl = config.get('apiUrl') as string || '';

    this._view.webview.postMessage({
      type: 'loadConfig',
      apiUrl: apiUrl
    });
  }

  /**
   * Saves the configuration
   * @param apiUrl The API URL
   */
  private async _saveConfig(apiUrl: string): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const config = vscode.workspace.getConfiguration('sauco-de');
      await config.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);

      this._view.webview.postMessage({
        type: 'saveResult',
        success: true,
        message: 'Configuration saved successfully.'
      });
    } catch (error) {
      console.error('Error saving configuration:', error);

      this._view.webview.postMessage({
        type: 'saveResult',
        success: false,
        message: `Error saving configuration: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Tests the connection to the API
   * @param apiUrl The API URL
   */
  private async _testConnection(apiUrl: string): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const result = await ApiService.testConnection(apiUrl);

      this._view.webview.postMessage({
        type: 'testResult',
        success: true,
        message: `Successfully connected to ${result.api} v${result.version}`
      });
    } catch (error) {
      console.error('Error testing connection:', error);

      this._view.webview.postMessage({
        type: 'testResult',
        success: false,
        message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Gets the HTML for the webview
   * @param webview The webview
   * @returns The HTML
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to main script run in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'config', 'main.js')
    );

    // Get the local path to css styles
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'config', 'styles.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>Sauco Configuration</title>
      </head>
      <body>
        <div class="container">
          <h1>Sauco Configuration</h1>
          <div class="form-group">
            <label for="apiUrl">API URL:</label>
            <input type="text" id="apiUrl" placeholder="http://localhost:8000">
          </div>
          <div class="button-group">
            <button id="saveButton">Save</button>
            <button id="testButton">Test Connection</button>
          </div>
          <div id="status" class="status" style="display: none;"></div>
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
}
