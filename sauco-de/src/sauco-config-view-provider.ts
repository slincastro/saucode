import * as vscode from 'vscode';

/**
 * WebviewViewProvider for the configuration view in the activity bar
 */
export class SaucoConfigViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _connectionValidated: boolean = false;

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
                case 'testConnection':
                    this.testConnection(message.url);
                    return;
                case 'saveUrl':
                    // First verify the connection, then save if successful
                    this.verifyAndSaveUrl(message.url);
                    return;
            }
        });
    }

    /**
     * Verifies the connection and saves the URL if successful
     * @param url The API URL to verify and save
     */
    private async verifyAndSaveUrl(url: string) {
        if (!this._view) {
            return;
        }

        // Show testing status
        this._view.webview.postMessage({ 
            command: 'updateConnectionStatus', 
            status: 'testing',
            message: 'Verificando conexión...' 
        });

        try {
            // Normalize URL
            let testUrl = url;
            if (!testUrl.endsWith('/')) {
                testUrl += '/';
            }
            testUrl += 'health';

            // Make the request to the health endpoint
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Define the expected response type
            interface HealthResponse {
                status: string;
                api: string;
                version: string;
            }
            
            const result = await response.json() as HealthResponse;
            
            if (result.status === 'healthy') {
                // Connection successful - save the URL
                this._connectionValidated = true;
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'success',
                    message: 'Conexión exitosa! Configuración guardada.' 
                });
                
                // Save the URL to configuration
                const config = vscode.workspace.getConfiguration('sauco-de');
                config.update('apiUrl', url, vscode.ConfigurationTarget.Global);
                
                // Reset validation state after saving
                setTimeout(() => {
                    if (this._view) {
                        this._connectionValidated = false;
                        this._view.webview.postMessage({ command: 'resetValidation' });
                    }
                }, 3000);
            } else {
                // Connection failed
                this._connectionValidated = false;
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'error',
                    message: 'Conexión fallida. La API devolvió un estado inesperado.' 
                });
            }
        } catch (error) {
            // Connection failed
            this._connectionValidated = false;
            this._view.webview.postMessage({ 
                command: 'updateConnectionStatus', 
                status: 'error',
                message: `Conexión fallida: ${error instanceof Error ? error.message : String(error)}` 
            });
        }
    }

    /**
     * Tests the connection to the API by making a request to the health endpoint
     * @param url The API URL to test
     */
    private async testConnection(url: string) {
        if (!this._view) {
            return;
        }

        // Show testing status
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'testing',
                    message: 'Verificando conexión...' 
                });

        try {
            // Normalize URL
            let testUrl = url;
            if (!testUrl.endsWith('/')) {
                testUrl += '/';
            }
            testUrl += 'health';

            // Make the request to the health endpoint
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Define the expected response type
            interface HealthResponse {
                status: string;
                api: string;
                version: string;
            }
            
            const result = await response.json() as HealthResponse;
            
            if (result.status === 'healthy') {
                // Connection successful
                this._connectionValidated = true;
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'success',
                    message: 'Conexión exitosa! La API está funcionando correctamente.' 
                });
            } else {
                // Connection failed
                this._connectionValidated = false;
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'error',
                    message: 'Conexión fallida. La API devolvió un estado inesperado.' 
                });
            }
        } catch (error) {
            // Connection failed
            this._connectionValidated = false;
                this._view.webview.postMessage({ 
                    command: 'updateConnectionStatus', 
                    status: 'error',
                    message: `Conexión fallida: ${error instanceof Error ? error.message : String(error)}` 
                });
        }
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
                    margin-right: 8px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .button-container {
                    display: flex;
                    margin-bottom: 15px;
                }
                .status-message {
                    margin-top: 15px;
                    padding: 8px;
                    border-radius: 3px;
                    display: none;
                }
                .status-success {
                    background-color: rgba(0, 128, 0, 0.2);
                    color: var(--vscode-testing-iconPassed);
                    border: 1px solid var(--vscode-testing-iconPassed);
                }
                .status-error {
                    background-color: rgba(255, 0, 0, 0.1);
                    color: var(--vscode-testing-iconFailed);
                    border: 1px solid var(--vscode-testing-iconFailed);
                }
                .status-testing {
                    background-color: rgba(255, 165, 0, 0.1);
                    color: var(--vscode-testing-iconQueued);
                    border: 1px solid var(--vscode-testing-iconQueued);
                }
            </style>
        </head>
        <body>
            <h2>API Configuration</h2>
            <div class="form-group">
                <label for="apiUrl">API URL:</label>
                <input type="text" id="apiUrl" value="${currentUrl}" placeholder="Enter API URL">
            </div>
            <div class="button-container">
                <button id="testButton">Test Connection</button>
                <button id="saveButton" disabled>Save Configuration</button>
            </div>
            <div id="statusMessage" class="status-message"></div>

            <script>
                const vscode = acquireVsCodeApi();
                const apiUrlInput = document.getElementById('apiUrl');
                const testButton = document.getElementById('testButton');
                const saveButton = document.getElementById('saveButton');
                const statusMessage = document.getElementById('statusMessage');
                
                // Handle the test button click
                testButton.addEventListener('click', () => {
                    const url = apiUrlInput.value;
                    if (!url) {
                        updateStatus('error', 'Por favor ingrese una URL de API');
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'testConnection',
                        url: url
                    });
                });
                
                // Handle the save button click
                saveButton.addEventListener('click', () => {
                    const url = apiUrlInput.value;
                    if (!url) {
                        updateStatus('error', 'Por favor ingrese una URL de API');
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'saveUrl',
                        url: url
                    });
                });
                
                // Handle input changes
                apiUrlInput.addEventListener('input', () => {
                    // Disable save button when URL changes
                    saveButton.disabled = true;
                    // Hide status message
                    statusMessage.style.display = 'none';
                });
                
                // Handle messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateConnectionStatus':
                            updateStatus(message.status, message.message);
                            if (message.status === 'success') {
                                saveButton.disabled = false;
                            } else {
                                saveButton.disabled = true;
                            }
                            break;
                        case 'resetValidation':
                            saveButton.disabled = true;
                            statusMessage.style.display = 'none';
                            break;
                    }
                });
                
                function updateStatus(status, message) {
                    statusMessage.textContent = message;
                    statusMessage.className = 'status-message';
                    statusMessage.classList.add('status-' + status);
                    statusMessage.style.display = 'block';
                }
            </script>
        </body>
        </html>`;
    }
}
