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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * TreeDataProvider for the Sauco Explorer view
 */
class SaucoTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        else {
            // Root items
            return Promise.resolve([
                new SaucoItem('Documentation', 'View Sauco documentation', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.helloWorld', // For now, using helloWorld command
                    title: 'Open Documentation'
                }),
                new SaucoItem('Analyze Code', 'Analyze current code', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.analyzeCode',
                    title: 'Analyze Code'
                })
            ]);
        }
    }
}
/**
 * Tree item for the Sauco Explorer view
 */
class SaucoItem extends vscode.TreeItem {
    label;
    description;
    collapsibleState;
    command;
    constructor(label, description, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.tooltip = description;
        this.description = description;
    }
    iconPath = {
        light: vscode.Uri.file(path.join(__filename, '..', '..', 'images', 'icon.svg')),
        dark: vscode.Uri.file(path.join(__filename, '..', '..', 'images', 'icon.svg'))
    };
    contextValue = 'saucoItem';
}
/**
 * WebviewViewProvider for the configuration view in the activity bar
 */
class SaucoConfigViewProvider {
    extensionUri;
    _view;
    _extensionUri;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this._extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
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
    _getHtmlForWebview(webview) {
        // Get the current URL value from configuration
        const config = vscode.workspace.getConfiguration('sauco-de');
        const currentUrl = config.get('apiUrl') || '';
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
/**
 * Manages the configuration webview panel
 */
class ConfigurationPanel {
    static currentPanel;
    _panel;
    _extensionUri;
    _disposables = [];
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (ConfigurationPanel.currentPanel) {
            ConfigurationPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel('saucoConfiguration', 'Sauco Configuration', column || vscode.ViewColumn.One, {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from our extension's directory
            localResourceRoots: [extensionUri]
        });
        ConfigurationPanel.currentPanel = new ConfigurationPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'saveUrl':
                    // Save the URL to configuration
                    const config = vscode.workspace.getConfiguration('sauco-de');
                    config.update('apiUrl', message.url, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage('Sauco API URL has been updated.');
                    return;
            }
        }, null, this._disposables);
    }
    dispose() {
        ConfigurationPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.title = "Sauco Configuration";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        // Get the current URL value from configuration
        const config = vscode.workspace.getConfiguration('sauco-de');
        const currentUrl = config.get('apiUrl') || '';
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
					padding: 20px;
					color: var(--vscode-foreground);
				}
				.container {
					max-width: 800px;
					margin: 0 auto;
				}
				h1 {
					font-size: 1.5em;
					margin-bottom: 20px;
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
					padding: 8px;
					font-size: 14px;
					border: 1px solid var(--vscode-input-border);
					background-color: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
				}
				button {
					padding: 8px 16px;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					cursor: pointer;
					font-size: 14px;
				}
				button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>Sauco Configuration</h1>
				<div class="form-group">
					<label for="apiUrl">API URL:</label>
					<input type="text" id="apiUrl" value="${currentUrl}" placeholder="Enter API URL">
				</div>
				<button id="saveButton">Save Configuration</button>
			</div>

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
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "sauco-de" is now active!');
    // Register the tree data provider for the Sauco Explorer view
    const saucoTreeDataProvider = new SaucoTreeDataProvider();
    vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
    // Register the webview view provider for the configuration view
    const saucoConfigViewProvider = new SaucoConfigViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('saucoConfigView', saucoConfigViewProvider));
    // Create a status bar item for configuration
    const configStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    configStatusBarItem.command = 'sauco-de.configure';
    configStatusBarItem.text = "$(gear) Sauco Config";
    configStatusBarItem.tooltip = "Configure Sauco API URL";
    configStatusBarItem.show();
    // Create a status bar item for the analyze button
    const analyzeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    analyzeStatusBarItem.command = 'sauco-de.analyzeCode';
    analyzeStatusBarItem.text = "$(beaker) Analyze";
    analyzeStatusBarItem.tooltip = "Analyze current code";
    analyzeStatusBarItem.show();
    // Update status bar with current URL
    function updateStatusBar() {
        const config = vscode.workspace.getConfiguration('sauco-de');
        const currentUrl = config.get('apiUrl');
        if (currentUrl) {
            configStatusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
        }
        else {
            configStatusBarItem.tooltip = "Configure Sauco API URL";
        }
    }
    // Update status bar initially
    updateStatusBar();
    // Listen for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('sauco-de.apiUrl')) {
            updateStatusBar();
        }
    }));
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const helloWorldDisposable = vscode.commands.registerCommand('sauco-de.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from sauco-de!');
    });
    // Register the configuration command
    const configureDisposable = vscode.commands.registerCommand('sauco-de.configure', async () => {
        // Focus on the Sauco Explorer view container
        await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
        // Focus on the configuration view
        await vscode.commands.executeCommand('saucoConfigView.focus');
    });
    // Register the analyze code command
    const analyzeCodeDisposable = vscode.commands.registerCommand('sauco-de.analyzeCode', async () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file to analyze.');
            return;
        }
        // Get the text from the editor
        const code = editor.document.getText();
        // Get the API URL from configuration
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl');
        if (!apiUrl) {
            vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
            await vscode.commands.executeCommand('sauco-de.configure');
            return;
        }
        // Show progress notification
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing code...",
            cancellable: false
        }, async (progress) => {
            try {
                // Prepare the request
                let analyzeUrl = apiUrl;
                // Make sure the URL ends with a slash before appending 'analyze/'
                if (!analyzeUrl.endsWith('/')) {
                    analyzeUrl += '/';
                }
                analyzeUrl += 'analyze/';
                const requestBody = JSON.stringify({ code });
                // Log the request for debugging
                console.log(`Sending request to: ${analyzeUrl}`);
                console.log(`Request body: ${requestBody}`);
                // Show a more detailed message to help with debugging
                vscode.window.showInformationMessage(`Sending request to: ${analyzeUrl}`);
                // Send the request
                const response = await fetch(analyzeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: requestBody
                });
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'No error details available');
                    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                }
                // Parse the response
                const result = await response.json();
                // Show the result
                vscode.window.showInformationMessage(`Analysis result: ${result.message}`);
            }
            catch (error) {
                console.error('Error analyzing code:', error);
                // Provide more detailed error message based on the type of error
                let errorMessage = '';
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    errorMessage = `Failed to connect to the API server. Please check that:
1. The API server is running
2. The API URL is correct (${config.get('apiUrl')})
3. There are no network issues or firewalls blocking the connection`;
                }
                else {
                    errorMessage = `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`;
                }
                vscode.window.showErrorMessage(errorMessage);
            }
            return Promise.resolve();
        });
    });
    context.subscriptions.push(helloWorldDisposable, configureDisposable, analyzeCodeDisposable, configStatusBarItem, analyzeStatusBarItem);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map