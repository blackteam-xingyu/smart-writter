const vscode = acquireVsCodeApi();
const isJSON = (str) => {
  if (typeof str === 'string') {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};

const debounce = (func, time = 1000) => {
  let timer = null;
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(func, time);
  };
};

const savefile = debounce(() => {
  vscode.postMessage({ method: 'save', data: tinymce.activeEditor.getContent({ format: 'txt' }) });
}, 5000);

const titleFilter = (title) => {
  const regex1 = /.*第([\u4e00-\u9fa5]|\num)章/;
  const regex2 = /.*第.*章\s(.*)\.txt/;
  const result1 = title.match(regex1);
  const result2 = title.match(regex2);
  return {
    num: result1[1],
    name: result2[1],
  };
};

new Vue({
  el: '#editor',
  data() {
    return {
      title: {
        num: '',
        name: '',
      },
      isTools: false,
      isTotal: false,
      isNamed: false,
      isNamedResult: false,
      isNamedLoading: false,
      toolbar: {
        blod: false,
        italic: false,
        underline: false,
      },
      fontSize: '14px',
      fontSizeList: ['10px', '12px', '14px', '16px', '18px', '20px', '22px', '24px'],
      total: 0,
      speed: 0,
      speedTime: 0,
      nameForm: {
        fimalyName: '',
        type: '',
        sex: '',
        context: '',
      },
      nameFormOption: {
        type: ['中国姓名', '日本姓名', '欧美姓名'],
        sex: ['幼年男性', '幼年女性', '青年男性', '青年女性', '成年男性', '成年女性', '老年男性', '老年女性'],
      },
      nameList: [],
      chatGlmReq: null,
      SaveTitle: debounce(() => {
        console.log(this);
        vscode.postMessage({ method: 'saveTitle', data: `第${this.title.num}章 ${this.title.name}` });
      }),
    };
  },
  computed: {
    preCss() {
      const list = [];
      if (this.toolbar.blod) {
        list.push('blod');
      }
      if (this.toolbar.italic) {
        list.push('italic');
      }
      if (this.toolbar.underline) {
        list.push('underline');
      }
      return list.toString().replace(/\,/g, ' ');
    },
    varCss() {
      return {
        '--pre-font-size': this.fontSize,
      };
    },
  },
  methods: {
    initData({ title, file, chatGlm }) {
      if (chatGlm && chatGlm.apiKey) {
        this.chatGlmReq = axios.create({
          baseURL: chatGlm.url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: chatGlm.apiKey,
          },
        });
        this.chatGlmReq.interceptors.request.use(
          (config) => {
            return config;
          },
          function (err) {
            console.error(err);
            return Promise.reject(err);
          },
        );
        this.chatGlmReq.interceptors.response.use(
          (response) => {
            return response.data;
          },
          (err) => {
            console.error(err);
            return Promise.reject(err);
          },
        );
      }
      this.title = titleFilter(title);
      this.speedTime = dayjs().valueOf();
      tinymce.init({
        selector: '#edit',
        inline: true,
        toolbar: false,
        menubar: false,
        init_instance_callback: (editor) => {
          if (!file) {
            console.warn('没有文本');
          }
          editor.setContent(file, { format: 'txt' });
        },
        setup: (editor) => {
          editor.on('keydown', (e) => {
            if (e.keyCode === 13) {
              // 获取当前光标范围
              var rng = editor.selection.getRng();
              var textNode = rng.startContainer;

              // 创建两个汉字字符宽度的空格
              var indentText = '\u3000\u3000';

              // 插入换行符和缩进文本
              if (textNode && textNode.nodeType === 3) {
                // 确保是文本节点且不为null
                var startOffset = rng.startOffset;
                var text = textNode.nodeValue;

                // 检查光标后是否还有空格以外的字符
                var remainingText = text.substring(startOffset);
                if (!/\S/.test(remainingText)) {
                  // 检查是否按下回车键
                  e.preventDefault(); // 阻止默认的回车键行为

                  // 光标后没有空格以外的字符，进行缩进
                  var newText = text.substring(0, startOffset) + '\n' + indentText + text.substring(startOffset);
                  textNode.nodeValue = newText;

                  // 移动光标到缩进后的位置
                  rng.setStart(textNode, startOffset + 3);
                  rng.setEnd(textNode, startOffset + 3);
                  editor.selection.setRng(rng);
                }
              }
            }
          });
          editor.on('input', () => {
            const content = editor.getContent({ format: 'txt' });
            const list = content.split(/\s/);
            let num = 0;
            list.forEach((element) => {
              num += element.length;
            });
            if (num > this.total) {
              const time = dayjs().valueOf();
              const diffrence = time - this.speedTime;
              this.speedTime = time;
              this.speed = _.floor((1 / diffrence) * 1000 * 60);
            } else {
              this.speedTime = dayjs().valueOf();
              this.speed = 0;
            }
            this.total = num;
            savefile();
          });
        },
      });
    },
    Format() {
      const content = tinymce.activeEditor.getContent({ format: 'txt' });
      const fileList = content.split('\n');
      const textList = fileList.map((item) => {
        const _item = item.replace(/(\r|\u3000|\s)+/g, ' ').trim();
        return `\u3000\u3000${_item}`;
      });
      tinymce.activeEditor.setContent(textList.join('\n'), { format: 'txt' });
      savefile();
    },
    Undo() {
      tinymce.activeEditor.undoManager.undo();
      savefile();
    },
    Redo() {
      tinymce.activeEditor.undoManager.redo();
      savefile();
    },
    InsertBlankLineBetweenParagraphs() {
      const content = tinymce.activeEditor.getContent({ format: 'txt' });
      const fileList = content.split('\n');
      const textList = fileList.filter((item) => {
        return !/^[\r\u3000\s]*$/.test(item);
      });
      tinymce.activeEditor.setContent(textList.join('\n\u3000\u3000\n'), { format: 'txt' });
      savefile();
    },
    CancelBlankLineBetweenParagraphs() {
      const content = tinymce.activeEditor.getContent({ format: 'txt' });
      const fileList = content.split('\n');
      const textList = fileList.filter((item) => {
        return !/^[\r\u3000\s]*$/.test(item);
      });
      tinymce.activeEditor.setContent(textList.join('\n'), { format: 'txt' });
      savefile();
    },
    async postName(param, num = 12) {
      if (!this.chatGlmReq) {
        return;
      }
      try {
        this.isNamedLoading = true;
        let content = '请帮助我给我的小说角色起姓名，请你的回答符合以下要求：\n';
        content += `我需要${num}个推荐的姓名\n`;
        if (param.fimalyName) {
          content += `我的角色姓氏是“${param.fimalyName}”。你的每一个回答都必须包含这个姓氏\n`;
        } else {
          content += `请给这个名字起随机一个姓氏”。\n`;
        }
        if (param.type) {
          content += `我的角色姓名风格是“${param.type}”。\n`;
        } else {
          content += `请自行决定这个角色的国籍、但所有名字必须统一国籍。\n`;
        }
        if (param.sex) {
          content += `我的角色性别是“${param.sex}”。\n`;
        } else {
          content += `请自行决定这个角色的年龄性别、但所有角色的年龄性别必须统一。\n`;
        }
        if (param.context) {
          content += `我的角色还有以下人设“${param.context}”。\n`;
        }

        content += '你的回答只能是完美符合js字符串数组的格式，例如["xx","yy"]，其中xx,yy都是你起的姓名。\n';
        content +=
          '名字不能和其他热门小说中的角色名字一样，最好是原创。类似如下名称不可行：杨过、张无忌、周芷若、哈利·波特\n';
        content +=
          '如果是欧美姓名必须遵守名字在前、姓氏在后的原则并且姓名用·分隔，例如：aa·bb。其中“bb”是姓氏，“aa”是名字\n';
        content += '你的回答只能是中文。如果不是中文名字需要翻译成中文，例如：山上彻也、爱丽丝·阿黛儿\n';
        content += '直接给出你的答案不要说任何多余的话。\n';
        const prompt = [
          {
            role: 'user',
            content,
          },
        ];
        const response = await this.chatGlmReq.post('', { prompt });
        if (response && response.code === 200) {
          const res = response.data.choices[0].content;
          if (!isJSON(res)) {
            console.warn(res);
            return;
          }
          return JSON.parse(response.data.choices[0].content);
        } else {
          console.error(response);
          return;
        }
      } catch (error) {
        console.error(error);
        return;
      } finally {
        this.isNamedLoading = false;
      }
    },
    async GetName() {
      this.nameList = [];
      this.isNamedResult = true;
      const nameStr = await this.postName(this.nameForm);
      this.nameList = JSON.parse(nameStr);
    },
    ClearName() {
      this.isNamedResult = false;
      this.nameList = [];
      this.nameForm = {
        fimalyName: '',
        type: '',
        sex: '',
        context: '',
      };
    },
    Copy(str) {
      navigator.clipboard.writeText(str);
      vscode.postMessage({ method: 'msg', data: '已复制到剪贴板' });
    },
  },
  created() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.method) {
        this[msg.method](msg.data);
      }
    });
    vscode.postMessage({ method: 'init', data: null });
  },
});
