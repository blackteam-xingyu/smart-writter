import * as path from 'path';
import * as fs from 'fs';
import { BookTreeNode, ChapterTreeNode } from '../explorer/TreeNode';
class WritterDriver {
  constructor() {
    this.absPath = path.join(__dirname, '.book.json');
    try {
      fs.accessSync(this.absPath);
    } catch (error) {
      console.warn(error);
      console.warn('搜索配置文件失败，新建一个!');
      fs.appendFileSync(this.absPath, '[]', 'utf-8');
    }
  }
  absPath: string;
  public async getAllBooks(): Promise<BookTreeNode[]> {
    try {
      const bookListStr: string = fs.readFileSync(this.absPath, 'utf-8');
      const bookListPath: string[] = JSON.parse(bookListStr);
      const bookList: BookTreeNode[] = bookListPath.map((item) => {
        return new BookTreeNode(item);
      });
      return bookList;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  public saveTreeNode(bookNodes: BookTreeNode[]) {
    try {
      const pathList = bookNodes.map((item) => item.path);
      fs.writeFileSync(this.absPath, JSON.stringify(pathList), 'utf-8');
    } catch (error) {
      console.error(error);
    }
  }
  public async getChaptersFromBook(book: BookTreeNode): Promise<ChapterTreeNode[]> {
    try {
      const files: string[] = fs.readdirSync(book.path);
      const chapters: string[] = files.filter((item) => item.endsWith('.txt'));
      return chapters.map((item) => new ChapterTreeNode(item, book));
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}

export const writterDriver: WritterDriver = new WritterDriver();
