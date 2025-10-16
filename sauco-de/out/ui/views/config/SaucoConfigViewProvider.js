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
exports.SaucoConfigViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const ApiService_1 = require("../../../services/api/ApiService");
/**
 * Provides the webview content for the configuration view
 */
class SaucoConfigViewProvider {
    _extensionUri;
    static viewType = 'saucoConfigView';
    _view;
    /**
     * Creates a new configuration view provider
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
                case 'saveConfig':
                    await this._saveConfig(data.apiUrl);
                    break;
                case 'testConnection':
                    await this._testConnection(data.apiUrl);
                    break;
            }
        });
        // Load current configuration
        this._loadConfig();
    }
    /**
     * Loads the current configuration
     */
    _loadConfig() {
        if (!this._view) {
            return;
        }
        const config = vscode.workspace.getConfiguration('sauco-de');
        const apiUrl = config.get('apiUrl') || '';
        this._view.webview.postMessage({
            type: 'loadConfig',
            apiUrl: apiUrl
        });
    }
    /**
     * Saves the configuration
     * @param apiUrl The API URL
     */
    async _saveConfig(apiUrl) {
        if (!this._view) {
            return;
        }
        try {
            const config = vscode.workspace.getConfiguration('sauco-de');
            await config.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
            this._view.webview.postMessage({
                type: 'saveResult',
                success: true,
                message: 'Configuration saved successfully.'
            });
        }
        catch (error) {
            console.error('Error saving configuration:', error);
            this._view.webview.postMessage({
                type: 'saveResult',
                success: false,
                message: `Error saving configuration: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    /**
     * Tests the connection to the API
     * @param apiUrl The API URL
     */
    async _testConnection(apiUrl) {
        if (!this._view) {
            return;
        }
        try {
            const result = await ApiService_1.ApiService.testConnection(apiUrl);
            this._view.webview.postMessage({
                type: 'testResult',
                success: true,
                message: `Successfully connected to ${result.api} v${result.version}`
            });
        }
        catch (error) {
            console.error('Error testing connection:', error);
            this._view.webview.postMessage({
                type: 'testResult',
                success: false,
                message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    /**
     * Gets the HTML for the webview
     * @param webview The webview
     * @returns The HTML
     */
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'config', 'main.js'));
        // Get the local path to css styles
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'views', 'config', 'styles.css'));
        // Use a nonce to only allow specific scripts to be run
        const nonce = this._getNonce();
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>Sauco Configuration</title>
      </head>
      <body>
        <div class="container">
          <h1>Sauco Configuration</h1>
          <div class="form-group">
            <label for="apiUrl">API URL:</label>
            <input type="text" id="apiUrl" placeholder="http://localhost:8000">
          </div>
          <div class="button-group">
            <button id="saveButton">Save</button>
            <button id="testButton">Test Connection</button>
          </div>
          <div id="status" class="status" style="display: none;"></div>
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
exports.SaucoConfigViewProvider = SaucoConfigViewProvider;
//# sourceMappingURL=SaucoConfigViewProvider.js.map