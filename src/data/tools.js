export const defaultCategories = [
  {
    id: 'text',
    name: '文字工具',
    icon: '📝',
    color: '#3b82f6',
    tools: [
      { id: 'rename', name: '文件批量改名', icon: '📁', type: 'rename', desc: '批量重命名' },
      { id: 'proofread', name: '中文排版检查', icon: '📋', type: 'proofread', desc: '排版检查修复' },
    ]
  },
  {
    id: 'image',
    name: '图片工具',
    icon: '🖼️',
    color: '#10b981',
    tools: [
      { id: 'qrcode', name: '二维码', icon: '📱', type: 'qrcode', desc: '生成识别' },
      { id: 'colorpick', name: '取色器', icon: '🎨', type: 'color', desc: '提取颜色' },
      { id: 'imgcompress', name: '图片压缩', icon: '🗜️', type: 'image', desc: '压缩图片' },
    ]
  },
  {
    id: 'daily',
    name: '日常工具',
    icon: '🧰',
    color: '#f59e0b',
    tools: [
      { id: 'timer', name: '倒计时', icon: '⏱️', type: 'timer', desc: '计时器' },
      { id: 'random', name: '随机数', icon: '🎲', type: 'random', desc: '生成随机' },
      { id: 'barrage', name: '手持弹幕', icon: '📢', type: 'barrage', desc: '全屏弹幕' },
      { id: 'calc', name: '计算器', icon: '🧮', type: 'calc', desc: '简单计算' },
    ]
  },
]

export const toolTypeMap = {
  rename: () => import('../tools/RenameTool.vue'),
  proofread: () => import('../tools/ProofreaderTool.vue'),
  base64: () => import('../tools/Base64Tool.vue'),
  qrcode: () => import('../tools/QrCodeTool.vue'),
  timer: () => import('../tools/TimerTool.vue'),
  random: () => import('../tools/RandomTool.vue'),
  barrage: () => import('../tools/BarrageTool.vue'),
  color: () => import('../tools/ColorPickerTool.vue'),
  text: () => import('../tools/TextTool.vue'),
  calc: () => import('../tools/CalcTool.vue'),
  image: () => import('../tools/ImageTool.vue'),
}

export const toolIcons = {
  rename: '📁', proofread: '📋', base64: '🔐', qrcode: '📱', timer: '⏱️', random: '🎲',
  barrage: '📢', color: '🎨', text: '📝', calc: '🧮', image: '🗜️',
}

export const toolDescs = {
  rename: '批量重命名', proofread: '排版检查修复', base64: '编解码', qrcode: '生成识别', timer: '计时器', random: '生成随机',
  barrage: '全屏弹幕', color: '提取颜色', text: '文本处理', calc: '简单计算', image: '图片处理',
}