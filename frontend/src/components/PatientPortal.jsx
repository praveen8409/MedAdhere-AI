import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  HeartPulse, 
  CheckCircle2, 
  Clock, 
  Pill, 
  AlertCircle, 
  Volume2, 
  VolumeX,
  PhoneCall, 
  Lock, 
  ShieldCheck,
  Search,
  UserCheck,
  FileText,
  Send,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Bell,
  Check,
  X,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  Thermometer,
  RefreshCw,
  Sliders,
  Shield,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { api } from '../api';
import MedicineTracker from './MedicineTracker';

export default function PatientPortal({
  summary,
  onTakeDose,
  onOpenSos,
  onSpeak,
  voiceEnabled,
  onToggleVoice,
  patientTab,
  setPatientTab
}) {
  const patient = summary?.linkedPatient || summary?.currentUser || {};
  const caretaker = summary?.linkedCaretaker || patient?.caretaker || null;
  const chemist = summary?.linkedChemist || patient?.chemist || null;
  const schedules = summary?.todaySchedules || [];

  // Assignment Request & Caretaker Live Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCaretaker, setSelectedCaretaker] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescriptionDocUrl, setPrescriptionDocUrl] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessNotice, setRequestSuccessNotice] = useState(null);
  const [requestErrorNotice, setRequestErrorNotice] = useState(null);
  const [myAssignmentRequests, setMyAssignmentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch patient assignment requests on mount or when patient changes
  useEffect(() => {
    if (patient?.id) {
      loadMyRequests(patient.id);
    }
  }, [patient?.id]);

  const loadMyRequests = async (patientId) => {
    setLoadingRequests(true);
    try {
      const data = await api.getPatientAssignmentRequests(patientId);
      setMyAssignmentRequests(data || []);
    } catch (err) {
      console.error('Failed to load patient assignment requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Patient Health Telemetry State (Clinical Governance: Opt-In by Patient ONLY)
  const [telemetryStatus, setTelemetryStatus] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [syncingTelemetry, setSyncingTelemetry] = useState(false);
  const [telemetryFeedback, setTelemetryFeedback] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [showManualRecordModal, setShowManualRecordModal] = useState(false);
  const [sharingConsent, setSharingConsent] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState(30);
  const [manualForm, setManualForm] = useState({
    heartRate: '74',
    systolicBp: '120',
    diastolicBp: '80',
    bloodGlucose: '110',
    oxygenSaturation: '98.5',
    bodyTemperature: '98.6',
    stepCount: '2600',
    telemetryNotes: ''
  });

  // Load telemetry status on mount or patient change
  useEffect(() => {
    if (patient?.id) {
      loadTelemetryStatus(patient.id);
    }
  }, [patient?.id]);

  const loadTelemetryStatus = async (patientId) => {
    setLoadingTelemetry(true);
    try {
      const data = await api.getTelemetryStatus(patientId);
      setTelemetryStatus(data);
      if (data?.shareWithCaretaker !== undefined) {
        setSharingConsent(data.shareWithCaretaker);
      }
      if (data?.frequencyMinutes) {
        setSyncFrequency(data.frequencyMinutes);
      }
      if (data?.recentReadings) {
        setTelemetryHistory(data.recentReadings);
      }
    } catch (err) {
      console.error('Failed to load telemetry status:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Toggle Telemetry Consent (Clinical Governance: Patient Autonomous Action Only)
  const handleToggleTelemetry = async (enable) => {
    if (!patient?.id) return;
    setLoadingTelemetry(true);
    setTelemetryFeedback(null);
    try {
      const updated = await api.updateTelemetryConsent(patient.id, {
        enabled: enable,
        shareWithCaretaker: sharingConsent,
        frequencyMinutes: syncFrequency
      });
      setTelemetryStatus(updated);
      setTelemetryHistory(updated.recentReadings || []);
      const msg = enable
        ? '✓ Health Telemetry Activated! You have self-enabled vitals monitoring.'
        : '✓ Telemetry Deactivated! Your data privacy is strictly protected.';
      setTelemetryFeedback({ type: 'success', text: msg });
      if (onSpeak && voiceEnabled) {
        onSpeak(enable
          ? 'Health telemetry enabled by your consent. Your vitals monitoring is active.'
          : 'Health telemetry disabled. Your data privacy is protected.');
      }
    } catch (err) {
      console.error('Failed to update telemetry consent:', err);
      setTelemetryFeedback({ type: 'error', text: err.message || 'Failed to update telemetry consent.' });
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Update Telemetry Preferences (Sharing / Frequency)
  const handleUpdateTelemetryPreferences = async (newShare, newFreq) => {
    if (!patient?.id) return;
    try {
      const updated = await api.updateTelemetryConsent(patient.id, {
        enabled: Boolean(telemetryStatus?.telemetryEnabled),
        shareWithCaretaker: newShare,
        frequencyMinutes: newFreq
      });
      setTelemetryStatus(updated);
      setSharingConsent(newShare);
      setSyncFrequency(newFreq);
      setTelemetryFeedback({ type: 'success', text: '✓ Telemetry preferences updated.' });
    } catch (err) {
      setTelemetryFeedback({ type: 'error', text: err.message || 'Failed to update preferences.' });
    }
  };

  // Simulate BLE Sensor Sync
  const handleSyncSensor = async () => {
    if (!patient?.id) return;
    setSyncingTelemetry(true);
    setTelemetryFeedback(null);
    try {
      const reading = await api.simulateTelemetrySync(patient.id);
      await loadTelemetryStatus(patient.id);
      setTelemetryFeedback({
        type: 'success',
        text: `✓ BLE Sensor Synced! Heart Rate: ${reading.heartRate} bpm • BP: ${reading.systolicBp}/${reading.diastolicBp} • SpO2: ${reading.oxygenSaturation}%`
      });
      if (onSpeak && voiceEnabled) {
        onSpeak(`Sensor synced. Heart rate is ${reading.heartRate} beats per minute. Blood oxygen is ${reading.oxygenSaturation} percent.`);
      }
    } catch (err) {
      setTelemetryFeedback({ type: 'error', text: err.message || 'Sensor synchronization failed.' });
    } finally {
      setSyncingTelemetry(false);
    }
  };

  // Manual Vital Submission
  const handleSaveManualTelemetry = async (e) => {
    e.preventDefault();
    if (!patient?.id) return;
    setLoadingTelemetry(true);
    try {
      await api.recordTelemetry(patient.id, {
        heartRate: parseInt(manualForm.heartRate, 10),
        systolicBp: parseInt(manualForm.systolicBp, 10),
        diastolicBp: parseInt(manualForm.diastolicBp, 10),
        bloodGlucose: parseFloat(manualForm.bloodGlucose),
        oxygenSaturation: parseFloat(manualForm.oxygenSaturation),
        bodyTemperature: parseFloat(manualForm.bodyTemperature),
        stepCount: parseInt(manualForm.stepCount, 10),
        sensorSource: 'Manual Clinical Entry',
        telemetryNotes: manualForm.telemetryNotes
      });
      setShowManualRecordModal(false);
      await loadTelemetryStatus(patient.id);
      setTelemetryFeedback({ type: 'success', text: '✓ Manual vitals entry recorded to your telemetry log.' });
    } catch (err) {
      setTelemetryFeedback({ type: 'error', text: err.message || 'Failed to record vitals.' });
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Live Caretaker Search
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchCaretakers(val.trim());
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send Care Assignment Request
  const handleSendAssignmentRequest = async (e) => {
    e.preventDefault();
    if (!selectedCaretaker) {
      setRequestErrorNotice('Please select a verified caretaker from the search results.');
      return;
    }
    if (!prescriptionNotes.trim()) {
      setRequestErrorNotice('Please describe your medical prescription details or clinical notes.');
      return;
    }

    setIsSubmittingRequest(true);
    setRequestErrorNotice(null);
    setRequestSuccessNotice(null);

    try {
      await api.createAssignmentRequest({
        patientId: patient.id,
        caretakerId: selectedCaretaker.id,
        prescriptionNotes: prescriptionNotes.trim(),
        prescriptionDocUrl: prescriptionDocUrl.trim()
      });

      setRequestSuccessNotice(`Assignment request transmitted to ${selectedCaretaker.fullName}! You will be notified when they approve and schedule your regimen.`);
      setSelectedCaretaker(null);
      setSearchQuery('');
      setSearchResults([]);
      setPrescriptionNotes('');
      setPrescriptionDocUrl('');
      await loadMyRequests(patient.id);
    } catch (err) {
      setRequestErrorNotice(err.message || 'Failed to submit assignment request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const speakTodaySummary = () => {
    if (!voiceEnabled || !onSpeak) return;
    const pendingCount = schedules.filter(s => s.status === 'PENDING').length;
    const patName = patient?.fullName?.split(' ')[0] || 'Patient';
    const text = `Namaste ${patName}! Please take medicines on time. You have taken ${summary?.dosesTakenToday || 0} out of ${schedules.length} doses today. You have ${pendingCount} pending doses. Please take your medicine strictly after meals with warm water.`;
    onSpeak(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Senior Companion Top Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
        color: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-md)',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.6rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse-ring 2s infinite'
          }}>
            <Bell size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Namaste {patient.fullName?.split(' ')[0] || 'Patient'}!
            </h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: '0.15rem 0 0 0' }}>
              {caretaker 
                ? `Supervised by Primary Caretaker: ${caretaker.fullName} • Regimen Active` 
                : '⚠️ No Caretaker Assigned Yet. Please visit "Assign Caretaker" tab below.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Patient Voice Speech Control */}
          <button
            onClick={() => {
              if (!voiceEnabled) {
                if (onToggleVoice) onToggleVoice(true);
              } else {
                speakTodaySummary();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: voiceEnabled ? '#fff' : 'rgba(255, 255, 255, 0.15)',
              color: voiceEnabled ? 'var(--primary)' : '#fff',
              border: voiceEnabled ? 'none' : '1.5px solid rgba(255, 255, 255, 0.4)',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: voiceEnabled ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={voiceEnabled ? "Voice speech is active. Click to read today's summary." : "Voice speech is currently disabled. Click to enable."}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{voiceEnabled ? 'Voice: ON (Read Regimen)' : 'Voice: OFF (Click to Enable)'}</span>
          </button>

          {voiceEnabled && (
            <button
              onClick={() => onToggleVoice && onToggleVoice(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Disable Voice Speech"
            >
              Mute
            </button>
          )}

          {/* Telemetry Status Quick Badge */}
          <div
            onClick={() => setPatientTab && setPatientTab('TELEMETRY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: telemetryStatus?.telemetryEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.15)',
              border: telemetryStatus?.telemetryEnabled ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              padding: '0.55rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to manage your Health Telemetry & Privacy preferences"
          >
            <Activity size={16} color={telemetryStatus?.telemetryEnabled ? '#6ee7b7' : '#e2e8f0'} />
            <span>{telemetryStatus?.telemetryEnabled ? 'Telemetry: ACTIVE' : 'Telemetry: OFF (Privacy)'}</span>
          </div>

          <button
            onClick={onOpenSos}
            className="btn btn-danger pulse-emergency"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-md)'
            }}
          >
            <PhoneCall size={18} />
            <span>EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* Patient Portal Secondary Tab Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          onClick={() => setPatientTab && setPatientTab('TRACKER')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: (!patientTab || patientTab === 'TRACKER') ? 'var(--primary)' : 'transparent',
            color: (!patientTab || patientTab === 'TRACKER') ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Pill size={16} />
          <span>Medicine Tracker</span>
        </button>

        <button
          onClick={() => setPatientTab && setPatientTab('PRESCRIPTIONS')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: patientTab === 'PRESCRIPTIONS' ? '#8b5cf6' : 'transparent',
            color: patientTab === 'PRESCRIPTIONS' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Lock size={16} />
          <span>Prescriptions Regimen</span>
        </button>

        <button
          onClick={() => setPatientTab && setPatientTab('TELEMETRY')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: patientTab === 'TELEMETRY' ? '#0d9488' : 'transparent',
            color: patientTab === 'TELEMETRY' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Activity size={16} />
          <span>Health Telemetry (Opt-In)</span>
          {telemetryStatus?.telemetryEnabled ? (
            <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 900 }}>
              ON
            </span>
          ) : (
            <span style={{ background: '#94a3b8', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 900 }}>
              OFF
            </span>
          )}
        </button>

        <button
          onClick={() => setPatientTab && setPatientTab('CARETAKER_ASSIGNMENT')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: patientTab === 'CARETAKER_ASSIGNMENT' ? '#d97706' : 'transparent',
            color: patientTab === 'CARETAKER_ASSIGNMENT' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <UserCheck size={16} />
          <span>Assign Caretaker</span>
        </button>
      </div>

      {/* No Caretaker Notice Callout */}
      {!caretaker && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1.5px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={22} color="#d97706" />
            <div>
              <div style={{ fontWeight: 800, color: '#b45309', fontSize: '0.95rem' }}>
                Primary Caretaker Required for Prescription Governance
              </div>
              <div style={{ fontSize: '0.82rem', color: '#92400e' }}>
                You have registered a clean account. Search for your Caretaker by Name or Mobile Number to send your prescription document/notes for clinical approval.
              </div>
            </div>
          </div>
          <button
            onClick={() => setPatientTab && setPatientTab('CARETAKER_ASSIGNMENT')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
          >
            Find Caretaker Now →
          </button>
        </div>
      )}

      {/* 2. TAB CONTENT A: TODAY'S MEDICINE TRACKER */}
      {(!patientTab || patientTab === 'TRACKER') && (
        <MedicineTracker
          patientId={patient?.id}
          patientName={patient?.fullName || 'Patient'}
          patientPhone={patient?.phoneNumber || ''}
          caretakerName={caretaker?.fullName || 'Not yet assigned'}
          isPatientRole={true}
          isCaretakerRole={false}
          onDoseTakenSuccess={onTakeDose}
          onSpeak={onSpeak}
          voiceEnabled={voiceEnabled}
        />
      )}

      {/* 3. TAB CONTENT B: LOCKED PRESCRIPTION REGIMEN */}
      {patientTab === 'PRESCRIPTIONS' && (
        <div className="glass-panel" style={{
          padding: '1.5rem',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04), var(--bg-card))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#8b5cf6', color: '#fff', padding: '0.45rem', borderRadius: '8px' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Prescriptions Governed by: {caretaker ? caretaker.fullName : 'Awaiting Assignment'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Prescription regimens are authored and locked by your family caretaker to prevent accidental dosage errors.
                </p>
              </div>
            </div>

            {caretaker?.phoneNumber && (
              <a
                href={`tel:${caretaker.phoneNumber}`}
                className="btn btn-outline"
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderColor: '#8b5cf6',
                  color: '#8b5cf6'
                }}
              >
                <PhoneCall size={16} />
                <span>Call Caretaker ({caretaker.phoneNumber})</span>
              </a>
            )}
          </div>

          {(summary?.medicines || []).length === 0 ? (
            <div style={{
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Pill size={36} style={{ opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                No Prescribed Regimen Scheduled Yet
              </div>
              <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1rem auto' }}>
                {caretaker 
                  ? 'Your caretaker is currently configuring your medicine slots and dosages.'
                  : 'Assign a caretaker and send your prescription notes to have your medicine course scheduled.'}
              </p>
              {!caretaker && (
                <button
                  onClick={() => setPatientTab && setPatientTab('CARETAKER_ASSIGNMENT')}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 800 }}
                >
                  Assign Caretaker & Send Prescription
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {(summary?.medicines || []).map(med => (
                <div
                  key={med.id}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{med.name}</div>
                    <span className={med.remainingTablets <= 6 ? 'badge badge-warning' : 'badge badge-primary'}>
                      {med.remainingTablets} left
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.5rem 0' }}>
                    Dosage: {med.dosage} &bull; {med.dailyDoseCount}x Daily
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Instructions: {med.instructions || 'Strictly take after meals with warm water.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT C: FIND & ASSIGN CARETAKER VIA LIVE SEARCH */}
      {patientTab === 'CARETAKER_ASSIGNMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Caretaker Status Card (If already mapped) */}
          {caretaker && (
            <div className="glass-panel" style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--bg-card))',
              border: '1.5px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', padding: '0.65rem' }}>
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        {caretaker.fullName}
                      </h3>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        Active Primary Caretaker
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Mobile: <strong>{caretaker.phoneNumber || 'Not provided'}</strong> • Address: <strong>{caretaker.address || 'Registered Residence'}</strong>
                    </p>
                  </div>
                </div>

                {caretaker.phoneNumber && (
                  <a
                    href={`tel:${caretaker.phoneNumber}`}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: 800, borderColor: '#10b981', color: '#047857' }}
                  >
                    <PhoneCall size={16} />
                    <span>Contact Caretaker</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Caretaker Live Search & Assignment Submission Box */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid var(--border-medium)' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <Search size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Search & Assign a Caretaker
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                Find your primary caretaker by <strong>Full Name</strong> or <strong>Mobile Number</strong> via live search, select them, and send your prescription details.
              </p>
            </div>

            {requestSuccessNotice && (
              <div style={{
                background: 'var(--success-light)',
                border: '1px solid var(--success-border)',
                color: 'var(--success)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={18} />
                <span>{requestSuccessNotice}</span>
              </div>
            )}

            {requestErrorNotice && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>{requestErrorNotice}</span>
              </div>
            )}

            {/* Live Search Input & Dropdown */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Live Caretaker Search (Name or Mobile) *
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Type caretaker name (e.g. Ananya) or mobile number..."
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--primary)',
                    background: 'var(--bg-main)',
                    fontSize: '0.9rem',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              {/* Live Search Results Dropdown */}
              {searchQuery.trim().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-medium)',
                  marginTop: '0.35rem',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {isSearching ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Searching verified caretakers...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No registered caretakers match "{searchQuery}". Ensure your caretaker has registered with their legal name or mobile number.
                    </div>
                  ) : (
                    searchResults.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCaretaker(c);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        style={{
                          padding: '0.85rem 1.15rem',
                          borderBottom: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.5rem', borderRadius: '50%' }}>
                            <UserCheck size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {c.fullName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Mobile: <strong>{c.phoneNumber || 'Not provided'}</strong> • {c.address || 'Registered Caretaker'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Caretaker Chip */}
            {selectedCaretaker && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1.5px solid #8b5cf6',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#8b5cf6', color: '#fff', padding: '0.4rem', borderRadius: '50%' }}>
                    <Check size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
                      Selected Caretaker:
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedCaretaker.fullName} ({selectedCaretaker.phoneNumber || 'No phone'})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCaretaker(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <X size={14} />
                  <span>Change</span>
                </button>
              </div>
            )}

            {/* Assignment Request Form */}
            <form onSubmit={handleSendAssignmentRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Prescription Notes & Medication Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Describe your current prescriptions, dosages, and medical conditions (e.g. Metformin 500mg morning and night after food; Telma 40 for hypertension; Becadexamin multivitamins)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-main)',
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Prescription Document / Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={prescriptionDocUrl}
                  onChange={(e) => setPrescriptionDocUrl(e.target.value)}
                  placeholder="e.g. https://storage.example.org/prescriptions/ramesh-rx-2026.pdf"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-main)',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  If you have a digital copy of your doctor's prescription slip, paste the link here for your caretaker's review.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest || !selectedCaretaker}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  opacity: (!selectedCaretaker || isSubmittingRequest) ? 0.65 : 1
                }}
              >
                <Send size={18} />
                <span>{isSubmittingRequest ? 'Transmitting Request...' : 'Send Assignment Request & Prescription'}</span>
              </button>
            </form>
          </div>

          {/* 5. Historic / Submitted Assignment Requests */}
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-medium)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
              Assignment Requests Sent by You ({myAssignmentRequests.length})
            </h3>

            {loadingRequests ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Loading request telemetry...
              </div>
            ) : myAssignmentRequests.length === 0 ? (
              <div style={{
                background: 'var(--bg-main)',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem'
              }}>
                No assignment requests sent yet. Search for a caretaker above to initiate your care link.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {myAssignmentRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          Request to: {req.caretaker?.fullName || 'Primary Caretaker'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Contact: <strong>{req.caretaker?.phoneNumber || 'N/A'}</strong> • Submitted: {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <span className={
                        req.status === 'APPROVED' ? 'badge badge-success' :
                        req.status === 'REJECTED' ? 'badge badge-danger' :
                        'badge badge-warning'
                      } style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                        {req.status === 'APPROVED' ? '✓ Approved' : req.status === 'REJECTED' ? '✕ Declined' : '⏳ Awaiting Review'}
                      </span>
                    </div>

                    <div style={{
                      background: 'var(--bg-card)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.84rem',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-light)',
                      marginBottom: '0.5rem'
                    }}>
                      <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                        Prescription Notes:
                      </strong>
                      {req.prescriptionNotes}
                    </div>

                    {req.prescriptionDocUrl && (
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        <a href={req.prescriptionDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={14} />
                          <span>View Attached Prescription Document</span>
                        </a>
                      </div>
                    )}

                    {req.caretakerResponseNotes && (
                      <div style={{
                        background: req.status === 'APPROVED' ? 'var(--success-light)' : 'var(--danger-light)',
                        border: `1px solid ${req.status === 'APPROVED' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                        color: req.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem'
                      }}>
                        <strong>Caretaker Note:</strong> {req.caretakerResponseNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT D: PATIENT HEALTH TELEMETRY & WEARABLE SENSORS (CLINICAL GOVERNANCE: OPT-IN ONLY) */}
      {patientTab === 'TELEMETRY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Feedback Notification */}
          {telemetryFeedback && (
            <div style={{
              background: telemetryFeedback.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
              border: `1px solid ${telemetryFeedback.type === 'error' ? 'var(--danger-border)' : 'var(--success-border)'}`,
              color: telemetryFeedback.type === 'error' ? 'var(--danger)' : 'var(--success)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {telemetryFeedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <span>{telemetryFeedback.text}</span>
              </div>
              <button
                onClick={() => setTelemetryFeedback(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Clinical Governance Privacy Guarantee Banner */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(2, 132, 199, 0.05))',
            border: '1.5px solid rgba(13, 148, 136, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                }}>
                  <Activity size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Patient Health Telemetry & Smart Sensor Mesh
                    </h2>
                    <span className="badge" style={{
                      background: telemetryStatus?.telemetryEnabled ? '#dcfce7' : '#f1f5f9',
                      color: telemetryStatus?.telemetryEnabled ? '#15803d' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem'
                    }}>
                      <Shield size={12} /> {telemetryStatus?.telemetryEnabled ? 'OPT-IN ACTIVE' : 'STRICTLY PRIVACY PROTECTED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', maxWidth: '720px' }}>
                    <strong>Clinical Privacy & Autonomous Governance:</strong> Health telemetry (wearable vitals, heart rate, blood pressure, SpO2, and activity tracking) is <strong>STRICTLY OPT-IN</strong>. Only YOU can activate this service. Caretakers, pharmacists, or administrators cannot force-enable telemetry without your personal consent.
                  </p>
                </div>
              </div>

              {telemetryStatus?.telemetryEnabled && (
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSyncSensor}
                    disabled={syncingTelemetry}
                    className="btn btn-primary"
                    style={{
                      padding: '0.65rem 1.15rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      background: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <RefreshCw size={16} className={syncingTelemetry ? 'spin' : ''} />
                    <span>{syncingTelemetry ? 'Syncing BLE...' : 'Sync Sensor Now'}</span>
                  </button>

                  <button
                    onClick={() => setShowManualRecordModal(true)}
                    className="btn btn-outline"
                    style={{
                      padding: '0.65rem 1.15rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      borderColor: '#0d9488',
                      color: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <Plus size={16} />
                    <span>Manual Vital Entry</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Master Autonomous Consent Card */}
          <div className="glass-panel" style={{
            padding: '1.75rem',
            border: telemetryStatus?.telemetryEnabled ? '2px solid #10b981' : '2px dashed var(--border-medium)',
            background: telemetryStatus?.telemetryEnabled
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--bg-card))'
              : 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '650px' }}>
                <div style={{
                  background: telemetryStatus?.telemetryEnabled ? '#10b981' : '#94a3b8',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {telemetryStatus?.telemetryEnabled ? <Wifi size={28} /> : <WifiOff size={28} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {telemetryStatus?.telemetryEnabled
                      ? 'Health Telemetry is Currently ACTIVE (Self-Enabled)'
                      : 'Health Telemetry is Currently DISABLED (Zero Tracking)'}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
                    {telemetryStatus?.telemetryEnabled
                      ? `You gave explicit consent on ${telemetryStatus?.consentAt ? new Date(telemetryStatus.consentAt).toLocaleDateString() : 'recent session'}. Wearable devices, smart blood pressure monitors, and continuous glucose telemetry can stream vitals to your personal adherence record.`
                      : 'Wearable sensors, vitals streaming, and smart-band background telemetry are completely inactive. No vital data is gathered or shared with third parties or family members. You maintain total privacy autonomy.'}
                  </p>

                  {/* Config options when enabled */}
                  {telemetryStatus?.telemetryEnabled && (
                    <div style={{
                      marginTop: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      background: 'var(--bg-main)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <input
                          type="checkbox"
                          checked={sharingConsent}
                          onChange={(e) => handleUpdateTelemetryPreferences(e.target.checked, syncFrequency)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>
                          Allow Primary Caretaker ({caretaker ? caretaker.fullName : 'Supervised Caretaker'}) to view my live vitals stream for emergency alerts
                        </span>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Sliders size={16} />
                        <span>Background Sensor Polling Cadence:</span>
                        <select
                          value={syncFrequency}
                          onChange={(e) => handleUpdateTelemetryPreferences(sharingConsent, parseInt(e.target.value, 10))}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-card)',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                        >
                          <option value={15}>Every 15 Minutes (High Precision)</option>
                          <option value={30}>Every 30 Minutes (Recommended)</option>
                          <option value={60}>Every 60 Minutes (Battery Saver)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Master Toggle Button */}
              <div>
                {telemetryStatus?.telemetryEnabled ? (
                  <button
                    onClick={() => handleToggleTelemetry(false)}
                    disabled={loadingTelemetry}
                    className="btn btn-outline"
                    style={{
                      borderColor: 'var(--danger)',
                      color: 'var(--danger)',
                      padding: '0.75rem 1.4rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <WifiOff size={18} />
                    <span>{loadingTelemetry ? 'Updating...' : 'Deactivate Telemetry (Revoke Consent)'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleTelemetry(true)}
                    disabled={loadingTelemetry}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #0d9488, #059669)',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                    }}
                  >
                    <Wifi size={18} />
                    <span>{loadingTelemetry ? 'Activating...' : 'Enable My Health Telemetry (Opt-In)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LIVE VITALS GAUGES (Only visible when self-enabled by patient) */}
          {telemetryStatus?.telemetryEnabled ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Telemetry Sensor Hub Diagnostics Strip */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.84rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Sensor Mesh: {telemetryStatus?.latestReading?.sensorSource || 'Patient BLE Wearable Band'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>• Status: <strong>ONLINE & STREAMING</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Battery size={16} color="#10b981" />
                    <span>Battery: <strong>{telemetryStatus?.latestReading?.deviceBatteryLevel || 91}%</strong></span>
                  </div>
                  <div>
                    Last Sync: <strong>{telemetryStatus?.latestReading?.timestamp ? new Date(telemetryStatus.latestReading.timestamp).toLocaleTimeString() : 'Just Now'}</strong>
                  </div>
                </div>
              </div>

              {/* 6 High-Contrast Elderly Accessible Vitals Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem'
              }}>
                {/* 1. Heart Rate */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #ef4444',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Heart Rate
                    </span>
                    <HeartPulse size={22} color="#ef4444" className="pulse-slow" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.heartRate || 74}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>BPM</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Normal Sinus Rhythm (60-100)
                  </div>
                </div>

                {/* 2. Blood Pressure */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #0284c7',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Blood Pressure
                    </span>
                    <Activity size={22} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.systolicBp || 120} / {telemetryStatus?.latestReading?.diastolicBp || 80}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>mmHg</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Optimal Geriatric Target
                  </div>
                </div>

                {/* 3. Blood Oxygen SpO2 */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #10b981',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Blood Oxygen (SpO2)
                    </span>
                    <Activity size={22} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.oxygenSaturation || 98.5}%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Healthy Pulmonary Saturation
                  </div>
                </div>

                {/* 4. Blood Glucose */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #f59e0b',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Blood Glucose (CGM)
                    </span>
                    <Sparkles size={22} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.bloodGlucose || 110}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>mg/dL</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Controlled Post-Meal Target
                  </div>
                </div>

                {/* 5. Body Temperature */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #8b5cf6',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Body Temperature
                    </span>
                    <Thermometer size={22} color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.bodyTemperature || 98.6}°F
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Normal Body Temp (Afebrile)
                  </div>
                </div>

                {/* 6. Daily Steps & Activity */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderTop: '4px solid #06b6d4',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Daily Mobility
                    </span>
                    <Activity size={22} color="#06b6d4" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {telemetryStatus?.latestReading?.stepCount?.toLocaleString() || '2,600'}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Steps</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: 700, marginTop: '0.3rem' }}>
                    ● Active Geriatric Ambulation
                  </div>
                </div>
              </div>

              {/* Telemetry Reading History Log */}
              <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-medium)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Recent Sensor Telemetry Readings ({telemetryHistory.length})
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Immutable timestamped records received from your wearable device or manual inputs.
                    </p>
                  </div>
                  <button
                    onClick={() => loadTelemetryStatus(patient.id)}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <RefreshCw size={14} /> Refresh Log
                  </button>
                </div>

                {telemetryHistory.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    No telemetry records yet. Click <strong>Sync Sensor Now</strong> above to pull your first reading!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Time</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Heart Rate</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Blood Pressure</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>SpO2</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Glucose</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Temp</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Steps</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {telemetryHistory.map(row => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <strong>{row.heartRate}</strong> bpm
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <strong>{row.systolicBp}/{row.diastolicBp}</strong> mmHg
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <strong>{row.oxygenSaturation}%</strong>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <strong>{row.bloodGlucose}</strong> mg/dL
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <strong>{row.bodyTemperature}</strong>°F
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              {row.stepCount?.toLocaleString() || '-'}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              {row.abnormalReading ? (
                                <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                                  ⚠️ {row.anomalyWarning || 'Abnormal Vital'}
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                  ✓ Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Information Card when Telemetry is Disabled */
            <div className="glass-panel" style={{
              padding: '2.5rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.03), var(--bg-card))',
              border: '1px solid var(--border-medium)'
            }}>
              <Shield size={44} style={{ opacity: 0.35, margin: '0 auto 1rem auto', color: '#0284c7' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                Why Consider Enabling Health Telemetry?
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                Enabling telemetry allows your connected wearable or home blood pressure monitor to stream essential health readings. If an irregular heartbeat or dangerous blood pressure spike is detected, your caretaker receives an instant high-priority alert.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                maxWidth: '750px',
                margin: '0 auto 1.75rem auto',
                textAlign: 'left'
              }}>
                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0d9488', marginBottom: '0.25rem' }}>
                    1. 100% Patient Autonomy
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Only you can enable or disable telemetry. You can turn it off anytime with zero penalties.
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7', marginBottom: '0.25rem' }}>
                    2. Early Clinical Radar
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Automatic detection of oxygen drops or blood pressure spikes protects you around the clock.
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                    3. Strict Data Minimization
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Your pharmacy or chemist CANNOT see your vitals. Only you and your primary caretaker have access.
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleToggleTelemetry(true)}
                disabled={loadingTelemetry}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #059669)',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <Wifi size={18} />
                <span>Enable Telemetry Now (Opt-In)</span>
              </button>
            </div>
          )}

          {/* Manual Vital Entry Modal */}
          {showManualRecordModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}>
              <div className="glass-panel" style={{
                background: 'var(--bg-card)',
                width: '100%',
                maxWidth: '480px',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                border: '1.5px solid var(--border-medium)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={22} color="#0d9488" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Record Vital Signs Reading
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowManualRecordModal(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveManualTelemetry} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Heart Rate (BPM)</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={manualForm.heartRate}
                        onChange={(e) => setManualForm({ ...manualForm, heartRate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Blood Oxygen (SpO2 %)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="input-field"
                        value={manualForm.oxygenSaturation}
                        onChange={(e) => setManualForm({ ...manualForm, oxygenSaturation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={manualForm.systolicBp}
                        onChange={(e) => setManualForm({ ...manualForm, systolicBp: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={manualForm.diastolicBp}
                        onChange={(e) => setManualForm({ ...manualForm, diastolicBp: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Blood Glucose (mg/dL)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        value={manualForm.bloodGlucose}
                        onChange={(e) => setManualForm({ ...manualForm, bloodGlucose: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Body Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        value={manualForm.bodyTemperature}
                        onChange={(e) => setManualForm({ ...manualForm, bodyTemperature: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Clinical Notes / Observations</label>
                    <textarea
                      rows={2}
                      className="input-field"
                      placeholder="e.g., Measured 30 mins after evening dinner."
                      value={manualForm.telemetryNotes}
                      onChange={(e) => setManualForm({ ...manualForm, telemetryNotes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowManualRecordModal(false)}
                      className="btn btn-outline"
                      style={{ padding: '0.55rem 1rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingTelemetry}
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 1.25rem', background: '#0d9488' }}
                    >
                      {loadingTelemetry ? 'Saving...' : 'Save Vitals Reading'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
