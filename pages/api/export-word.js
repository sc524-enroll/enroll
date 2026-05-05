import {
  Document, Packer, Paragraph, TextRun, ImageRun,
  AlignmentType, BorderStyle, Footer,
} from 'docx'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    content, studentName, schoolName,
    clubType, position,
    photoBase64, photoType,
  } = req.body

  if (!content) {
    return res.status(400).json({ error: '文案內容不能為空' })
  }

  try {
    const paragraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)

    const footerPara = new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 6 } },
      children: [
        new TextRun({
          text: `姓名：${studentName || ''}　｜　就讀學校：${schoolName || ''}　｜　社團類型：${clubType || ''}　｜　職務：${position || ''}`,
          font: '標楷體', size: 18, color: '888888',
        }),
      ],
    })

    const children = []

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a2744', space: 8 } },
        children: [
          new TextRun({ text: '朝陽科技大學企業管理系', font: '標楷體', size: 32, bold: true, color: '1a2744' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 60 },
        children: [
          new TextRun({ text: '推甄備審資料 — 社團活動學習歷程', font: '標楷體', size: 28, bold: true, color: '1a2744' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 360 },
        children: [
          new TextRun({
            text: `社團類型：${clubType || ''}　｜　擔任職務：${position || ''}`,
            font: '標楷體', size: 22, color: '888888',
          }),
        ],
      }),
    )

    if (photoBase64 && photoType) {
      try {
        const photoBuffer = Buffer.from(photoBase64, 'base64')
        const imgType = photoType.includes('png') ? 'png' : 'jpg'
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new ImageRun({
                data: photoBuffer,
                type: imgType,
                transformation: { width: 300, height: 400 },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
            children: [
              new TextRun({ text: '▲ 社團活動照片', font: '標楷體', size: 18, color: '888888', italics: true }),
            ],
          }),
        )
      } catch (imgErr) {
        console.warn('照片插入失敗，略過：', imgErr.message)
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 0, after: 200 },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: '1a2744', space: 8 } },
        children: [
          new TextRun({ text: '  社團活動與學習歷程', font: '標楷體', size: 26, bold: true, color: '1a2744' }),
        ],
      }),
    )

    paragraphs.forEach(text => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 0, after: 240, line: 432, lineRule: 'auto' },
          indent: { firstLine: 480 },
          children: [new TextRun({ text, font: '標楷體', size: 24 })],
        }),
      )
    })

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: '標楷體', size: 24, color: '1a1a1a' } },
        },
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1200, left: 1800 },
          },
        },
        footers: { default: new Footer({ children: [footerPara] }) },
        children,
      }],
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`備審資料_${studentName || '社團活動'}.docx`)}`)
    res.status(200).send(buffer)

  } catch (err) {
    console.error('[export-word] error:', err.message)
    res.status(500).json({ error: err.message || 'Word 輸出失敗' })
  }
}
