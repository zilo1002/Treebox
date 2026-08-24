export default {
  // 通用
  appName: '我的工具箱',
  open: '点击打开',
  back: '返回',
  search: '搜索',
  settings: '设置',
  cancel: '取消',
  confirm: '确定',
  save: '保存',
  reset: '重置',
  clear: '清除',
  upload: '上传',
  change: '更换',
  preview: '预览',

  // 导航
  nav: {
    home: '首页',
    all: '全部',
    fav: '收藏',
    back: '返回',
  },

  // 首页
  home: {
    title: '工具箱',
    createCategory: '新建分类',
    createHint: '点击创建',
  },

  // 全部
  all: {
    title: '全部工具',
  },

  // 收藏
  fav: {
    title: '我的收藏',
    empty: '暂无收藏，去添加一些吧',
  },

  // 分类
  category: {
    title: '分类',
  },

  // 工具
  tool: {
    title: '工具',
  },

  // 设置
  settings: {
    title: '设置',
    language: '语言',
    appearance: '外观模式',
    accentColor: '主题色',
    customColors: '自定义颜色',
    bgColor: '背景色',
    textColor: '文字色',
    navColor: '导航栏色',
    eyeCare: '护眼色推荐',
    bgAnimation: '背景动画',
    uploadAnimation: '上传动画',
    changeAnimation: '更换动画',
    fontSize: '字体大小',
    radius: '卡片圆角',
    layout: '书架布局',
    glassEffect: '毛玻璃效果',
    reduceMotion: '减少动画',
    light: '浅色',
    dark: '深色',
    auto: '自动',
    followSystem: '跟随系统',
    list: '列表',
    grid3x3: '3×3',
    grid4x4: '4×4',
    zh: '中文',
    en: 'English',
  },

  // 信封
  envelope: {
    welcome: '欢迎来到树榕',
    hint: '点击开启',
  },

  // 计算器
  calc: {
    tab: 'Calculate',
    mc: 'mc',
    mPlus: 'm+',
    mMinus: 'm−',
    mr: 'mr',
    ac: 'AC',
    del: '删除',
    plusMinus: '+⁄−',
    divide: '÷',
    multiply: '×',
    minus: '−',
    plus: '+',
    percent: '%',
    dot: '.',
    equal: '=',
  },

  // 汇率
  rate: {
    tab: 'Exchange',
    dataSource: 'Data source: xCurrency. Last updated: {time}',
  },

  // 生日
  astro: {
    tab: 'Birth',
    selectDate: '选择出生日期',
    lunarDate: '农历日期',
    zodiacGanZhi: '生肖 / 干支',
  },

  // 进制
  base: {
    tab: 'Base',
    title: '进制转换',
    bin: '二进制',
    oct: '八进制',
    dec: '十进制',
    hex: '十六进制',
    inputPlaceholder: '输入数值',
  },

  // 颜色
  color: {
    tab: 'Color',
    title: '颜色编码转换',
    hex: 'HEX',
    rgb: 'RGB',
    hsl: 'HSL',
    hexPlaceholder: '#RRGGBB',
    rgbPlaceholder: 'rgb(r, g, b)',
    hslPlaceholder: 'hsl(h, s%, l%)',
  },

  citation: {
    tab: 'Citation',
    title: '引用助手',
    stepImport: '导入文档',
    stepRefs: '参考文献',
    stepAnnotate: '标注引用',
    stepExport: '预览导出',
    uploadHint: '支持直接粘贴文本，或上传 .docx / .txt / .md 文件提取内容',
    uploadArea: '点击上传或拖拽文件到此处',
    pasteText: '在此粘贴论文正文...',
    citeFormat: '引用格式',
    citePosition: '引用位置',
    superscript: '上标 [1]',
    subscript: '下标 [1]',
    bracket: '括号 [1]',
    authorYear: '作者-年份 (张三, 2023)',
    footnote: '脚注',
    gb7714: 'GB/T 7714（国标）',
    apa7: 'APA 7th',
    mla9: 'MLA 9th',
    chicago17: 'Chicago 17th',
    addRef: '添加参考文献',
    authors: '作者',
    year: '年份',
    title: '标题',
    source: '期刊/出版社/来源',
    volume: '卷(期):页码',
    doi: 'DOI / URL',
    journal: '期刊论文',
    book: '专著',
    conference: '会议论文',
    web: '网页/电子资源',
    thesis: '学位论文',
    annotateHint: '在正文中选中文字，点击对应参考文献即可插入引用标记',
    quickCite: '快速引用',
    caption: '题注',
    addFigure: '添加图注',
    addTable: '添加表注',
    crossRef: '交叉引用',
    crossRefEmpty: '请先添加图注或表注',
    untitled: '未命名',
    clickToInsert: '点击插入',
    footnote: '脚注 / 尾注',
    addFootnote: '添加脚注',
    previewBody: '正文',
    previewRefs: '参考文献',
    previewCaptions: '题注',
    previewFootnotes: '脚注',
    exportDocx: '导出 Word 文档 (.docx)',
    exportHint: '已导出 Word 文档 (.docx)',
    citeTextPlaceholder: '输入正文中被引用的原文片段，系统将自动定位并插入引用标记',
    autoCite: '🔍 自动标注',
    autoCiteSuccess: '已在正文中找到并标注 {mark}',
    autoCiteFuzzy: '已找到相似内容并标注 {mark}（匹配片段：「{snippet}」）',
    autoCiteFail: '未在正文中找到匹配内容，请检查引文是否正确，或进入「标注引用」步骤手动插入',
  },


  // 代码工具
  codefmt: {
    title: '代码格式化查看',
    uploadHint: '点击上传或拖拽代码文件到此处',
    supportFormats: '支持 .js .ts .html .css .vue .py .java .json .xml .md 等格式',
    fileName: '文件名',
    language: '语言',
    fileSize: '文件大小',
    lines: '行数',
    largeFileTip: '文件较大，仅显示前 {lines} 行（共 {total} 行），点击下载可获取完整内容',
    copy: '复制',
    download: '下载',
    reupload: '重新上传',
    formatted: '已格式化',
    original: '原始内容',
    formatBtn: '格式化拆分',
    viewBtn: '查看',
    formatTitle: '格式化设置',
    formatDesc: '将超长行按指定字节数拆分，避免浏览器渲染崩溃。建议每行不超过 2000 字节。',
    warnBody: '当前最长行约 {len} 字节，超过 {threshold} 字节极易导致浏览器崩溃，建议立即拆分！',
    warnBodyMild: '当前最长行约 {len} 字节，建议拆分为 {suggest} 字节以下以获得更好体验。',
    bytesPerLine: '每行字节数',
    bytesHint: '字节',
  },
  jsurl: {
    title: 'JS 网址转换',
    urlPlaceholder: '输入 JS 文件网址，如 https://cdn.example.com/lib.js',
    fetch: '获取内容',
    fetching: '获取中...',
    preview: '预览',
    downloadJs: '下载 .js',
    downloadTxt: '下载 .txt',
    copy: '复制',
    errorCors: '跨域限制，无法直接获取。建议下载后使用「代码格式化」查看',
    errorFetch: '获取失败，请检查网址是否正确',
    size: '大小',
  },

  codereplace: {
    title: '代码批量替换',
    uploadHint: '点击上传或拖拽代码文件到此处',
    supportFormats: '支持 .js .ts .html .css .vue .py .java .json .xml .md 等格式',
    reupload: '重新上传',
    commandTitle: '修改指令',
    commandDesc: '按格式输入修改指令，支持多处同时修改。示例：',
    commandPlaceholder: `在此输入修改指令...
第 X~Y 行替换为：
（替换内容）

第 A-B 行替换为：
（替换内容）

把这个代码xxx换成xxx：
将 xxx替换成xxx：`,
    applyBtn: '✨ 一键实现',
    clearBtn: '清空',
    previewTitle: '修改预览',
    copy: '复制',
    download: '下载',
    copied: '已复制到剪贴板',
    changeSummary: '共修改 {count} 处，涉及 {lines} 行',
    originalFile: '原始文件',
    noCommand: '未识别到有效指令，请检查格式',
    conflictTitle: '发现多处匹配',
    conflictDesc: '以下内容在文件中存在多处，请选择要替换的位置：',
    selectAll: '全选',
    selectNone: '全不选',
    applySelected: '替换选中',
    applyAll: '全部替换',
    skip: '跳过',
    previewMore: '还有 {n} 行未显示，请下载查看完整内容',
  },

  // 搜索
  search: {
    placeholder: '搜索工具...',
  },
}
