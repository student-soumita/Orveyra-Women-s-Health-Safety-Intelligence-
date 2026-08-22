import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Send, Sparkles, ShieldCheck, Database, Bot, Trash2,
  Copy, Check, WifiOff, RefreshCw, Zap
} from "lucide-react"

function formatInline(str) {
  let out = str
  out = out.replace(/\*\*(.*?)\*\*/g, "<strong class=\"text-slate-100 font-semibold\">$1</strong>")
  out = out.replace(/`(.*?)`/g, "<code class=\"px-1.5 py-0.5 rounded bg-amethyst-900 text-rosegold-300 font-mono text-[11px] border border-amethyst-700/60\">$1</code>")
  out = out.replace(/\[(.*?)\]\((.*?)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener\" class=\"text-rosegold-300 underline hover:text-rosegold-200\">$1</a>")
  out = out.replace(/\*(.*?)\*/g, "<em class=\"text-slate-300\">$1</em>")
  return out
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="rounded-xl overflow-hidden border border-amethyst-700/60 my-1.5">
      <div className="flex items-center justify-between px-3 py-1.5 bg-amethyst-900/80 border-b border-amethyst-700/60">
        <span className="text-[10px] font-mono text-slate-400 uppercase">{lang || "code"}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rosegold-300 transition-colors cursor-pointer">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-slate-200 bg-amethyst-950/80 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-amethyst-800/60 text-slate-500 hover:text-rosegold-300 transition-colors cursor-pointer" title="Copy message">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex items-center gap-2 text-xs text-rosegold-300 p-3 rounded-2xl rounded-bl-sm bg-amethyst-950/95 border border-amethyst-700/60 w-fit shadow-lg">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="flex gap-1">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="w-2 h-2 rounded-full bg-rosegold-400 animate-bounce" style={{ animationDelay: delay + "ms" }} />
          ))}
        </div>
        <span className="text-slate-400 text-[11px]">Thinking...</span>
      </div>
    </div>
  )
}

function MarkdownRenderer({ text }) {
  if (!text) return null
  const lines = text.split("\n")
  const segments = []
  let currentLines = []
  let inCode = false, codeLang = "", codeLines = []

  const flush = () => { if (currentLines.length) { segments.push({ type: "lines", lines: [...currentLines] }); currentLines = [] } }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) { flush(); inCode = true; codeLang = line.slice(3).trim(); codeLines = [] }
      else { segments.push({ type: "code", lang: codeLang, code: codeLines.join("\n") }); inCode = false }
      continue
    }
    if (inCode) codeLines.push(line)
    else currentLines.push(line)
  }
  if (inCode) segments.push({ type: "code", lang: codeLang, code: codeLines.join("\n") })
  flush()

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {segments.map((seg, si) => {
        if (seg.type === "code") return <CodeBlock key={si} lang={seg.lang} code={seg.code} />
        return seg.lines.map((line, idx) => {
          const key = si + "-" + idx
          if (line.startsWith("### ")) return <h3 key={key} className="text-sm sm:text-base font-extrabold text-rosegold-300 pt-1.5 pb-0.5 border-b border-amethyst-800/40">{line.replace("### ","")}</h3>
          if (line.startsWith("#### ")) return <h4 key={key} className="text-xs sm:text-sm font-bold text-slate-100 pt-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rosegold-400 shrink-0" /><span>{line.replace("#### ","")}</span></h4>
          if (line.startsWith("## ")) return <h2 key={key} className="text-sm font-extrabold text-rosegold-200 pt-2 pb-0.5 border-b border-rosegold-700/30">{line.replace("## ","")}</h2>
          if (line.startsWith("# ")) return <h1 key={key} className="text-base font-black text-white pt-2">{line.replace("# ","")}</h1>
          if (line.startsWith("---")) return <hr key={key} className="border-amethyst-800/60 my-2" />
          if (line.startsWith("- ")) return <div key={key} className="flex items-start gap-2 pl-2"><span className="w-1.5 h-1.5 rounded-full bg-amethyst-400 mt-1.5 shrink-0" /><span className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line.replace("- ","")) }} /></div>
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+\.)\s/)[1]
            const rest = line.replace(/^\d+\.\s/,"")
            return <div key={key} className="flex items-start gap-2 pl-2"><span className="font-bold text-rosegold-400 shrink-0">{num}</span><span className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(rest) }} /></div>
          }
          if (line.startsWith("> ")) return <div key={key} className="p-3 rounded-xl bg-amethyst-900/90 border-l-4 border-rosegold-400 text-xs italic text-slate-200 shadow-md"><span dangerouslySetInnerHTML={{ __html: formatInline(line.replace("> ","")) }} /></div>
          if (!line.trim()) return <div key={key} className="h-1" />
          return <p key={key} className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        })
      })}
    </div>
  )
}

