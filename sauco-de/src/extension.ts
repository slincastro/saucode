// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * TreeDataProvider for the Sauco Explorer view
 */
class SaucoTreeDataProvider implements vscode.TreeDataProvider<SaucoItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<SaucoItem | undefined | null | void> = new vscode.EventEmitter<SaucoItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<SaucoItem | undefined | null | void> = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: SaucoItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: SaucoItem): Thenable<SaucoItem[]> {
		if (element) {
			return Promise.resolve([]);
		} else {
			// Root items
			return Promise.resolve([
				new SaucoItem(
					'Documentation',
					'View Sauco documentation',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'sauco-de.helloWorld', // For now, using helloWorld command
						title: 'Open Documentation'
					}
				),
				new SaucoItem(
					'Analyze Code',
					'Analyze current code',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'sauco-de.analyzeCode',
						title: 'Analyze Code'
					}
				)
			]);
		}
	}
}

/**
 * Tree item for the Sauco Explorer view
 */
class SaucoItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
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
class SaucoConfigViewProvider implements vscode.WebviewViewProvider {
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sauco-de" is now active!');
	
	// Register the tree data provider for the Sauco Explorer view
	const saucoTreeDataProvider = new SaucoTreeDataProvider();
	vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
	
	// Register the webview view provider for the configuration view
	const saucoConfigViewProvider = new SaucoConfigViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('saucoConfigView', saucoConfigViewProvider)
	);

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
		const currentUrl = config.get('apiUrl') as string;
		if (currentUrl) {
			configStatusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
		} else {
			configStatusBarItem.tooltip = "Configure Sauco API URL";
		}
	}
	
	// Update status bar initially
	updateStatusBar();
	
	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('sauco-de.apiUrl')) {
				updateStatusBar();
			}
		})
	);

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
		const apiUrl = config.get('apiUrl') as string;
		
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
				const result = await response.json() as { message: string };
				
				// Create a side-by-side comparison view
				await createSideBySideComparison(editor.document.getText(), result.message);
				
			} catch (error) {
				console.error('Error analyzing code:', error);
				
				// Provide more detailed error message based on the type of error
				let errorMessage = '';
				if (error instanceof TypeError && error.message.includes('fetch')) {
					errorMessage = `Failed to connect to the API server. Please check that:
1. The API server is running
2. The API URL is correct (${config.get('apiUrl')})
3. There are no network issues or firewalls blocking the connection`;
				} else {
					errorMessage = `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`;
				}
				
				vscode.window.showErrorMessage(errorMessage);
			}
			
			return Promise.resolve();
		});
	});

	context.subscriptions.push(
		helloWorldDisposable, 
		configureDisposable, 
		analyzeCodeDisposable, 
		configStatusBarItem,
		analyzeStatusBarItem
	);
}

/**
 * Creates a side-by-side comparison view with the original code and analysis result
 * @param originalCode The original code from the editor
 * @param analysisResult The analysis result from the API
 */
async function createSideBySideComparison(originalCode: string, analysisResult: string) {
	try {
		// Get the active editor's filename for reference
		const activeFileName = vscode.window.activeTextEditor?.document.fileName || 'code';
		const fileName = path.basename(activeFileName);
		
		// Create a new untitled document for the analysis result with a descriptive title
		const analysisDocument = await vscode.workspace.openTextDocument({
			content: `# Code Analysis for ${fileName}\n\n${analysisResult}`,
			language: 'markdown' // Use markdown for better formatting
		});

		// Get the active editor's view column
		const activeColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
		
		// Show the original document in the active column
		await vscode.window.showTextDocument(
			vscode.window.activeTextEditor!.document, 
			{ viewColumn: activeColumn, preview: false }
		);
		
		// Show the analysis result in the column beside
		await vscode.window.showTextDocument(
			analysisDocument, 
			{ 
				viewColumn: vscode.ViewColumn.Beside, 
				preview: false,
				preserveFocus: false
			}
		);
		
		// Show a success message with instructions
		vscode.window.showInformationMessage(
			'Code analysis complete! The analysis is displayed in a side-by-side view.'
		);
	} catch (error) {
		console.error('Error creating side-by-side comparison:', error);
		vscode.window.showErrorMessage(`Error creating side-by-side comparison: ${error instanceof Error ? error.message : String(error)}`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
