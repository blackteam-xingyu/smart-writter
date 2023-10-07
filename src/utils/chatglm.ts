import { workspace } from 'vscode';
import utils from './index';

export default class ChatGlm {
  constructor() {
    const apiKeyStr = workspace.getConfiguration('smart-writter').get<string>('chatglm.key');
    const url = workspace.getConfiguration('smart-writter').get<string>('chatglm.url');
    const version = workspace.getConfiguration('smart-writter').get<string>('chatglm.version');
    if (apiKeyStr && url && version) {
      const apiKeyArray = apiKeyStr.split('.');
      if (apiKeyArray.length === 2) {
        const [id, secret] = apiKeyArray;
        this.url = `${url}/${version}/invoke`;
        const timestamp = new Date().valueOf();
        const exp = timestamp + 10 * 24 * 60 * 60 * 1000;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.apiKey = utils.getChatGlmJwtToken({ api_key: id, exp, timestamp }, secret);
      } else {
        this.apiKey = '';
        this.url = '';
        console.warn('生成chatglm失败');
      }
    } else {
      this.apiKey = '';
      this.url = '';
      console.warn('生成chatglm失败');
    }
  }
  public url: string;
  public apiKey: string;
}
