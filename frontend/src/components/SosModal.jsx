import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, X, Check, Flame } from 'lucide-react';

export default function SosModal({ patient, onClose, onSendSos }) {
  const [selectedReason, setSelectedReason] = useState('Severe Dizziness / Low Blood Sugar Feeling');
  const [customReason, setCustomReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const reasons = [
    'Severe Dizziness / Feeling Faint (Sugar Check)',
    'Chest Tightness / High Blood Pressure Discomfort',
    'Accidental Missed Dose / Confusion',
    'Need Immediate Physical Assistance'
  ];

  const handleSubmit = async () => {
    setIsSending(true);
    const finalReason = customReason.trim() ? customReason : selectedReason;
    await onSendSos(finalReason);
    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', border: '2px solid var(--danger)' }}>
        {/* Header */}
        <div style={{
          background: 'var(--danger-light)',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--danger-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--danger)',
              color: '#fff',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>
                EMERGENCY SOS BEACON
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Instant priority alert to Caretaker Dr. Ananya Sharma
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {sentSuccess ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                background: 'var(--success-light)',
                color: 'var(--success)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Check size={36} />
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>
                SOS Alert Broadcasted!
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                High-priority alert logged into Dr. Ananya's clinical dashboard. Calling Caretaker: <strong>+91 98111 22334</strong>...
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Select Medical Emergency Reason:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {reasons.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSelectedReason(r); setCustomReason(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: selectedReason === r && !customReason ? '2px solid var(--danger)' : '1px solid var(--border-light)',
                      background: selectedReason === r && !customReason ? 'var(--danger-light)' : 'var(--bg-main)',
                      color: selectedReason === r && !customReason ? 'var(--danger)' : 'var(--text-main)',
                      fontWeight: selectedReason === r && !customReason ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Flame size={18} color={selectedReason === r && !customReason ? 'var(--danger)' : 'var(--text-muted)'} />
                    <span>{r}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Or Describe Symptoms / Needs:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shakiness in hands, feeling dizzy after taking morning pill..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={onClose}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="btn btn-danger"
                  style={{ flex: 2, padding: '0.85rem', fontSize: '1.05rem', fontWeight: 700 }}
                >
                  <PhoneCall size={20} />
                  <span>{isSending ? 'Transmitting Alert...' : 'BROADCAST SOS NOW'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
