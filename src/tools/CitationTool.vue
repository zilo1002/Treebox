<!-- CitationTool.vue - 学术引用助手 -->
<template>
  <div class="citation-tool">
    <!-- 步骤导航 -->
    <div class="citation-steps">
      <div
        v-for="(step, idx) in steps"
        :key="step.key"
        class="step-item"
        :class="{ active: currentStep === idx, done: currentStep > idx }"
        @click="currentStep = idx"
      >
        <span class="step-num">{{ idx + 1 }}</span>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Step 1: 导入文档 -->
    <div v-if="currentStep === 0" class="step-panel">
      <div class="import-section">
        <h3>📄 导入正文</h3>
        <p class="hint">支持直接粘贴文本，或上传 .docx / .txt / .md 文件提取内容</p>

        <div class="upload-area" @click="$refs.fileInput.click()" @drop.prevent="onDrop" @dragover.prevent>
          <input ref="fileInput" type="file" accept=".docx,.txt,.md" @change="onFileChange" style="display:none" />
          <div class="upload-icon">📁</div>
          <div class="upload-text">点击上传或拖拽文件到此处</div>
          <div class="upload-types">支持 .docx / .txt / .md</div>
        </div>

        <div class="or-divider">或</div>

        <textarea
          v-model="rawText"
          class="text-input"
          rows="12"
          placeholder="在此粘贴论文正文..."
        ></textarea>

        <div class="step-actions">
          <button class="btn-primary" @click="nextStep" :disabled="!rawText.trim()">
            下一步：管理参考文献 →
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: 参考文献 -->
    <div v-if="currentStep === 1" class="step-panel">
      <div class="ref-section">
        <h3>📚 参考文献</h3>
        <p class="hint">添加参考文献条目，系统将自动按格式排序并生成文末列表</p>

        <div class="usage-tip">
          <strong>💡 使用提示</strong>
          <ol>
            <li>选择引用格式（GB/T 7714、APA 等）和文中标注样式（上标/括号/作者-年份/脚注）</li>
            <li>点击「添加参考文献」填写作者、年份、标题等信息</li>
            <li>文献类型支持期刊论文、专著、会议论文、网页、学位论文</li>
            <li>填写完成后进入「标注引用」步骤，在正文中选中文本即可插入引用标记</li>
          </ol>
        </div>

        <div class="ref-format-bar">
          <label>引用格式：</label>
          <select v-model="citationStyle">
            <option value="gb7714">GB/T 7714（国标）</option>
            <option value="apa7">APA 7th</option>
            <option value="mla9">MLA 9th</option>
            <option value="chicago17">Chicago 17th</option>
          </select>
          <label style="margin-left:16px">引用位置：</label>
          <select v-model="citePosition">
            <option value="superscript">上标 [1]</option>
            <option value="subscript">下标 [1]</option>
            <option value="bracket">括号 [1]</option>
            <option value="authorYear">作者-年份 (张三, 2023)</option>
            <option value="footnote">脚注</option>
          </select>
        </div>

        <div class="ref-paste-area">
          <label class="paste-label">📋 粘贴参考文献（每行一条）</label>
          <textarea
            v-model="rawRefsInput"
            class="ref-paste-input"
            rows="8"
            placeholder="[1] 陈嘉映. 何为良好生活[M]. 上海：上海文艺出版社，2015：142.
