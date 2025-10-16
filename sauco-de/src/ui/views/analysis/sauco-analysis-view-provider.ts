import * as vscode from 'vscode';
import * as path from 'path';
let marked: any;
try {
    import('marked').then(m => {
        marked = m.marked || m.defaults || m;
    }).catch(e => {
        console.error('Error importing marked as ESM:', e);
    });
} catch (error) {
    console.error('Error setting up marked import:', error);
}

interface MetricsData {
    before: {
        method_number: number;
        number_of_ifs: number;
        number_of_loops: number;
        cyclomatic_complexity: number;
        average_method_size: number;
    };
    after: {
        method_number: number;
        number_of_ifs: number;
        number_of_loops: number;
        cyclomatic_complexity: number;
        average_method_size: number;
    };
}

export class SaucoAnalysisViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _extensionUri: vscode.Uri;
	private _metricsContent: string = '';
	private _metricsData?: MetricsData;
	private _improvedCode: string = '';
	private _analysisResult: string = '';
	private _originalEditor?: vscode.TextEditor;
	private _improvedCodeEditor?: vscode.TextEditor;

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
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview('No analysis results yet', '');

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'applyImprovedCode':
					this._applyImprovedCode();
					return;
			}
		});
	}

	public updateContent(analysisResult: string, fileName: string, metricsData?: MetricsData, improvedCode?: string) {
		if (metricsData) {
			this._metricsData = metricsData;
		}
		if (improvedCode) {
			this._improvedCode = improvedCode;
		}
		// Store the analysis result for later use
		this._analysisResult = analysisResult || this._analysisResult;
		
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview(this._analysisResult, fileName);
			this._view.show(true);
		}
	}

	public setOriginalEditor(editor: vscode.TextEditor) {
		this._originalEditor = editor;
	}

	public setImprovedCodeEditor(editor: vscode.TextEditor) {
		this._improvedCodeEditor = editor;
	}

	public applyImprovedCode() {
		if (!this._improvedCode || !this._originalEditor) {
			vscode.window.showErrorMessage('No improved code available or no active editor found.');
			return;
		}

		// Store current analysis content and metrics data
		const metricsData = this._metricsData;
		const improvedCode = this._improvedCode;
		const analysisResult = this._analysisResult;
		const fileName = this._originalEditor.document.fileName ? 
			path.basename(this._originalEditor.document.fileName) : 'code';
		
		const editor = this._originalEditor;
		
		const selection = editor.selection;
		const range = selection.isEmpty 
			? new vscode.Range(0, 0, editor.document.lineCount, 0) 
			: selection;

		const edit = new vscode.WorkspaceEdit();
		edit.replace(editor.document.uri, range, this._improvedCode);

		// Apply the edit
		vscode.workspace.applyEdit(edit).then(async success => {
			if (success) {
				vscode.window.showInformationMessage('Improved code applied successfully!');
				
				// Close the improved code editor without saving
				if (this._improvedCodeEditor) {
					vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				}
				
				// Make sure the explorer view is visible
				await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
				
				// Ensure the analysis view is still visible with the same content
				if (this._view) {
					// Re-apply the content to ensure it's displayed
					this.updateContent(this._analysisResult, fileName, this._metricsData, this._improvedCode);
					
					// Focus the analysis view
					await vscode.commands.executeCommand('saucoAnalysisView.focus');
					
					// Show the view
					this._view.show(true);
				}
			} else {
				vscode.window.showErrorMessage('Failed to apply improved code.');
			}
		});
	}
	
	// Keep the private method for backward compatibility with the webview button
	private _applyImprovedCode() {
		this.applyImprovedCode();
	}

	public updateMetricsContent(metricsTable: string, fileName: string) {
		this._metricsContent = metricsTable;
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview('', fileName);
			this._view.show(true);
		}
	}
	
	/**
	 * Checks if the analysis view has content to display
	 * @returns true if there is analysis content, false otherwise
	 */
	public hasAnalysisContent(): boolean {
		return this._analysisResult !== '';
	}

	private _getHtmlForWebview(analysisResult: string, fileName: string) {
		const title = fileName ? `Code Analysis for ${fileName}` : 'Code Analysis';
		const hasMetricsData = this._metricsData !== undefined;
		const hasImprovedCode = this._improvedCode !== '';

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			
			<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
			<style>
				body {
					font-family: var(--vscode-font-family);
					padding: 10px;
					color: var(--vscode-foreground);
					line-height: 1.5;
				}
				h1, h2, h3, h4, h5, h6 {
					color: var(--vscode-editor-foreground);
				}
				pre {
					background-color: var(--vscode-editor-background);
					padding: 10px;
					border-radius: 5px;
					overflow-x: auto;
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				code {
					background-color: var(--vscode-editor-background);
					padding: 2px 4px;
					border-radius: 3px;
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				ul, ol {
					padding-left: 20px;
				}
				.metrics-table {
					width: 100%;
					border-collapse: collapse;
					margin: 20px 0;
				}
				.metrics-table th, .metrics-table td {
					border: 1px solid var(--vscode-panel-border);
					padding: 8px 12px;
					text-align: left;
				}
				.metrics-table th {
					background-color: var(--vscode-editor-background);
					font-weight: bold;
				}
				.metrics-table tr:nth-child(even) {
					background-color: var(--vscode-list-hoverBackground);
				}
				.chart-container {
					width: 100%;
					height: 300px;
					margin: 20px 0;
				}
				.apply-button {
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 8px 16px;
					border-radius: 4px;
					cursor: pointer;
					font-weight: bold;
					margin-top: 10px;
					margin-bottom: 20px;
				}
				.apply-button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
				.apply-button:active {
					background-color: var(--vscode-button-background);
					opacity: 0.8;
				}
			</style>
		</head>
		<body>
			${hasMetricsData ? `
			<div id="metrics-chart-container">
				<h2>Metrics Comparison</h2>
				<div class="chart-container">
					<canvas id="metricsChart"></canvas>
				</div>
				<script>
					document.addEventListener('DOMContentLoaded', function() {
						const metricsData = ${JSON.stringify(this._metricsData)};
						const ctx = document.getElementById('metricsChart').getContext('2d');
						
						// Create labels and datasets
						const labels = ['Methods', 'If Statements', 'Loops', 'Cyclomatic Complexity', 'Avg Method Size'];
						const beforeData = [
							metricsData.before.method_number,
							metricsData.before.number_of_ifs,
							metricsData.before.number_of_loops,
							metricsData.before.cyclomatic_complexity,
							metricsData.before.average_method_size
						];
						const afterData = [
							metricsData.after.method_number,
							metricsData.after.number_of_ifs,
							metricsData.after.number_of_loops,
							metricsData.after.cyclomatic_complexity,
							metricsData.after.average_method_size
						];
						
						// Create the chart
						const chart = new Chart(ctx, {
							type: 'bar',
							data: {
								labels: labels,
								datasets: [
									{
										label: 'Before',
										data: beforeData,
										backgroundColor: 'rgba(255, 99, 132, 0.5)',
										borderColor: 'rgba(255, 99, 132, 1)',
										borderWidth: 1
									},
									{
										label: 'After',
										data: afterData,
										backgroundColor: 'rgba(54, 162, 235, 0.5)',
										borderColor: 'rgba(54, 162, 235, 1)',
										borderWidth: 1
									}
								]
							},
							options: {
								responsive: true,
								maintainAspectRatio: false,
								scales: {
									y: {
										beginAtZero: true
									}
								}
							}
						});
					});
				</script>
			</div>
			` : ''}
			
			${hasImprovedCode ? `
			<div id="apply-button-container">
				<button class="apply-button" id="apply-improved-code">Apply Improved Code</button>
			</div>
			` : ''}
			
			${analysisResult ? `
			<div id="analysis-content">
				${this._formatAnalysisContent(analysisResult)}
			</div>
			` : ''}
			
			<script>
				const vscode = acquireVsCodeApi();
				
				// Add event listener for the apply button if it exists
				document.addEventListener('DOMContentLoaded', function() {
					const applyButton = document.getElementById('apply-improved-code');
					if (applyButton) {
						applyButton.addEventListener('click', function() {
							vscode.postMessage({
								command: 'applyImprovedCode'
							});
						});
					}
				});
			</script>
		</body>
		</html>`;
	}

	private async _getMarkedHtml(content: string): Promise<string> {
		try {
			// Dynamically import marked
			const markedModule = await import('marked');
			// Use the parse function
			return markedModule.parse(content);
		} catch (error) {
			console.error('Error parsing markdown with marked:', error);
			// Fallback to basic parsing if marked fails
			return this._basicMarkdownParse(content);
		}
	}

	private _basicMarkdownParse(content: string): string {
		// Simple HTML escaping for safety
		const escaped = content
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
		
		// Convert markdown-like syntax to HTML
		return escaped
			.replace(/\n\n/g, '<br><br>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			// Handle headers with numbers (e.g., "#### 1. Title")
			.replace(/^#{1,6}\s+(\d+\.\s+)?(.+)$/gm, (match, p1, p2, offset, string) => {
				const level = match.trim().indexOf(' ');
				const number = p1 ? p1 : '';
				return `<h${level}>${number}${p2}</h${level}>`;
			})
			// Fallback for standard headers
			.replace(/^# (.*$)/gm, '<h1>$1</h1>')
			.replace(/^## (.*$)/gm, '<h2>$1</h2>')
			.replace(/^### (.*$)/gm, '<h3>$1</h3>')
			.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
			.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
			.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
	}
	
	private _formatAnalysisContent(content: string): string {
		// Try to use marked if available, otherwise fall back to basic parser
		try {
			if (marked && typeof marked.parse === 'function') {
				return marked.parse(content);
			}
		} catch (error) {
			console.error('Error using marked:', error);
		}
		
		// Fallback to basic parser
		return this._basicMarkdownParse(content);
	}
}
