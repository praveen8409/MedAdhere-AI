import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Pill, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sun, 
  CloudSun, 
  Moon, 
  Volume2, 
  PhoneCall, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  History, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Zap, 
  HeartHandshake
} from 'lucide-react';
import { api } from '../api';

export default function MedicineTracker({
  patientId,
  patientName,
  patientPhone,
  caretakerName,
  isPatientRole,
  isCaretakerRole,
  onDoseTakenSuccess,
  onAlertResolved,
  onSpeak,
  voiceEnabled
}) {
  const [schedules, setSchedules] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [takingId, setTakingId] = useState(null);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [selectedResponseTemplate, setSelectedResponseTemplate] = useState({});
  const [showResolvedAudit, setShowResolvedAudit] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep track of current minute for dynamic countdowns
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(clockTimer);
  }, []);

  const loadTrackerData = useCallback(async () => {
    if (!patientId) return;
    try {
      const [scheds, meds, altList] = await Promise.all([
        api.getSchedulesByPatient(patientId).catch(() => []),
        api.getMedicinesByPatient(patientId).catch(() => []),
        api.getAlertsByPatient(patientId).catch(() => [])
      ]);
      setSchedules(scheds || []);
      setMedicines(meds || []);
      setAlerts(altList || []);
    } catch (err) {
      console.error('Failed to load dynamic tracker data:', err);
    }
  }, [patientId]);

  // Initial load
  useEffect(() => {
    if (patientId) {
      setLoading(true);
      loadTrackerData().finally(() => setLoading(false));
    }
  }, [patientId, loadTrackerData]);

  // Real-time synchronization polling every 10 seconds for seamless multi-device sync
  useEffect(() => {
    if (!patientId) return;
    const syncInterval = setInterval(() => {
      loadTrackerData();
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [patientId, loadTrackerData]);

  // Time window calculation helper
  const getTimeWindowInfo = (sched) => {
    const slot = sched.scheduledSlot || 'MORNING';
    let startHour = 8;
    let startMin = 0;

    if (sched.scheduledTime) {
      const parts = sched.scheduledTime.split(':');
      startHour = parseInt(parts[0], 10);
      startMin = parseInt(parts[1], 10);
    } else {
      if (slot === 'MORNING') { startHour = 8; startMin = 0; }
      else if (slot === 'AFTERNOON') { startHour = 13; startMin = 30; }
      else if (slot === 'NIGHT') { startHour = 20; startMin = 30; }
    }

    const windowMinutes = sched.windowMinutes || 90;
    const startTotal = startHour * 60 + startMin;
    const endTotal = startTotal + windowMinutes;

    const endHour = Math.floor(endTotal / 60) % 24;
    const endMin = endTotal % 60;

    const formatTime = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : m;
      return `${displayH}:${displayM} ${ampm}`;
    };

    const startTimeFormatted = formatTime(startHour, startMin);
    const endTimeFormatted = formatTime(endHour, endMin);

    const nowTotal = currentTime.getHours() * 60 + currentTime.getMinutes();

    let windowStatus = 'PENDING';
    let timeRemainingMinutes = 0;

    if (nowTotal < startTotal) {
      windowStatus = 'UPCOMING';
      timeRemainingMinutes = startTotal - nowTotal;
    } else if (nowTotal >= startTotal && nowTotal <= endTotal) {
      windowStatus = 'ACTIVE';
      timeRemainingMinutes = endTotal - nowTotal;
    } else {
      windowStatus = 'EXPIRED';
      timeRemainingMinutes = nowTotal - endTotal;
    }

    return {
      startTimeFormatted,
      endTimeFormatted,
      windowMinutes,
      windowStatus,
      timeRemainingMinutes
    };
  };

  // Patient marks dose taken
  const handleTakeDose = async (schedule) => {
    setTakingId(schedule.id);
    try {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      if (isPatientRole && voiceEnabled && onSpeak) {
        onSpeak(`Shabash! You have taken ${schedule.medicine?.name || 'your medicine'}. Dose recorded!`);
      }

      await api.markDoseTaken(schedule.id);
      await loadTrackerData();

      if (onDoseTakenSuccess) {
        onDoseTakenSuccess(schedule);
      }
    } catch (err) {
      console.error('Failed to mark dose taken:', err);
    } finally {
      setTakingId(null);
    }
  };

  // Simulate time duration window expiration (triggers auto-alert)
  const handleSimulateMissedDose = async (schedule) => {
    setTakingId(schedule.id);
    try {
      await api.markDoseMissed(schedule.id);
      await loadTrackerData();

      if (isPatientRole && voiceEnabled && onSpeak) {
        onSpeak(`Time window expired for ${schedule.medicine?.name || 'medicine'}. Alert dispatched to caretaker.`);
      }
    } catch (err) {
      console.error('Failed to mark missed dose:', err);
    } finally {
      setTakingId(null);
    }
  };

  // Caretaker marks missed dose alert as resolved with clinical response
  const handleResolveMissedAlert = async (alert) => {
    setResolvingAlertId(alert.id);
    try {
      const notes = resolutionNotes[alert.id] || selectedResponseTemplate[alert.id] || 'Called patient and verified dose was taken with warm water.';
      const resolvedBy = caretakerName || 'Dr. Ananya Sharma';

      await api.resolveAlert(alert.id, notes, resolvedBy);
      await loadTrackerData();

      if (onAlertResolved) {
        onAlertResolved(alert);
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingAlertId(null);
    }
  };

  // Adherence Calculations
  const totalDoses = schedules.length;
  const takenDoses = schedules.filter(s => s.status === 'TAKEN').length;
  const missedDoses = schedules.filter(s => s.status === 'MISSED').length;
  const pendingDoses = totalDoses - takenDoses - missedDoses;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  // Alerts filtering
  const unresolvedMissedAlerts = alerts.filter(a => !a.resolved && a.alertType === 'MISSED_DOSE');
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header & Live Adherence Telemetry Card */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))',
        border: '1px solid var(--border-medium)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <Pill size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Dynamic Medicine Intake Tracker
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                <Sparkles size={11} /> Real-Time Telemetry
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Monitoring: <strong>{patientName || 'Patient'}</strong> &bull; Caretaker Governance: <strong>{caretakerName || 'Dr. Ananya Sharma'}</strong>
            </p>
          </div>

          {/* Quick Adherence Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: adherenceRate >= 80 ? 'var(--success)' : adherenceRate >= 60 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>
                {adherenceRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
                Today's Adherence
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              gap: '1rem',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓ {takenDoses}</span> Taken
              </div>
              <div>
                <span style={{ color: 'var(--warning)', fontWeight: 800 }}>⏳ {pendingDoses}</span> Due
              </div>
              <div>
                <span style={{ color: 'var(--danger)', fontWeight: 800 }}>⚠ {missedDoses}</span> Missed
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '1rem' }}>
          <div style={{
            width: `${totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #0284c7)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* 2. CARETAKER RADAR: Active Missed Dose Alerts & Clinical Response Center */}
      {unresolvedMissedAlerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
          border: '2px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                background: 'var(--danger)',
                color: '#fff',
                padding: '0.45rem',
                borderRadius: '8px',
                animation: 'pulse-ring 1.5s infinite'
              }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>
                  CRITICAL MISSED DOSE RADAR: Caretaker Response Required
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                  {patientName} did not ingest medication within the allowed time duration window. Auto-alert escalated to caretaker desk.
                </p>
              </div>
            </div>

            {patientPhone && (
              <a
                href={`tel:${patientPhone}`}
                className="btn btn-danger"
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none'
                }}
              >
                <PhoneCall size={15} />
                <span>Call Patient ({patientPhone})</span>
              </a>
            )}
          </div>

          {/* List of active missed dose incidents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {unresolvedMissedAlerts.map(alert => {
              const currentNotes = resolutionNotes[alert.id] || '';
              const isResolving = resolvingAlertId === alert.id;

              return (
                <div
                  key={alert.id}
                  style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--danger-border)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--danger)' }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Incident Triggered: {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Escalation Channel: Real-Time SSE Push
                      </div>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                      PENDING CARETAKER RESOLUTION
                    </span>
                  </div>

                  {/* Caretaker Response Templates & Notes */}
                  <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Select or Type Caretaker Clinical Intervention:
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {[
                        'Called elder; verified they had late meal and took dose now.',
                        'Elder was resting; reminded over phone to ingest with warm water.',
                        'Elder reported mild dizziness; advised to withhold morning dose.',
                        'Prescription dosage adjusted after tele-consult with physician.'
                      ].map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedResponseTemplate(prev => ({ ...prev, [alert.id]: template }));
                            setResolutionNotes(prev => ({ ...prev, [alert.id]: template }));
                          }}
                          style={{
                            background: selectedResponseTemplate[alert.id] === template ? 'var(--primary-light)' : 'var(--bg-main)',
                            border: selectedResponseTemplate[alert.id] === template ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            color: selectedResponseTemplate[alert.id] === template ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          "{template}"
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Type customized caretaker resolution notes..."
                        value={currentNotes}
                        onChange={(e) => setResolutionNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-main)',
                          fontSize: '0.82rem',
                          color: 'var(--text-main)'
                        }}
                      />
                      <button
                        onClick={() => handleResolveMissedAlert(alert)}
                        disabled={isResolving}
                        className="btn btn-success"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        <Check size={15} />
                        <span>{isResolving ? 'Resolving...' : 'Mark as Resolved'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SCHEDULED MEDICINE CARDS WITH TIME DURATION WINDOW */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>Today's Prescribed Doses & Time Duration Windows</span>
          </h3>
          <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
            {schedules.length} Scheduled Slots Today
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live medicine schedules...</div>
        ) : schedules.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
            No medicines scheduled for today. Caretaker can prescribe medicines to generate schedule slots.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.15rem' }}>
            {schedules.map(sched => {
              const isTaken = sched.status === 'TAKEN';
              const isMissed = sched.status === 'MISSED';
              const isPending = !isTaken && !isMissed;
              const isProcessing = takingId === sched.id;

              const med = sched.medicine || {};
              const slot = sched.scheduledSlot || 'MORNING';
              const timeInfo = getTimeWindowInfo(sched);

              let SlotIcon = Sun;
              let slotColor = '#f59e0b';
              if (slot === 'AFTERNOON') {
                SlotIcon = CloudSun;
                slotColor = '#0ea5e9';
              } else if (slot === 'NIGHT') {
                SlotIcon = Moon;
                slotColor = '#6366f1';
              }

              const stockCount = med.remainingTablets !== undefined ? med.remainingTablets : 10;
              const isLowStock = stockCount <= 5;

              return (
                <div
                  key={sched.id}
                  className="glass-panel"
                  style={{
                    padding: '1.35rem',
                    borderLeft: isTaken 
                      ? '8px solid var(--success)' 
                      : isMissed 
                      ? '8px solid var(--danger)' 
                      : `8px solid ${slotColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                    background: 'var(--bg-card)'
                  }}
                >
                  <div>
                    {/* Slot Header & Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: slotColor }}>
                        <SlotIcon size={18} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {slot} ({timeInfo.startTimeFormatted})
                        </span>
                      </div>

                      {isTaken && (
                        <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          <CheckCircle2 size={13} /> DOSE TAKEN
                        </span>
                      )}
                      {isMissed && (
                        <span className="badge badge-danger" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          <AlertTriangle size={13} /> MISSED (&gt;90m)
                        </span>
                      )}
                      {isPending && timeInfo.windowStatus === 'ACTIVE' && (
                        <span className="badge badge-warning" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          <Clock size={13} /> DUE NOW ({timeInfo.timeRemainingMinutes}m left)
                        </span>
                      )}
                      {isPending && timeInfo.windowStatus === 'UPCOMING' && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          <Clock size={13} /> UPCOMING (at {timeInfo.startTimeFormatted})
                        </span>
                      )}
                      {isPending && timeInfo.windowStatus === 'EXPIRED' && (
                        <span className="badge badge-danger" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          <AlertTriangle size={13} /> WINDOW EXPIRED
                        </span>
                      )}
                    </div>

                    {/* Medicine Name & Dosage */}
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
                      {med.name || 'Prescribed Medicine'}
                    </h4>

                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      Dosage: {med.dosage || '1 Tablet'} &bull; {med.dailyDoseCount || 1}x daily
                    </div>

                    {/* Ingestion Rule */}
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
                      border: '1px solid var(--border-light)'
                    }}>
                      <strong>Rule:</strong> {med.instructions || 'Take strictly after meals with warm water.'}
                    </div>

                    {/* Time Duration Window & Stock Status */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Allowed Duration:</span>{' '}
                        <strong>{timeInfo.startTimeFormatted} &ndash; {timeInfo.endTimeFormatted} ({timeInfo.windowMinutes}m)</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Box Stock:</span>{' '}
                        <strong style={{ color: isLowStock ? 'var(--danger)' : 'var(--success)' }}>
                          {stockCount} tabs left
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.35rem' }}>
                    {/* Patient Marks Taken */}
                    {isPending && (
                      <button
                        onClick={() => handleTakeDose(sched)}
                        disabled={isProcessing}
                        className="btn btn-success"
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          fontSize: '1rem',
                          fontWeight: 800,
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle2 size={20} />
                        <span>{isProcessing ? 'Recording Dose...' : '✓ DOSE TAKEN (DOSE LIYA)'}</span>
                      </button>
                    )}

                    {/* Taken Confirmation */}
                    {isTaken && (
                      <div style={{
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--success-light)',
                        border: '1.5px solid var(--success-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--success)',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        gap: '0.45rem'
                      }}>
                        <CheckCircle2 size={18} />
                        <span>
                          Dose Recorded on Time {sched.takenAt ? `(${new Date(sched.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''} &bull; Stock Decremented
                        </span>
                      </div>
                    )}

                    {/* Missed Dose Escalation Banner */}
                    {isMissed && (
                      <div style={{
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--danger-light)',
                        border: '1.5px solid var(--danger-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--danger)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        textAlign: 'center',
                        padding: '0.4rem 0.75rem'
                      }}>
                        ⚠ 90-min duration window expired &bull; Caretaker auto-alert triggered
                      </div>
                    )}

                    {/* Simulation helper for testing time expired */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleSimulateMissedDose(sched)}
                        disabled={isProcessing}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          alignSelf: 'center',
                          marginTop: '0.2rem'
                        }}
                        title="Simulate 90-minute time window expired without patient action"
                      >
                        [Simulate Window Expired (Time Over) ➔ Auto-Alert Caretaker]
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Resolved Caretaker Interventions & Clinical Resolution Trail */}
      {resolvedAlerts.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.15rem 1.35rem', border: '1px solid var(--border-light)' }}>
          <div
            onClick={() => setShowResolvedAudit(!showResolvedAudit)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Resolved Caretaker Interventions & Resolution Audit Trail ({resolvedAlerts.length})
              </h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span>{showResolvedAudit ? 'Hide Audit Log' : 'View Resolved Log'}</span>
              {showResolvedAudit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showResolvedAudit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
              {resolvedAlerts.map(alt => (
                <div
                  key={alt.id}
                  style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    borderLeft: '4px solid var(--success)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {alt.message}
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      ✓ RESOLVED & COMPLIANT
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Caretaker Intervention:</strong> {alt.resolutionNotes || 'Verified elder took dose with warm water.'}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Resolved by: <strong>{alt.resolvedBy || caretakerName || 'Caretaker'}</strong> &bull; Resolved at: {alt.resolvedAt ? new Date(alt.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
