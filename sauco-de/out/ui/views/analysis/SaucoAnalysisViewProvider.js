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
exports.SaucoAnalysisViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const ApiService_1 = require("../../../services/api/ApiService");
const MetricsService_1 = require("../../../services/metrics/MetricsService");
const ViewUtils_1 = require("../../../utils/ViewUtils");
/**
 * Provides the webview content for the analysis view
 */
class SaucoAnalysisViewProvider {
    _extensionUri;
    static viewType = 'saucoAnalysisView';
    _view;
    _currentFileName = '';
    _currentImprovement;
    /**
     * Creates a new analysis view provider
     * @param extensionUri The URI of the extension
     */
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    /**
     * Resolves the webview view
     * @param webviewView The webview view to resolve
     * @param context The webview view context
     * @param token The cancellation token
     */
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'applyCode':
                    await this._applyImprovedCode();
                    break;
                case 'closeImprovedCode':
                    this._clearContent();
                    break;
            }
        });
    }
    /**
     * Shows the metrics for a file
     * @param fileName The name of the file
     * @param fileContent The content of the file
     */
    async showMetrics(fileName, fileContent) {
        if (!this._view) {
            return;
        }
        this._currentFileName = fileName;
        this._currentImprovement = undefined;
        try {
            const metrics = await MetricsService_1.MetricsService.calculateMetrics(fileContent);
            const metricsHtml = ViewUtils_1.ViewUtils.formatMetricsAsHtml(metrics);
            this._view.webview.postMessage({
                type: 'updateMetricsContent',
                fileName: fileName,
                metricsHtml: metricsHtml
            });
        }
        catch (error) {
            console.error('Error calculating metrics:', error);
            vscode.window.showErrorMessage(`Error calculating metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Shows the analysis for a file
     * @param fileName The name of the file
     * @param fileContent The content of the file
     */
    async showAnalysis(fileName, fileContent) {
        if (!this._view) {
            return;
        }
        this._currentFileName = fileName;
        this._currentImprovement = undefined;
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Analyzing ${fileName}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                const improvement = await ApiService_1.ApiService.getCodeImprovement(fileContent);
                this._currentImprovement = improvement;
                progress.report({ increment: 100 });
                const content = ViewUtils_1.ViewUtils.formatImprovedCodeAsHtml(improvement.improvedCode);
                const metricsHtml = ViewUtils_1.ViewUtils.formatMetricsComparisonAsHtml(improvement.originalMetrics, improvement.improvedMetrics);
                const buttonsHtml = this._getButtonsHtml();
                this._view?.webview.postMessage({
                    type: 'updateContent',
                    fileName: fileName,
                    content: content,
                    metricsHtml: metricsHtml,
                    buttonsHtml: buttonsHtml
                });
            });
        }
        catch (error) {
            console.error('Error analyzing code:', error);
            vscode.window.showErrorMessage(`Error analyzing code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clears the content of the webview
     */
    _clearContent() {
        if (!this._view) {
            return;
        }
        this._currentImprovement = undefined;
        this._currentFileName = '';
        this._view.webview.postMessage({
            type: 'updateContent',
            fileName: '',
            content: '<p>Select a file to analyze.</p>',
            metricsHtml: '',
            buttonsHtml: ''
        });
    }
    /**
     * Applies the improved code to the file
     */
    async _applyImprovedCode() {
        if (!this._currentImprovement || !this._currentFileName) {
            return;
        }
        try {
            const document = await vscode.workspace.openTextDocument(this._currentFileName);
            const edit = new vscode.WorkspaceEdit();
            // Replace the entire content of the file
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            edit.replace(document.uri, fullRange, this._currentImprovement.improvedCode);
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                vscode.window.showInformationMessage(`Successfully applied improvements to ${this._currentFileName}`);
                this._clearContent();
            }
            else {
                vscode.window.showErrorMessage(`Failed to apply improvements to ${this._currentFileName}`);
            }
        }
        catch (error) {
            console.error('Error applying improved code:', error);
            vscode.window.showErrorMessage(`Error applying improved code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Gets the HTML for the buttons
     * @returns The HTML for the buttons
     */
    _getButtonsHtml() {
        return `
      <div class="action-buttons">
        <button class="apply-button">Apply Improvements</button>
        <button class="close-button">Close</button>
      </div>
    `;
    }
    /**
     * Gets the HTML for the webview
     * @param webview The webview
     * @returns The HTML
     */
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'analysis', 'main.js'));
        // Get the local path to css styles
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'analysis', 'styles.css'));
        // Use a nonce to only allow specific scripts to be run
        const nonce = this._getNonce();
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>Sauco Analysis</title>
      </head>
      <body>
        <div class="container">
          <h1 id="file-name">Select a file to analyze</h1>
          <div id="content" class="content">
            <p>Select a file to analyze.</p>
          </div>
          <div id="metrics" class="metrics"></div>
          <div id="buttons"></div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
    }
    /**
     * Generates a nonce
     * @returns The nonce
     */
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.SaucoAnalysisViewProvider = SaucoAnalysisViewProvider;
//# sourceMappingURL=SaucoAnalysisViewProvider.js.map