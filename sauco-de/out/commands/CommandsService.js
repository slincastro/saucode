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
exports.CommandsService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Service for handling extension commands
 */
class CommandsService {
    /**
     * Registers all commands for the extension
     * @param context The extension context
     * @param analysisViewProvider The analysis view provider
     */
    static registerCommands(context, analysisViewProvider) {
        // Configure command
        const configureDisposable = vscode.commands.registerCommand('sauco-de.configure', async () => {
            await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
            await vscode.commands.executeCommand('saucoConfigView.focus');
        });
        // Analyze code command
        const analyzeCodeDisposable = vscode.commands.registerCommand('sauco-de.analyzeCode', async () => {
            await this.analyzeCode(analysisViewProvider);
        });
        // Show metrics command
        const showMetricsDisposable = vscode.commands.registerCommand('sauco-de.showMetrics', async () => {
            await this.showMetrics(analysisViewProvider);
        });
        // Add all commands to subscriptions
        context.subscriptions.push(configureDisposable, analyzeCodeDisposable, showMetricsDisposable);
    }
    /**
     * Analyzes the code in the active editor
     * @param analysisViewProvider The analysis view provider
     */
    static async analyzeCode(analysisViewProvider) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file to analyze.');
            return;
        }
        // Get selected text or entire document if no selection
        const selection = editor.selection;
        const code = selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
        const fileName = editor.document.fileName;
        // Show what's being analyzed
        console.log('Analyzing code selection:', selection.isEmpty ? 'Entire document' : 'Selected text');
        // Check if API URL is configured
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl');
        if (!apiUrl) {
            vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
            await vscode.commands.executeCommand('sauco-de.configure');
            return;
        }
        try {
            // Show the analysis view
            await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
            await vscode.commands.executeCommand('saucoAnalysisView.focus');
            // Show the analysis in the view
            await analysisViewProvider.showAnalysis(fileName, code);
        }
        catch (error) {
            console.error('Error analyzing code:', error);
            let errorMessage = '';
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = `Failed to connect to the API server. Please check that:
        1. The API server is running
        2. The API URL is correct (${apiUrl})
        3. There are no network issues or firewalls blocking the connection`;
            }
            else {
                errorMessage = `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`;
            }
            vscode.window.showErrorMessage(errorMessage);
        }
    }
    /**
     * Shows metrics for the code in the active editor
     * @param analysisViewProvider The analysis view provider
     */
    static async showMetrics(analysisViewProvider) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file to analyze metrics.');
            return;
        }
        // Get selected text or entire document if no selection
        const selection = editor.selection;
        const code = selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
        const fileName = editor.document.fileName;
        // Show what's being analyzed
        console.log('Calculating metrics for:', selection.isEmpty ? 'Entire document' : 'Selected text');
        // Check if API URL is configured
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl');
        if (!apiUrl) {
            vscode.window.showErrorMessage('API URL not configured. Please configure the API URL first.');
            await vscode.commands.executeCommand('sauco-de.configure');
            return;
        }
        try {
            // Show the analysis view
            await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
            await vscode.commands.executeCommand('saucoAnalysisView.focus');
            // Show the metrics in the view
            await analysisViewProvider.showMetrics(fileName, code);
        }
        catch (error) {
            console.error('Error calculating metrics:', error);
            let errorMessage = '';
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = `Failed to connect to the API server. Please check that:
        1. The API server is running
        2. The API URL is correct (${apiUrl})
        3. There are no network issues or firewalls blocking the connection`;
            }
            else {
                errorMessage = `Error calculating metrics: ${error instanceof Error ? error.message : String(error)}`;
            }
            vscode.window.showErrorMessage(errorMessage);
        }
    }
}
exports.CommandsService = CommandsService;
//# sourceMappingURL=CommandsService.js.map