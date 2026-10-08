import { readAB, readText, getExt } from '../utils.js';

export async function convDoc(file, target) {
  const ext = getExt(file.name);
  const { jsPDF } = window.jspdf;

  if (ext === 'docx') {
    const ab = await readAB(file);
    if (target === 'txt') {
      const r = await mammoth.extractRawText({ arrayBuffer: ab });
      return new Blob([r.value], { type: 'text/plain;charset=utf-8' });
    }
    if (target === 'md') {
      const r = await mammoth.convertToMarkdown({ arrayBuffer: ab });
      return new Blob([r.value], { type: 'text/plain;charset=utf-8' });
    }
    if (target === 'html') {
      const r = await mammoth.convertToHtml({ arrayBuffer: ab });
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title></head><body>' + r.value + '</body></html>';
      return new Blob([html], { type: 'text/html;charset=utf-8' });
    }
    if (target === 'pdf') {
      const r = await mammoth.convertToHtml({ arrayBuffer: ab });
      const div = document.createElement('div');
      div.innerHTML = r.value;
      div.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;padding:40px;background:#fff;color:#000;font-family:sans-serif;line-height:1.6;';
      document.body.appendChild(div);
      const canvas = await html2canvas(div, { scale: 2 });
      document.body.removeChild(div);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      return pdf.output('blob');
    }
  }

  if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
    const ab = await readAB(file);
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (target === 'csv') {
      return new Blob([XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv' });
    }
    if (target === 'json') {
      return new Blob([JSON.stringify(XLSX.utils.sheet_to_json(ws), null, 2)], { type: 'application/json' });
    }
    if (target === 'xlsx') {
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    if (target === 'html') {
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-size:13px}td,th{border:1px solid #ccc;padding:6px 10px}</style></head><body>' + XLSX.utils.sheet_to_html(ws) + '</body></html>';
      return new Blob([html], { type: 'text/html' });
    }
  }

  if (['txt', 'md'].includes(ext) && target === 'pdf') {
    const text = await readText(file);
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(text, 180);
    let y = 20;
    for (const line of lines) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(line, 15, y);
      y += 6;
    }
    return pdf.output('blob');
  }

    if (['txt', 'md', 'html'].includes(ext) && ['txt', 'md', 'html', 'doc'].includes(target)) {
    const text = await readText(file);
    const mime = target === 'html' ? 'text/html' : 'text/plain';
    return new Blob([text], { type: mime + ';charset=utf-8' });
  }

    if (['txt', 'md', 'html'].includes(ext) && target === 'docx') {
    const text = await readText(file);
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    let paragraphs = [];
    if (ext === 'html') {
      // 简单 HTML 解析：把 <p>、<br>、<h1>-<h6> 转为段落
      const div = document.createElement('div');
      div.innerHTML = text;
      const walk = (node) => {
        if (node.nodeType === 3 && node.textContent.trim()) {
          return [new TextRun(node.textContent)];
        }
        if (node.nodeType !== 1) return [];
        const tag = node.tagName.toLowerCase();
        if (tag === 'br') return [new TextRun({ text: '', break: 1 })];
        const runs = [];
        for (const child of node.childNodes) {
          runs.push(...walk(child));
        }
        if (tag === 'p' || tag === 'div' || tag === 'li') {
          if (runs.length) paragraphs.push(new Paragraph({ children: runs }));
          else paragraphs.push(new Paragraph(''));
        } else if (/^h[1-6]$/.test(tag)) {
          const level = parseInt(tag[1]);
          paragraphs.push(new Paragraph({
            children: runs,
            heading: level <= 3 ? 'Heading' + level : undefined
          }));
        } else if (runs.length) {
          return runs;
        }
        return [];
      };
      for (const child of div.childNodes) walk(child);
    } else {
      // txt / md：按行分割
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          paragraphs.push(new Paragraph(''));
          continue;
        }
        // Markdown 简单处理：# 标题、**粗体**、*斜体*
        if (ext === 'md') {
          let runs = [];
          let remaining = trimmed;
          // 标题
          const headingMatch = remaining.match(/^(#{1,6})\s+(.*)$/);
          if (headingMatch) {
            const level = Math.min(headingMatch[1].length, 3);
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: headingMatch[2], bold: true, size: 28 - level * 2 })],
              heading: 'Heading' + level
            }));
            continue;
          }
          // 粗体/斜体/普通文本
          const parts = remaining.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
              runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
            } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
            } else {
              runs.push(new TextRun(part));
            }
          }
          paragraphs.push(new Paragraph({ children: runs }));
        } else {
          paragraphs.push(new Paragraph(trimmed));
        }
      }
    }
    if (!paragraphs.length) paragraphs.push(new Paragraph(''));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    return blob;
  }

  throw new Error('该转换组合暂不支持');
}

export async function mergeDocs(files, target, customName) {
  let contents = [];
  for (const f of files) {
    const ext = getExt(f.name);
    if (ext === 'docx') {
      const ab = await f.arrayBuffer();
      const r = await mammoth.extractRawText({ arrayBuffer: ab });
      contents.push(r.value);
    } else if (['txt', 'md', 'html'].includes(ext)) {
      const text = await f.text();
      contents.push(text);
    } else {
      throw new Error('仅支持 TXT/MD/HTML/DOCX 文件合并');
    }
  }
  const joined = contents.join('\n\n---\n\n');
  const mime = target === 'html' ? 'text/html' : 'text/plain';
  const ext = target === 'html' ? 'html' : 'txt';
  const name = customName || ('merged.' + ext);
  return { blob: new Blob([joined], { type: mime + ';charset=utf-8' }), name };
}
