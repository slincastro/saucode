import * as vscode from 'vscode';

export interface MetricResult {
  label: string;
  value: number;
  lineNumber?: number;
  duplicatedBlocks?: { startLine: number, endLine: number, blockId?: string }[];
  loopBlocks?: { startLine: number, endLine: number, loopType: string }[];
  methodBlocks?: { startLine: number, endLine: number, size: number, name?: string }[];
  constructorBlocks?: { startLine: number, endLine: number, name?: string }[];
}

export interface MetricAction {
  method: string;
}

export interface Metric {
  name: string;
  description: string;
  hasAction?: boolean;
  action?: MetricAction;
  extract(document: vscode.TextDocument): MetricResult;
}
