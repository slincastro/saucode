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
const vscode = __importStar(require("vscode"));
const SaucoConfigViewProvider_1 = require("./ui/views/config/SaucoConfigViewProvider");
const SaucoAnalysisViewProvider_1 = require("./ui/views/analysis/SaucoAnalysisViewProvider");
const SaucoTreeDataProvider_1 = require("./ui/tree/SaucoTreeDataProvider");
const CommandsService_1 = require("./commands/CommandsService");
const CognitiveComplexityMetric_1 = require("./services/metrics/CognitiveComplexityMetric");
function activate(context) {
    console.log('Congratulations, your extension "sauco-de" is now active!');
    // Register tree view
    const saucoTreeDataProvider = new SaucoTreeDataProvider_1.SaucoTreeDataProvider();
    vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
    // Register config view
    const saucoConfigViewProvider = new SaucoConfigViewProvider_1.SaucoConfigViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SaucoConfigViewProvider_1.SaucoConfigViewProvider.viewType, saucoConfigViewProvider));
    // Register analysis view
    const saucoAnalysisViewProvider = new SaucoAnalysisViewProvider_1.SaucoAnalysisViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SaucoAnalysisViewProvider_1.SaucoAnalysisViewProvider.viewType, saucoAnalysisViewProvider));
    // Make the analysis view provider globally accessible
    global.saucoAnalysisViewProvider = saucoAnalysisViewProvider;
    // Register commands
    CommandsService_1.CommandsService.registerCommands(context, saucoAnalysisViewProvider);
    // Add event listener for editor closing to ensure analysis view stays visible
    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(async (editors) => {
        // If the improved code editor was closed, ensure the analysis view is still visible
        if (global.saucoAnalysisViewProvider._currentImprovement) {
            await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
            await vscode.commands.executeCommand(SaucoAnalysisViewProvider_1.SaucoAnalysisViewProvider.viewType + '.focus');
        }
    }));
    // Register metrics
    const metrics = [CognitiveComplexityMetric_1.CognitiveComplexityMetric];
    // Add event listener for when a text document is opened
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            calculateAndDisplayMetrics(editor.document, metrics, saucoAnalysisViewProvider);
        }
    }));
    // Calculate metrics for the currently open document (if any)
    if (vscode.window.activeTextEditor) {
        calculateAndDisplayMetrics(vscode.window.activeTextEditor.document, metrics, saucoAnalysisViewProvider);
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
        const currentUrl = config.get('apiUrl');
        if (currentUrl) {
            configStatusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
        }
        else {
            configStatusBarItem.tooltip = "Configure Sauco API URL";
        }
    }
    updateStatusBar();
    // Listen for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('sauco-de.apiUrl')) {
            updateStatusBar();
        }
    }));
    // Add status bar items to subscriptions
    context.subscriptions.push(configStatusBarItem, analyzeStatusBarItem, metricsStatusBarItem);
}
/**
 * Calculates metrics for a document and displays them in the analysis view
 * @param document The document to calculate metrics for
 * @param metrics The metrics to calculate
 * @param analysisViewProvider The analysis view provider to update
 */
function calculateAndDisplayMetrics(document, metrics, analysisViewProvider) {
    try {
        const fileName = document.fileName.split('/').pop() || document.fileName;
        const fileContent = document.getText();
        // Show metrics in the analysis view
        analysisViewProvider.showMetrics(fileName, fileContent);
    }
    catch (error) {
        console.error('Error calculating metrics:', error);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map