[2] 米兰·昆德拉. 帷幕[M]. 董强，译. 上海：上海译文出版社，2006：76. （引文为编译大意）
..."
          ></textarea>
          <button class="btn-parse" @click="parseRefs" :disabled="!rawRefsInput.trim()">
            🔍 解析参考文献
          </button>
          <p class="parse-hint">支持 GB/T 7714 格式，自动识别 [M]专著 [J]期刊 [C]会议 [D]学位 [EB/OL]网页</p>
        </div>

        <div class="ref-list">
          <div v-for="(ref, idx) in references" :key="ref.id" class="ref-item">
            <div class="ref-header">
              <span class="ref-index">[{{ idx + 1 }}]</span>
              <span class="ref-brief">{{ ref.authors || '佚名' }}《{{ ref.title || '无标题' }}》{{ ref.year ? '(' + ref.year + ')' : '' }}</span>
              <button class="ref-del" @click="removeRef(idx)">✕</button>
            </div>
            <div class="ref-cite-area">
              <textarea
                v-model="ref.citeText"
                class="cite-textarea"
                rows="2"
                :placeholder="$t('citation.citeTextPlaceholder')"
              ></textarea>
              <button
                class="btn-auto-cite"
                :disabled="!ref.citeText?.trim() || !rawText.trim()"
                @click="autoCite(idx)"
              >
                {{ $t('citation.autoCite') }}
              </button>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-secondary" @click="prevStep">← 上一步</button>
          <button class="btn-primary" @click="nextStep">
            下一步：标注引用 →
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: 标注引用 -->
    <div v-if="currentStep === 2" class="step-panel">
      <div class="annotate-section">
        <h3>✏️ 标注引用</h3>
        <p class="hint">在正文中选中文字，点击对应参考文献即可插入引用标记</p>

        <div class="annotate-layout">
          <!-- 左侧：正文编辑区 -->
          <div class="editor-pane">
            <div class="pane-header">
              <span>正文预览</span>
              <label class="toggle-wrap">
                <input type="checkbox" v-model="showCiteMarks" />
                <span>显示引用标记</span>
              </label>
            </div>
            <div ref="editor" class="rich-editor" contenteditable="true" @mouseup="onTextSelect">
              <p v-for="(para, idx) in paragraphs" :key="idx" v-html="renderPara(para)"></p>
            </div>
          </div>

          <!-- 右侧：快速引用面板 -->
          <div class="ref-pane">
            <div class="pane-header">快速引用</div>
            <div class="ref-quick-list">
              <div
                v-for="(ref, idx) in references"
                :key="ref.id"
                class="ref-quick-item"
                :class="{ disabled: !selectedText }"
                @click="insertCitation(idx)"
              >
                <span class="ref-quick-num">[{{ idx + 1 }}]</span>
                <span class="ref-quick-title">{{ ref.title || '未命名' }}</span>
              </div>
            </div>

            <!-- 题注管理 -->
            <div class="pane-header" style="margin-top:16px">{{ $t('citation.caption') }}</div>
            <div class="caption-section">
              <button class="btn-small" @click="addCaption('figure')">+ {{ $t('citation.addFigure') }}</button>
              <button class="btn-small" @click="addCaption('table')">+ {{ $t('citation.addTable') }}</button>
            </div>
            <div class="caption-list">
              <div v-for="(cap, idx) in captions" :key="cap.id" class="caption-item">
                <span class="cap-tag">{{ cap.label }}{{ cap.num }}</span>
                <input v-model="cap.text" :placeholder="$t('citation.title')" />
                <button class="cap-del" @click="removeCaption(idx)">✕</button>
              </div>
            </div>

            <!-- 交叉引用 -->
            <div class="pane-header" style="margin-top:16px">{{ $t('citation.crossRef') }}</div>
            <div class="crossref-list">
              <div v-if="captions.length === 0" class="crossref-empty">
                {{ $t('citation.crossRefEmpty') }}
              </div>
              <div
                v-for="cap in captions"
                :key="'cr-'+cap.id"
                class="crossref-item"
                @click="insertCrossRef(cap)"
              >
                <span class="crossref-tag">{{ cap.label }}{{ cap.num }}</span>
                <span class="crossref-title">{{ cap.text || $t('citation.untitled') }}</span>
                <span class="crossref-hint">{{ $t('citation.clickToInsert') }}</span>
              </div>
            </div>

            <div class="pane-header" style="margin-top:16px">脚注 / 尾注</div>
            <div class="footnote-section">
              <button class="btn-small" @click="addFootnote">+ 添加脚注</button>
            </div>
            <div class="footnote-list">
              <div v-for="(fn, idx) in footnotes" :key="fn.id" class="footnote-item">
                <span>注{{ idx + 1 }}：</span>
                <input v-model="fn.text" placeholder="脚注内容" />
                <button @click="insertFootnoteMark(idx)">插入标记</button>
                <button @click="removeFootnote(idx)">✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-secondary" @click="prevStep">← 上一步</button>
          <button class="btn-primary" @click="nextStep">
            下一步：预览导出 →
          </button>
        </div>
      </div>
    </div>

    <!-- Step 4: 预览导出 -->
    <div v-if="currentStep === 3" class="step-panel">
      <div class="export-section">
        <h3>👁️ 预览</h3>

        <div class="preview-tabs">
          <button
            v-for="tab in previewTabs"
            :key="tab.key"
            class="preview-tab"
            :class="{ active: previewTab === tab.key }"
            @click="previewTab = tab.key"
          >{{ tab.label }}</button>
        </div>

        <!-- 正文预览 -->
        <div v-if="previewTab === 'body'" class="preview-body">
          <div class="doc-preview" v-html="previewBodyHtml"></div>
        </div>

        <!-- 参考文献列表预览 -->
        <div v-if="previewTab === 'refs'" class="preview-refs">
          <h4>参考文献</h4>
          <ol>
            <li v-for="ref in formattedRefs" :key="ref.id" v-html="ref.formatted"></li>
          </ol>
        </div>

        <!-- 题注列表 -->
        <div v-if="previewTab === 'captions'" class="preview-captions">
          <h4>题注列表</h4>
          <div v-for="cap in captions" :key="cap.id">
            {{ cap.label }} {{ cap.num }}：{{ cap.text }}
          </div>
        </div>

        <!-- 脚注列表 -->
        <div v-if="previewTab === 'footnotes'" class="preview-footnotes">
          <h4>脚注</h4>
          <div v-for="(fn, idx) in footnotes" :key="fn.id">
            {{ idx + 1 }}. {{ fn.text }}
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-secondary" @click="prevStep">← 上一步</button>
          <button class="btn-export" @click="exportDocx">
            📥 导出 Word 文档 (.docx)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Footer, PageNumber, convertInchesToTwip } from 'docx'

