import Anthropic from '@anthropic-ai/sdk'

// 允許較大的 request body（照片 base64）
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `你是一位專業的大學推甄備審資料撰寫顧問，專精協助學生撰寫朝陽科技大學企業管理系備審資料。

根據學生的社團資訊，撰寫符合企管系審查委員期待的「社團活動與學習歷程」文案。

文案要求：
1. 展現學生的領導力、溝通協調能力、團隊合作精神等企管系重視的核心特質
2. 將社團職務與企業管理概念連結（社長→領導統御；副社長→協調溝通；幹部→專案執行）
3. 強調從社團經驗中習得的管理思維與實務能力
4. 語氣誠懇、具體、有說服力，約 250～350 字
5. 直接輸出文案段落，不需要標題或額外說明`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    studentName, schoolName, clubType, position, experience,
    photoBase64, photoType,
    adjustInstruction, currentContent,
    regenMode,
  } = req.body

  try {
    let messages

    // ── 模式一：調整既有文案 ──
    if (adjustInstruction && currentContent) {
      messages = [{
        role: 'user',
        content: `以下是目前的備審文案，請依照指示調整後，直接輸出修改後的完整文案（不要說明修改了什麼）：\n\n指示：${adjustInstruction}\n\n目前文案：\n${currentContent}`,
      }]

    // ── 模式二：重新生成（換角度）──
    } else if (regenMode) {
      messages = [{
        role: 'user',
        content: `請重新撰寫一版朝陽科技大學企管系推甄備審的社團活動文案。
學生姓名：${studentName}，就讀學校：${schoolName}
社團類型：${clubType}，擔任職務：${position}
社團經驗：${experience}

請換一個不同的切入角度撰寫，風格與標準版本有所差異，約 300 字，直接輸出文案。`,
      }]

    // ── 模式三：首次生成 ──
    } else {
      const userContent = []

      // 若有附上照片
      if (photoBase64 && photoType) {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: photoType, data: photoBase64 },
        })
      }

      userContent.push({
        type: 'text',
        text: `【學生姓名】${studentName}
【就讀學校】${schoolName}
【社團類型】${clubType}
【擔任職務】${position}
【社團經驗與反思】
${experience}${photoBase64 ? '\n\n（已附上活動照片，請適當參考照片情境融入文案描述）' : ''}

請撰寫朝陽科技大學企管系推甄備審的社團活動文案。`,
      })

      messages = [{ role: 'user', content: userContent }]
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content.map(b => b.text || '').join('').trim()
    if (!text) throw new Error('API 回應內容為空')

    res.status(200).json({ text })

  } catch (err) {
    console.error('[generate] error:', err.message)
    res.status(500).json({ error: err.message || '伺服器錯誤' })
  }
}
