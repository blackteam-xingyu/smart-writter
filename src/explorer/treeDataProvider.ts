import * as vscode from 'vscode';
import { BookTreeNode, ChapterTreeNode } from './TreeNode';
import { bookNodeManager, chapterNodeManager } from './explorerNodeManager';

class BookDataProvider implements vscode.TreeDataProvider<BookTreeNode>, vscode.Disposable {
  private onDidChangeTreeDataEvent: vscode.EventEmitter<BookTreeNode | undefined | null | void> =
    new vscode.EventEmitter<BookTreeNode | undefined | null | void>();
  public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;
  public initialize(): void {
    // ...
  }
  public dispose() {
    this.fire();
  }
  fire(): void {
    this.onDidChangeTreeDataEvent.fire();
  }
  public getTreeItem(element: BookTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    // 这里要返回最终显示的
    return {
      label: element.name,
      tooltip: element.name,
      iconPath: vscode.ThemeIcon.Folder,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      command: element.previewCommand,
      // contextValue
    };
  }
  public async getChildren(element?: BookTreeNode | undefined): Promise<BookTreeNode[]> {
    if (!element) {
      return bookNodeManager.getBookChildren();
    } else {
      return [];
    }
  }
}
export const bookDataProvider: BookDataProvider = new BookDataProvider();

class ChapterDataProvider implements vscode.TreeDataProvider<ChapterTreeNode>, vscode.Disposable {
  private onDidChangeTreeDataEvent: vscode.EventEmitter<ChapterTreeNode | undefined | null | void> =
    new vscode.EventEmitter<ChapterTreeNode | undefined | null | void>();
  public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;
  public initialize(): void {
    // ...
  }
  public dispose() {
    this.fire();
  }
  fire(): void {
    this.onDidChangeTreeDataEvent.fire();
  }
  public getTreeItem(element: ChapterTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    // 这里要返回最终显示的
    return {
      label: element.name.replace('.txt', ''),
      tooltip: element.name,
      iconPath: vscode.ThemeIcon.File,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      command: element.previewCommand,
      // contextValue
    };
  }
  public async getChildren(element?: ChapterTreeNode | undefined): Promise<ChapterTreeNode[]> {
    if (!element) {
      return chapterNodeManager.getChapterChildren();
    } else {
      return [];
    }
  }
}
export const chapterDataProvider: ChapterDataProvider = new ChapterDataProvider();
