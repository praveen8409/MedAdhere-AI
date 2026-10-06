import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Flame, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Activity, 
  ShieldAlert,
  Clock,
  Play
} from 'lucide-react';
import { api } from '../api';

export default function AuditLedgerView({ onActionSuccess, onRefreshDashboard }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [chaosResult, setChaosResult] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const runChaos = async (simulatorFn, name) => {
    try {
      setSimulating(true);
      setChaosResult({ status: 'RUNNING', message: `Executing ${name}...` });
      const res = await simulatorFn();
      setChaosResult(res);
      await fetchLogs();
      if (onRefreshDashboard) onRefreshDashboard();
      if (onActionSuccess) onActionSuccess(`Chaos Simulator [${name}] executed!`);
    } catch (err) {
      setChaosResult({ status: 'ERROR', message: err.message });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        color: '#fff',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Terminal size={26} color="#38bdf8" />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                In-Memory H2 Audit Trail & Chaos Simulator
              </h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0 }}>
              Immutable transactional activity ledger, dead-man's timer testing, and live database state verification
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="http://localhost:8080/h2-console"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1.5px solid #38bdf8',
                color: '#38bdf8',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <Database size={16} />
              <span>Launch H2 Web Console</span>
              <ExternalLink size={14} />
            </a>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: '0.55rem 0.85rem', color: '#fff', borderColor: '#475569' }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* H2 Console Instructions Box */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1.15rem',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.82rem',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <strong>Raw SQL Verification:</strong> JDBC URL: <code>jdbc:h2:mem:medtrackerdb</code> &bull; User: <code>sa</code> &bull; Password: <em>(blank)</em>
          </div>
          <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#34d399' }}>
            SELECT id, name, remaining_tablets, auto_refill_triggered FROM MEDICINES;
          </code>
        </div>
      </div>

      {/* 1-Click Chaos Simulators (Page 7 Specification) */}
      <div className="glass-panel" style={{ padding: '1.5rem', border: '2px solid var(--primary)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              1-Click System Scenario & Chaos Simulators
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
            Execute clinical stress scenarios on command to demonstrate multi-tenant fail-safe responses
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Simulator 1: 90-Min Missed Dose */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.3rem' }}>
              Scenario 1: 90-Min Missed Dose
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Forces an unacknowledged dose past 90 minutes. State flips to MISSED and fires SSE alert to Dr. Ananya's phone.
            </p>
            <button
              onClick={() => runChaos(api.simulateChaosMissedDose, '90-Min Missed Dose')}
              disabled={simulating}
              className="btn btn-danger"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.84rem', fontWeight: 800 }}
            >
              <Play size={14} />
              <span>Simulate 90-Min Missed Dose</span>
            </button>
          </div>

          {/* Simulator 2: Low Stock (5 tabs) */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--warning)', marginBottom: '0.3rem' }}>
              Scenario 2: Low Stock (5 Tabs Left)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Sets Metformin to 5 tabs (5 / 2 = 2.5 days &le; 5 threshold). Dispatches auto-refill order to Apollo Pharmacy.
            </p>
            <button
              onClick={() => runChaos(api.simulateChaosLowStock, 'Low Stock Burn Rate')}
              disabled={simulating}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.84rem', fontWeight: 800 }}
            >
              <Play size={14} />
              <span>Simulate Low Stock &le; 5 Days</span>
            </button>
          </div>

          {/* Simulator 3: Emergency SOS Beacon */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '0.3rem' }}>
              Scenario 3: Emergency SOS Beacon
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Simulates Dadaji pressing the 1-touch panic button for sudden dizziness / blood pressure anomaly.
            </p>
            <button
              onClick={() => runChaos(api.simulateChaosSos, 'Emergency SOS')}
              disabled={simulating}
              className="btn btn-outline"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.84rem', fontWeight: 800, borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              <Play size={14} />
              <span>Broadcast Emergency SOS</span>
            </button>
          </div>

          {/* Simulator 4: Reset Scenario */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.3rem' }}>
              Scenario 4: Reset to Baseline
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Restores baseline state: Metformin = 6 tabs, Morning dose Taken, Afternoon/Night pending.
            </p>
            <button
              onClick={() => runChaos(api.simulateChaosReset, 'Baseline Reset')}
              disabled={simulating}
              className="btn btn-success"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.84rem', fontWeight: 800 }}
            >
              <RefreshCw size={14} />
              <span>Reset Scenario to Baseline</span>
            </button>
          </div>
        </div>

        {/* Chaos Execution Result Console */}
        {chaosResult && (
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: 'var(--text-main)'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>[SIMULATION OUTPUT]: </span>
            <span>{JSON.stringify(chaosResult, null, 2)}</span>
          </div>
        )}
      </div>

      {/* Live Transaction Ledger (Last 50 Activity Records) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Live Database Activity Ledger (Last 50 Records)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
              Atomic row-level writes, inventory deductions, and SSE escalation events with millisecond timestamps
            </p>
          </div>
          <span className="badge badge-primary">
            {logs.length} Events Logged
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.65rem' }}>Timestamp</th>
                <th style={{ padding: '0.65rem' }}>Event Type</th>
                <th style={{ padding: '0.65rem' }}>Severity</th>
                <th style={{ padding: '0.65rem' }}>Actor</th>
                <th style={{ padding: '0.65rem' }}>Patient</th>
                <th style={{ padding: '0.65rem' }}>Transaction Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isCritical = log.severity === 'CRITICAL';
                const isWarning = log.severity === 'WARNING';

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.65rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 800 }}>
                      <code>{log.eventType}</code>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={isCritical ? 'badge badge-danger' : isWarning ? 'badge badge-warning' : 'badge badge-primary'} style={{ fontSize: '0.68rem' }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {log.actor || 'SYSTEM'}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>
                      {log.patientName || 'Ramesh Sharma'}
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-main)', maxWidth: '350px' }}>
                      {log.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
