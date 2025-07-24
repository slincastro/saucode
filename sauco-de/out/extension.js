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
    // Register the webview view provider for the analysis view
    const saucoAnalysisViewProvider = new SaucoAnalysisViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('saucoAnalysisView', saucoAnalysisViewProvider));
    // Store the analysis view provider in the global scope so it can be accessed from other functions
    global.saucoAnalysisViewProvider = saucoAnalysisViewProvider;
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
                // Create a side-by-side comparison view
                await createSideBySideComparison(editor.document.getText(), result.Analisis, result.code);
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
/**
 * WebviewViewProvider for the analysis results view in the activity bar
 */
class SaucoAnalysisViewProvider {
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
        // Set initial content
        webviewView.webview.html = this._getHtmlForWebview('No analysis results yet', '');
    }
    updateContent(analysisResult, fileName) {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(analysisResult, fileName);
            // Make sure the view is visible
            this._view.show(true);
        }
    }
    _getHtmlForWebview(analysisResult, fileName) {
        const title = fileName ? `Code Analysis for ${fileName}` : 'Code Analysis';
        // Return the HTML content
        return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					padding: 10px;
					color: var(--vscode-foreground);
					line-height: 1.5;
				}
				h1 {
					font-size: 1.5em;
					margin-bottom: 15px;
					color: var(--vscode-editor-foreground);
					border-bottom: 1px solid var(--vscode-panel-border);
					padding-bottom: 10px;
				}
				h2 {
					font-size: 1.2em;
					margin-top: 20px;
					margin-bottom: 10px;
					color: var(--vscode-editor-foreground);
				}
				pre {
					background-color: var(--vscode-editor-background);
					padding: 10px;
					border-radius: 5px;
					overflow: auto;
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				code {
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				ul, ol {
					padding-left: 20px;
				}
				li {
					margin-bottom: 5px;
				}
			</style>
		</head>
		<body>
			<h1>${title}</h1>
			<div id="analysis-content">
				${this._formatAnalysisContent(analysisResult)}
			</div>
		</body>
		</html>`;
    }
    _formatAnalysisContent(content) {
        // Convert markdown-style headers to HTML
        let formattedContent = content
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
            .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
        // Convert markdown-style code blocks to HTML
        formattedContent = formattedContent.replace(/```(?:.*?)\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');
        // Convert markdown-style inline code to HTML
        formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert markdown-style lists to HTML
        formattedContent = formattedContent.replace(/^\d+\. (.*$)/gm, '<li>$1</li>').replace(/^- (.*$)/gm, '<li>$1</li>');
        // Convert line breaks to HTML
        formattedContent = formattedContent.replace(/\n\n/g, '<br><br>');
        return formattedContent;
    }
}
/**
 * Creates a side-by-side comparison view with the original code, analysis result, and improved code
 * @param originalCode The original code from the editor
 * @param analysisResult The analysis result from the API
 * @param improvedCode The improved code from the API
 */
async function createSideBySideComparison(originalCode, analysisResult, improvedCode) {
    try {
        // Get the active editor's filename for reference
        const activeFileName = vscode.window.activeTextEditor?.document.fileName || 'code';
        const fileName = path.basename(activeFileName);
        // Create a new untitled document for the improved code
        const improvedCodeDocument = await vscode.workspace.openTextDocument({
            content: improvedCode,
            language: vscode.window.activeTextEditor?.document.languageId || 'plaintext' // Use the same language as the original file
        });
        // Get the active editor's view column
        const activeColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
        // Show the original document in the active column
        await vscode.window.showTextDocument(vscode.window.activeTextEditor.document, { viewColumn: activeColumn, preview: false });
        // Show the improved code in the column beside
        await vscode.window.showTextDocument(improvedCodeDocument, {
            viewColumn: vscode.ViewColumn.Beside,
            preview: false,
            preserveFocus: false
        });
        // Update the analysis view with the analysis result
        global.saucoAnalysisViewProvider.updateContent(analysisResult, fileName);
        // Focus on the analysis view
        await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
        await vscode.commands.executeCommand('saucoAnalysisView.focus');
        // Show a success message with instructions
        vscode.window.showInformationMessage('Code analysis complete! The improved code is displayed in the side panel and the analysis is in the activity window.');
    }
    catch (error) {
        console.error('Error creating side-by-side comparison:', error);
        vscode.window.showErrorMessage(`Error creating side-by-side comparison: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map