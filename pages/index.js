import { useState, useRef } from 'react'
import Head from 'next/head'

const ADJUST_MAP = {
  formal:     '請將文案語氣調整得更正式、更符合學術備審風格，維持約 300 字',
  warm:       '請將文案語氣調整得更親切自然、真誠，減少制式用語，維持約 300 字',
  concise:    '請將文案精簡至約 200 字，保留最核心的亮點',
  expand:     '請將文案擴充至約 400 字，加入更多細節描述與反思',
  management: '請在文案中更明確地連結企業管理的專業概念（如 PDCA、SWOT、領導理論），維持約 300 字',
}

const CHIPS = [
  { label: '換個開頭', instruction: '開頭改為從具體事件切入，更有畫面感' },
  { label: '加入數據', instruction: '加入更多數據佐證，例如活動參與人數、滿意度等' },
  { label: '強化結尾', instruction: '結尾改為對企管系課程的期待與具體連結' },
  { label: '口吻自然', instruction: '將語氣調整得更像大學生寫作，自然真誠' },
]

export default function Home() {
  // 表單狀態
  const [studentName, setStudentName] = useState('')
  const [schoolName,  setSchoolName]  = useState('')
  const [clubType,    setClubType]    = useState('')
  const [position,    setPosition]    = useState('')
  const [experience,  setExperience]  = useState('')
  const [photoBase64, setPhotoBase64] = useState(null)
  const [photoType,   setPhotoType]   = useState(null)
  const [photoName,   setPhotoName]   = useState('')

  // UI 狀態
  const [outputText,  setOutputText]  = useState('')
  const [loading,     setLoading]     = useState(false)
  const [wordLoading, setWordLoading] = useState(false)
  const [error,       setError]       = useState('')
  const [showOutput,  setShowOutput]  = useState(false)

  const photoInputRef  = useRef(null)
  const outputRef      = useRef(null)
  const toastRef       = useRef(null)

  // ── 照片上傳 ──
  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('照片檔案超過 5MB，請壓縮後再上傳')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target.result
      setPhotoBase64(result.split(',')[1])
      setPhotoType(file.type)
      setPhotoName(file.name)
      setError('')
    }
    reader.onerror = () => setError('照片讀取失敗，請換一張圖片')
    reader.readAsDataURL(file)
  }

  // ── 呼叫後端 API 生成文案 ──
  async function callGenerate(payload) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失敗')
      return data.text
    } catch (err) {
      setError('生成失敗：' + err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // ── 生成備審文案 ──
  async function handleGenerate() {
    if (!studentName || !schoolName || !clubType || !position || !experience) {
      setError('請填寫所有必填欄位')
      return
    }
    const text = await callGenerate({
      studentName, schoolName, clubType, position, experience,
      photoBase64, photoType,
    })
    if (text) {
      setOutputText(text)
      setShowOutput(true)
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  // ── 調整文案 ──
  async function handleAdjust(instruction) {
    if (!outputText.trim()) return
    const text = await callGenerate({ adjustInstruction: instruction, currentContent: outputText })
    if (text) setOutputText(text)
  }

  // ── 重新生成 ──
  async function handleRegen() {
    const text = await callGenerate({
      studentName, schoolName, clubType, position, experience,
      photoBase64, photoType,
      regenMode: true,
    })
    if (text) setOutputText(text)
  }

  // ── 輸出 Word ──
  async function handleExportWord() {
    if (!outputText.trim()) return
    setWordLoading(true)
    try {
      const res = await fetch('/api/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: outputText,
          studentName, schoolName, clubType, position,
          photoBase64, photoType,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || '輸出失敗')
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `備審資料_${studentName || '社團活動'}.docx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('✓ Word 檔已下載！')
    } catch (err) {
      setError('Word 輸出失敗：' + err.message)
    } finally {
      setWordLoading(false)
    }
  }

  // ── 複製 ──
  function handleCopy() {
    navigator.clipboard.writeText(outputText).then(() => showToast('✓ 已複製到剪貼簿'))
  }

  // ── 清除 ──
  function handleClear() {
    setStudentName(''); setSchoolName('')
    setClubType('');    setPosition('')
    setExperience('');  setOutputText('')
    setPhotoBase64(null); setPhotoType(null); setPhotoName('')
    setShowOutput(false); setError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  // ── Toast ──
  function showToast(msg) {
    const el = toastRef.current
    if (!el) return
    el.textContent = msg
    el.classList.add('show')
    setTimeout(() => el.classList.remove('show'), 2400)
  }

  return (
    <>
      <Head>
        <title>備審資料產生器｜朝陽科技大學企管系</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-wrap">

        {/* ── Header ── */}
        <header className="site-header">
          <p className="school">朝陽科技大學 · 企業管理系</p>
          <h1>推甄備審資料｜社團活動文案產生器</h1>
          <p className="sub">CLUB ACTIVITY PORTFOLIO GENERATOR</p>
        </header>

        {/* ── 學生基本資料 ── */}
        <div className="section-card">
          <div className="section-label">學生基本資料</div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="studentName">姓名 *</label>
              <input
                id="studentName" type="text"
                placeholder="請輸入姓名"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="schoolName">就讀高中職 *</label>
              <input
                id="schoolName" type="text"
                placeholder="請輸入學校名稱"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── 社團基本資料 ── */}
        <div className="section-card">
          <div className="section-label">社團基本資料</div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="clubType">社團類型 *</label>
              <select id="clubType" value={clubType} onChange={e => setClubType(e.target.value)}>
                <option value="">請選擇...</option>
                <option value="體育型">體育型</option>
                <option value="學習型">學習型</option>
                <option value="服務型">服務型</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="position">擔任職務 *</label>
              <select id="position" value={position} onChange={e => setPosition(e.target.value)}>
                <option value="">請選擇...</option>
                <option value="社長">社長</option>
                <option value="副社長">副社長</option>
                <option value="幹部">幹部</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 社團經驗 ── */}
        <div className="section-card">
          <div className="section-label">社團經驗與反思 *</div>
          <textarea
            placeholder="請簡要描述您在社團中的經驗、承擔的責任、遇到的挑戰，以及從中獲得的學習與反思…（建議 100～300 字）"
            value={experience}
            onChange={e => setExperience(e.target.value)}
          />
        </div>

        {/* ── 照片上傳 ── */}
        <div className="section-card">
          <div className="section-label">社團活動照片（選填）</div>
          <label className="upload-label" htmlFor="photoInput">
            <div className={`upload-zone${photoBase64 ? ' has-photo' : ''}`}>
              <div className="icon">{photoBase64 ? '✅' : '📷'}</div>
              <p>{photoBase64 ? `已載入：${photoName}` : '點擊此處選擇照片（JPG / PNG，5MB 以內）'}</p>
            </div>
          </label>
          <input
            ref={photoInputRef}
            type="file" id="photoInput" accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />
          {photoBase64 && (
            <img
              src={`data:${photoType};base64,${photoBase64}`}
              alt="活動照片預覽"
              className="upload-preview visible"
            />
          )}
          {photoBase64 && (
            <button
              className="change-photo-btn visible"
              onClick={() => photoInputRef.current?.click()}
            >
              更換照片
            </button>
          )}
        </div>

        {/* ── 錯誤訊息 ── */}
        {error && <div className="error-box visible">⚠ {error}</div>}

        {/* ── Loading bar ── */}
        <div className={`loading-bar${loading ? ' visible' : ''}`}>
          <div className="loading-fill" />
        </div>

        {/* ── 操作按鈕 ── */}
        <div className="btn-row">
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? '生成中，請稍候…' : '✦ 生成備審文案'}
          </button>
          <button className="btn-clear" onClick={handleClear}>🗑 清除重填</button>
        </div>

        {/* ── 輸出對話框 ── */}
        {showOutput && (
          <div className="output-section visible" ref={outputRef}>
            <div className="output-header">
              <span className="title">✦ 備審文案編輯</span>
              <span className="badge">可直接修改內容</span>
            </div>

            <div className="output-toolbar">
              {Object.entries(ADJUST_MAP).map(([key, instruction]) => (
                <button
                  key={key}
                  className="tool-btn"
                  disabled={loading}
                  onClick={() => handleAdjust(instruction)}
                >
                  {{ formal:'更正式', warm:'更親切', concise:'更精簡', expand:'加強內容', management:'強調管理能力' }[key]}
                </button>
              ))}
              <span className="word-count">{outputText.length} 字</span>
            </div>

            <textarea
              className="output-editor"
              value={outputText}
              onChange={e => setOutputText(e.target.value)}
              placeholder="文案內容將顯示於此…"
            />

            <div className="chips-area">
              <div className="chips-label">快速修改</div>
              <div className="chips">
                {CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    className="chip"
                    disabled={loading}
                    onClick={() => handleAdjust(chip.instruction)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="output-footer">
              <button className="btn-regen" disabled={loading} onClick={handleRegen}>
                ↺ 重新生成
              </button>
              <button className="btn-word" disabled={wordLoading} onClick={handleExportWord}>
                <span className="word-icon" />
                {wordLoading ? '輸出中…' : '輸出 Word'}
              </button>
              <button className="btn-copy" onClick={handleCopy}>複製</button>
            </div>
          </div>
        )}

      </div>

      <div className="toast" ref={toastRef} />
    </>
  )
}
