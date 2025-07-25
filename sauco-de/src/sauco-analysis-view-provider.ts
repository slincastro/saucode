import * as vscode from 'vscode';

export class SaucoAnalysisViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _extensionUri: vscode.Uri;

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
				h1 {
					font-size: 1.5em;
					margin-bottom: 15px;
					color: var(--vscode-editor-foreground);
					border-bottom: 1px solid var(--vscode-panel-border);
					padding-bottom: 10px;
				}
				h2 {
					font-size: 1.2em;
					margin-top: 20px;
					margin-bottom: 10px;
					color: var(--vscode-editor-foreground);
				}
				pre {
					background-color: var(--vscode-editor-background);
					padding: 10px;
					border-radius: 5px;
					overflow: auto;
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				code {
					font-family: var(--vscode-editor-font-family);
					font-size: var(--vscode-editor-font-size);
				}
				ul, ol {
					padding-left: 20px;
				}
				li {
					margin-bottom: 5px;
				}
			</style>
		</head>
		<body>
			<h1>${title}</h1>
			<div id="analysis-content">
				${this._formatAnalysisContent(analysisResult)}
			</div>
		</body>
		</html>`;
	}

	private _formatAnalysisContent(content: string): string {
		// Convert markdown-style headers to HTML
		let formattedContent = content
			.replace(/^# (.*$)/gm, '<h1>$1</h1>')
			.replace(/^## (.*$)/gm, '<h2>$1</h2>')
			.replace(/^### (.*$)/gm, '<h3>$1</h3>')
			.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
			.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
			.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
		
		// Convert markdown-style code blocks to HTML
		formattedContent = formattedContent.replace(/```(?:.*?)\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');
		
		// Convert markdown-style inline code to HTML
		formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
		
		// Convert markdown-style lists to HTML
		formattedContent = formattedContent.replace(/^\d+\. (.*$)/gm, '<li>$1</li>').replace(/^- (.*$)/gm, '<li>$1</li>');
		
		// Convert line breaks to HTML
		formattedContent = formattedContent.replace(/\n\n/g, '<br><br>');
		
		return formattedContent;
	}
}