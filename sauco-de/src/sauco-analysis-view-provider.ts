import * as vscode from 'vscode';
// Import marked using a workaround for ESM/CommonJS compatibility
let marked: any;
try {
    // Try to import as ESM
    import('marked').then(m => {
        marked = m.marked || m.defaults || m;
    }).catch(e => {
        console.error('Error importing marked as ESM:', e);
    });
} catch (error) {
    console.error('Error setting up marked import:', error);
}

export class SaucoAnalysisViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _extensionUri: vscode.Uri;
	private _metricsContent: string = '';

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
	}

	public updateContent(analysisResult: string, fileName: string) {
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview(analysisResult, fileName);
			this._view.show(true);
		}
	}

	public updateMetricsContent(metricsTable: string, fileName: string) {
		this._metricsContent = metricsTable;
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview('', fileName);
			this._view.show(true);
		}
	}

	private _getHtmlForWebview(analysisResult: string, fileName: string) {
		const title = fileName ? `Code Analysis for ${fileName}` : 'Code Analysis';

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
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
			</style>
		</head>
		<body>
			<h1>${title}</h1>
			${this._metricsContent ? `
			<div id="metrics-content">
				<h2>Code Metrics</h2>
				${this._metricsContent}
			</div>
			` : ''}
			${analysisResult ? `
			<div id="analysis-content">
				${this._formatAnalysisContent(analysisResult)}
			</div>
			` : ''}
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
