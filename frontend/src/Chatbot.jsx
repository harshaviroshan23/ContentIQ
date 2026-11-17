
import { useState, useRef, useEffect } from 'react'
import {
  Bot, Send, X, Sparkles, MessageCircle,
  User, Trash2, LoaderCircle
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

const suggestions = [
  'Which platform performs best?',
  'What should I post next?',
  'Summarise my content performance',
  'Give me a 7-day content strategy'
]

const welcomeMessage = {
  role: 'assistant',
  text: "Hey! I'm ContentIQ AI. I can analyse your content, explain performance trends, compare platforms and help you build better content strategies. What would you like to explore?"
}

export default function Chatbot({ content = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([welcomeMessage])
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const historyRef = useRef([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages, loading, isOpen])

  const sendMessage = async (text = message) => {
    const question = text.trim()

    if (!question || loading) return

    const previousHistory = [...historyRef.current]

    const userMessage = {
      role: 'user',
      text: question
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: question,
          content,
          history: previousHistory
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to get a response from ContentIQ AI.'
        )
      }

      const assistantMessage = {
        role: 'assistant',
        text: data.reply
      }

      // Update conversation history only after a successful response.
      historyRef.current = [
        ...previousHistory,
        userMessage,
        assistantMessage
      ].slice(-12)

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('ContentIQ chatbot error:', error)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn't complete that request. ${error.message || 'Please check your backend connection and try again.'}`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    historyRef.current = []
    setMessages([welcomeMessage])
    setMessage('')
  }

  return (
    <>
      {!isOpen && (
        <button
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open ContentIQ assistant"
        >
          <MessageCircle size={23} />
          <span>Ask ContentIQ</span>
          <span className="chatbot-launcher-dot" />
        </button>
      )}

      {isOpen && (
        <section className="chatbot-window">
          <header className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Bot size={21} />
              </div>

              <div>
                <strong>ContentIQ AI</strong>
                <span>
                  <span className="chatbot-online-dot" />
                  Conversational AI assistant
                </span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                onClick={clearChat}
                title="Clear conversation"
                disabled={loading}
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <div
                className={`chatbot-message ${item.role}`}
                key={index}
              >
                <div className="chatbot-message-avatar">
                  {item.role === 'assistant'
                    ? <Bot size={16} />
                    : <User size={16} />}
                </div>

                <div className="chatbot-message-content">
                  {item.text}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="chatbot-suggestions">
                <span>TRY ASKING</span>

                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading}
                  >
                    <Sparkles size={13} />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-message-avatar">
                  <Bot size={16} />
                </div>

                <div className="chatbot-typing">
                  <LoaderCircle size={15} />
                  ContentIQ is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="chatbot-input-area"
            onSubmit={event => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <input
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Ask ContentIQ anything about content..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Send message"
            >
              {loading
                ? <LoaderCircle size={17} />
                : <Send size={17} />}
            </button>
          </form>

          <div className="chatbot-footer">
            ContentIQ AI · Powered by Gemini · Dataset-connected
          </div>
        </section>
      )}
    </>
  )
}
