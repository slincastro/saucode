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
exports.SaucoItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Represents an item in the Sauco tree view
 */
class SaucoItem extends vscode.TreeItem {
    label;
    tooltip;
    collapsibleState;
    command;
    /**
     * Creates a new Sauco item
     * @param label The label of the item
     * @param tooltip The tooltip of the item
     * @param collapsibleState The collapsible state of the item
     * @param command The command to execute when the item is clicked
     */
    constructor(label, tooltip, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.tooltip = tooltip;
        this.collapsibleState = collapsibleState;
        this.command = command;
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
exports.SaucoItem = SaucoItem;
//# sourceMappingURL=SaucoItem.js.map