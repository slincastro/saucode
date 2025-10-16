# Sauco Extension for VS Code

A Visual Studio Code extension for Sauco that provides configuration options for API integration, code analysis, and improvement suggestions.

## Features

- Configuration panel to set the Sauco API URL
- Code analysis with metrics visualization
- Code improvement suggestions
- Easy access to Sauco settings through VS Code commands

## Installation

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click on the "..." menu in the top-right of the Extensions view
5. Select "Install from VSIX..." and choose the downloaded file

## Usage

1. Press Ctrl+Shift+P (or Cmd+Shift+P on macOS) to open the command palette
2. Type "Sauco: Configure Settings" and select it
3. Enter your API URL in the configuration panel
4. Click "Save Configuration" to save your settings

npm run compile 

## Extension Settings

This extension contributes the following settings:

* `sauco-de.apiUrl`: The URL for the Sauco API

## Requirements

- Visual Studio Code version 1.102.0 or higher

## Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press F5 to launch the extension in a new VS Code window

## Architecture

This extension follows a layered architecture pattern for better maintainability and scalability. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed information about the project structure and design patterns used.

## License

MIT
