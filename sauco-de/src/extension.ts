import * as vscode from 'vscode';
import { SaucoConfigViewProvider } from './ui/views/config/SaucoConfigViewProvider';
import { SaucoAnalysisViewProvider } from './ui/views/analysis/SaucoAnalysisViewProvider';
import { SaucoTreeDataProvider } from './ui/tree/SaucoTreeDataProvider';
import { CommandsService } from './commands/CommandsService';
import { MetricsService } from './services/metrics/MetricsService';
import { Metric } from './models/MetricModels';
import { CognitiveComplexityMetric } from './services/metrics/CognitiveComplexityMetric';
import { CodeImprovement } from './models/ApiModels';

/**
 * Interface for the file analysis data stored in the global store
 */
interface FileAnalysisData {
  filePath: string;
  fileName: string;
  improvement: CodeImprovement;
  documentUri?: vscode.Uri;
  improvedCodeDocumentUri?: vscode.Uri;
  timestamp: number;
}

/**
 * Global store for file analysis data
 */
interface SaucoGlobalStore {
  analysisData: Map<string, FileAnalysisData>;
  
  /**
   * Adds or updates analysis data for a file
   * @param filePath The full path of the analyzed file
   * @param fileName The name of the analyzed file
   * @param improvement The code improvement data
   * @param documentUri The URI of the original document
   * @param improvedCodeDocumentUri The URI of the document with improved code
   */
  addAnalysisData(
    filePath: string, 
    fileName: string, 
    improvement: CodeImprovement, 
    documentUri?: vscode.Uri,
    improvedCodeDocumentUri?: vscode.Uri
  ): void;
  
  /**
   * Gets analysis data for a file by path
   * @param filePath The path of the file
   * @returns The analysis data or undefined if not found
   */
  getAnalysisDataByPath(filePath: string): FileAnalysisData | undefined;
  
  /**
   * Gets analysis data for a file by name
   * @param fileName The name of the file
   * @returns An array of analysis data for files with the given name
   */
  getAnalysisDataByName(fileName: string): FileAnalysisData[];
  
  /**
   * Gets all analysis data
   * @returns An array of all analysis data
   */
  getAllAnalysisData(): FileAnalysisData[];
}

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
	
	// Create the global store for file analysis data
	const saucoGlobalStore: SaucoGlobalStore = {
		analysisData: new Map<string, FileAnalysisData>(),
		
		addAnalysisData(
			filePath: string, 
			fileName: string, 
			improvement: CodeImprovement, 
			documentUri?: vscode.Uri,
			improvedCodeDocumentUri?: vscode.Uri
		): void {
			this.analysisData.set(filePath, {
				filePath,
				fileName,
				improvement,
				documentUri,
				improvedCodeDocumentUri,
				timestamp: Date.now()
			});
			console.log(`Added analysis data for ${fileName} (${filePath})`);
		},
		
		getAnalysisDataByPath(filePath: string): FileAnalysisData | undefined {
			return this.analysisData.get(filePath);
		},
		
		getAnalysisDataByName(fileName: string): FileAnalysisData[] {
			return Array.from(this.analysisData.values())
				.filter(data => data.fileName === fileName || data.fileName.endsWith(`/${fileName}`) || data.fileName.endsWith(`\\${fileName}`));
		},
		
		getAllAnalysisData(): FileAnalysisData[] {
			return Array.from(this.analysisData.values());
		}
	};
	
	// Make the analysis view provider and other important variables globally accessible
	(global as any).saucoAnalysisViewProvider = saucoAnalysisViewProvider;
	(global as any).lastAnalyzedDocument = null; // Store the last analyzed document
	(global as any).saucoGlobalStore = saucoGlobalStore; // Store the global store
	
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
	
	const applyCodeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 103);
	applyCodeStatusBarItem.command = 'sauco-de.applyCode';
	applyCodeStatusBarItem.text = "$(check) Apply";
	applyCodeStatusBarItem.tooltip = "Apply improved code";
	applyCodeStatusBarItem.show();
	
	const historyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 104);
	historyStatusBarItem.command = 'sauco-de.getAnalysisData';
	historyStatusBarItem.text = "$(history) History";
	historyStatusBarItem.tooltip = "View analysis history";
	historyStatusBarItem.show();
	
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
		metricsStatusBarItem,
		applyCodeStatusBarItem,
		historyStatusBarItem
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