const steps = [
  { key: 'import', label: '导入文档' },
  { key: 'refs', label: '参考文献' },
  { key: 'annotate', label: '标注引用' },
  { key: 'export', label: '预览导出' },
]
const { t: $t } = useI18n()
const currentStep = ref(0)

// === Step 1 ===
const rawText = ref('')
const uploadedFileName = ref('')
const fileInput = ref(null)

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  uploadedFileName.value = file.name.replace(/\.[^.]+$/, '')
  if (file.name.endsWith('.docx')) {
    // 用 mammoth 提取纯文本（假设 mammoth 已全局可用或按需加载）
    const mammoth = await import('mammoth')
    const arr = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: arr })
    rawText.value = result.value
  } else {
    rawText.value = await file.text()
  }
}
function onDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file) {
    const ev = { target: { files: [file] } }
    onFileChange(ev)
  }
}

// === Step 2 ===
const citationStyle = ref('gb7714')
const citePosition = ref('superscript')
const references = ref([])
const rawRefsInput = ref('')

let refIdCounter = 1
function addRef() {
  references.value.push({
    id: refIdCounter++,
    authors: '',
    year: '',
    title: '',
    source: '',
    volume: '',
    doi: '',
    type: 'journal',
    citeText: '',
  })
}
function removeRef(idx) {
  references.value.splice(idx, 1)
}

// 自动解析 GB/T 7714 格式参考文献
function parseRefs() {
  const lines = rawRefsInput.value.split('\n').filter(l => l.trim())
  let added = 0
  for (const line of lines) {
    const parsed = parseRefLine(line.trim())
    if (parsed) {
      references.value.push(parsed)
      added++
    }
  }
  if (added > 0) {
    rawRefsInput.value = ''
    alert(`成功解析 ${added} 条参考文献`)
  } else {
    alert('未能解析任何参考文献，请检查格式')
  }
}

