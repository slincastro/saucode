import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents an item in the Sauco tree view
 */
export class SaucoItem extends vscode.TreeItem {
  /**
   * Creates a new Sauco item
   * @param label The label of the item
   * @param tooltip The tooltip of the item
   * @param collapsibleState The collapsible state of the item
   * @param command The command to execute when the item is clicked
   */
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.command = command;
  }

  /**
   * Gets the icon path for the item
   */
  iconPath = {
    light: vscode.Uri.file(path.join(__filename, '..', '..', '..', '..', 'images', 'icon.svg')),
    dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', '..', 'images', 'icon.svg'))
  };

  /**
   * Gets the context value for the item
   */
  contextValue = 'saucoItem';
}
