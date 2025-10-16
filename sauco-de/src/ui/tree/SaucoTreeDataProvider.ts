import * as vscode from 'vscode';
import * as path from 'path';
import { SaucoItem } from './SaucoItem';

/**
 * Tree data provider for the Sauco view in the activity bar
 */
export class SaucoTreeDataProvider implements vscode.TreeDataProvider<SaucoItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SaucoItem | undefined | null | void> = new vscode.EventEmitter<SaucoItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SaucoItem | undefined | null | void> = this._onDidChangeTreeData.event;

  /**
   * Refreshes the tree view
   */
  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Gets the tree item for the given element
   * @param element The element to get the tree item for
   * @returns The tree item
   */
  public getTreeItem(element: SaucoItem): vscode.TreeItem {
    return element;
  }

  /**
   * Gets the children of the given element
   * @param element The element to get the children for
   * @returns A promise that resolves to the children
   */
  public getChildren(element?: SaucoItem): Thenable<SaucoItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve([
        new SaucoItem(
          'Analyze Code',
          'Analyze current code',
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'sauco-de.analyzeCode',
            title: 'Analyze Code'
          }
        ),
        new SaucoItem(
          'Explain Code',
          'Get explanation of current code',
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'sauco-de.explainCode',
            title: 'Explain Code'
          }
        )
      ]);
    }
  }
}