function parseRefLine(line) {
  if (!line) return null
  // 去掉 [n] 前缀
  line = line.replace(/^\s*\[\d+\]\s*/, '').trim()
  if (!line) return null

  // 提取类型 [M] [J] [C] [D] [EB/OL]
  const typeMatch = line.match(/\[([A-Za-z/]+)\]/)
  let type = 'journal'
  if (typeMatch) {
    const code = typeMatch[1].toUpperCase()
    if (code === 'M') type = 'book'
    else if (code === 'J') type = 'journal'
    else if (code === 'C') type = 'conference'
    else if (code === 'D') type = 'thesis'
    else if (code.includes('EB') || code.includes('OL')) type = 'web'
  }

  // 去掉类型标记
  let work = line.replace(/\s*\[[A-Za-z/]+\]\s*/, '').trim()

  // 提取备注（括号内容）
  let note = ''
  const noteMatch = work.match(/[（(]([^）)]+)[）)]/)
  if (noteMatch) {
    note = noteMatch[1]
    work = work.replace(noteMatch[0], '').trim()
  }

  // 提取年份
  let year = ''
  const yearMatch = work.match(/[，,]\s*(\d{4})/)
  if (yearMatch) {
    year = yearMatch[1]
  }

  // 提取页码
  let pages = ''
  const pageMatch = work.match(/[：:]\s*(\d+(?:[-–]\d+)?)/)
  if (pageMatch) {
    pages = pageMatch[1]
  }

  // 分割作者
  let authors = ''
  let rest = work
  const firstDot = work.indexOf('.')
  if (firstDot > 0) {
    authors = work.slice(0, firstDot).trim()
    rest = work.slice(firstDot + 1).trim()
  }

  // 分割标题和来源
  let title = ''
  let source = ''
  if (yearMatch) {
    const yearPos = rest.indexOf(yearMatch[0])
    let beforeYear = rest.slice(0, yearPos).trim()
    const titleDot = beforeYear.indexOf('.')
    if (titleDot >= 0) {
      title = beforeYear.slice(0, titleDot).trim()
      source = beforeYear.slice(titleDot + 1).trim()
    } else {
      title = beforeYear
    }
  } else {
    const titleDot = rest.indexOf('.')
    if (titleDot >= 0) {
      title = rest.slice(0, titleDot).trim()
      source = rest.slice(titleDot + 1).trim()
    } else {
      title = rest
    }
  }

  title = title.replace(/[.．。]$/, '').trim()
  source = source.replace(/[.．。]$/, '').trim()

  return {
    id: refIdCounter++,
    authors,
    year,
    title,
    source,
    volume: pages,
    doi: '',
    type,
    citeText: '',
    note,
  }
}

// 格式化单条参考文献
function formatRef(ref, idx) {
  const a = ref.authors || '佚名'
  const y = ref.year || 'n.d.'
  const t = ref.title || '无标题'
  const s = ref.source || ''
  const v = ref.volume || ''
  const d = ref.doi ? `DOI:${ref.doi}` : ''

  switch (citationStyle.value) {
    case 'gb7714':
      if (ref.type === 'journal') return `${a}. ${t}[J]. ${s}, ${y}${v ? ', ' + v : ''}.${d ? ' ' + d : ''}`
      if (ref.type === 'book') return `${a}. ${t}[M]. ${s}, ${y}.${d ? ' ' + d : ''}`
      if (ref.type === 'web') return `${a}. ${t}[EB/OL]. ${s}, ${y}.${d ? ' ' + d : ''}`
      return `${a}. ${t}[J]. ${s}, ${y}.${d ? ' ' + d : ''}`
    case 'apa7':
      return `${a} (${y}). ${t}. ${s}${v ? ', ' + v : ''}.${d ? ' https://doi.org/' + ref.doi : ''}`
    case 'mla9':
      return `${a}. "${t}." ${s}${v ? ', ' + v : ''}, ${y}.${d ? ', ' + ref.doi : ''}`
    case 'chicago17':
      return `${a}. ${t}. ${s}, ${y}.${d ? ' ' + ref.doi : ''}`
    default:
      return `${a}. ${t}. ${s}, ${y}.`
  }
}

