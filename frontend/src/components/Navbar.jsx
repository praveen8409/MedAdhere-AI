import React from 'react';
import { 
  HeartHandshake, 
  User, 
  ShieldCheck, 
  ShieldAlert,
  Store, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Eye, 
  HelpCircle,
  LogOut,
  Bell,
  Home,
  Users,
  Package,
  Pill,
  AlertTriangle,
  FileText,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Activity
} from 'lucide-react';

export default function Navbar({
  currentUser,
  onLogout,
  elderMode,
  setElderMode,
  voiceEnabled,
  setVoiceEnabled,
  onOpenExplainer,
  onOpenNotifications,
  unreadCount,
  activeTab,
  setActiveTab,
  onSwitchPersona,
  caretakerView,
  setCaretakerView,
  chemistTab,
  setChemistTab,
  patientTab,
  setPatientTab
}) {
  const role = currentUser?.role;

  let RoleIcon = UserCheck;
  let roleLabel = 'Patient';
  let badgeColor = 'var(--primary)';

  if (role === 'ROLE_CARETAKER') {
    RoleIcon = ShieldCheck;
    roleLabel = 'Primary Caretaker';
    badgeColor = '#8b5cf6';
  } else if (role === 'ROLE_CHEMIST') {
    RoleIcon = Store;
    roleLabel = 'Apollo Pharmacist';
    badgeColor = '#10b981';
  } else if (role === 'ROLE_ADMIN') {
    RoleIcon = ShieldAlert;
    roleLabel = 'Head Medical Administrator';
    badgeColor = '#ef4444';
  }

  // Handle Logo Click -> Go Home
  const handleGoHome = () => {
    setActiveTab('PORTAL');
    if (role === 'ROLE_CARETAKER' && setCaretakerView) {
      setCaretakerView('OVERVIEW');
    } else if (role === 'ROLE_CHEMIST' && setChemistTab) {
      setChemistTab('ORDERS');
    } else if (role === 'ROLE_PATIENT' && setPatientTab) {
      setPatientTab('TRACKER');
    }
  };

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* 1. TOP HEADER BAR: Brand, Persona Quick Switcher, Profile & Controls */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        flexWrap: 'wrap',
        gap: '0.85rem',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {/* Brand & Home Link */}
        <div 
          onClick={handleGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          title="Go to Home Dashboard"
        >
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#fff',
            padding: '0.55rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <HeartHandshake size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                MedAdhere <span style={{ color: 'var(--primary)' }}>AI</span>
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                <ShieldCheck size={11} /> Live Clinical Mesh
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
              Geriatric Care Governance &bull; Multi-Tenant Mesh
            </p>
          </div>
        </div>


        {/* Right Nav: Bell, Profile, Accessibility */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            style={{
              position: 'relative',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
            title="Open Live Notification Drawer"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Chip */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-card-subtle)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                background: badgeColor,
                color: '#fff',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RoleIcon size={14} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.2' }}>
                  {currentUser.fullName}
                </div>
                <div style={{ fontSize: '0.65rem', color: badgeColor, fontWeight: 700 }}>
                  {roleLabel}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-outline"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.7rem',
                  marginLeft: '0.3rem',
                  color: 'var(--danger)',
                  borderColor: 'var(--danger-border)'
                }}
                title="Sign out of session"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Accessibility & Blueprint Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button
              onClick={() => setElderMode(!elderMode)}
              className="btn btn-outline"
              style={{
                padding: '0.35rem 0.55rem',
                fontSize: '0.74rem',
                background: elderMode ? 'var(--primary-light)' : 'transparent',
                borderColor: elderMode ? 'var(--primary)' : 'var(--border-medium)',
                color: elderMode ? 'var(--primary)' : 'inherit'
              }}
              title="Toggle Large-Font Elder Mode"
            >
              <Eye size={14} />
              <span>{elderMode ? 'Elder: ON' : 'Elder Mode'}</span>
            </button>

            {/* Voice Speech Control: Rendered ONLY for ROLE_PATIENT upon self-enablement. For other roles, it is completely absent */}
            {role === 'ROLE_PATIENT' && (
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="btn btn-outline"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  background: voiceEnabled ? 'var(--success-light)' : 'transparent',
                  borderColor: voiceEnabled ? 'var(--success)' : 'var(--border-medium)',
                  color: voiceEnabled ? 'var(--success)' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title={voiceEnabled ? 'Voice Speech: Enabled (Click to Disable)' : 'Voice Speech: Disabled (Click to Enable)'}
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{voiceEnabled ? 'Voice: ON' : 'Voice: OFF'}</span>
              </button>
            )}

            <button
              onClick={onOpenExplainer}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.74rem' }}
              title="View Architecture Blueprint"
            >
              <HelpCircle size={14} />
              <span>Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY PAGE NAVIGATION MENU: Home & User Respective Pages */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 1.25rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
        background: 'var(--bg-main)'
      }}>
        {/* Navigation Tabs according to logged in role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* A. CARETAKER NAVIGATION */}
          {role === 'ROLE_CARETAKER' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setCaretakerView) setCaretakerView('OVERVIEW');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && caretakerView === 'OVERVIEW' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'PORTAL' && caretakerView === 'OVERVIEW' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Home size={15} />
                <span>Caretaker Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setCaretakerView) setCaretakerView('REQUESTS');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && caretakerView === 'REQUESTS' ? '#8b5cf6' : 'transparent',
                  color: activeTab === 'PORTAL' && caretakerView === 'REQUESTS' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <UserCheck size={15} />
                <span>Incoming Assignment Requests</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setCaretakerView) setCaretakerView('RADAR');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && caretakerView === 'RADAR' ? 'var(--danger)' : 'transparent',
                  color: activeTab === 'PORTAL' && caretakerView === 'RADAR' ? '#fff' : 'var(--danger)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <AlertTriangle size={15} />
                <span>Missed Dose Radar</span>
              </button>
            </>
          )}

          {/* B. CHEMIST NAVIGATION */}
          {role === 'ROLE_CHEMIST' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setChemistTab) setChemistTab('ORDERS');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && chemistTab === 'ORDERS' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'PORTAL' && chemistTab === 'ORDERS' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Package size={15} />
                <span>Refill Orders Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setChemistTab) setChemistTab('PATIENTS');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && chemistTab === 'PATIENTS' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'PORTAL' && chemistTab === 'PATIENTS' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Users size={15} />
                <span>Mapped Patients & Fulfillment</span>
              </button>
            </>
          )}

          {/* C. PATIENT NAVIGATION */}
          {role === 'ROLE_PATIENT' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setPatientTab) setPatientTab('TRACKER');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && patientTab === 'TRACKER' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'PORTAL' && patientTab === 'TRACKER' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Home size={15} />
                <span>Medicine Tracker</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setPatientTab) setPatientTab('PRESCRIPTIONS');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && patientTab === 'PRESCRIPTIONS' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'PORTAL' && patientTab === 'PRESCRIPTIONS' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Pill size={15} />
                <span>Prescriptions Regimen</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setPatientTab) setPatientTab('CARETAKER_ASSIGNMENT');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && patientTab === 'CARETAKER_ASSIGNMENT' ? '#8b5cf6' : 'transparent',
                  color: activeTab === 'PORTAL' && patientTab === 'CARETAKER_ASSIGNMENT' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShieldCheck size={15} />
                <span>Assign Caretaker & Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PORTAL');
                  if (setPatientTab) setPatientTab('TELEMETRY');
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === 'PORTAL' && patientTab === 'TELEMETRY' ? '#0d9488' : 'transparent',
                  color: activeTab === 'PORTAL' && patientTab === 'TELEMETRY' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Activity size={15} />
                <span>Health Telemetry (Opt-In)</span>
              </button>
            </>
          )}

          {/* D. ADMIN NAVIGATION */}
          {role === 'ROLE_ADMIN' && (
            <button
              onClick={() => setActiveTab('PORTAL')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'PORTAL' ? '#dc2626' : 'transparent',
                color: activeTab === 'PORTAL' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ShieldAlert size={15} />
              <span>Admin Supervisory Desk</span>
            </button>
          )}

          {/* E. AUDIT LEDGER (Available to all) */}
          <button
            onClick={() => setActiveTab('AUDIT_LEDGER')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'AUDIT_LEDGER' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'AUDIT_LEDGER' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={15} />
            <span>Clinical Audit Trail</span>
          </button>
        </div>

        {/* Current Active Page Breadcrumb */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>Current Page:</span>
          <strong style={{ color: role === 'ROLE_ADMIN' ? '#dc2626' : 'var(--primary)' }}>
            {activeTab === 'AUDIT_LEDGER' ? 'Audit Ledger' :
             role === 'ROLE_ADMIN' ? 'Central Governance & Verification Desk' :
             role === 'ROLE_CARETAKER' ? (caretakerView === 'REQUESTS' ? 'Incoming Assignment Requests' : caretakerView === 'RADAR' ? 'Missed Dose Radar' : 'Supervised Regimen & Overview') :
             role === 'ROLE_CHEMIST' ? (chemistTab === 'PATIENTS' ? 'Mapped Patients & Caretakers' : 'Refill Orders Dashboard') :
             patientTab === 'CARETAKER_ASSIGNMENT' ? 'Assign Caretaker & Profile' : patientTab === 'PRESCRIPTIONS' ? 'Prescriptions Regimen' : "Today's Medicine Tracker"}
          </strong>
        </div>
      </div>
    </header>
  );
}
