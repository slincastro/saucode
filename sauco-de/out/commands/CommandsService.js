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
const ApiService_1 = require("../services/api/ApiService");
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
        // Apply code command
        const applyCodeDisposable = vscode.commands.registerCommand('sauco-de.applyCode', async () => {
            await this.applyImprovedCode(analysisViewProvider);
        });
        // Add all commands to subscriptions
        context.subscriptions.push(configureDisposable, analyzeCodeDisposable, showMetricsDisposable, applyCodeDisposable);
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
        // Store the document reference for the analyze command
        // This ensures lastAnalyzedDocument is only updated when analyze is executed
        global.lastAnalyzedDocument = editor.document;
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
            // Get the global provider
            const globalAnalysisViewProvider = global.saucoAnalysisViewProvider;
            // Show the analysis in the view
            await analysisViewProvider.showAnalysis(fileName, code);
            // Get the improvement directly from the API
            try {
                const improvement = await ApiService_1.ApiService.getCodeImprovement(code);
                console.log('Got improvement directly from API:', improvement);
                // Set the improvement on both providers to ensure it's available
                if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
                    globalAnalysisViewProvider.setCurrentImprovement(improvement);
                }
                if (analysisViewProvider.setCurrentImprovement) {
                    analysisViewProvider.setCurrentImprovement(improvement);
                }
            }
            catch (innerError) {
                console.error('Error getting improvement directly:', innerError);
            }
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
    /**
     * Applies the improved code to the current file
     * @param analysisViewProvider The analysis view provider
     */
    static async applyImprovedCode(analysisViewProvider) {
        try {
            // Use the global variable instead of the passed parameter
            const globalAnalysisViewProvider = global.saucoAnalysisViewProvider;
            const lastAnalyzedDocument = global.lastAnalyzedDocument;
            // Enhanced debugging
            console.log('Global analysis provider exists:', !!globalAnalysisViewProvider);
            console.log('Passed analysis provider exists:', !!analysisViewProvider);
            console.log('Last analyzed document exists:', !!lastAnalyzedDocument);
            // Compare the two providers
            console.log('Are providers the same object?', globalAnalysisViewProvider === analysisViewProvider);
            // Log all properties of the global provider
            console.log('Global provider properties:', Object.keys(globalAnalysisViewProvider));
            // Log the current state for debugging
            console.log('Current improvement (global):', globalAnalysisViewProvider._currentImprovement);
            console.log('Current file name (global):', globalAnalysisViewProvider._currentFileName);
            console.log('Current improvement (passed):', analysisViewProvider._currentImprovement);
            console.log('Current file name (passed):', analysisViewProvider._currentFileName);
            // Try both providers
            const provider = globalAnalysisViewProvider || analysisViewProvider;
            // If we don't have an improvement, try to get it from the last analyzed document or active editor
            if (!provider._currentImprovement) {
                // First try to use the last analyzed document
                if (lastAnalyzedDocument) {
                    try {
                        const code = lastAnalyzedDocument.getText();
                        const fileName = lastAnalyzedDocument.fileName;
                        console.log('Trying to get improvement for last analyzed file:', fileName);
                        // Get the improvement directly from the API
                        const improvement = await ApiService_1.ApiService.getCodeImprovement(code);
                        console.log('Got improvement directly from API for last analyzed document:', improvement);
                        // Set the improvement on both providers
                        if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
                            globalAnalysisViewProvider.setCurrentImprovement(improvement);
                            globalAnalysisViewProvider._currentFileName = fileName;
                        }
                        if (analysisViewProvider.setCurrentImprovement) {
                            analysisViewProvider.setCurrentImprovement(improvement);
                            analysisViewProvider._currentFileName = fileName;
                        }
                        // Update the provider reference
                        provider._currentImprovement = improvement;
                        provider._currentFileName = fileName;
                    }
                    catch (innerError) {
                        console.error('Error getting improvement for last analyzed file:', innerError);
                        // Fall back to active editor if last analyzed document fails
                        await this._tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider);
                    }
                }
                else {
                    // Fall back to active editor if no last analyzed document
                    await this._tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider);
                }
            }
            if (!provider._currentFileName) {
                vscode.window.showInformationMessage('No file selected for improvement. Please analyze a file first.');
                return;
            }
            // Try to use both methods to apply the code
            try {
                // First try the global provider
                console.log('Attempting to apply code with global provider...');
                await globalAnalysisViewProvider._applyImprovedCode();
            }
            catch (innerError) {
                console.error('Error with global provider, trying passed provider:', innerError);
                // If that fails, try the passed provider
                await analysisViewProvider._applyImprovedCode();
            }
        }
        catch (error) {
            console.error('Error applying improved code:', error);
            vscode.window.showErrorMessage(`Error applying improved code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Tries to get an improvement from the active editor
     * @param provider The provider to update
     * @param globalAnalysisViewProvider The global analysis view provider
     * @param analysisViewProvider The passed analysis view provider
     * @returns A promise that resolves when the operation is complete
     */
    static async _tryGetImprovementFromActiveEditor(provider, globalAnalysisViewProvider, analysisViewProvider) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                const code = editor.document.getText();
                const fileName = editor.document.fileName;
                console.log('Trying to get improvement for current file:', fileName);
                // Get the improvement directly from the API
                const improvement = await ApiService_1.ApiService.getCodeImprovement(code);
                console.log('Got improvement directly from API:', improvement);
                // Set the improvement on both providers
                if (globalAnalysisViewProvider && globalAnalysisViewProvider.setCurrentImprovement) {
                    globalAnalysisViewProvider.setCurrentImprovement(improvement);
                    globalAnalysisViewProvider._currentFileName = fileName;
                }
                if (analysisViewProvider.setCurrentImprovement) {
                    analysisViewProvider.setCurrentImprovement(improvement);
                    analysisViewProvider._currentFileName = fileName;
                }
                // Update the provider reference
                provider._currentImprovement = improvement;
                provider._currentFileName = fileName;
            }
            catch (innerError) {
                console.error('Error getting improvement for current file:', innerError);
                vscode.window.showInformationMessage('No code improvements available. Please analyze code first.');
                throw innerError; // Re-throw to signal failure
            }
        }
        else {
            vscode.window.showInformationMessage('No code improvements available. Please analyze code first.');
            throw new Error('No active editor available');
        }
    }
}
exports.CommandsService = CommandsService;
//# sourceMappingURL=CommandsService.js.map