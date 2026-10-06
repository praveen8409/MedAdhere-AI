import React from 'react';
import { X, Shield, Activity, Truck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MeshExplainerModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Closed-Loop Clinical Governance & Refill Mesh Blueprint
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Multi-tenant telemetry loop connecting Geriatric Patient, Primary Caretaker, and Community Chemist
            </p>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Architecture Visual Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Node 1: Patient */}
            <div style={{
              background: 'var(--bg-main)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '12px',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}>
                NODE 1: EDGE COMPANION
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Activity size={24} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Geriatric Patient</h3>
              </div>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>High-contrast morning/noon/night tactile cards</li>
                <li>Voice synthesizer speech cues in Hindi/English</li>
                <li>Single-tap adherence confirmation</li>
                <li>Atomic stock decrement on dose consumed</li>
                <li>Emergency SOS panic broadcast</li>
              </ul>
            </div>

            {/* Node 2: Caretaker */}
            <div style={{
              background: 'var(--bg-main)',
              border: '2px solid #8b5cf6',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '12px',
                background: '#8b5cf6',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}>
                NODE 2: GOVERNANCE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Shield size={24} color="#8b5cf6" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Family Caretaker</h3>
              </div>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Real-time adherence score telemetry</li>
                <li>Prescription & regimen authority (anti-tamper)</li>
                <li>Missed dose automated escalation & SMS trigger</li>
                <li>Inventory burn rate & run-out projections</li>
                <li>Refill dispatch delivery oversight</li>
              </ul>
            </div>

            {/* Node 3: Chemist */}
            <div style={{
              background: 'var(--bg-main)',
              border: '2px solid #10b981',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '12px',
                background: '#10b981',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}>
                NODE 3: REFILL MESH
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Truck size={24} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Community Chemist</h3>
              </div>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Automated refill intake when tablets &le; 5 units</li>
                <li>Live Kanban: Requested &rarr; Packed &rarr; Dispatched</li>
                <li>Direct courier tracking assignment</li>
                <li>Delivery confirmation automatically restocks patient</li>
                <li>Eliminates chronic medication stockouts</li>
              </ul>
            </div>
          </div>

          {/* Closed Loop Steps */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border-light)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              How The Closed-Loop Mesh Prevents Medication Non-Adherence & Exhaustion:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Scheduled Dose Event:</strong> The patient is notified via audio and visual card. Tapping <em>"Take Dose"</em> atomically logs compliance and decrements physical pill count.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#f59e0b', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Incident Escalation:</strong> If a scheduled slot expires without intake, the system flags a <em>MISSED DOSE</em> incident, dispatching critical alerts to Caretaker Dr. Ananya.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  3
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Auto-Refill Trigger:</strong> When Glycomet drops to &le; 4 tablets, an urgent refill order is automatically transmitted into Chemist Rajesh's fulfillment queue without burdening the elder.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  4
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Delivery Handshake:</strong> Sanjeevani Meds dispatches the package. Marking <em>"Delivered"</em> auto-restocks the digital pill cabinet and verifies replenishment to the family.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-primary">
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
}