const formattedRefs = computed(() => {
  return references.value.map((ref, idx) => ({
    id: ref.id,
    formatted: formatRef(ref, idx),
  }))
})

// === Step 3 ===
const paragraphs = computed(() => rawText.value.split('\n').filter(p => p.trim()))
const showCiteMarks = ref(true)
const selectedText = ref('')
const editor = ref(null)

// 引用映射：{ paragraphIndex: [{ start, end, refIndex }] }
const citations = ref({})

function onTextSelect() {
  const sel = window.getSelection()
  if (sel && sel.toString().trim()) {
    selectedText.value = sel.toString().trim()
  }
}

function renderPara(text) {
  // 简单渲染，实际应处理引用标记高亮
  let html = escapeHtml(text)
  return html
}

function escapeHtml(t) {
  const div = document.createElement('div')
  div.textContent = t
  return div.innerHTML
}

function insertCitation(refIdx) {
  if (!selectedText.value) return
  const mark = generateCiteMark(refIdx)
  // 上标模式用 <sup> 包裹，确保预览和导出都能识别
  const html = citePosition.value === 'superscript'
    ? `<sup>${mark}</sup>`
    : citePosition.value === 'subscript'
    ? `<sub>${mark}</sub>`
    : mark
  document.execCommand('insertHTML', false, html)
  selectedText.value = ''
}

function generateCiteMark(refIdx) {
  const n = refIdx + 1
  switch (citePosition.value) {
    case 'superscript': return `[${n}]`
    case 'subscript': return `[${n}]`
    case 'bracket': return `[${n}]`
    case 'authorYear': {
      const ref = references.value[refIdx]
      const author = (ref.authors || '佚名').split(',')[0].trim()
      return `(${author}, ${ref.year || 'n.d.'})`
    }
    case 'footnote': return `${n}`
    default: return `[${n}]`
  }
}

// 题注
const captions = ref([])
let capIdCounter = 1
function addCaption(type) {
  const label = type === 'figure' ? '图' : '表'
  const num = captions.value.filter(c => c.type === type).length + 1
  captions.value.push({ id: capIdCounter++, type, label, num, text: '' })
}
function removeCaption(idx) {
  captions.value.splice(idx, 1)
  // 重新编号
  let f = 1, t = 1
  captions.value.forEach(c => {
    if (c.type === 'figure') c.num = f++
    if (c.type === 'table') c.num = t++
  })
}
function insertCrossRef(cap) {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const textNode = document.createTextNode(`（见${cap.label}${cap.num}）`)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    sel.removeAllRanges()
    sel.addRange(range)
  } else {
    document.execCommand('insertText', false, `（见${cap.label}${cap.num}）`)
  }
}

// 脚注
const footnotes = ref([])
let fnIdCounter = 1
function addFootnote() {
  footnotes.value.push({ id: fnIdCounter++, text: '' })
}
function removeFootnote(idx) {
  footnotes.value.splice(idx, 1)
}
function insertFootnoteMark(idx) {
  if (!selectedText.value) return
  document.execCommand('insertText', false, `${idx + 1}`)
}

// === Step 4 ===
const previewTab = ref('body')
const previewTabs = [
  { key: 'body', label: '正文' },
  { key: 'refs', label: '参考文献' },
  { key: 'captions', label: '题注' },
  { key: 'footnotes', label: '脚注' },
]

const previewBodyHtml = computed(() => {
  // 简化预览：把编辑器内容拿出来
  if (editor.value) {
    return editor.value.innerHTML
  }
  return paragraphs.value.map(p => `<p>${escapeHtml(p)}</p>`).join('')
})

