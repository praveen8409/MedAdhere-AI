import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  AlertOctagon, 
  Clock, 
  Volume2,
  Radio
} from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  sseConnected,
  isPatientRole,
  voiceEnabled,
  onSpeakAlert
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '420px',
          maxWidth: '100vw',
          height: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.25)',
          animation: 'slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-main)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Live Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: sseConnected ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
              <Radio size={13} className={sseConnected ? 'pulse-emergency' : ''} />
              <span>{sseConnected ? 'Server-Sent Events (SSE) Live Connected' : 'Polling Sync Mode'}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Controls */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            System-Wide Telemetry Alerts
          </span>
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Alerts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-main)' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No alerts recorded.
            </div>
          ) : (
            notifications.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING' || alert.severity === 'HIGH';
              const isResolved = alert.resolved;

              let IconComponent = Info;
              let iconColor = 'var(--primary)';
              if (isCritical) {
                IconComponent = AlertOctagon;
                iconColor = 'var(--danger)';
              } else if (isWarning) {
                IconComponent = AlertTriangle;
                iconColor = 'var(--warning)';
              }

              return (
                <div
                  key={alert.id}
                  style={{
                    background: isResolved ? 'var(--bg-card)' : isCritical ? 'var(--danger-light)' : 'var(--warning-light)',
                    border: isResolved ? '1px solid var(--border-light)' : isCritical ? '1.5px solid var(--danger-border)' : '1.5px solid var(--warning-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <IconComponent size={16} color={iconColor} />
                      <span className={isCritical ? 'badge badge-danger' : isWarning ? 'badge badge-warning' : 'badge badge-primary'} style={{ fontSize: '0.65rem' }}>
                        {alert.alertType || 'ALERT'} &bull; {alert.severity}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Voice Read Aloud: Rendered ONLY for ROLE_PATIENT with explicit consent */}
                      {isPatientRole && voiceEnabled && onSpeakAlert && (
                        <button
                          onClick={() => onSpeakAlert(alert.message)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                          title="Read alert aloud via speech synthesis"
                        >
                          <Volume2 size={15} />
                        </button>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '0.2rem 0', lineHeight: '1.45', fontWeight: isResolved ? 500 : 700 }}>
                    {alert.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
