import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import AiCopilot from './components/AiCopilot';
import PatientPortal from './components/PatientPortal';
import CaretakerPortal from './components/CaretakerPortal';
import ChemistPortal from './components/ChemistPortal';
import AdminDashboard from './components/AdminDashboard';
import AuditLedgerView from './components/AuditLedgerView';
import NotificationDrawer from './components/NotificationDrawer';
import MeshExplainerModal from './components/MeshExplainerModal';
import AddMedicineModal from './components/AddMedicineModal';
import SosModal from './components/SosModal';
import { api, setAuthToken, setStoredUser, getStoredUser, clearAuthSession, getAuthToken } from './api';
import { CheckCircle2, AlertCircle, HeartPulse } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PORTAL'); // 'PORTAL' or 'AUDIT_LEDGER'
  const [caretakerView, setCaretakerView] = useState('OVERVIEW'); // 'OVERVIEW', 'PATIENT_4', 'PATIENT_5', 'RADAR'
  const [chemistTab, setChemistTab] = useState('ORDERS'); // 'ORDERS', 'PATIENTS'
  const [patientTab, setPatientTab] = useState('TRACKER'); // 'TRACKER', 'PRESCRIPTIONS'

  // Accessibility & UI Modes
  const [elderMode, setElderMode] = useState(false);
  // Voice Speech: Disabled by default for everyone.
  // Only for ROLE_PATIENT if they have explicitly self-enabled it in settings.
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Synchronize Voice Speech consent with current user role
  // Voice synthesis is strictly reserved for ROLE_PATIENT upon explicit self-enablement
  useEffect(() => {
    if (currentUser?.role === 'ROLE_PATIENT') {
      const saved = localStorage.getItem('medadhere_patient_voice_enabled') === 'true';
      setVoiceEnabled(saved);
    } else {
      setVoiceEnabled(false);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  // Modals & Drawers
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notifications & SSE Live Stream
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sseConnected, setSseConnected] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Patient voice toggle handler with localStorage persistence
  const handleToggleVoice = useCallback((targetState) => {
    if (currentUser?.role !== 'ROLE_PATIENT') {
      setVoiceEnabled(false);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      return;
    }
    const nextVal = typeof targetState === 'boolean' ? targetState : !voiceEnabled;
    setVoiceEnabled(nextVal);
    try {
      localStorage.setItem('medadhere_patient_voice_enabled', String(nextVal));
    } catch (e) {}
    if (!nextVal && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    } else if (nextVal && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Voice speech enabled.');
        utterance.rate = 0.95;
        utterance.lang = 'en-IN';
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }, [currentUser?.role, voiceEnabled]);

  // Web Audio Synthetic Chime Generator (Two-tone melodic chime: 440 Hz to 880 Hz)
  const playChimeSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz tone 1
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.18); // 880 Hz tone 2
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // AudioContext fallback
    }
  }, []);

  // Web Speech API Voice Synthesizer - STRICTLY for PATIENTS who have EXPLICITLY OPTED IN
  const speakText = useCallback((text) => {
    // 1. Strict Role Governance: Voice speech is solely for ROLE_PATIENT. For others, it must not be there.
    if (currentUser?.role !== 'ROLE_PATIENT') {
      return;
    }
    // 2. Consent Governance: Voice speech is disabled by default, active only if explicitly enabled by the patient.
    if (!voiceEnabled || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // speech fallback
    }
  }, [currentUser?.role, voiceEnabled]);

  // Toggle Elder Mode body class
  useEffect(() => {
    if (elderMode) {
      document.body.classList.add('elder-mode');
    } else {
      document.body.classList.remove('elder-mode');
    }
  }, [elderMode]);

  const [activePatientId, setActivePatientId] = useState(null);

  // Load Dashboard Summary for the authenticated user
  const loadDashboard = useCallback(async (patientId) => {
    try {
      const pid = patientId !== undefined ? patientId : activePatientId;
      const summary = await api.getDashboard(pid);
      setDashboardSummary(summary);
      if (summary?.linkedPatient?.id) {
        setActivePatientId(summary.linkedPatient.id);
      }
      if (summary?.recentAlerts) {
        setNotificationsList(summary.recentAlerts);
        const unread = summary.recentAlerts.filter(a => !a.resolved).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized'))) {
        clearAuthSession();
        setCurrentUser(null);
        setDashboardSummary(null);
      }
    }
  }, [activePatientId]);

  // Server-Sent Events (SSE) Persistent Push Subscription (Page 6 Specification)
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener('INIT', () => {
        setSseConnected(true);
      });

      // Specification Topic: DOSE_DUE
      eventSource.addEventListener('DOSE_DUE', (event) => {
        try {
          playChimeSound();
          speakText('Time for scheduled medicine intake.');
          showToast('Reminder: Scheduled dose is now due.', 'info');
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: DOSE_TAKEN
      eventSource.addEventListener('DOSE_TAKEN', () => {
        try {
          playChimeSound();
          showToast('Dose intake confirmed! Tablet count updated.', 'success');
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: DOSE_MISSED
      eventSource.addEventListener('DOSE_MISSED', (event) => {
        try {
          const alert = JSON.parse(event.data);
          playChimeSound();
          showToast(alert.message || 'CRITICAL: Missed dose window expired!', 'error');
          speakText('Critical alert: Missed dose window expired. Caretaker notified.');
          setUnreadCount(prev => prev + 1);
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: REFILL_REQUESTED
      eventSource.addEventListener('REFILL_REQUESTED', () => {
        try {
          showToast('Autonomous refill order transmitted to chemist.', 'info');
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: REFILL_DISPATCHED
      eventSource.addEventListener('REFILL_DISPATCHED', (event) => {
        try {
          playChimeSound();
          showToast('Pharmacy has dispatched 30-day medication strip! Physical inventory restocked.', 'success');
          speakText('Pharmacy has dispatched your 30-day medication strip.');
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: PATIENT_REQUESTED
      eventSource.addEventListener('PATIENT_REQUESTED', () => {
        try {
          playChimeSound();
          showToast('New patient assignment request received!', 'info');
          speakText('New patient assignment request received.');
          loadDashboard();
        } catch (e) {}
      });

      // Specification Topic: REQUEST_APPROVED
      eventSource.addEventListener('REQUEST_APPROVED', () => {
        try {
          playChimeSound();
          showToast('Care Assignment Request approved by Caretaker! Regimen is now active.', 'success');
          speakText('Care assignment request approved.');
          loadDashboard();
        } catch (e) {}
      });

      eventSource.addEventListener('TELEMETRY_UPDATE', () => {
        try {
          loadDashboard();
        } catch (e) {}
      });

      eventSource.addEventListener('TELEMETRY_CONSENT_CHANGED', () => {
        try {
          loadDashboard();
        } catch (e) {}
      });

      eventSource.addEventListener('CRITICAL_ALERT', (event) => {
        try {
          const alert = JSON.parse(event.data);
          playChimeSound();
          showToast(alert.message, 'error');
          speakText(alert.message);
          setUnreadCount(prev => prev + 1);
          loadDashboard();
        } catch (e) {
          // ignore
        }
      });

      eventSource.addEventListener('EMERGENCY_SOS', (event) => {
        try {
          const alert = JSON.parse(event.data);
          playChimeSound();
          showToast(alert.message, 'error');
          speakText('Emergency Alert: SOS Beacon Activated by patient.');
          setUnreadCount(prev => prev + 1);
          loadDashboard();
        } catch (e) {
          // ignore
        }
      });

      eventSource.addEventListener('AUDIT_EVENT', () => {
        loadDashboard();
      });

      eventSource.addEventListener('ALERT_RESOLVED', () => {
        loadDashboard();
      });

      eventSource.addEventListener('ASSIGNMENT_REQUESTED', () => {
        try {
          playChimeSound();
          showToast('New Care Assignment Request received from patient!', 'info');
          speakText('New patient assignment request received.');
          loadDashboard();
        } catch (e) {}
      });

      eventSource.addEventListener('ASSIGNMENT_APPROVED', () => {
        try {
          playChimeSound();
          showToast('Care Assignment Request approved by Caretaker! Regimen is now active.', 'success');
          speakText('Care assignment request approved.');
          loadDashboard();
        } catch (e) {}
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      console.error('SSE connection error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [playChimeSound, speakText, loadDashboard]);

  // Listen for global auth session expiry
  useEffect(() => {
    const handleExpired = () => {
      clearAuthSession();
      setCurrentUser(null);
      setDashboardSummary(null);
    };
    window.addEventListener('auth-session-expired', handleExpired);
    return () => window.removeEventListener('auth-session-expired', handleExpired);
  }, []);

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true);
        const token = getAuthToken();
        const storedUser = getStoredUser();

        if (token && storedUser) {
          setCurrentUser(storedUser);
          await loadDashboard();
        } else {
          clearAuthSession();
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        clearAuthSession();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [loadDashboard]);

  // Real-Time Login Handler
  const handleLogin = async (credentials) => {
    const authData = await api.login(credentials);
    setAuthToken(authData.token);
    setStoredUser(authData);
    setCurrentUser(authData);

    const summary = await api.getDashboard();
    setDashboardSummary(summary);

    playChimeSound();
    showToast(`Welcome back, ${authData.fullName}! Logged in as ${authData.role}.`, 'success');

    if (authData.role === 'ROLE_PATIENT') {
      const isVoice = localStorage.getItem('medadhere_patient_voice_enabled') === 'true';
      setVoiceEnabled(isVoice);
      if (isVoice) {
        speakText(`Namaste ${authData.fullName}. Telemetry active.`);
      }
    } else {
      setVoiceEnabled(false);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    }
  };

  // Real-Time Register Handler
  const handleRegister = async (data) => {
    const authData = await api.register(data);
    setAuthToken(authData.token);
    setStoredUser(authData);
    setCurrentUser(authData);

    const summary = await api.getDashboard();
    setDashboardSummary(summary);

    playChimeSound();
    showToast(`Registration successful! Welcome ${authData.fullName}.`, 'success');

    if (authData.role === 'ROLE_PATIENT') {
      const isVoice = localStorage.getItem('medadhere_patient_voice_enabled') === 'true';
      setVoiceEnabled(isVoice);
      if (isVoice) {
        speakText(`Welcome to MedAdhere AI, ${authData.fullName}.`);
      }
    } else {
      setVoiceEnabled(false);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    }
  };

  // Logout Handler
  const handleLogout = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    clearAuthSession();
    setCurrentUser(null);
    setDashboardSummary(null);
    setVoiceEnabled(false);
    showToast('Signed out successfully.', 'info');
  };

  const [modalPatientId, setModalPatientId] = useState(null);

  const handleOpenAddMedicine = (patientId) => {
    if (typeof patientId === 'number' && !isNaN(patientId)) {
      setModalPatientId(patientId);
    } else if (typeof patientId === 'string' && /^\d+$/.test(patientId.trim())) {
      setModalPatientId(parseInt(patientId.trim(), 10));
    } else if (patientId && typeof patientId === 'object' && 'id' in patientId && typeof patientId.id === 'number') {
      setModalPatientId(patientId.id);
    } else {
      setModalPatientId(null);
    }
    setShowAddMedicineModal(true);
  };

  // Dose Taken Handler
  const handleTakeDose = async (scheduleId) => {
    try {
      await api.markDoseTaken(scheduleId);
      await loadDashboard();
      showToast('Dose recorded successfully! Physical stock decremented.', 'success');
    } catch (err) {
      showToast('Error recording dose: ' + err.message, 'error');
    }
  };

  // Resolve Alert Handler
  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      await loadDashboard();
      showToast('Clinical alert resolved.', 'success');
    } catch (err) {
      showToast('Error resolving alert: ' + err.message, 'error');
    }
  };

  // Add Medicine Handler
  const handleAddMedicine = async (medData) => {
    try {
      const pid = typeof medData.patientId === 'number'
        ? medData.patientId
        : parseInt(medData.patientId, 10);

      const cid = medData.caretakerAuthorId
        ? (typeof medData.caretakerAuthorId === 'number' ? medData.caretakerAuthorId : parseInt(medData.caretakerAuthorId, 10))
        : null;

      const payload = {
        patientId: pid,
        caretakerAuthorId: cid,
        name: String(medData.name || '').trim(),
        dosage: String(medData.dosage || '').trim(),
        instructions: String(medData.instructions || '').trim(),
        dailyDoseCount: Number(medData.dailyDoseCount) || 1,
        remainingTablets: Number(medData.remainingTablets) || 30,
        totalCourseDays: Number(medData.totalCourseDays) || 90,
        daysCompleted: Number(medData.daysCompleted) || 0,
        emergencyPurpose: String(medData.emergencyPurpose || '').trim(),
        scheduledSlots: Array.isArray(medData.scheduledSlots) ? medData.scheduledSlots : ['MORNING']
      };

      await api.createMedicine(payload);
      await loadDashboard(pid);
      showToast(`New medication ${payload.name} added to regimen!`, 'success');
      speakText(`New medication ${payload.name} has been prescribed.`);
    } catch (err) {
      showToast('Error adding medication: ' + err.message, 'error');
    }
  };

  // Delete Medicine Handler
  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to discontinue this medication?')) return;
    try {
      await api.deleteMedicine(id);
      await loadDashboard();
      showToast('Medication discontinued.', 'info');
    } catch (err) {
      showToast('Error deleting medicine: ' + err.message, 'error');
    }
  };

  // Update Refill Order Status Handler
  const handleUpdateOrderStatus = async (orderId, newStatus, notes) => {
    try {
      await api.updateRefillStatus(orderId, newStatus, notes);
      await loadDashboard();
      playChimeSound();
      showToast(`Refill Order #${orderId} fulfilled & restocked!`, 'success');
      if (newStatus === 'DELIVERED') {
        speakText('Apollo Pharmacy refill confirmed delivered. Patient box inventory automatically restocked.');
      }
    } catch (err) {
      showToast('Error updating order: ' + err.message, 'error');
    }
  };

  // Send SOS Handler
  const handleSendSos = async (reason) => {
    try {
      const patientId = dashboardSummary?.linkedPatient?.id || currentUser?.id;
      await api.triggerEmergencySos(patientId, reason);
      await loadDashboard();
      showToast('EMERGENCY SOS TRANSMITTED! Ananya alerted.', 'error');
      speakText('Emergency alert sent to Ananya Sharma. Calling primary caretaker now.');
    } catch (err) {
      showToast('Failed to broadcast SOS: ' + err.message, 'error');
    }
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      await loadDashboard();
      showToast('All notifications marked as read.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-main)',
        gap: '1rem'
      }}>
        <div style={{
          background: 'var(--primary)',
          color: '#fff',
          padding: '1.25rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <HeartPulse size={48} className="pulse-emergency" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Initializing MedAdhere AI Mesh...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Connecting Spring Boot H2 Database & Real-Time Telemetry
        </p>
      </div>
    );
  }

  // Not authenticated: Show Page 1 AuthScreen
  if (!currentUser) {
    return (
      <>
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--primary)' : 'var(--success)',
            color: '#fff',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{toast.message}</span>
          </div>
        )}
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
      </>
    );
  }

  const role = currentUser.role;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--primary)' : 'var(--success)',
          color: '#fff',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          animation: 'modal-enter 0.25s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        elderMode={elderMode}
        setElderMode={setElderMode}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={handleToggleVoice}
        onOpenExplainer={() => setShowExplainerModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadCount={unreadCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        caretakerView={caretakerView}
        setCaretakerView={setCaretakerView}
        chemistTab={chemistTab}
        setChemistTab={setChemistTab}
        patientTab={patientTab}
        setPatientTab={setPatientTab}
      />

      {/* Visible AI Copilot Banner & Floating Pharmacist Hub (Page 3) */}
      <AiCopilot
        currentUser={currentUser}
        linkedPatient={dashboardSummary?.linkedPatient || currentUser}
        onSpeak={currentUser?.role === 'ROLE_PATIENT' ? speakText : null}
        voiceEnabled={currentUser?.role === 'ROLE_PATIENT' ? voiceEnabled : false}
        onToggleVoice={currentUser?.role === 'ROLE_PATIENT' ? handleToggleVoice : null}
        onActionExecuted={(msg) => {
          showToast(msg, 'success');
          loadDashboard();
        }}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.5rem 0' }}>
        <div className="container">
          {/* TAB 1: Role-Specific Clinical Portal */}
          {activeTab === 'PORTAL' && (
            <>
              {role === 'ROLE_PATIENT' && (
                <PatientPortal
                  summary={dashboardSummary}
                  onTakeDose={handleTakeDose}
                  onOpenSos={() => setShowSosModal(true)}
                  onSpeak={speakText}
                  voiceEnabled={voiceEnabled}
                  onToggleVoice={handleToggleVoice}
                  patientTab={patientTab}
                  setPatientTab={setPatientTab}
                />
              )}

              {role === 'ROLE_CARETAKER' && (
                <CaretakerPortal
                  summary={dashboardSummary}
                  currentUser={currentUser}
                  onOpenAddMedicine={handleOpenAddMedicine}
                  onResolveAlert={handleResolveAlert}
                  onDeleteMedicine={handleDeleteMedicine}
                  onSimulateReminder={(alert) => {
                    playChimeSound();
                    showToast(`SMS / WhatsApp Alert Dispatched: "${alert.message}"`, 'info');
                  }}
                  onPatientSwitched={(patientId) => {
                    loadDashboard(patientId);
                  }}
                  onChemistChanged={() => {
                    showToast('Bound pharmacy updated for patient.', 'success');
                    loadDashboard();
                  }}
                  onSpeak={null}
                  voiceEnabled={false}
                  caretakerView={caretakerView}
                  setCaretakerView={setCaretakerView}
                />
              )}

              {role === 'ROLE_CHEMIST' && (
                <ChemistPortal
                  summary={dashboardSummary}
                  currentUser={currentUser}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  chemistTab={chemistTab}
                  setChemistTab={setChemistTab}
                />
              )}

              {role === 'ROLE_ADMIN' && (
                <AdminDashboard
                  currentUser={currentUser}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {/* TAB 2: Page 7 Audit Ledger & Chaos Lab */}
          {activeTab === 'AUDIT_LEDGER' && (
            <AuditLedgerView
              onActionSuccess={(msg) => showToast(msg, 'success')}
              onRefreshDashboard={loadDashboard}
            />
          )}
        </div>
      </main>

      {/* Page 6: System-Wide Real-Time Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notificationsList}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllNotificationsRead}
        sseConnected={sseConnected}
        isPatientRole={currentUser?.role === 'ROLE_PATIENT'}
        voiceEnabled={voiceEnabled}
        onSpeakAlert={currentUser?.role === 'ROLE_PATIENT' && voiceEnabled ? speakText : null}
      />

      {/* Modals */}
      {showExplainerModal && (
        <MeshExplainerModal onClose={() => setShowExplainerModal(false)} />
      )}

      {showAddMedicineModal && (
        <AddMedicineModal
          patientId={modalPatientId || activePatientId || dashboardSummary?.linkedPatient?.id || currentUser?.id}
          caretakerId={currentUser?.id}
          onClose={() => {
            setShowAddMedicineModal(false);
            setModalPatientId(null);
          }}
          onAddMedicine={handleAddMedicine}
        />
      )}

      {showSosModal && (
        <SosModal
          patient={dashboardSummary?.linkedPatient || currentUser}
          onClose={() => setShowSosModal(false)}
          onSendSos={handleSendSos}
        />
      )}

      {/* Minimal Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '1.25rem 0',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-card)'
      }}>
        <div className="container">
          MedAdhere AI &bull; End-to-End Clinical Mesh Architecture &bull; Ramesh &bull; Ananya &bull; Apollo Pharmacy &bull; Spring Boot 3.3.4 (Java 21) &bull; Vite/React
        </div>
      </footer>
    </div>
  );
}
