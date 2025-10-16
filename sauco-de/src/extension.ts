import * as vscode from 'vscode';
import { SaucoConfigViewProvider } from './ui/views/config/SaucoConfigViewProvider';
import { SaucoAnalysisViewProvider } from './ui/views/analysis/SaucoAnalysisViewProvider';
import { SaucoTreeDataProvider } from './ui/tree/SaucoTreeDataProvider';
import { CommandsService } from './commands/CommandsService';
import { MetricsService } from './services/metrics/MetricsService';
import { Metric } from './models/MetricModels';
import { CognitiveComplexityMetric } from './services/metrics/CognitiveComplexityMetric';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "sauco-de" is now active!');
	
	// Register tree view
	const saucoTreeDataProvider = new SaucoTreeDataProvider();
	vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
	
	// Register config view
	const saucoConfigViewProvider = new SaucoConfigViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SaucoConfigViewProvider.viewType, saucoConfigViewProvider)
	);
	
	// Register analysis view
	const saucoAnalysisViewProvider = new SaucoAnalysisViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SaucoAnalysisViewProvider.viewType, saucoAnalysisViewProvider)
	);
	
	// Make the analysis view provider globally accessible
	(global as any).saucoAnalysisViewProvider = saucoAnalysisViewProvider;
	
	// Register commands
	CommandsService.registerCommands(context, saucoAnalysisViewProvider);
	
	// Add event listener for editor closing to ensure analysis view stays visible
	context.subscriptions.push(
		vscode.window.onDidChangeVisibleTextEditors(async (editors) => {
			// If the improved code editor was closed, ensure the analysis view is still visible
			if ((global as any).saucoAnalysisViewProvider._currentImprovement) {
				await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
				await vscode.commands.executeCommand(SaucoAnalysisViewProvider.viewType + '.focus');
			}
		})
	);
	
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

	// Create status bar items
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
	
	const metricsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
	metricsStatusBarItem.command = 'sauco-de.showMetrics';
	metricsStatusBarItem.text = "$(graph) Metrics";
	metricsStatusBarItem.tooltip = "Show code metrics";
	metricsStatusBarItem.show();
	
	// Update status bar with current API URL
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
	
	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('sauco-de.apiUrl')) {
				updateStatusBar();
			}
		})
	);

	// Add status bar items to subscriptions
	context.subscriptions.push(
		configStatusBarItem,
		analyzeStatusBarItem,
		metricsStatusBarItem
	);
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
		const fileName = document.fileName.split('/').pop() || document.fileName;
		const fileContent = document.getText();
		
		// Show metrics in the analysis view
		analysisViewProvider.showMetrics(fileName, fileContent);
	} catch (error) {
		console.error('Error calculating metrics:', error);
	}
}

export function deactivate() {}
