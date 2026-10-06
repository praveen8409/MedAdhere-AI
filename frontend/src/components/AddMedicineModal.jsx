import React, { useState, useEffect } from 'react';
import { Pill, X, Plus, Calendar, Clock, CheckCircle, User, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AddMedicineModal({ patientId, caretakerId, onClose, onAddMedicine }) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPid, setSelectedPid] = useState(
    typeof patientId === 'number' ? patientId : typeof patientId === 'string' && /^\d+$/.test(patientId) ? parseInt(patientId, 10) : ''
  );
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('Take with warm water after food');
  const [remainingTablets, setRemainingTablets] = useState(30);
  const [totalCourseDays, setTotalCourseDays] = useState(90);
  const [emergencyPurpose, setEmergencyPurpose] = useState('Chronic Disease Maintenance');
  const [slots, setSlots] = useState(['MORNING']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  // Fetch supervised patients if caretakerId is present
  useEffect(() => {
    if (typeof patientId === 'number' && !isNaN(patientId)) {
      setSelectedPid(patientId);
    } else if (typeof patientId === 'string' && /^\d+$/.test(patientId.trim())) {
      setSelectedPid(parseInt(patientId.trim(), 10));
    }

    if (caretakerId && typeof caretakerId === 'number') {
      api.getPatientsByCaretaker(caretakerId).then(pts => {
        setPatientList(pts || []);
        if (!selectedPid && pts && pts.length > 0) {
          setSelectedPid(pts[0].id);
        }
      }).catch(err => console.error(err));
    }
  }, [patientId, caretakerId]);

  const toggleSlot = (slot) => {
    if (slots.includes(slot)) {
      if (slots.length > 1) {
        setSlots(slots.filter(s => s !== slot));
      }
    } else {
      setSlots([...slots, slot]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice('');

    if (!name.trim() || !dosage.trim()) {
      setErrorNotice('Please provide the medicine name and dosage form.');
      return;
    }

    // Strictly ensure patientId is a clean numeric ID
    let finalPid = null;
    if (typeof selectedPid === 'number' && !isNaN(selectedPid)) {
      finalPid = selectedPid;
    } else if (typeof selectedPid === 'string' && /^\d+$/.test(selectedPid.trim())) {
      finalPid = parseInt(selectedPid.trim(), 10);
    } else if (typeof patientId === 'number' && !isNaN(patientId)) {
      finalPid = patientId;
    } else if (typeof patientId === 'string' && /^\d+$/.test(patientId.trim())) {
      finalPid = parseInt(patientId.trim(), 10);
    }

    if (!finalPid) {
      setErrorNotice('Please select a valid patient to schedule this medication for.');
      return;
    }

    let finalCaretakerId = null;
    if (typeof caretakerId === 'number' && !isNaN(caretakerId)) {
      finalCaretakerId = caretakerId;
    } else if (typeof caretakerId === 'string' && /^\d+$/.test(caretakerId.trim())) {
      finalCaretakerId = parseInt(caretakerId.trim(), 10);
    }

    setIsSubmitting(true);
    try {
      await onAddMedicine({
        patientId: finalPid,
        caretakerAuthorId: finalCaretakerId,
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        dailyDoseCount: slots.length,
        remainingTablets: parseInt(remainingTablets, 10) || 30,
        totalCourseDays: parseInt(totalCourseDays, 10) || 90,
        daysCompleted: 0,
        emergencyPurpose: emergencyPurpose.trim(),
        scheduledSlots: slots
      });
      onClose();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to prescribe medicine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePatientName = patientList.find(p => p.id === selectedPid)?.fullName || 'Patient';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.5rem',
              borderRadius: '10px'
            }}>
              <Pill size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Prescribe New Medication
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Clinical Regimen Governance &bull; Read-only lock enforced on patient phone
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorNotice && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Patient Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Prescribing For Patient: *
            </label>
            {patientList.length > 0 ? (
              <select
                value={selectedPid}
                onChange={(e) => setSelectedPid(parseInt(e.target.value, 10))}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--primary)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                {patientList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (Age: {p.age || 'N/A'}, Phone: {p.phoneNumber || 'N/A'})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <User size={16} color="var(--primary)" />
                <span>Target Patient ID: #{selectedPid || patientId || 'Active Patient'}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Medicine Brand / Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metformin Glycomet 500mg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Dosage & Form *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 500mg (1 Tablet)"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Intake Rule / Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Strictly take with warm water after food"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Schedule Slots */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Daily Schedule Slots (Select all that apply):
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['MORNING', 'AFTERNOON', 'NIGHT'].map((slot) => {
                const active = slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                      background: active ? 'var(--primary-light)' : 'var(--bg-main)',
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Clock size={16} />
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Physical Stock in Box (Tablets) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={remainingTablets}
                onChange={(e) => setRemainingTablets(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Total Course Duration (Days) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalCourseDays}
                onChange={(e) => setTotalCourseDays(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Clinical / Emergency Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Type-2 Diabetes Glycemic Control"
              value={emergencyPurpose}
              onChange={(e) => setEmergencyPurpose(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontWeight: 800 }}
            >
              <Plus size={18} />
              <span>{isSubmitting ? 'Prescribing...' : 'Prescribe & Schedule Regimen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
