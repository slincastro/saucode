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
exports.SaucoTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const SaucoItem_1 = require("./SaucoItem");
/**
 * Tree data provider for the Sauco view in the activity bar
 */
class SaucoTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    /**
     * Refreshes the tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    /**
     * Gets the tree item for the given element
     * @param element The element to get the tree item for
     * @returns The tree item
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Gets the children of the given element
     * @param element The element to get the children for
     * @returns A promise that resolves to the children
     */
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        else {
            return Promise.resolve([
                new SaucoItem_1.SaucoItem('Documentation', 'View Sauco documentation', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.helloWorld', // For now, using helloWorld command
                    title: 'Open Documentation'
                }),
                new SaucoItem_1.SaucoItem('Analyze Code', 'Analyze current code', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.analyzeCode',
                    title: 'Analyze Code'
                }),
                new SaucoItem_1.SaucoItem('Explain Code', 'Get explanation of current code', vscode.TreeItemCollapsibleState.None, {
                    command: 'sauco-de.explainCode',
                    title: 'Explain Code'
                })
            ]);
        }
    }
}
exports.SaucoTreeDataProvider = SaucoTreeDataProvider;
//# sourceMappingURL=SaucoTreeDataProvider.js.map