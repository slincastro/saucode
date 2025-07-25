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
const path = __importStar(require("path"));
const sauco_config_view_provider_1 = require("./sauco-config-view-provider");
const sauco_analysis_view_provider_1 = require("./sauco-analysis-view-provider");
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
            return Promise.resolve([
                new SaucoItem('Documentation', 'View Sauco documentation', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.helloWorld', // For now, using helloWorld command
                    title: 'Open Documentation'
                }),
                new SaucoItem('Analyze Code', 'Analyze current code', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.analyzeCode',
                    title: 'Analyze Code'
                }),
                new SaucoItem('Explain Code', 'Get explanation of current code', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.explainCode',
                    title: 'Explain Code'
                })
            ]);
        }
    }
}
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
function activate(context) {
    console.log('Congratulations, your extension "sauco-de" is now active!');
    const saucoTreeDataProvider = new SaucoTreeDataProvider();
    vscode.window.registerTreeDataProvider('saucoView', saucoTreeDataProvider);
    const saucoConfigViewProvider = new sauco_config_view_provider_1.SaucoConfigViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('saucoConfigView', saucoConfigViewProvider));
    const saucoAnalysisViewProvider = new sauco_analysis_view_provider_1.SaucoAnalysisViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('saucoAnalysisView', saucoAnalysisViewProvider));
    global.saucoAnalysisViewProvider = saucoAnalysisViewProvider;
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
        const currentUrl = config.get('apiUrl');
        if (currentUrl) {
            configStatusBarItem.tooltip = `Sauco API URL: ${currentUrl}`;
        }
        else {
            configStatusBarItem.tooltip = "Configure Sauco API URL";
        }
    }
    updateStatusBar();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('sauco-de.apiUrl')) {
            updateStatusBar();
        }
    }));
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
        const apiUrl = config.get('apiUrl');
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
                const result = await response.json();
                await createSideBySideComparison(editor.document.getText(), result.Analisis, result.code);
            }
            catch (error) {
                console.error('Error analyzing code:', error);
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
    const explainCodeDisposable = vscode.commands.registerCommand('sauco-de.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file to explain.');
            return;
        }
        const code = editor.document.getText();
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl');
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
                const result = await response.json();
                // Display the explanation in the analysis view
                global.saucoAnalysisViewProvider.updateContent(result.explanation, vscode.window.activeTextEditor?.document.fileName ? path.basename(vscode.window.activeTextEditor.document.fileName) : 'code');
                await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
                await vscode.commands.executeCommand('saucoAnalysisView.focus');
                vscode.window.showInformationMessage('Code explanation complete! The explanation is displayed in the activity window.');
            }
            catch (error) {
                console.error('Error explaining code:', error);
                let errorMessage = '';
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    errorMessage = `Failed to connect to the API server. Please check that:
					1. The API server is running
					2. The API URL is correct (${config.get('apiUrl')})
					3. There are no network issues or firewalls blocking the connection`;
                }
                else {
                    errorMessage = `Error explaining code: ${error instanceof Error ? error.message : String(error)}`;
                }
                vscode.window.showErrorMessage(errorMessage);
            }
            return Promise.resolve();
        });
    });
    context.subscriptions.push(helloWorldDisposable, configureDisposable, analyzeCodeDisposable, explainCodeDisposable, configStatusBarItem, analyzeStatusBarItem, explainStatusBarItem);
}
/**
 * Creates a side-by-side comparison view with the original code, analysis result, and improved code
 * @param originalCode The original code from the editor
 * @param analysisResult The analysis result from the API
 * @param improvedCode The improved code from the API
 */
async function createSideBySideComparison(originalCode, analysisResult, improvedCode) {
    try {
        const activeFileName = vscode.window.activeTextEditor?.document.fileName || 'code';
        const fileName = path.basename(activeFileName);
        const improvedCodeDocument = await vscode.workspace.openTextDocument({
            content: improvedCode,
            language: vscode.window.activeTextEditor?.document.languageId || 'plaintext' // Use the same language as the original file
        });
        const activeColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
        await vscode.window.showTextDocument(vscode.window.activeTextEditor.document, { viewColumn: activeColumn, preview: false });
        await vscode.window.showTextDocument(improvedCodeDocument, {
            viewColumn: vscode.ViewColumn.Beside,
            preview: false,
            preserveFocus: false
        });
        global.saucoAnalysisViewProvider.updateContent(analysisResult, fileName);
        await vscode.commands.executeCommand('workbench.view.extension.sauco-explorer');
        await vscode.commands.executeCommand('saucoAnalysisView.focus');
        vscode.window.showInformationMessage('Code analysis complete! The improved code is displayed in the side panel and the analysis is in the activity window.');
    }
    catch (error) {
        console.error('Error creating side-by-side comparison:', error);
        vscode.window.showErrorMessage(`Error creating side-by-side comparison: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map