export default function AskTimelineView() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState([{
    sender: "ai",
    text: "### Hello! I am ORVEYRA Health Guide\n\nI am your intelligent health and safety companion powered by **ORVEYRA**. I can have rich, natural conversations on **any topic** — casual chat, jokes, science, coding, creative writing — plus personalized analysis of your:\n\n- **Cycle patterns** and menstrual health\n- **Sleep telemetry** and lifestyle signals\n- **Lab biomarkers** and abnormal flags\n- **Healthcare provider** recommendations\n\nAsk me anything!",
    grounded_records: [],
    confidence: "ORVEYRA INTELLIGENCE",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }])
  const [loading, setLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState(null)
  const [expandedRecords, setExpandedRecords] = useState({})
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/ai/status", { headers: { Authorization: "Bearer " + (localStorage.getItem("token") || "") } })
        if (res.ok) { const d = await res.json(); setAiStatus(d.ai_connected ? "active" : "standby") }
        else setAiStatus("standby")
      } catch { setAiStatus("standby") }
    }
    check()
  }, [])

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + (localStorage.getItem("token") || "")
  }), [])

  const handleClearChat = async () => {
    try { await fetch("/api/ai/clear-chat", { method: "POST", headers: getHeaders() }) } catch {}
    setMessages([{ sender: "ai", text: "### Chat Cleared\n\nConversation memory reset. Ready for a fresh start!", grounded_records: [], confidence: "ORVEYRA INTELLIGENCE", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])
    setExpandedRecords({})
    inputRef.current?.focus()
  }

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault()
    const txt = (textOverride || query).trim()
    if (!txt || loading) return
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setQuery("")
    setMessages(prev => [...prev, { sender: "user", text: txt, timestamp: ts }])
    setLoading(true)
    try {
      const res = await fetch("/api/ai/ask-timeline", { method: "POST", headers: getHeaders(), body: JSON.stringify({ query: txt }) })
      if (!res.ok) {
        let msg = "Server error (" + res.status + ")"
        try { const d = await res.json(); msg = d.detail || msg } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      setAiStatus("active")
      setMessages(prev => [...prev, { sender: "ai", text: data.answer || "No response.", grounded_records: data.grounded_records_used || [], confidence: data.confidence || "ORVEYRA INTELLIGENCE", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])
    } catch (err) {
      const isAuth = err.message?.includes("401") || err.message?.includes("Not authenticated")
      setMessages(prev => [...prev, { sender: "ai", text: isAuth ? "### Authentication Required\n\nPlease log in to use ORVEYRA Health Guide." : "### Connection Error\n\n" + (err.message || "Unable to reach the backend."), grounded_records: [], confidence: "ERROR", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(null) } }
  const toggleRecord = (i) => setExpandedRecords(prev => ({ ...prev, [i]: !prev[i] }))

  const topics = [
    { label: "Who are you?", query: "Who are you and what can you do?" },
    { label: "Tell a joke", query: "Tell me a good joke!" },
    { label: "Find Clinics", query: "Show me verified healthcare centers and clinics" },
    { label: "Gynecologists", query: "Find top gynecologists and women's health clinics near me" },
    { label: "Endocrinologists", query: "Recommend endocrinologists and thyroid specialists" },
    { label: "Mental Health", query: "Find mental health clinics and therapists for PMDD and stress" },
    { label: "Nutrition", query: "Find clinical dietitians and nutritionists for PCOS" },
    { label: "Why am I tired?", query: "Why am I so tired lately? Analyze my sleep and iron levels." },
    { label: "Lab Results", query: "Summarize my lab biomarker results and flag any abnormalities" },
    { label: "Doctor Prep", query: "What questions should I bring to my next doctor visit?" },
    { label: "Stress & Hormones", query: "How does stress affect my cycle and hormones?" },
    { label: "PCOS Info", query: "Explain common treatments for PCOS and lifestyle changes" },
  ]

  const badgeColor = (c = "") => {
    if (c === "ERROR") return "bg-red-500/20 text-red-300 border-red-500/40"
    if (c.includes("CARE")) return "bg-blue-500/20 text-blue-300 border-blue-500/40"
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Bot className="w-6 h-6 text-rosegold-400" />
            ORVEYRA Health Guide
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Conversational Clinical • Multi-turn memory</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={"px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition-all " + (aiStatus === "active" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : aiStatus === "standby" ? "bg-amber-500/10 border-amber-500/40 text-amber-300" : "bg-amethyst-900/80 border-amethyst-700/60 text-slate-400")}>
            {aiStatus === "active" ? <><Zap className="w-3.5 h-3.5" /><span>Live</span></> : aiStatus === "standby" ? <><WifiOff className="w-3.5 h-3.5" /><span>Standby</span></> : <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Connecting...</span></>}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-amethyst-900/80 border border-amethyst-700/60 text-xs text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>PII Redacted</span>
          </div>
          <button onClick={handleClearChat} disabled={loading} className="px-3 py-1.5 rounded-full bg-amethyst-900/80 hover:bg-red-900/40 border border-amethyst-700/60 text-xs text-slate-300 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /><span>Clear</span>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 flex flex-col h-[580px]">
        <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin flex-1 min-h-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={"flex flex-col " + (msg.sender === "user" ? "items-end" : "items-start")}>
              <div className={"max-w-[88%] p-4 rounded-2xl shadow-lg " + (msg.sender === "user" ? "bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white rounded-br-sm" : "bg-amethyst-950/95 border border-amethyst-700/60 text-slate-200 rounded-bl-sm")}>
                {msg.sender === "ai" && (
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-amethyst-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-extrabold tracking-wider gradient-text">ORVEYRA</span>
                      {msg.timestamp && <span className="text-[10px] text-slate-500 ml-1">{msg.timestamp}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={"text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 " + badgeColor(msg.confidence)}>
                        <Sparkles className="w-2.5 h-2.5" />{msg.confidence === "ERROR" ? "ERROR" : "ORVEYRA"}
                      </span>
                      <CopyBtn text={msg.text} />
                    </div>
                  </div>
                )}
                {msg.sender === "user" ? (
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.timestamp && <span className="text-[10px] text-white/60 shrink-0">{msg.timestamp}</span>}
                  </div>
                ) : <MarkdownRenderer text={msg.text} />}
                {msg.grounded_records && msg.grounded_records.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-amethyst-800/80 space-y-1.5">
                    <button onClick={() => toggleRecord(idx)} className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 hover:text-rosegold-300 transition-colors cursor-pointer">
                      <Database className="w-3 h-3 text-rosegold-400" />Evidence Records ({msg.grounded_records.length})<span className="ml-1">{expandedRecords[idx] ? "v" : ">"}</span>
                    </button>
                    {expandedRecords[idx] && (
                      <div className="flex flex-wrap gap-1 pt-0.5 animate-in fade-in duration-200">
                        {msg.grounded_records.map((r, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-amethyst-900 border border-amethyst-700/60 text-slate-300 flex items-center gap-1">
                            <span className={"w-1.5 h-1.5 rounded-full " + (r.type === "cycle" ? "bg-pink-400" : r.type === "symptom" ? "bg-amber-400" : r.type === "biomarker" ? "bg-cyan-400" : r.type === "lifestyle" ? "bg-emerald-400" : "bg-slate-400")} />
                            {r.type || "log"}: {r.start_date || r.date || r.test_name || r.metric || "entry"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-3 pb-2 border-t border-amethyst-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {topics.map((t, idx) => (
              <button key={idx} onClick={(e) => handleSend(e, t.query)} disabled={loading} className="px-2.5 py-1.5 rounded-xl bg-amethyst-900/80 hover:bg-amethyst-800 border border-amethyst-700/60 text-[11px] font-medium text-slate-200 whitespace-nowrap transition-all hover:border-rosegold-500/50 hover:text-rosegold-200 disabled:opacity-50 cursor-pointer">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-1">
          <textarea
            ref={inputRef}
            placeholder="Ask me anything — health, jokes, science, life advice… (Enter to send)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            className="flex-1 px-4 py-3 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500 disabled:opacity-50 resize-none overflow-hidden"
            style={{ minHeight: "48px", maxHeight: "120px" }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px" }}
          />
          <button type="submit" disabled={loading || !query.trim()} className="px-5 py-3 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-sm shadow-lg transition-all glow-purple flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      <p className="text-center text-[10px] text-slate-500 pb-1">ORVEYRA AI provides informational insights only, not medical diagnosis. Always consult a qualified healthcare provider.</p>
    </div>
  )
}
