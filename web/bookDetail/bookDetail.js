const vscode = acquireVsCodeApi();
const body = document.body;
const themeKind = body.dataset.vscodeThemeKind;
const upload = (validSuffixes) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';

    if (validSuffixes) {
      input.accept = validSuffixes.join(',');
    }
    input.click();
    input.onchange = () => {
      if (_.isEmpty(input.files)) {
        return reject(Error('未选择有效文件'));
      }
      const file = input.files.length > 0 ? input.files[0] : null;
      if (!file) {
        return;
      }
      const fileNameSuffix = _.last(file.name.split('.'));
      if (validSuffixes && !validSuffixes.includes(`${fileNameSuffix}`)) {
        const errorMessage = `文件格式错误，仅支持${validSuffixes.toString()}为后缀名的文件`;
        this.$message.error(errorMessage);
        return reject(Error(errorMessage));
      }
      resolve(file);
      input.remove();
    };
  });
};
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    // 创建一个新的 FileReader 对象
    const reader = new FileReader();
    // 读取 File 对象
    reader.readAsDataURL(file);
    // 加载完成后
    reader.onload = function () {
      // 将读取的数据转换为 base64 编码的字符串
      const base64String = reader.result.split(',')[1];
      // 解析为 Promise 对象，并返回 base64 编码的字符串
      resolve(base64String);
    };
    // 加载失败时
    reader.onerror = function () {
      reject(new Error('Failed to load file'));
    };
  });
};

