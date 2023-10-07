import { Command } from 'vscode';
import { Commands } from '../config';
import { IBookDetail } from '../@types';
import * as fs from 'fs';

export class BookTreeNode {
  constructor(public path: string, name?: string) {
    try {
      console.log('输入的小说名为：', this.name);
      console.log('选择的路径为：', this.path);
      fs.accessSync(`${this.path}/.detail.json`);
    } catch (error) {
      console.warn(error);
      console.warn('搜索详情文件失败，新建一个!');
      fs.appendFileSync(`${this.path}/.detail.json`, JSON.stringify({ name: name ? name : '' }), 'utf-8');
    }
  }
  public get name(): string {
    if (this.detail.name) {
      return this.detail.name;
    } else {
      const pathlist = this.path.split('/');
      const name = pathlist[pathlist.length - 1];
      return name;
    }
  }

  public get previewCommand(): Command {
    return {
      title: this.name,
      command: Commands.openBook,
      arguments: [this],
    };
  }
  public get detail(): IBookDetail {
    const detailStr = fs.readFileSync(`${this.path}/.detail.json`, 'utf-8');
    return JSON.parse(detailStr);
  }
  public set detail(_detail: Partial<IBookDetail>) {
    try {
      fs.writeFileSync(`${this.path}/.detail.json`, JSON.stringify(_detail), 'utf-8');
    } catch (error) {
      console.error(error);
    }
  }
}
export class ChapterTreeNode {
  constructor(public name: string, public readonly book: BookTreeNode) {}
  public get path(): string {
    return `${this.book.path}/${this.name}`;
  }
  public get detail(): IBookDetail {
    const detailStr = fs.readFileSync(`${this.book.path}/.detail.json`, 'utf-8');
    return JSON.parse(detailStr);
  }
  public get file(): string {
    try {
      const fileStr = fs.readFileSync(this.path, 'utf-8');
      return fileStr;
    } catch (error) {
      return '';
    }
  }
  public set file(str: string) {
    try {
      fs.writeFileSync(`${this.path}`, str, 'utf-8');
    } catch (error) {
      console.error(error);
    }
  }
  public rename(newname: string) {
    fs.rename(`${this.book.path}/${this.name}`, `${this.book.path}/${newname}`, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      this.name = newname;
    });
  }
  public get previewCommand(): Command {
    return {
      title: this.name,
      command: Commands.editChapter,
      arguments: [this],
    };
  }
}
