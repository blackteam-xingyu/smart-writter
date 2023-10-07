import * as path from 'path';
import * as fs from 'fs';
import { Uri, ExtensionContext, WebviewPanel } from 'vscode';

export const getWebViewContent = (context: ExtensionContext, templatePath: string, panel: WebviewPanel) => {
  const resourcePath = path.join(context.extensionPath, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, 'utf-8');
  // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  html = html.replace(/(<link.+?href="|<script.+?src=")(.+?)"/g, (m, $1, $2) => {
    return $1 + panel.webview.asWebviewUri(Uri.file(path.resolve(dirPath, $2))) + '"';
  });
  return html;
};

export const callWebView = (panel: WebviewPanel, message: WebviewMessage) => {
  panel.webview.postMessage(message);
};

export const bookWebviewListener = () => {
  return {};
};
export default class WebViewTool {
  constructor(public panel: WebviewPanel) {}
  public postMessage(message: WebviewMessage) {
    this.panel.webview.postMessage(message);
  }
  public get webview() {
    return this.panel.webview;
  }
  public listener: any = {};
}
export interface WebviewMessage {
  method: string;
  data?: any;
}