new Vue({
  el: '#book',
  data() {
    return {
      edit: false,
      themeKind,
      detail: {
        imgPath: '',
        coverPath: '',
        name: '',
        author: '',
        assorts: [],
        tags: [],
        codeNum: 0,
        introduction: '',
      },
      detailEdit: {
        imgPath: '',
        coverPath: '',
        name: '',
        author: '',
        assorts: [],
        tags: [],
        codeNum: 0,
        introduction: '',
      },
      bookType: [
        {
          label: '男生',
          children: [
            {
              label: '玄幻小说',
              children: [
                { label: '东方玄幻' },
                { label: '转世重生' },
                { label: '异界大陆' },
                { label: '洪荒神话' },
                { label: '西方玄幻' },
                { label: '领主贵族' },
                { label: '亡灵异族' },
                { label: '魔法校园' },
                { label: '其他玄幻' },
              ],
            },
            {
              label: '武侠小说',
              children: [
                { label: '幻武异侠' },
                { label: '传统武侠' },
                { label: '国术武技' },
                { label: '国术武技' },
                { label: '新派武侠' },
                { label: '其他武侠' },
              ],
            },
            {
              label: '竞技体育',
              children: [
                { label: '球类运动' },
                { label: '体坛竞技' },
                { label: '弈林生涯' },
                { label: '体育经营' },
                { label: '篮球竞技' },
                { label: '足球竞技' },
                { label: '体育风云' },
                { label: '其他竞技' },
              ],
            },
            {
              label: '军事小说',
              children: [
                { label: '军旅生活' },
                { label: '军事战争' },
                { label: '抗日烽火' },
                { label: '战争幻想' },
                { label: '谍战特工' },
                { label: '其他军事' },
              ],
            },
            {
              label: '游戏竞技',
              children: [
                { label: '虚拟网游' },
                { label: '游戏人生' },
                { label: '游戏异界' },
                { label: '网游情缘' },
                { label: '其他游戏' },
              ],
            },
            {
              label: '灵异推理',
              children: [
                { label: '灵异鬼怪' },
                { label: '惊悚恐怖' },
                { label: '侦探推理' },
                { label: '悬疑探险' },
                { label: '神秘文化' },
                { label: '诡秘志怪' },
                { label: '其他灵异' },
              ],
            },
            {
              label: '都市小说',
              children: [
                { label: '极道江湖' },
                { label: '官场沉浮' },
                { label: '都市生活' },
                { label: '都市异能' },
                { label: '都市重生' },
                { label: '乡村乡土' },
                { label: '社会百态' },
                { label: '都市情感' },
                { label: '都市人生' },
                { label: '都市热血' },
                { label: '都市商战' },
                { label: '娱乐明星' },
                { label: '职场励志' },
                { label: '其他都市' },
              ],
            },
            {
              label: '科幻小说',
              children: [
                { label: '未来世界' },
                { label: '时空穿梭' },
                { label: '科技时代' },
                { label: '古武机甲' },
                { label: '数字生命' },
                { label: '星际战争' },
                { label: '进化变异' },
                { label: '末世危机' },
                { label: '其他科幻' },
              ],
            },
            {
              label: '同人地带',
              children: [
                { label: '武侠同人' },
                { label: '动漫同人' },
                { label: '影视同人' },
                { label: '小说同人' },
                { label: '游戏同人' },
                { label: '授权同人' },
                { label: '其他同人' },
              ],
            },
            {
              label: '历史架空',
              children: [
                { label: '架空历史' },
                { label: '人物传记' },
                { label: '上古先秦' },
                { label: '秦汉三国' },
                { label: '两晋隋唐' },
                { label: '五代十国' },
                { label: '两宋元明' },
                { label: '清史民国' },
                { label: '历史传记' },
                { label: '外国历史' },
                { label: '古代典籍' },
                { label: '其他历史' },
              ],
            },
          ],
        },
        {
          label: '女生',
          children: [
            {
              label: '纯恋小说',
              children: [
                { label: '现代纯恋' },
                { label: '古代纯恋' },
                { label: '幻想纯恋' },
                { label: '架空纯恋' },
                { label: '百合之恋' },
                { label: '同人纯恋' },
                { label: '衍生纯恋' },
                { label: '其他纯恋' },
              ],
            },
            {
              label: '浪漫青春',
              children: [
                { label: '青春校园' },
                { label: '青春励志' },
                { label: '校园异能' },
                { label: '叛逆成长' },
                { label: '青春美好' },
                { label: '青春之殇' },
              ],
            },
            {
              label: '幻想言情',
              children: [{ label: '同人衍生' }, { label: '异族恋情' }, { label: '快穿系统' }, { label: '西方魔幻' }],
            },
            { label: '轻小说', children: [{ label: '唯美幻想' }, { label: '萌系变身' }, { label: '青春日常' }] },
          ],
        },
      ],
    };
  },
  computed: {
    varCss() {
      if (this.themeKind == 'vscode-dark') {
        return {
          '--card-color': '#333',
          '--card-shadow': '#000',
          '--font-color': '#fff',
          '--tag-font-color': '#666',
          '--tag-background-color': '#fff',
        };
      } else {
        return {
          '--card-color': '#f7f7fc',
          '--card-shadow': '#ccc',
          '--font-color': '#000',
          '--tag-font-color': '#666',
          '--tag-background-color': '#fff',
        };
      }
    },
  },
  methods: {
    initData({ path, detail }) {
      this.detail = {
        imgPath: detail.imgPath,
        name: detail.name,
        author: detail.author,
        assorts: detail.assorts,
        tags: detail.tags,
        codeNum: detail.codeNum,
        introduction: detail.introduction,
      };
    },
    Edit() {
      this.detailEdit = JSON.parse(JSON.stringify(this.detail));
      this.edit = true;
    },
    Save() {
      const param = {
        name: this.detailEdit.name,
        author: this.detailEdit.author,
        codeNum: this.detailEdit.codeNum,
        introduction: this.detailEdit.introduction,
        assorts: this.detailEdit.assorts,
      };
      vscode.postMessage({ method: 'save', data: param });
      this.detail = JSON.parse(JSON.stringify(this.detailEdit));
      this.detailEdit = {
        imgPath: '',
        coverPath: '',
        name: '',
        author: '',
        assorts: [],
        tags: [],
        codeNum: 0,
        introduction: '',
      };
      this.edit = false;
    },
    async Upload() {
      const file = await upload(['png', 'jpg', 'webp', 'jpeg']);
      if (file) {
        vscode.postMessage({ method: 'saveImg', data: { path: file.path, type: file.type } });
        const img64 = await fileToBase64(file);
        this.detail.imgPath = `data:${file.type};base64,${img64}`;
      }
    },
    change() {},
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
