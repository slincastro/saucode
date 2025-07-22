// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Manages the configuration webview panel
 */
class ConfigurationPanel {
	public static currentPanel: ConfigurationPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ConfigurationPanel.currentPanel) {
			ConfigurationPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'saucoConfiguration',
			'Sauco Configuration',
			column || vscode.ViewColumn.One,
			{
				// Enable JavaScript in the webview
				enableScripts: true,
				// Restrict the webview to only load resources from our extension's directory
				localResourceRoots: [extensionUri]
			}
		);

		ConfigurationPanel.currentPanel = new ConfigurationPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'saveUrl':
						// Save the URL to configuration
						const config = vscode.workspace.getConfiguration('sauco-de');
						config.update('apiUrl', message.url, vscode.ConfigurationTarget.Global);
						vscode.window.showInformationMessage('Sauco API URL has been updated.');
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
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

	private _update() {
		const webview = this._panel.webview;
		this._panel.title = "Sauco Configuration";
		this._panel.webview.html = this._getHtmlForWebview(webview);
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
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sauco-de" is now active!');

	// Create a status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'sauco-de.configure';
	statusBarItem.text = "$(wand) Sauco Config";
	statusBarItem.tooltip = "Configure Sauco API URL";
	statusBarItem.show();
	
	// Update status bar with current URL
	function updateStatusBar() {
		const config = vscode.workspace.getConfiguration('sauco-de');
		const currentUrl = config.get('apiUrl') as string;
		if (currentUrl) {
			statusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
		} else {
			statusBarItem.tooltip = "Configure Sauco API URL";
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
	const configureDisposable = vscode.commands.registerCommand('sauco-de.configure', () => {
		ConfigurationPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(helloWorldDisposable, configureDisposable, statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {}
