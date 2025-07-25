import * as vscode from 'vscode';
import * as path from 'path';
import { SaucoConfigViewProvider } from './sauco-config-view-provider';
import { SaucoAnalysisViewProvider } from './sauco-analysis-view-provider';
import { CognitiveComplexityMetric } from './metrics/CognitiveComplexityMetric';
import { Metric, MetricResult } from './metrics/Metric';


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
				),
				new SaucoItem(
					'Explain Code',
					'Get explanation of current code',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'sauco-de.explainCode',
						title: 'Explain Code'
					}
				)
			]);
		}
	}
}

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

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "sauco-de" is now active!');
	
	const saucoTreeDataProvider = new SaucoTreeDataProvider();
	vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
	
	const saucoConfigViewProvider = new SaucoConfigViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('saucoConfigView', saucoConfigViewProvider)
	);
	
	const saucoAnalysisViewProvider = new SaucoAnalysisViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('saucoAnalysisView', saucoAnalysisViewProvider)
	);
	
	(global as any).saucoAnalysisViewProvider = saucoAnalysisViewProvider;
	
	// Register metrics
	const metrics: Metric[] = [CognitiveComplexityMetric];
	
	// Add event listener for when a text document is opened
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				calculateAndDisplayMetrics(editor.document, metrics, saucoAnalysisViewProvider);
			}
		})
	);
	
	// Calculate metrics for the currently open document (if any)
	if (vscode.window.activeTextEditor) {
		calculateAndDisplayMetrics(
			vscode.window.activeTextEditor.document, 
			metrics, 
			saucoAnalysisViewProvider
		);
	}

	const configStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	configStatusBarItem.command = 'sauco-de.configure';
	configStatusBarItem.text = "$(gear) Sauco Config";
	configStatusBarItem.tooltip = "Configure Sauco API URL";
	configStatusBarItem.show();
	
	const analyzeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
	analyzeStatusBarItem.command = 'sauco-de.analyzeCode';
	analyzeStatusBarItem.text = "$(beaker) Analyze";
	analyzeStatusBarItem.tooltip = "Analyze current code";
	analyzeStatusBarItem.show();
	
	const explainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
	explainStatusBarItem.command = 'sauco-de.explainCode';
	explainStatusBarItem.text = "$(book) Explain";
	explainStatusBarItem.tooltip = "Get explanation of current code";
	explainStatusBarItem.show();
	
	function updateStatusBar() {
		const config = vscode.workspace.getConfiguration('sauco-de');
		const currentUrl = config.get('apiUrl') as string;
		if (currentUrl) {
			configStatusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
		} else {
			configStatusBarItem.tooltip = "Configure Sauco API URL";
		}
	}
	
	updateStatusBar();
	
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('sauco-de.apiUrl')) {
				updateStatusBar();
			}
		})
	);

	const helloWorldDisposable = vscode.commands.registerCommand('sauco-de.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from sauco-de!');
	});

	const configureDisposable = vscode.commands.registerCommand('sauco-de.configure', async () => {
		await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
		await vscode.commands.executeCommand('saucoConfigView.focus');
	});

	const analyzeCodeDisposable = vscode.commands.registerCommand('sauco-de.analyzeCode', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a file to analyze.');
			return;
		}

		const code = editor.document.getText();
		const config = vscode.workspace.getConfiguration('sauco-de');
		const apiUrl = config.get('apiUrl') as string;
		
		if (!apiUrl) {
			vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
			await vscode.commands.executeCommand('sauco-de.configure');
			return;
		}

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Analyzing code...",
			cancellable: false
		}, async (progress) => {
			try {

				let analyzeUrl = apiUrl;
				if (!analyzeUrl.endsWith('/')) {
					analyzeUrl += '/';
				}
				analyzeUrl += 'analyze/';
				
				const requestBody = JSON.stringify({ code });
				
				console.log(`Sending request to: ${analyzeUrl}`);
				console.log(`Request body: ${requestBody}`);
				
				vscode.window.showInformationMessage(`Sending request to: ${analyzeUrl}`);
				
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
				
				const result = await response.json() as { Analisis: string, code: string };
				
				await createSideBySideComparison(editor.document.getText(), result.Analisis, result.code);
				
			} catch (error) {
				console.error('Error analyzing code:', error);
				
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

	const explainCodeDisposable = vscode.commands.registerCommand('sauco-de.explainCode', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a file to explain.');
			return;
		}

		const code = editor.document.getText();
		const config = vscode.workspace.getConfiguration('sauco-de');
		const apiUrl = config.get('apiUrl') as string;
		
		if (!apiUrl) {
			vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
			await vscode.commands.executeCommand('sauco-de.configure');
			return;
		}

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Explaining code...",
			cancellable: false
		}, async (progress) => {
			try {
				let explainUrl = apiUrl;
				if (!explainUrl.endsWith('/')) {
					explainUrl += '/';
				}
				explainUrl += 'explain/';
				
				const requestBody = JSON.stringify({ code });
				
				console.log(`Sending request to: ${explainUrl}`);
				console.log(`Request body: ${requestBody}`);
				
				vscode.window.showInformationMessage(`Sending request to: ${explainUrl}`);
				
				const response = await fetch(explainUrl, {
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
				
				const result = await response.json() as { explanation: string, code: string };
				
				// Display the explanation in the analysis view
				(global as any).saucoAnalysisViewProvider.updateContent(result.explanation, 
					vscode.window.activeTextEditor?.document.fileName ? path.basename(vscode.window.activeTextEditor.document.fileName) : 'code');
				
				await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
				await vscode.commands.executeCommand('saucoAnalysisView.focus');
				
				vscode.window.showInformationMessage(
					'Code explanation complete! The explanation is displayed in the activity window.'
				);
				
			} catch (error) {
				console.error('Error explaining code:', error);
				
				let errorMessage = '';
				if (error instanceof TypeError && error.message.includes('fetch')) {
					errorMessage = `Failed to connect to the API server. Please check that:
					1. The API server is running
					2. The API URL is correct (${config.get('apiUrl')})
					3. There are no network issues or firewalls blocking the connection`;
				} else {
					errorMessage = `Error explaining code: ${error instanceof Error ? error.message : String(error)}`;
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
		explainCodeDisposable,
		configStatusBarItem,
		analyzeStatusBarItem,
		explainStatusBarItem
	);
}



/**
 * Creates a side-by-side comparison view with the original code, analysis result, and improved code
 * @param originalCode The original code from the editor
 * @param analysisResult The analysis result from the API
 * @param improvedCode The improved code from the API
 */
async function createSideBySideComparison(originalCode: string, analysisResult: string, improvedCode: string) {
	try {
		const activeFileName = vscode.window.activeTextEditor?.document.fileName || 'code';
		const fileName = path.basename(activeFileName);
		
		const improvedCodeDocument = await vscode.workspace.openTextDocument({
			content: improvedCode,
			language: vscode.window.activeTextEditor?.document.languageId || 'plaintext' // Use the same language as the original file
		});

		const activeColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
		
		await vscode.window.showTextDocument(
			vscode.window.activeTextEditor!.document, 
			{ viewColumn: activeColumn, preview: false }
		);
		
		await vscode.window.showTextDocument(
			improvedCodeDocument, 
			{ 
				viewColumn: vscode.ViewColumn.Beside, 
				preview: false,
				preserveFocus: false
			}
		);
		
		(global as any).saucoAnalysisViewProvider.updateContent(analysisResult, fileName);
		
		await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
		await vscode.commands.executeCommand('saucoAnalysisView.focus');
		
		vscode.window.showInformationMessage(
			'Code analysis complete! The improved code is displayed in the side panel and the analysis is in the activity window.'
		);
	} catch (error) {
		console.error('Error creating side-by-side comparison:', error);
		vscode.window.showErrorMessage(`Error creating side-by-side comparison: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Calculates metrics for a document and displays them in the analysis view
 * @param document The document to calculate metrics for
 * @param metrics The metrics to calculate
 * @param analysisViewProvider The analysis view provider to update
 */
function calculateAndDisplayMetrics(
	document: vscode.TextDocument, 
	metrics: Metric[], 
	analysisViewProvider: SaucoAnalysisViewProvider
) {
	try {
		const fileName = path.basename(document.fileName);
		const metricResults: { metric: Metric, result: MetricResult }[] = [];
		
		// Calculate each metric
		for (const metric of metrics) {
			try {
				const result = metric.extract(document);
				metricResults.push({ metric, result });
			} catch (error) {
				console.error(`Error calculating metric ${metric.name}:`, error);
			}
		}
		
		// Generate HTML table for metrics
		const metricsTable = generateMetricsTable(metricResults);
		
		// Update the analysis view with the metrics table
		analysisViewProvider.updateMetricsContent(metricsTable, fileName);
	} catch (error) {
		console.error('Error calculating metrics:', error);
	}
}

/**
 * Generates an HTML table for displaying metrics
 * @param metricResults The metric results to display
 * @returns HTML string for the metrics table
 */
function generateMetricsTable(metricResults: { metric: Metric, result: MetricResult }[]): string {
	if (metricResults.length === 0) {
		return '<p>No metrics available for this file.</p>';
	}
	
	let tableHtml = `
		<table class="metrics-table">
			<thead>
				<tr>
					<th>Metric</th>
					<th>Value</th>
				</tr>
			</thead>
			<tbody>
	`;
	
	for (const { metric, result } of metricResults) {
		tableHtml += `
			<tr>
				<td>${result.label}</td>
				<td>${result.value}</td>
			</tr>
		`;
	}
	
	tableHtml += `
			</tbody>
		</table>
	`;
	
	return tableHtml;
}

export function deactivate() {}
