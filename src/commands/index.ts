import { window, ViewColumn, ExtensionContext, commands, ThemeColor, workspace } from 'vscode';
import { bookDataProvider, chapterDataProvider } from '../explorer/treeDataProvider';
import { Notification, showWarningMessage, showErrorMessage } from '../utils/notification';
import { BookTreeNode, ChapterTreeNode } from '../explorer/TreeNode';
import { bookNodeManager, chapterNodeManager } from '../explorer/explorerNodeManager';
import { writterDriver } from '../writter';
import { Commands } from '../config';
import WebViewTool, { WebviewMessage, getWebViewContent } from '../utils/webview';
import { IBookDetail } from '../@types';
import utils from '../utils';
import ChatGlm from '../utils/chatglm';

export const localRefresh = async () => {
  const notification = new Notification('刷新小说目录');
  try {
    const treeNode: BookTreeNode[] = await bookNodeManager.getAllBooks();
    bookDataProvider.fire();
    bookNodeManager.bookNodes = treeNode;
  } catch (error) {
    console.error(error);
  } finally {
    notification.stop();
  }
};

export const importBook = async () => {
  const msg = await window.showInputBox({
    password: false,
    ignoreFocusOut: false,
    placeHolder: '请输入小说的名字',
    prompt: '',
  });
  if (msg) {
    const pathDir = await window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (pathDir) {
      const newNode = new BookTreeNode(decodeURIComponent(pathDir[0].toString().replace('file://', '')), msg);
      writterDriver.saveTreeNode(bookNodeManager.appendTreeNode(newNode));
      bookDataProvider.fire();
    }
  }
};

export const openBook = async (bookNode: BookTreeNode) => {
  commands.executeCommand(Commands.openDetail, bookNode);
  commands.executeCommand(Commands.chapterRefresh, bookNode);
};

export const deleteBook = (bookNode: BookTreeNode) => {
  writterDriver.deleteBook(bookNode.path);
  commands.executeCommand(Commands.localRefresh);
};

export const openDetail = (context: ExtensionContext) => {
  return async (bookNode: BookTreeNode) => {
    const panel = window.createWebviewPanel(
      'bookWebview', // viewType
      '书籍详情', // 视图标题
      ViewColumn.One, // 显示在编辑器的哪个部位
      {
        enableScripts: true, // 启用JS，默认禁用
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      },
    );
    const webviewTool = new WebViewTool(panel);
    webviewTool.listener = {
      init() {
        webviewTool.postMessage({
          method: 'initData',
          data: { path: bookNode.path, detail: bookNode.detail },
        });
      },
      save(data: Partial<IBookDetail>) {
        const param: IBookDetail = JSON.parse(JSON.stringify(bookNode.detail));
        param.name = data.name as string;
        param.author = data.author as string;
        param.codeNum = data.codeNum as number;
        param.introduction = data.introduction as string;
        param.assorts = data.assorts as string[];
        bookNode.detail = param;
        commands.executeCommand(Commands.localRefresh);
      },
      saveImg({ path, type }: { path?: string; type?: string }) {
        if (path && type) {
          const param: IBookDetail = JSON.parse(JSON.stringify(bookNode.detail));
          param.imgPath = utils.base64img(path, type);
          bookNode.detail = param;
        }
      },
    };
    const webview = webviewTool.webview;
    webview.html = getWebViewContent(context, 'src/web/bookDetail/bookDetail.html', panel);
    webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        if (message.method in webviewTool.listener) {
          webviewTool.listener[message.method](message.data);
        } else {
          window.showInformationMessage('未知命令');
        }
      },
      undefined,
      context.subscriptions,
    );
  };
};

export const chapterRefresh = async (book?: BookTreeNode) => {
  if (book && book instanceof BookTreeNode) {
    chapterNodeManager.book = book;
  }
  const notification = new Notification('刷新文章目录');
  try {
    const treeNode: ChapterTreeNode[] = await chapterNodeManager.getAllChapters();
    chapterDataProvider.fire();
    chapterNodeManager.chapterNodes = treeNode;
  } catch (error) {
    console.error(error);
  } finally {
    notification.stop();
  }
};

export const editChapter = (context: ExtensionContext) => {
  return async (chapterNode: ChapterTreeNode) => {
    const panel = window.createWebviewPanel(
      'editWebview', // viewType
      '编辑器', // 视图标题
      ViewColumn.One, // 显示在编辑器的哪个部位
      {
        enableScripts: true, // 启用JS，默认禁用
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      },
    );
    const webviewTool = new WebViewTool(panel);
    webviewTool.listener = {
      init() {
        webviewTool.postMessage({
          method: 'initData',
          data: { title: chapterNode.name, file: chapterNode.file, chatGlm: new ChatGlm() },
        });
      },
      msg(str: string) {
        window.showInformationMessage(str);
      },
      save(file: string) {
        chapterNode.file = file;
        console.log('save');
      },
      saveTitle(title: string) {
        chapterNode.rename(`${chapterNode.detail.name} ${title}.txt`);
        commands.executeCommand(Commands.chapterRefresh, chapterNode.book);
      },
    };
    const webview = webviewTool.webview;
    webview.html = getWebViewContent(context, 'src/web/chapterEditor/chapterEditor.html', panel);
    webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        if (message.method in webviewTool.listener) {
          webviewTool.listener[message.method](message.data);
        } else {
          window.showInformationMessage('未知命令');
        }
      },
      undefined,
      context.subscriptions,
    );
  };
};

export const createChapter = async () => {
  if (!chapterNodeManager.book) {
    return;
  }
  const num = await window.showInputBox({
    password: false,
    ignoreFocusOut: false,
    placeHolder: '请输入章节序号（如：第一章请输入“一”）',
    prompt: '',
  });
  if (num) {
    const title = await window.showInputBox({
      password: false,
      ignoreFocusOut: false,
      placeHolder: '请输入章节名称',
      prompt: '',
    });
    if (title) {
      const titleList = chapterNodeManager.chapterNodes.map((item) => item.name);
      const titleStr = `${chapterNodeManager.book.name} 第${num}章 ${title}.txt`;
      if (titleList.includes(titleStr)) {
        showWarningMessage('名称重复');
      } else {
        chapterNodeManager.appendTreeNode(new ChapterTreeNode(titleStr, chapterNodeManager.book));
        chapterDataProvider.fire();
      }
    }
  }
};

export const deleteChapter = async (chapterNode: ChapterTreeNode) => {
  try {
    chapterNode.delete();
    commands.executeCommand(Commands.chapterRefresh);
  } catch (error) {
    console.error(error);
    showErrorMessage('删除失败');
  }
};
