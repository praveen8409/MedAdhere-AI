import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  Pill, 
  Clock, 
  Package, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Database,
  Globe
} from 'lucide-react';
import { api } from '../api';

/**
 * AI HEALTH CHATBOT (DYNAMIC REAL-TIME AI)
 * Connects to Spring Boot Dual-Engine Function Calling (/api/ai/advise):
 *   - Engine 1: Live H2 Database Grounding (Prescriptions, Stock, Adherence, Queue)
 *   - Engine 2: Outer Source Medical Knowledge & openFDA Web Retrieval
 *   - Emergency Intercept Guardrail with 108/911 Alerts
 *   - Speech-to-Text (Microphone) & Text-to-Speech (Voice Synthesizer for Patients)
 */
export default function AiHealthChatbot({ 
  currentUser, 
  linkedPatient, 
  onSpeak, 
  voiceEnabled,
  onToggleVoice,
  onActionExecuted 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const userRole = currentUser?.role || 'ROLE_PATIENT';

  // Dynamic Initial Welcome Message based on logged-in role
  const getInitialWelcome = () => {
    switch (userRole) {
      case 'ROLE_PATIENT':
        return {
          sender: 'ai',
          text: 'Namaste! I am your AI Clinical Pharmacist. I have live, real-time access to your prescriptions, remaining pill counts, and daily dosing schedules. You can type or speak ANY question in English, Hindi, or Hinglish!',
          timestamp: new Date().toLocaleTimeString()
        };
      case 'ROLE_CARETAKER':
        return {
          sender: 'ai',
          text: 'Hello Caretaker. I am your Clinical Governance & Multi-Patient Adherence Assistant. I track live medication inventories, missed dose escalations, and cross-reference drug interactions (DDI) for all your linked dependents.',
          timestamp: new Date().toLocaleTimeString()
        };
      case 'ROLE_CHEMIST':
        return {
          sender: 'ai',
          text: 'Welcome, Apollo Pharmacy. I provide autonomous fulfillment queue prioritization, patient courier address cards, and CDSCO cold-chain compliance monitoring.',
          timestamp: new Date().toLocaleTimeString()
        };
      case 'ROLE_ADMIN':
        return {
          sender: 'ai',
          text: 'Administrative Health Mesh Intelligence active. I monitor platform-wide telemetry, verify caretaker/chemist licenses, and maintain immutable audit trails under DPDP Act 2023.',
          timestamp: new Date().toLocaleTimeString()
        };
      default:
        return {
          sender: 'ai',
          text: 'Welcome to MedAdhere AI. How may I assist your clinical workflow today?',
          timestamp: new Date().toLocaleTimeString()
        };
    }
  };

  const [chatMessages, setChatMessages] = useState([getInitialWelcome()]);

  // Keep welcome message in sync if role changes
  useEffect(() => {
    setChatMessages([getInitialWelcome()]);
  }, [userRole]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Speech-to-Text Setup (webkitSpeechRecognition)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English / Hindi phonetic support

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query in the input box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech Readout - Strictly for ROLE_PATIENT with explicit opt-in
  const speakMessage = (text) => {
    if (userRole !== 'ROLE_PATIENT' || !voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove emojis and URLs for cleaner speech
      const cleanText = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[🚨⚠️💊⏰🍵📊🔍📦📍❄️📋👥⚖️]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // speech fallback
    }
  };

  // Send Chat Query to Dynamic Dual-Engine Backend (/api/ai/advise)
  const handleSendChat = async (promptToSend) => {
    const rawMessage = promptToSend || chatInput;
    if (!rawMessage || !rawMessage.trim()) return;

    // Sanitize user message: ensure NO debug prefixes or function names are prepended
    const cleanedMessage = rawMessage
      .replace(/^(InternalDatabaseGrounding|getPatientPrescriptionDetails|queryDrugKnowledgeAndInteractions)[:\s-]*/i, '')
      .trim();

    const userMsg = {
      sender: 'user',
      text: cleanedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoading(true);

    try {
      // Direct call to dynamic dual-engine endpoint POST /api/ai/advise
      const res = await api.adviseAi({
        query: cleanedMessage,
        message: cleanedMessage,
        role: userRole,
        patientId: linkedPatient?.id
      });

      // Extract ONLY clean conversational reply from backend (strip any stray function names)
      let replyText = res.reply || res.chatReply || res.summary || 'I received your clinical query.';
      replyText = replyText
        .replace(/^(InternalDatabaseGrounding|getPatientPrescriptionDetails|queryDrugKnowledgeAndInteractions)[:\s-]*/i, '')
        .trim();

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        toolsUsed: res.toolsUsed || [],
        toolData: res.toolData,
        isEmergency: res.riskTier === 'CRITICAL' || replyText.includes('EMERGENCY WARNING') || replyText.includes('108/911'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);

      // Read aloud strictly if patient explicitly enabled voice
      if (userRole === 'ROLE_PATIENT' && voiceEnabled) {
        speakMessage(replyText);
      }
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: 'Apologies, I encountered an issue retrieving that clinical record: ' + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // 3 Role-Aware Quick Suggestion Chips (1-click shortcuts, never restricting free typing)
  const getSuggestionChips = () => {
    switch (userRole) {
      case 'ROLE_PATIENT':
        return [
          { label: '💊 Metformin kitne din aur chalegi?', query: 'Meri Metformin kitne din aur chalegi?' },
          { label: '🍵 Telma 40 aur Chai / Doodh?', query: 'Can I drink hot milk or tea right after taking Telma 40?' },
          { label: '🏃 Senior Exercise Suggestions', query: 'Can you provide suggestions for exercise?' }
        ];
      case 'ROLE_CARETAKER':
        return [
          { label: '📉 Low Stock Parents Check', query: 'Which of my parents is running low on medicines this week?' },
          { label: '⚠️ Metformin + Ibuprofen Interaction', query: 'Dadaji is taking Metformin and Telma 40. Is it safe to give him Ibuprofen for joint pain?' },
          { label: '📊 Adherence Compliance Score', query: 'What is the current compliance adherence rate for my dependents?' }
        ];
      case 'ROLE_CHEMIST':
        return [
          { label: '📦 Pending Refills Today', query: 'How many refills do I need to pack and dispatch today?' },
          { label: '❄️ Lantus Storage Parameters', query: 'What are the exact cold-chain storage parameters for Lantus Solostar?' },
          { label: '📍 Ramesh Delivery Address', query: 'Show delivery address and caretaker contact for patient Ramesh Sharma' }
        ];
      case 'ROLE_ADMIN':
        return [
          { label: '🚨 Critical 24h Escalations', query: 'Show all critical escalation alerts and missed doses across the platform in the last 24 hours.' },
          { label: '📋 Unverified Licenses Queue', query: 'Show all unverified chemist and caretaker licenses awaiting approval.' },
          { label: '⚖️ DPDP & Drug Law Standards', query: 'What are the drug license formats and DPDP Act compliance rules?' }
        ];
      default:
        return [
          { label: '💊 Prescriptions', query: 'What are my prescribed medicines?' },
          { label: '⏰ Next Dose', query: 'What medicine is next?' },
          { label: '🏃 Healthy Lifestyle', query: 'Can you provide suggestions for exercise?' }
        ];
    }
  };

  return (
    <>
      {/* 1. CIRCULAR FLOATING ACTION BUTTON (Fixed at Bottom-Right) */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem'
      }}>
        {!isOpen && (
          <div style={{
            background: '#0f172a',
            color: '#38bdf8',
            fontSize: '0.74rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            animation: 'pulse-subtle 3s infinite',
            pointerEvents: 'none'
          }}>
            <Sparkles size={12} color="#38bdf8" />
            <span>AI Dynamic Health Copilot</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            color: '#fff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative'
          }}
          title={isOpen ? 'Close AI Chatbot' : 'Open AI Health Assistant'}
        >
          {isOpen ? <X size={26} /> : <Bot size={28} />}
          {!isOpen && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #fff'
            }} />
          )}
        </button>
      </div>

      {/* 2. FLOATING DRAWER / CHAT WINDOW */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            zIndex: 9995,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modal-enter 0.25s ease'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            padding: '0.9rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>MedAdhere AI</span>
                  <span style={{
                    fontSize: '0.65rem',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    Dual-Engine Active
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                  <Database size={11} color="#38bdf8" />
                  <span>DB Grounded</span> &bull; 
                  <Globe size={11} color="#34d399" />
                  <span>openFDA Active</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Audio Readout Toggle: Rendered ONLY for ROLE_PATIENT upon self-enablement */}
              {userRole === 'ROLE_PATIENT' && (
                <button
                  onClick={() => {
                    const next = !voiceEnabled;
                    if (onToggleVoice) onToggleVoice(next);
                    if (!next && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  style={{
                    background: voiceEnabled ? 'rgba(13, 148, 136, 0.3)' : 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: voiceEnabled ? '#2dd4bf' : '#94a3b8',
                    borderRadius: '6px',
                    padding: '0.35rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                  title={voiceEnabled ? 'Voice Speech: Enabled (Click to Disable)' : 'Voice Speech: Disabled (Click to Enable)'}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{voiceEnabled ? 'Voice: ON' : 'Voice: OFF'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Close Window"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'var(--bg-main)'
          }}>
            {chatMessages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              const isEmergency = msg.isEmergency;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '88%',
                    animation: 'fade-in 0.2s ease'
                  }}
                >
                  <div style={{
                    padding: '0.8rem 1rem',
                    borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    background: isEmergency
                      ? '#fef2f2'
                      : isAi
                      ? 'var(--bg-card)'
                      : 'linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)',
                    color: isEmergency
                      ? '#991b1b'
                      : isAi
                      ? 'var(--text-main)'
                      : '#fff',
                    border: isEmergency
                      ? '1.5px solid #ef4444'
                      : isAi
                      ? '1px solid var(--border-light)'
                      : 'none',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.86rem',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {isEmergency && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.4rem' }}>
                        <AlertTriangle size={16} />
                        <span>EMERGENCY INTERCEPT TRIGGERED</span>
                      </div>
                    )}
                    {msg.text}
                  </div>

                  {/* AI Metadata & Tool Grounding Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.3rem',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    alignSelf: isAi ? 'flex-start' : 'flex-end'
                  }}>
                    <span>{msg.timestamp}</span>

                    {isAi && userRole === 'ROLE_PATIENT' && voiceEnabled && (
                      <button
                        onClick={() => speakMessage(msg.text)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Read this message aloud"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '0.7rem 1rem',
                borderRadius: '4px 16px 16px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Sparkles size={16} color="var(--primary)" className="pulse-emergency" />
                <span>AI Pharmacist is reviewing your records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (Shortcuts, not restricting free input) */}
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-main)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            {getSuggestionChips().map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(chip.query)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input & Voice Controls Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {/* Microphone Button (SpeechRecognition) */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: isListening ? '2px solid var(--danger)' : '1px solid var(--border-medium)',
                background: isListening ? '#fee2e2' : 'var(--bg-main)',
                color: isListening ? 'var(--danger)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                position: 'relative'
              }}
              title={isListening ? 'Listening... (Click to stop)' : 'Click to speak query (Voice Recognition)'}
            >
              {isListening ? (
                <>
                  <MicOff size={18} />
                  <span style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '2px solid #ef4444',
                    animation: 'pulse-ring 1s infinite'
                  }} />
                </>
              ) : (
                <Mic size={18} />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder={isListening ? 'Listening to speech...' : 'Ask question (English / Hindi / Hinglish)...'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (loading || !chatInput.trim()) ? 0.5 : 1,
                cursor: (loading || !chatInput.trim()) ? 'not-allowed' : 'pointer'
              }}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
