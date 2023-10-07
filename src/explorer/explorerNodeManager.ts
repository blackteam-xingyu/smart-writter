import { Disposable } from 'vscode';
import { BookTreeNode, ChapterTreeNode } from './TreeNode';
import { writterDriver } from '../writter';
import * as fs from 'fs';

class BookNodeManager implements Disposable {
  public bookNodes: BookTreeNode[] = [];

  public setTreeNode(treeNode: BookTreeNode[]): BookTreeNode[] {
    this.bookNodes = treeNode;
    return this.bookNodes;
  }
  public appendTreeNode(treeNode: BookTreeNode): BookTreeNode[] {
    this.bookNodes.push(treeNode);
    return this.bookNodes;
  }
  public getAllBooks(): Promise<BookTreeNode[]> {
    return new Promise((resolve) => {
      writterDriver.getAllBooks().then((bookNodes: BookTreeNode[]) => {
        this.bookNodes = bookNodes;
        resolve(this.bookNodes);
      });
    });
  }
  public dispose(): void {
    this.bookNodes = [];
  }
  public getBookChildren(): BookTreeNode[] {
    return this.bookNodes;
  }
}

export const bookNodeManager: BookNodeManager = new BookNodeManager();

class ChapterNodeManager implements Disposable {
  public book?: BookTreeNode;
  public chapterNodes: ChapterTreeNode[] = [];
  public getChapterChildren(): ChapterTreeNode[] {
    return this.chapterNodes;
  }
  public setTreeNode(treeNode: ChapterTreeNode[]): ChapterTreeNode[] {
    this.chapterNodes = treeNode;
    return this.chapterNodes;
  }
  public appendTreeNode(treeNode: ChapterTreeNode): ChapterTreeNode[] {
    this.chapterNodes.push(treeNode);
    fs.writeFileSync(treeNode.name, '', 'utf-8');
    return this.chapterNodes;
  }
  public setBookTreeNode(book: BookTreeNode) {
    this.book = book;
    this.getAllChapters();
  }
  public getAllChapters(): Promise<ChapterTreeNode[]> {
    return new Promise((resolve) => {
      if (!this.book) {
        return;
      }
      writterDriver.getChaptersFromBook(this.book).then((chapterNodes: ChapterTreeNode[]) => {
        this.chapterNodes = chapterNodes;
        resolve(this.chapterNodes);
      });
    });
  }
  public dispose(): void {
    this.chapterNodes = [];
  }
}

export const chapterNodeManager: ChapterNodeManager = new ChapterNodeManager();
