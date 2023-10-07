import { window, workspace, TextDocument, Uri } from 'vscode';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import * as crypto from 'crypto';

const util = {
  /**
   * 获取当前所在工程根目录，有3种使用方法：<br>
   * getProjectPath(uri) uri 表示工程内某个文件的路径<br>
   * getProjectPath(document) document 表示当前被打开的文件document对象<br>
   * getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
   * @param {*} document
   */
  getProjectPath(document: TextDocument | Uri | null) {
    if (!document) {
      document = window.activeTextEditor ? window.activeTextEditor.document : null;
    }
    if (!document) {
      this.showError('当前激活的编辑器不是文件或者没有文件被打开！');
      return '';
    }

    const currentFile = ((document as TextDocument).uri ? (document as TextDocument).uri : (document as Uri)).fsPath;
    let projectPath = null;

    let workspaceFolders = workspace.workspaceFolders?.map((item) => item.uri.path);

    // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
    // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
    if (workspaceFolders?.length === 1) {
      const rootPath = workspaceFolders[0];
      var files = readdirSync(rootPath);
      workspaceFolders = files.filter((name) => !/^\./g.test(name)).map((name) => resolve(rootPath, name));
      // vscode.workspace.rootPath会不准确，且已过时
      // return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
    }
    workspaceFolders?.forEach((folder) => {
      if (currentFile.indexOf(folder) === 0) {
        projectPath = folder;
      }
    });
    if (!projectPath) {
      this.showError('获取工程根路径异常！');
      return '';
    }
    return projectPath;
  },
  /**
   * 弹出错误信息
   */
  showError(info: string) {
    window.showErrorMessage(info);
  },
  base64img(path: string, type: string) {
    const data = readFileSync(resolve(path));
    const img64 = Buffer.from(data).toString('base64');
    return `data:${type};base64,${img64}`;
  },
  getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },
  getChatGlmJwtToken(payload: ChatGlmPayload, secret: string) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const header = { alg: 'HS256', sign_type: 'SIGN' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const message = encodedHeader + '.' + encodedPayload;
    // 使用HMAC-SHA256算法进行签名
    const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },
};

interface ChatGlmPayload {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  api_key: string;
  exp: number;
  timestamp: number;
}
export default util;
