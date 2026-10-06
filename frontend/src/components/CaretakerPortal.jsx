import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Pill,
  Plus,
  CheckCircle,
  PhoneCall,
  Calendar,
  Truck,
  HeartPulse,
  User,
  Trash2,
  Users,
  Store,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Activity,
  UserCheck,
  FileText,
  Check,
  X,
  AlertCircle,
  Shield,
  Wifi,
  WifiOff,
  Battery,
  Thermometer
} from 'lucide-react';
import { api } from '../api';
import MedicineTracker from './MedicineTracker';

export default function CaretakerPortal({
  summary,
  onOpenAddMedicine,
  onResolveAlert,
  onDeleteMedicine,
  onSimulateReminder,
  onPatientSwitched,
  onChemistChanged,
  currentUser,
  onSpeak,
  voiceEnabled,
  caretakerView,
  setCaretakerView
}) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [chemistsList, setChemistsList] = useState([]);
  const [selectedChemistId, setSelectedChemistId] = useState('');
  const [isChangingChemist, setIsChangingChemist] = useState(false);
  const [patientMedicines, setPatientMedicines] = useState([]);
  const [patientSchedules, setPatientSchedules] = useState([]);
  const [patientRefills, setPatientRefills] = useState([]);
  const [patientTelemetry, setPatientTelemetry] = useState(null);
  const [loadingPatientData, setLoadingPatientData] = useState(false);

  // Assignment Requests State
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestChemistMap, setRequestChemistMap] = useState({});
  const [requestNotesMap, setRequestNotesMap] = useState({});
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const caretakerId = currentUser?.id || summary?.currentUser?.id;

  // Load patients, chemists, and assignment requests
  useEffect(() => {
    if (caretakerId) {
      loadCaredPatients(caretakerId);
      loadChemists();
      loadRequests(caretakerId);
    }
  }, [caretakerId]);

  const loadCaredPatients = async (cId) => {
    try {
      const data = await api.getPatientsByCaretaker(cId);
      setPatientList(data || []);
      if (data && data.length > 0) {
        if (!selectedPatientId || !data.some(p => p.id === selectedPatientId)) {
          setSelectedPatientId(data[0].id);
          loadPatientDetails(data[0].id);
        }
      } else {
        setSelectedPatientId(null);
        setPatientMedicines([]);
        setPatientSchedules([]);
        setPatientRefills([]);
      }
    } catch (err) {
      console.error('Failed to load supervised patients:', err);
    }
  };

  const loadChemists = async () => {
    try {
      const chemists = await api.getChemists();
      setChemistsList(chemists || []);
    } catch (err) {
      console.error('Failed to load chemists list:', err);
    }
  };

  const loadRequests = async (cId) => {
    setLoadingRequests(true);
    try {
      const reqs = await api.getCaretakerAssignmentRequests(cId);
      setIncomingRequests(reqs || []);
      // Set default chemist for pending requests
      const initialChemistMap = {};
      const initialNotesMap = {};
      (reqs || []).forEach(r => {
        if (r.status === 'PENDING') {
          initialNotesMap[r.id] = 'Prescription verified. Dosages scheduled and pharmacy mapped.';
        }
      });
      setRequestNotesMap(prev => ({ ...initialNotesMap, ...prev }));
    } catch (err) {
      console.error('Failed to load assignment requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load specific patient's clinical records
  const loadPatientDetails = async (patientId) => {
    if (!patientId) return;
    setLoadingPatientData(true);
    try {
      const [meds, scheds, ords, telem] = await Promise.all([
        api.getMedicinesByPatient(patientId).catch(() => []),
        api.getSchedulesByPatient(patientId).catch(() => []),
        api.getRefillsByPatient(patientId).catch(() => []),
        api.getTelemetryStatus(patientId).catch(() => null)
      ]);
      setPatientMedicines(meds || []);
      setPatientSchedules(scheds || []);
      setPatientRefills(ords || []);
      setPatientTelemetry(telem);
    } catch (err) {
      console.error('Failed to load patient clinical data:', err);
    } finally {
      setLoadingPatientData(false);
    }
  };

  // Switch selected patient
  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.id);
    loadPatientDetails(patient.id);
    if (patient.chemist?.id) {
      setSelectedChemistId(patient.chemist.id);
    }
    if (onPatientSwitched) {
      onPatientSwitched(patient.id);
    }
  };

  // Bind a new chemist to the active patient
  const handleChemistBindChange = async (e) => {
    const newChemistId = e.target.value;
    setSelectedChemistId(newChemistId);
    if (!selectedPatientId) return;

    try {
      setIsChangingChemist(true);
      await api.bindChemist(selectedPatientId, newChemistId);
      if (onChemistChanged) onChemistChanged();
      const updated = await api.getPatientById(selectedPatientId);
      setPatientList(prev => prev.map(p => p.id === updated.id ? updated : p));
      setActionFeedback({ type: 'success', message: 'Bound chemist updated successfully.' });
    } catch (err) {
      console.error('Failed to bind chemist:', err);
      setActionFeedback({ type: 'error', message: 'Failed to bind chemist: ' + err.message });
    } finally {
      setIsChangingChemist(false);
    }
  };

  // Approve Assignment Request
  const handleApproveRequest = async (req) => {
    setActionInProgressId(req.id);
    setActionFeedback(null);
    try {
      const chemistId = requestChemistMap[req.id] || (chemistsList.length > 0 ? chemistsList[0].id : null);
      const notes = requestNotesMap[req.id] || 'Approved by primary caretaker.';

      await api.approveAssignmentRequest(req.id, {
        chemistId: chemistId ? parseInt(chemistId, 10) : null,
        notes
      });

      setActionFeedback({
        type: 'success',
        message: `Successfully approved ${req.patient?.fullName}! Patient bound to your care and designated pharmacy.`
      });

      // Reload requests and patient directory
      await loadRequests(caretakerId);
      await loadCaredPatients(caretakerId);

      // Select this patient
      if (req.patient?.id) {
        setSelectedPatientId(req.patient.id);
        loadPatientDetails(req.patient.id);
      }

      if (setCaretakerView) {
        setCaretakerView('OVERVIEW');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setActionFeedback({ type: 'error', message: 'Approval failed: ' + err.message });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reject Assignment Request
  const handleRejectRequest = async (req) => {
    const reason = prompt('Please enter the reason for declining this care request:', 'Unable to supervise at this time.');
    if (!reason) return;

    setActionInProgressId(req.id);
    setActionFeedback(null);
    try {
      await api.rejectAssignmentRequest(req.id, reason);
      setActionFeedback({ type: 'info', message: `Request from ${req.patient?.fullName} declined.` });
      await loadRequests(caretakerId);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setActionFeedback({ type: 'error', message: 'Rejection failed: ' + err.message });
    } finally {
      setActionInProgressId(null);
    }
  };

  const pendingRequests = incomingRequests.filter(r => r.status === 'PENDING');
  const activePatient = patientList.find(p => p.id === selectedPatientId) || patientList[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Bar with Supervision Metrics & Action Buttons */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(2, 132, 199, 0.06))',
        border: '1px solid rgba(139, 92, 246, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={26} color="#8b5cf6" />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Caretaker Clinical Governance Desk
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#6d28d9' }}>
                Primary Supervisor: {currentUser?.fullName || 'Caretaker'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Full Clinical Authority &bull; Prescription Governance &bull; Pharmacy Network Binding &bull; Missed Dose Radar
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (setCaretakerView) setCaretakerView('REQUESTS');
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: caretakerView === 'REQUESTS' ? '#8b5cf6' : 'var(--bg-card)',
                color: caretakerView === 'REQUESTS' ? '#fff' : 'var(--text-main)',
                border: '1.5px solid #8b5cf6',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              <UserCheck size={16} />
              <span>Assignment Requests</span>
              {pendingRequests.length > 0 && (
                <span style={{
                  background: 'var(--danger)',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 900
                }}>
                  {pendingRequests.length} PENDING
                </span>
              )}
            </button>

            {activePatient && (
              <button
                onClick={() => onOpenAddMedicine && onOpenAddMedicine(activePatient.id)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.86rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>+ Schedule Medicine for {activePatient.fullName.split(' ')[0]}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div style={{
          background: actionFeedback.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
          border: `1px solid ${actionFeedback.type === 'error' ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: actionFeedback.type === 'error' ? 'var(--danger)' : 'var(--success)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {actionFeedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. VIEW 1: INCOMING ASSIGNMENT REQUESTS QUEUE */}
      {caretakerView === 'REQUESTS' && (
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={22} color="#8b5cf6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Incoming Patient Assignment Requests ({incomingRequests.length})
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Patients search for you by Name or Mobile to request clinical governance. Review their prescription notes, bind a designated pharmacy, and click <strong>Approve</strong> to author their medicine schedules.
              </p>
            </div>

            <button
              onClick={() => {
                if (setCaretakerView) setCaretakerView('OVERVIEW');
              }}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              ← Back to Overview
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Loading incoming assignment requests...
            </div>
          ) : incomingRequests.length === 0 ? (
            <div style={{
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <UserCheck size={40} style={{ opacity: 0.35, margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                No Incoming Assignment Requests
              </div>
              <p style={{ fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
                When patients register and search for your Name (<strong>{currentUser?.fullName}</strong>) or Mobile (<strong>{currentUser?.phoneNumber || 'registered number'}</strong>), their prescription details and care requests will appear here for your clinical authorization.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {incomingRequests.map(req => {
                const isPending = req.status === 'PENDING';
                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: isPending ? '2px solid #8b5cf6' : '1px solid var(--border-light)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: isPending ? '0 4px 14px rgba(139, 92, 246, 0.12)' : 'none'
                    }}
                  >
                    {/* Top Row: Patient Demographics & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.15rem'
                        }}>
                          {req.patient?.fullName ? req.patient.fullName[0] : 'P'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                              {req.patient?.fullName}
                            </h3>
                            {req.patient?.age && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                ({req.patient.age} yrs old)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            Phone: <strong>{req.patient?.phoneNumber || 'N/A'}</strong> &bull; Address: <strong>{req.patient?.address || 'N/A'}</strong>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            Submitted: {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <span className={
                        req.status === 'APPROVED' ? 'badge badge-success' :
                        req.status === 'REJECTED' ? 'badge badge-danger' :
                        'badge badge-warning'
                      } style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}>
                        {req.status === 'APPROVED' ? '✓ Approved' : req.status === 'REJECTED' ? '✕ Declined' : '⏳ Awaiting Clinical Approval'}
                      </span>
                    </div>

                    {/* Patient Prescription Notes */}
                    <div style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Patient Prescription & Medical Notes:
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        {req.prescriptionNotes || 'No additional notes provided.'}
                      </p>
                      {req.prescriptionDocUrl && (
                        <div style={{ marginTop: '0.65rem' }}>
                          <a
                            href={req.prescriptionDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <FileText size={15} />
                            <span>Inspect Patient Attached Prescription Document</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Governance Controls for PENDING requests */}
                    {isPending && (
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.04)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Clinical Approval & Chemist Binding Configuration:
                        </div>

                        {/* Dropdown to Bind a Registered Chemist */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                            Bind Designated Chemist for Auto-Refill Drops: *
                          </label>
                          <select
                            value={requestChemistMap[req.id] || (chemistsList.length > 0 ? chemistsList[0].id : '')}
                            onChange={(e) => setRequestChemistMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-main)',
                              fontSize: '0.86rem',
                              fontWeight: 700
                            }}
                          >
                            {chemistsList.length === 0 ? (
                              <option value="">No verified chemists registered yet</option>
                            ) : (
                              chemistsList.map(ch => (
                                <option key={ch.id} value={ch.id}>
                                  🏥 {ch.fullName} ({ch.address || 'Local Pharmacy'} - {ch.phoneNumber || 'No phone'})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Caretaker Clinical Regimen Notes */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                            Caretaker Approval Notes / Instructions for Regimen:
                          </label>
                          <input
                            type="text"
                            value={requestNotesMap[req.id] || ''}
                            onChange={(e) => setRequestNotesMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="e.g. Prescription validated. Scheduled for morning and evening dosings."
                            style={{
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-main)',
                              fontSize: '0.86rem'
                            }}
                          />
                        </div>

                        {/* Approval / Decline Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            disabled={actionInProgressId === req.id}
                            onClick={() => handleRejectRequest(req)}
                            className="btn btn-outline"
                            style={{ padding: '0.55rem 1rem', fontSize: '0.84rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                          >
                            <X size={15} />
                            <span>Decline Request</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionInProgressId === req.id}
                            onClick={() => handleApproveRequest(req)}
                            className="btn btn-success"
                            style={{ padding: '0.55rem 1.25rem', fontSize: '0.86rem', fontWeight: 800 }}
                          >
                            <Check size={16} />
                            <span>{actionInProgressId === req.id ? 'Approving...' : 'Approve & Bind Chemist'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Caretaker Response Notes if already responded */}
                    {!isPending && req.caretakerResponseNotes && (
                      <div style={{
                        background: req.status === 'APPROVED' ? 'var(--success-light)' : 'var(--danger-light)',
                        border: `1px solid ${req.status === 'APPROVED' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                        color: req.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem'
                      }}>
                        <strong>Your Response:</strong> {req.caretakerResponseNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. VIEW 2: SUPERVISED PATIENTS OVERVIEW & CLINICAL SCHEDULING */}
      {caretakerView !== 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Patient Directory / Selection Card */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--primary)" />
                  <span>Supervised Patients Directory ({patientList.length})</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Select any supervised patient to configure their locked medicines, slot timings, and bind fulfillment chemists.
                </p>
              </div>

              {pendingRequests.length > 0 && (
                <button
                  onClick={() => {
                    if (setCaretakerView) setCaretakerView('REQUESTS');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 800, background: '#8b5cf6' }}
                >
                  <span>Review {pendingRequests.length} Pending Requests →</span>
                </button>
              )}
            </div>

            {patientList.length === 0 ? (
              <div style={{
                background: 'var(--bg-main)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Users size={36} style={{ opacity: 0.35, margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  No Patients Currently Bound
                </div>
                <p style={{ fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 1rem auto' }}>
                  Once registered patients send you an assignment request, you can approve them from the <strong>Incoming Assignment Requests</strong> tab.
                </p>
                <button
                  onClick={() => {
                    if (setCaretakerView) setCaretakerView('REQUESTS');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 800 }}
                >
                  View Incoming Requests
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                {patientList.map(p => {
                  const isSelected = p.id === activePatient?.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                          {p.fullName}
                        </div>
                        {isSelected && (
                          <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Age: <strong>{p.age || 'N/A'} yrs</strong> &bull; Mobile: <strong>{p.phoneNumber || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Pharmacy: <strong>{p.chemist?.fullName || 'Not bound yet'}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Patient Details, Regimen & MedicineTracker */}
          {activePatient && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Active Patient Clinical Profile Summary Bar */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        {activePatient.fullName}
                      </h2>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        Supervised Regimen
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Age: <strong>{activePatient.age || 'N/A'} yrs</strong> &bull; Address: <strong>{activePatient.address || 'N/A'}</strong> &bull; Mobile: <strong>{activePatient.phoneNumber || 'N/A'}</strong>
                    </p>
                  </div>

                  {/* Direct Phone Call Button & Pharmacy Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {activePatient.phoneNumber && (
                      <a
                        href={`tel:${activePatient.phoneNumber}`}
                        className="btn btn-outline"
                        style={{
                          padding: '0.5rem 0.85rem',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        <PhoneCall size={14} color="var(--primary)" />
                        <span>Call {activePatient.fullName.split(' ')[0]}</span>
                      </a>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-main)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <Store size={15} color="var(--primary)" />
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Designated Chemist:</span>
                      <select
                        value={selectedChemistId || (activePatient.chemist?.id || '')}
                        onChange={handleChemistBindChange}
                        disabled={isChangingChemist}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">None / Unbound</option>
                        {chemistsList.map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Health Telemetry Monitor (Clinical Governance: Opt-In by Patient Only) */}
              <div className="glass-panel" style={{
                padding: '1.25rem 1.5rem',
                border: patientTelemetry?.telemetryEnabled ? '1.5px solid #10b981' : '1.5px dashed var(--border-medium)',
                background: patientTelemetry?.telemetryEnabled
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--bg-card))'
                  : 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color={patientTelemetry?.telemetryEnabled ? '#10b981' : 'var(--text-secondary)'} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Patient Health Telemetry & Vitals Stream
                    </h3>
                  </div>

                  <span className="badge" style={{
                    background: patientTelemetry?.telemetryEnabled ? '#dcfce7' : '#f1f5f9',
                    color: patientTelemetry?.telemetryEnabled ? '#15803d' : '#64748b',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    {patientTelemetry?.telemetryEnabled ? '● STREAM AUTHORIZED BY PATIENT' : '🔒 INACTIVE (PATIENT AUTONOMOUS CONTROL)'}
                  </span>
                </div>

                {!patientTelemetry?.telemetryEnabled ? (
                  <div style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem'
                  }}>
                    <Shield size={24} color="#64748b" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Telemetry Disabled by Patient: </strong>
                      {activePatient.fullName} has not activated health telemetry on their account.
                      In strict compliance with patient data privacy and clinical governance, wearable vitals streaming can <strong>ONLY be self-activated by the patient</strong> from their personal portal. Caretakers cannot force-enable telemetry.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                      Consent self-enabled by <strong>{activePatient.fullName}</strong> on {patientTelemetry?.consentAt ? new Date(patientTelemetry.consentAt).toLocaleDateString() : 'recent session'}.
                      Background polling interval: {patientTelemetry?.frequencyMinutes || 30} minutes.
                    </div>

                    {/* Vitals Summary Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>HEART RATE</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ef4444' }}>
                          {patientTelemetry?.latestReading?.heartRate || 74} <span style={{ fontSize: '0.75rem' }}>bpm</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BLOOD PRESSURE</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284c7' }}>
                          {patientTelemetry?.latestReading?.systolicBp || 120}/{patientTelemetry?.latestReading?.diastolicBp || 80}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BLOOD OXYGEN</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                          {patientTelemetry?.latestReading?.oxygenSaturation || 98.5}%
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BLOOD GLUCOSE</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b' }}>
                          {patientTelemetry?.latestReading?.bloodGlucose || 110} <span style={{ fontSize: '0.75rem' }}>mg/dL</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DEVICE BATTERY</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
                          {patientTelemetry?.latestReading?.deviceBatteryLevel || 91}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Medicine Tracker with Time Duration Windows & Caretaker Resolution */}
              <MedicineTracker
                patientId={activePatient.id}
                patientName={activePatient.fullName}
                patientPhone={activePatient.phoneNumber}
                caretakerName={currentUser?.fullName || 'Primary Caretaker'}
                isPatientRole={false}
                isCaretakerRole={true}
                onAlertResolved={() => {
                  loadPatientDetails(activePatient.id);
                  if (onPatientSwitched) onPatientSwitched(activePatient.id);
                }}
                onSpeak={null}
                voiceEnabled={false}
              />

              {/* Prescribed Medications & Regimen Authoring */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Pill size={18} color="var(--primary)" />
                      <span>Prescribed Medications & Inventory ({patientMedicines.length})</span>
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                      Pessimistic write lock enforced. Prescriptions are locked as read-only on patient phones.
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenAddMedicine && onOpenAddMedicine(activePatient?.id)}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Plus size={14} />
                    <span>+ Schedule New Medicine</span>
                  </button>
                </div>

                {loadingPatientData ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading prescription regimen...
                  </div>
                ) : patientMedicines.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    border: '1px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)'
                  }}>
                    <Pill size={32} style={{ opacity: 0.35, margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      No Medications Prescribed for {activePatient.fullName}
                    </div>
                    <p style={{ fontSize: '0.82rem', margin: '0 auto 0.85rem auto', maxWidth: '380px' }}>
                      Click below to schedule medicines, daily dosage timings (Morning/Afternoon/Night), and initial strip counts.
                    </p>
                    <button
                      onClick={() => onOpenAddMedicine && onOpenAddMedicine(activePatient?.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
                    >
                      <Plus size={15} />
                      <span>Schedule First Medicine</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {patientMedicines.map(med => {
                      const daily = Math.max(1, med.dailyDoseCount);
                      const daysLeft = Math.floor(med.remainingTablets / daily);
                      const isLow = daysLeft <= 5;
                      const totalCourse = med.totalCourseDays || 90;
                      const completedCourse = med.daysCompleted || 0;

                      return (
                        <div
                          key={med.id}
                          style={{
                            background: 'var(--bg-main)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.15rem',
                            border: isLow ? '2px solid var(--warning-border)' : '1.5px solid var(--border-light)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                  {med.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                                  {med.dosage} &bull; {med.dailyDoseCount}x daily
                                </div>
                              </div>

                              {isLow ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                  LOW STOCK ({daysLeft}d left)
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                  SUFFICIENT ({daysLeft}d left)
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              <strong>Rule:</strong> {med.instructions || 'Take as prescribed.'}
                            </div>

                            <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span>Course Progress:</span>
                                <strong>{completedCourse} / {totalCourse} days completed</strong>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.round((completedCourse / totalCourse) * 100))}%`, height: '100%', background: 'var(--primary)' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                                <span>Physical Box Stock: <strong>{med.remainingTablets} tablets</strong></span>
                                <span>Exhaustion in: <strong>{daysLeft} days</strong></span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                            <button
                              onClick={() => onDeleteMedicine && onDeleteMedicine(med.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                            >
                              <Trash2 size={13} />
                              <span>Discontinue</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Refill Orders for Active Patient */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Truck size={18} color="var(--primary)" />
                  <span>Autonomous Pharmacy Refill Orders for {activePatient.fullName}</span>
                </h3>

                {patientRefills.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
                    No active refill orders. The system will automatically dispatch an order to the bound pharmacy when stock drops &le; 5 days supply.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {patientRefills.map(refill => (
                      <div
                        key={refill.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'var(--bg-main)',
                          padding: '0.85rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {refill.medicine?.name || 'Refill Item'} ({refill.quantity || 30}-tablet monthly strip)
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Pharmacy: <strong>{refill.chemist?.fullName || 'Designated Chemist'}</strong> &bull; Order Status: <strong>{refill.orderStatus}</strong>
                          </div>
                        </div>

                        <span className={`badge ${refill.orderStatus === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                          {refill.orderStatus === 'DELIVERED' ? '✓ Restocked in Box' : 'In Fulfillment Pipeline'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
