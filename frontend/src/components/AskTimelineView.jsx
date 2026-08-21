import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, ShieldCheck, Database, Bot, Trash2 } from 'lucide-react'

export default function AskTimelineView() {
  const [query, setQuery] = useState('')
  const messagesEndRef = useRef(null)
  const [expandedRecords, setExpandedRecords] = useState({})

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "### 👋 Hello! I'm ORVEYRA AI\n\nI am your intelligent health assistant. I can have natural, fluidly intelligent conversations about anything — casual chat, science, jokes, creative writing, or personalized health pattern analysis!\n\nI correlate your **cycle dates**, **sleep telemetry**, **physical symptoms**, and **lab biomarkers** in real time to help you understand your body's clues. Ask me anything! 🚀",
      grounded_records: [],
      confidence: 'STRONG SIGNAL',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleClearChat = async () => {
    try {
      await fetch('/api/ai/clear-chat', { method: 'POST' })
    } catch (e) {}
    setMessages([{
      sender: 'ai',
      text: "### 🔄 Chat Cleared\n\nConversation memory has been reset. Ready for a fresh start! What would you like to talk about?",
      grounded_records: [],
      confidence: 'STRONG SIGNAL',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault()
    const textToSend = textOverride || query
    if (!textToSend.trim() || loading) return

    const sendTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setQuery('')
    setMessages(prev => [...prev, { sender: 'user', text: textToSend, timestamp: sendTime }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/ask-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      })
      const data = await res.json()
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer,
          grounded_records: data.grounded_records_used || [],
          confidence: data.confidence || 'STRONG SIGNAL',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "### ⚠️ Connection Error\n\nUnable to reach the backend server. Please make sure the backend is running on port 8000.",
          grounded_records: [],
          confidence: 'ERROR',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const starterTopics = [
    { label: "👋 Hey! Who are you?", query: "Hey! Who are you and what can you do?" },
    { label: "😄 Tell me a joke", query: "Tell me a funny joke!" },
    { label: "⚡ Why am I tired?", query: "Why am I so tired during my period? Analyze my sleep and iron levels." },
    { label: "🌊 Write me a poem", query: "Write me a short, beautiful poem about strength and resilience" },
    { label: "✨ Full Health Analysis", query: "Give me a comprehensive analysis of my overall health trends" },
    { label: "🔬 Lab Biomarkers", query: "Summarize my lab biomarker results and flag anything concerning" },
    { label: "🩺 Doctor Prep", query: "What questions should I bring to my next doctor visit?" },
    { label: "🩸 Cycle Analysis", query: "Analyze my cycle patterns and flag any irregularities" }
  ]

  const renderFormattedMarkdown = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return (
      <div className="space-y-1.5 text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm sm:text-base font-extrabold text-rosegold-300 pt-1 pb-0.5 border-b border-amethyst-800/40">
                {line.replace('### ', '')}
              </h3>
            )
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-100 pt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rosegold-400" />
                <span>{line.replace('#### ', '')}</span>
              </h4>
            )
          }
          if (line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amethyst-400 mt-1.5 shrink-0" />
                <span className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line.replace('- ', '')) }} />
              </div>
            )
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+\.)\s/)[1]
            const rest = line.replace(/^\d+\.\s/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-bold text-rosegold-400 shrink-0">{num}</span>
                <span className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(rest) }} />
              </div>
            )
          }
          if (line.startsWith('> ')) {
            return (
              <div key={idx} className="p-3 rounded-xl bg-amethyst-900/90 border-l-4 border-rosegold-400 text-xs italic text-slate-200 shadow-md">
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace('> ', '')) }} />
              </div>
            )
          }
          if (!line.trim()) return <div key={idx} className="h-1" />
          return <p key={idx} className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        })}
      </div>
    )
  }

  const formatInline = (str) => {
    let out = str
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    out = out.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-amethyst-900 text-rosegold-300 font-mono text-[11px] border border-amethyst-700/60">$1</code>')
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-rosegold-300 underline hover:text-rosegold-200">$1</a>')
    out = out.replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    return out
  }

  const toggleRecordExpand = (msgIdx) => {
    setExpandedRecords(prev => ({ ...prev, [msgIdx]: !prev[msgIdx] }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Bot className="w-6 h-6 text-rosegold-400" />
            <span>ORVEYRA AI Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conversational Health Intelligence • Multi-turn memory
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-full bg-amethyst-900/80 hover:bg-red-900/40 border border-amethyst-700/60 text-xs text-slate-300 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="px-3 py-1.5 rounded-full bg-amethyst-900/80 border border-amethyst-700/60 text-xs text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PII Redacted</span>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 flex flex-col h-[560px] justify-between">
        
        {/* Messages Scroll Area */}
        <div className="overflow-y-auto space-y-4 pr-2 scrollbar-thin flex-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-lg transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white rounded-br-sm'
                    : 'bg-amethyst-950/95 border border-amethyst-700/60 text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-amethyst-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-extrabold tracking-wider gradient-text">
                        ORVEYRA AI
                      </span>
                      {msg.timestamp && (
                        <span className="text-[10px] text-slate-500 ml-1">{msg.timestamp}</span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {(msg.confidence && !msg.confidence.toLowerCase().includes('gemini') && !msg.confidence.toLowerCase().includes('live ai')) ? msg.confidence : 'ORVEYRA INTELLIGENCE'}
                    </span>
                  </div>
                )}

                {msg.sender === 'user' ? (
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-sm">{msg.text}</p>
                    {msg.timestamp && (
                      <span className="text-[10px] text-white/60 shrink-0">{msg.timestamp}</span>
                    )}
                  </div>
                ) : (
                  renderFormattedMarkdown(msg.text)
                )}

                {/* Grounded Records */}
                {msg.grounded_records && msg.grounded_records.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-amethyst-800/80 space-y-1.5">
                    <button
                      onClick={() => toggleRecordExpand(idx)}
                      className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 hover:text-rosegold-300 transition-colors cursor-pointer"
                    >
                      <Database className="w-3 h-3 text-rosegold-400" />
                      Evidence Records ({msg.grounded_records.length})
                      <span className="text-[10px] ml-1">{expandedRecords[idx] ? '▼' : '▶'}</span>
                    </button>
                    {expandedRecords[idx] && (
                      <div className="flex flex-wrap gap-1 pt-0.5 animate-in fade-in duration-200">
                        {msg.grounded_records.map((r, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-amethyst-900 border border-amethyst-700/60 text-slate-300 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              r.type === 'cycle' ? 'bg-pink-400' :
                              r.type === 'symptom' ? 'bg-amber-400' :
                              r.type === 'biomarker' ? 'bg-cyan-400' :
                              r.type === 'lifestyle' ? 'bg-emerald-400' :
                              r.type === 'body_drift_flag' ? 'bg-red-400' :
                              'bg-slate-400'
                            }`} />
                            {r.type || 'log'}: {r.start_date || r.date || r.test_name || r.metric || 'entry'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="flex items-center gap-2 text-xs text-rosegold-300 p-3 rounded-2xl rounded-bl-sm bg-amethyst-950/95 border border-amethyst-700/60 w-fit">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-bounce" style={{animationDelay: '0ms'}} />
                  <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-bounce" style={{animationDelay: '150ms'}} />
                  <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Topics */}
        <div className="pt-3 pb-2 border-t border-amethyst-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {starterTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={(e) => handleSend(e, topic.query)}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-xl bg-amethyst-900/80 hover:bg-amethyst-800 border border-amethyst-700/60 text-[11px] font-medium text-slate-200 whitespace-nowrap transition-all hover:border-rosegold-500/50 disabled:opacity-50 cursor-pointer"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Ask me anything... health, jokes, poems, science, whatever you want!"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-sm shadow-lg transition-all glow-purple flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