// 使用 docx 库生成真正的 .docx 文件
// 把 HTML 文本解析为 docx TextRun 数组，支持 <sup> 上标
function parseHtmlToRuns(html) {
  const runs = []
  // 先去掉外层 <p> 标签
  const clean = html.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '')
  // 按 <sup> 和 </sup> 分割
  const parts = clean.split(/(<sup>[^<]*<\/sup>)/gi)
  parts.forEach(part => {
    const supMatch = part.match(/<sup>([^<]*)<\/sup>/i)
    const subMatch = part.match(/<sub>([^<]*)<\/sub>/i)
    if (supMatch) {
      runs.push(new TextRun({
        text: supMatch[1],
        superScript: true,
        font: 'Times New Roman',
        size: 24,
      }))
    } else if (subMatch) {
      runs.push(new TextRun({
        text: subMatch[1],
        subScript: true,
        font: 'Times New Roman',
        size: 24,
      }))
    } else {
      const text = part.replace(/<[^>]+>/g, '').trim()
      if (text) {
        runs.push(new TextRun({
          text,
          font: 'Times New Roman',
          size: 24,
        }))
      }
    }
  })
  return runs
}

async function exportDocx() {
  try {
    const children = []

    // 正文段落 — 解析 HTML 中的 <sup>[n]</sup> 为上标
    const bodyHtml = editor.value ? editor.value.innerHTML : previewBodyHtml.value
    const plainParas = bodyHtml.split('</p>').filter(p => p.trim())
    plainParas.forEach(p => {
      const html = p.trim()
      if (!html) return
      const runs = parseHtmlToRuns(html)
      if (runs.length > 0) {
        children.push(
          new Paragraph({
            children: runs,
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
          })
        )
      }
    })

    // 题注
    if (captions.value.length > 0) {
      children.push(new Paragraph({ text: '', spacing: { before: 400 } }))
      children.push(
        new Paragraph({
          text: '题注',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        })
      )
      captions.value.forEach(cap => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${cap.label}${cap.num} `, bold: true, font: 'Times New Roman', size: 22 }),
              new TextRun({ text: cap.text, font: 'Times New Roman', size: 22 }),
            ],
            spacing: { after: 120 },
          })
        )
      })
    }

    // 脚注
    if (footnotes.value.length > 0) {
      children.push(new Paragraph({ text: '', spacing: { before: 400 } }))
      children.push(
        new Paragraph({
          text: '脚注',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        })
      )
      footnotes.value.forEach((fn, idx) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${idx + 1}. `, bold: true, font: 'Times New Roman', size: 20 }),
              new TextRun({ text: fn.text, font: 'Times New Roman', size: 20 }),
            ],
            spacing: { after: 100 },
          })
        )
      })
    }

    // 分页 + 参考文献
    children.push(new Paragraph({ pageBreakBefore: true }))
    children.push(
      new Paragraph({
        text: '参考文献',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    )

    formattedRefs.value.forEach((ref, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${idx + 1}] `, bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: ref.formatted, font: 'Times New Roman', size: 22 }),
          ],
          spacing: { after: 160, line: 360 },
          alignment: AlignmentType.JUSTIFIED,
        })
      )
    })

    // 构建文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['第 ', PageNumber.CURRENT, ' 页'],
                    font: 'Times New Roman',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (uploadedFileName.value || '文档') + '_已标注.docx'
    a.click()
    URL.revokeObjectURL(url)
    alert('已导出 Word 文档 (.docx)')
  } catch (err) {
    console.error(err)
    alert('导出失败：' + err.message)
  }
}

// 导航
function autoCite(refIdx) {
  const ref = references.value[refIdx]
  const needle = ref.citeText?.trim()
  if (!needle || !rawText.value.trim()) return

  const body = rawText.value
  const idx = body.indexOf(needle)

  if (idx >= 0) {
    // 精确匹配：在引文后插入 [n]
    const before = body.slice(0, idx + needle.length)
    const after = body.slice(idx + needle.length)
    const mark = generateCiteMark(refIdx)
    const htmlMark = citePosition.value === 'superscript'
      ? `<sup>${mark}</sup>`
      : citePosition.value === 'subscript'
      ? `<sub>${mark}</sub>`
      : mark
    rawText.value = before + htmlMark + after
    alert($t('citation.autoCiteSuccess', { mark }))
  } else {
    // 模糊匹配：尝试找最长公共子串
    const fuzzy = fuzzyFind(body, needle)
    if (fuzzy.found && fuzzy.similarity > 0.5) {
      const before = body.slice(0, fuzzy.end)
      const after = body.slice(fuzzy.end)
      const mark = generateCiteMark(refIdx)
      const htmlMark = citePosition.value === 'superscript'
        ? `<sup>${mark}</sup>`
        : citePosition.value === 'subscript'
        ? `<sub>${mark}</sub>`
        : mark
      rawText.value = before + htmlMark + after
      alert($t('citation.autoCiteFuzzy', { mark, snippet: fuzzy.snippet }))
    } else {
      alert($t('citation.autoCiteFail'))
    }
  }
}

// 模糊查找：返回 body 中与 needle 最相似的位置
function fuzzyFind(body, needle) {
  const maxLen = Math.min(needle.length, 30)
  let best = { found: false, similarity: 0, end: 0, snippet: '' }

  for (let len = maxLen; len >= 8; len -= 2) {
    const sub = needle.slice(0, len)
    let pos = body.indexOf(sub)
    while (pos >= 0) {
      const sim = similarity(sub, needle)
      if (sim > best.similarity) {
        best = { found: true, similarity: sim, end: pos + len, snippet: body.slice(pos, pos + len) }
      }
      pos = body.indexOf(sub, pos + 1)
    }
  }
  return best
}

function similarity(a, b) {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1.0
  const costs = []
  for (let i = 0; i <= shorter.length; i++) costs[i] = i
  for (let i = 1; i <= longer.length; i++) {
    let nw = costs[0]
    costs[0] = i
    for (let j = 1; j <= shorter.length; j++) {
      const cj = Math.min(costs[j] + 1, costs[j - 1] + 1)
      costs[j] = Math.min(cj, nw + (longer[i - 1] === shorter[j - 1] ? 0 : 1))
      nw = cj - (longer[i - 1] === shorter[j - 1] ? 0 : 1)
    }
  }
  return (longer.length - costs[shorter.length]) / longer.length
}

function nextStep() {
  if (currentStep.value < steps.length - 1) currentStep.value++
}
function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}
</script>

<style scoped>
.citation-tool {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}

/* 步骤导航 */
.citation-steps {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: var(--bg-muted);
  border-radius: 12px;
}
.step-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--text-secondary);
}
.step-item.active {
  background: var(--accent);
  color: #fff;
  font-weight: 500;
}
.step-item.done {
  color: var(--accent);
}
.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.step-item.active .step-num {
  background: rgba(255,255,255,0.3);
  color: #fff;
}

/* 面板 */
.step-panel {
  background: var(--bg);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px var(--shadow);
}
.step-panel h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

/* 上传区 */
.upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}
.upload-area:hover {
  border-color: var(--accent);
  background: var(--bg-muted);
}
.upload-icon { font-size: 32px; margin-bottom: 8px; }
.upload-text { font-size: 14px; color: var(--text-secondary); }
.upload-types { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

.or-divider {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 12px 0;
  position: relative;
}
.or-divider::before,
.or-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--border);
}
.or-divider::before { left: 0; }
.or-divider::after { right: 0; }

.text-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  background: var(--bg-raised);
  color: var(--text-primary);
}

/* 参考文献 */
.ref-format-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.ref-format-bar label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.ref-format-bar select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-raised);
  color: var(--text-primary);
  max-width: 100%;
  min-width: 0;
  flex: 1;
}
@media (max-width: 640px) {
  .ref-format-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .ref-format-bar label {
    margin-left: 0 !important;
  }
  .ref-format-bar select {
    width: 100%;
    flex: none;
  }
  .ref-paste-input,
  .cite-textarea,
  .btn-auto-cite,
  .btn-parse {
    font-size: 16px;
    padding: 10px 12px;
  }
  .ref-brief {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .step-actions {
    flex-direction: column;
    gap: 10px;
  }
  .step-actions button {
    width: 100%;
  }
}

.ref-list { display: flex; flex-direction: column; gap: 12px; }
.ref-item {
  background: var(--bg-raised);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--border);
}
.ref-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ref-index {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
.ref-del {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 14px;
}
.ref-del:hover { background: #ffeaea; color: #e74c3c; }
.ref-paste-area {
  margin-bottom: 16px;
}
.paste-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.ref-paste-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.7;
  background: var(--bg-raised);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  margin-bottom: 10px;
}
.ref-paste-input::placeholder { color: var(--text-tertiary); }
.btn-parse {
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--accent);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-parse:hover { background: var(--bg-muted); }
.btn-parse:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border);
  color: var(--text-tertiary);
}
.parse-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
  text-align: center;
}
.ref-brief {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 8px;
}
.ref-cite-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.btn-add {
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-add:hover { background: var(--bg-muted); }

/* 标注区 */
.annotate-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) {
  .annotate-layout { grid-template-columns: 1fr; }
}

.editor-pane,
.ref-pane {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.pane-header {
  padding: 10px 12px;
  background: var(--bg-muted);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
}
.rich-editor {
  padding: 12px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
}
.rich-editor p { margin-bottom: 8px; }

.ref-quick-list {
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.ref-quick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 12px;
}
.ref-quick-item:hover { background: var(--bg-muted); }
.ref-quick-item.disabled { opacity: 0.4; pointer-events: none; }
.ref-quick-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}
.ref-quick-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caption-section,
.footnote-section {
  padding: 8px;
}
.btn-small {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-raised);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  margin-right: 6px;
  margin-bottom: 6px;
}
.btn-small:hover { background: var(--bg-muted); }

.caption-list,
.footnote-list {
  padding: 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.caption-item,
.footnote-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.caption-item input,
.footnote-item input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  background: var(--bg);
  color: var(--text-primary);
}
.caption-item button,
.footnote-item button {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-raised);
  font-size: 11px;
  cursor: pointer;
  color: var(--text-secondary);
}

/* 预览 */
.preview-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.preview-tab {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.preview-tab.active {
  background: var(--accent);
  color: #fff;
}

.doc-preview {
  padding: 20px;
  background: var(--bg-raised);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.8;
  min-height: 200px;
}
.preview-refs ol,
.preview-captions,
.preview-footnotes {
  padding: 16px;
  background: var(--bg-raised);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.8;
}
.preview-refs li { margin-bottom: 6px; }

/* 按钮 */
.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.btn-primary,
.btn-secondary,
.btn-export {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--bg-muted);
  color: var(--text-secondary);
}
.btn-secondary:hover { background: var(--bg-strong); }
.btn-export {
  background: #10b981;
  color: #fff;
}
.btn-export:hover { opacity: 0.9; }

/* 题注标签 */
.cap-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--bg-muted);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.cap-del {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}
.cap-del:hover { background: #ffeaea; color: #e74c3c; }

/* 交叉引用列表 */
.crossref-list {
  padding: 10px 8px 8px;
  margin-top: 4px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.crossref-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-muted);
  border-radius: 8px;
}
.crossref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
}
.crossref-item:hover {
  border-color: var(--accent);
  background: var(--bg-muted);
}
.crossref-tag {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}
.crossref-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}
.crossref-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}


/* 使用提示 */
.usage-tip {
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}
.usage-tip strong {
  color: var(--accent);
  font-size: 13px;
}
.usage-tip ol {
  margin: 6px 0 0 16px;
  padding: 0;
}
.usage-tip li {
  margin-bottom: 2px;
}


/* 被引用原文输入框 */
.cite-textarea {
  grid-column: 1 / -1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
}
.cite-textarea::placeholder { color: var(--text-tertiary); }

/* 自动标注按钮 */
.btn-auto-cite {
  grid-column: 1 / -1;
  padding: 8px;
  border: 1px dashed var(--accent);
  border-radius: 8px;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-auto-cite:hover { background: var(--bg-muted); }
.btn-auto-cite:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border);
  color: var(--text-tertiary);
}

</style>