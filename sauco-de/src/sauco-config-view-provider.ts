import * as vscode from 'vscode';

/**
 * WebviewViewProvider for the configuration view in the activity bar
 */
export class SaucoConfigViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    constructor(private readonly extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from our extension's directory
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'saveUrl':
                    // Save the URL to configuration
                    const config = vscode.workspace.getConfiguration('sauco-de');
                    config.update('apiUrl', message.url, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage('Sauco API URL has been updated.');
                    return;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the current URL value from configuration
        const config = vscode.workspace.getConfiguration('sauco-de');
        const currentUrl = config.get('apiUrl') as string || '';

        // Return the HTML content
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sauco Configuration</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 10px;
                    color: var(--vscode-foreground);
                }
                h2 {
                    font-size: 1.2em;
                    margin-bottom: 15px;
                    color: var(--vscode-editor-foreground);
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 6px;
                    font-size: 13px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                button {
                    padding: 6px 12px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    font-size: 13px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <h2>API Configuration</h2>
            <div class="form-group">
                <label for="apiUrl">API URL:</label>
                <input type="text" id="apiUrl" value="${currentUrl}" placeholder="Enter API URL">
            </div>
            <button id="saveButton">Save Configuration</button>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Handle the save button click
                document.getElementById('saveButton').addEventListener('click', () => {
                    const url = document.getElementById('apiUrl').value;
                    vscode.postMessage({
                        command: 'saveUrl',
                        url: url
                    });
                });
            </script>
        </body>
        </html>`;
    }
}
