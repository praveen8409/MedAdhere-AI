import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Users, 
  Store, 
  Pill, 
  Activity, 
  Search, 
  Filter, 
  Printer, 
  Lock, 
  Unlock, 
  FileText, 
  Clock, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
  Building,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard({ currentUser, onShowToast }) {
  const [activeAdminTab, setActiveAdminTab] = useState('VERIFICATION'); // 'VERIFICATION', 'USERS', 'AUDIT'
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Verification Queue
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // User Directory
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSeverity, setLogSeverity] = useState('');
  const [logQuery, setLogQuery] = useState('');

  // Selected Dossier
  const [dossierData, setDossierData] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Action Confirmation Modal (Block / Reject)
  const [actionTarget, setActionTarget] = useState(null); // { type: 'BLOCK' | 'REJECT', user: ... }
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // Load Pending Users
  const loadPendingQueue = useCallback(async () => {
    try {
      setLoadingPending(true);
      const data = await api.getAdminUsers({ status: 'PENDING_APPROVAL' });
      setPendingUsers(data);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Load Directory Users
  const loadUsersDirectory = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getAdminUsers({
        role: roleFilter,
        status: statusFilter,
        query: searchQuery
      });
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  // Load Master Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const data = await api.getAdminAuditLogs({
        severity: logSeverity,
        query: logQuery
      });
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [logSeverity, logQuery]);

  useEffect(() => {
    loadOverview();
    loadPendingQueue();
  }, [loadOverview, loadPendingQueue]);

  useEffect(() => {
    if (activeAdminTab === 'USERS') {
      loadUsersDirectory();
    } else if (activeAdminTab === 'AUDIT') {
      loadAuditLogs();
    }
  }, [activeAdminTab, loadUsersDirectory, loadAuditLogs]);

  // Handle Approve User
  const handleApprove = async (userId, userName) => {
    try {
      await api.adminApproveUser(userId);
      onShowToast?.(`Credentials verified! ${userName} is now ACTIVE and approved to practice.`, 'success');
      loadOverview();
      loadPendingQueue();
      if (activeAdminTab === 'USERS') loadUsersDirectory();
    } catch (err) {
      onShowToast?.(err.message || 'Failed to approve user', 'error');
    }
  };

  // Submit Block / Reject
  const handleSubmitAction = async () => {
    if (!actionTarget) return;
    try {
      setSubmittingAction(true);
      const reason = actionReason.trim() || (actionTarget.type === 'REJECT' ? 'Credentials failed verification.' : 'Administrative suspension.');
      
      if (actionTarget.type === 'REJECT') {
        await api.adminRejectUser(actionTarget.user.id, reason);
        onShowToast?.(`Application rejected and blocked for ${actionTarget.user.fullName}.`, 'info');
      } else {
        await api.adminBlockUser(actionTarget.user.id, reason);
        onShowToast?.(`Account for ${actionTarget.user.fullName} has been immediately LOCKED. Token invalidated.`, 'warning');
      }
      
      setActionTarget(null);
      setActionReason('');
      loadOverview();
      loadPendingQueue();
      if (activeAdminTab === 'USERS') loadUsersDirectory();
    } catch (err) {
      onShowToast?.(err.message || 'Action failed', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Unblock User
  const handleUnblock = async (userId, userName) => {
    try {
      await api.adminUnblockUser(userId);
      onShowToast?.(`Security suspension lifted for ${userName}. Account reinstated to ACTIVE.`, 'success');
      loadOverview();
      loadUsersDirectory();
    } catch (err) {
      onShowToast?.(err.message || 'Failed to unblock user', 'error');
    }
  };

  // Open Dossier
  const handleOpenDossier = async (userId) => {
    try {
      setLoadingDossier(true);
      setShowDossierModal(true);
      const data = await api.getAdminUserDossier(userId);
      setDossierData(data);
    } catch (err) {
      onShowToast?.(err.message || 'Failed to load user dossier', 'error');
      setShowDossierModal(false);
    } finally {
      setLoadingDossier(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_PATIENT':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>PATIENT</span>;
      case 'ROLE_CARETAKER':
        return <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>CARETAKER</span>;
      case 'ROLE_CHEMIST':
        return <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>CHEMIST</span>;
      case 'ROLE_ADMIN':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>ADMIN</span>;
      default:
        return <span>{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> ACTIVE</span>;
      case 'PENDING_APPROVAL':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> PENDING APPROVAL</span>;
      case 'BLOCKED':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Lock size={12} /> BLOCKED / SUSPENDED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. TOP HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        color: '#fff',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                background: '#dc2626',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>ROLE_ADMIN SUPERVISORY DESK</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Central Clinical Governance & Adherence Monitoring</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>
              {currentUser?.fullName || 'Supervisory Medical Director'}
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '0.88rem' }}>
              Multi-Tenant Authority &bull; Credential Verification &bull; Fraud Prevention &bull; Printable Dossiers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadOverview();
            if (activeAdminTab === 'VERIFICATION') loadPendingQueue();
            else if (activeAdminTab === 'USERS') loadUsersDirectory();
            else if (activeAdminTab === 'AUDIT') loadAuditLogs();
          }}
          className="btn btn-outline"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Platform State</span>
        </button>
      </div>

      {/* 2. TOP TELEMETRY KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        {/* Card 1: Total Users */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>System Accounts</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {overview?.totalUsers ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {overview?.totalPatients ?? 0} Patients &bull; {overview?.totalCaretakers ?? 0} Caretakers &bull; {overview?.totalChemists ?? 0} Chemists
          </div>
        </div>

        {/* Card 2: Pending Approvals Queue */}
        <div 
          onClick={() => setActiveAdminTab('VERIFICATION')}
          style={{
            background: overview?.pendingApprovalsCount > 0 ? '#fffbeb' : 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: overview?.pendingApprovalsCount > 0 ? '1px solid #fde68a' : '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#b45309', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Pending Verifications</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309' }}>
            {overview?.pendingApprovalsCount ?? '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem', fontWeight: 600 }}>
            {overview?.pendingApprovalsCount > 0 ? 'Action required: Review licenses' : 'All accounts verified & current'}
          </div>
        </div>

        {/* Card 3: Network Adherence Telemetry */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Adherence Telemetry</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success)' }}>
            {overview?.averageAdherence !== undefined ? `${overview.averageAdherence}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Platform-wide 30-day compliance score
          </div>
        </div>

        {/* Card 4: Supply Chain Orders */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Refill Supply Pipeline</span>
            <Package size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#8b5cf6' }}>
            {overview?.activeRefillsCount ?? '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Active pharmacy fulfillment orders
          </div>
        </div>

        {/* Card 5: Open Escalations & Alerts */}
        <div style={{
          background: overview?.activeAlertsCount > 0 ? '#fef2f2' : 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: overview?.activeAlertsCount > 0 ? '1px solid #fecaca' : '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Open Radar Alerts</span>
            <AlertTriangle size={18} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--danger)' }}>
            {overview?.activeAlertsCount ?? '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem' }}>
            Missed doses & low inventory notices
          </div>
        </div>
      </div>

      {/* 3. ADMIN WORKSPACE TABS */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border-light)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveAdminTab('VERIFICATION')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeAdminTab === 'VERIFICATION' ? 'var(--primary)' : 'transparent',
            color: activeAdminTab === 'VERIFICATION' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldCheck size={16} />
          <span>Verification Desk</span>
          {pendingUsers.length > 0 && (
            <span style={{
              background: activeAdminTab === 'VERIFICATION' ? '#fff' : '#ef4444',
              color: activeAdminTab === 'VERIFICATION' ? 'var(--primary)' : '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.1rem 0.45rem',
              borderRadius: '9999px'
            }}>
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('USERS')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeAdminTab === 'USERS' ? 'var(--primary)' : 'transparent',
            color: activeAdminTab === 'USERS' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={16} />
          <span>User Master Directory & Threat Lockdown</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('AUDIT')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeAdminTab === 'AUDIT' ? 'var(--primary)' : 'transparent',
            color: activeAdminTab === 'AUDIT' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} />
          <span>Supervisory Audit Ledger</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: VERIFICATION DESK */}
      {activeAdminTab === 'VERIFICATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck color="var(--primary)" size={20} />
                Healthcare Professional Verification Queue
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                Chemists and Caretakers must undergo credential validation before they can view clinical data or fulfill prescriptions.
              </p>
            </div>
            <button
              onClick={loadPendingQueue}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {loadingPending ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading verification queue...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem 1.5rem',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={42} color="var(--success)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Queue All Clear!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
                There are no healthcare professionals currently awaiting verification.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
              {pendingUsers.map((user) => (
                <div key={user.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.35rem',
                  border: '1px solid #fde68a',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          USER #{user.id} &bull; @{user.username}
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.15rem 0 0 0' }}>
                          {user.fullName}
                        </h3>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <div>
                        <strong>Designation:</strong> {user.designation || 'Not specified'}
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>SUBMITTED CLINICAL LICENSE / REGISTRATION NO:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                          {user.licenseNumber || 'None Submitted (Manual Inspection Required)'}
                        </strong>
                      </div>
                      <div>
                        <strong>Phone:</strong> {user.phoneNumber || '—'}
                      </div>
                      <div>
                        <strong>Address:</strong> {user.address || '—'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Registered: {user.registeredAt ? new Date(user.registeredAt).toLocaleString() : 'Recently'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '0.85rem'
                  }}>
                    <button
                      onClick={() => handleApprove(user.id, user.fullName)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.55rem', fontSize: '0.84rem', background: 'var(--success)' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Activate</span>
                    </button>

                    <button
                      onClick={() => {
                        setActionTarget({ type: 'REJECT', user });
                        setActionReason('');
                      }}
                      className="btn btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.55rem', fontSize: '0.84rem' }}
                    >
                      <XCircle size={15} />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleOpenDossier(user.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.55rem', fontSize: '0.84rem' }}
                      title="Inspect Dossier"
                    >
                      <FileText size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & INSTANT THREAT LOCKDOWN */}
      {activeAdminTab === 'USERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filtering Toolbar */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name, username, phone, or license..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  background: 'var(--bg-card)'
                }}
              >
                <option value="">All Roles</option>
                <option value="ROLE_PATIENT">Patients</option>
                <option value="ROLE_CARETAKER">Caretakers</option>
                <option value="ROLE_CHEMIST">Chemists</option>
                <option value="ROLE_ADMIN">Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  background: 'var(--bg-card)'
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <button
              onClick={loadUsersDirectory}
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '0.55rem 0.85rem' }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Directory Table */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            overflowX: 'auto',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading user directory...
              </div>
            ) : usersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No users found matching current filter criteria.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>User / Identity</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>License / Ref</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Contact & Address</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Supervisory Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isBlocked = u.status === 'BLOCKED';
                    return (
                      <tr 
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          background: isBlocked ? '#fff1f2' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>@{u.username} &bull; ID: #{u.id}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {getRoleBadge(u.role)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {getStatusBadge(u.status)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {u.licenseNumber || u.familyLinkCode || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                          <div>{u.phoneNumber || '—'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.address || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {/* Dossier Button */}
                            <button
                              onClick={() => handleOpenDossier(u.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              title="Generate Official Printable Dossier"
                            >
                              <FileText size={13} />
                              <span>Dossier</span>
                            </button>

                            {/* Block / Unblock 1-Click Action */}
                            {u.role !== 'ROLE_ADMIN' && (
                              isBlocked ? (
                                <button
                                  onClick={() => handleUnblock(u.id, u.fullName)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--success)', borderColor: 'var(--success)' }}
                                  title="Unblock Account"
                                >
                                  <Unlock size={13} />
                                  <span>Unblock</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActionTarget({ type: 'BLOCK', user: u });
                                    setActionReason('');
                                  }}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                  title="Instantly Lock / Suspend Account"
                                >
                                  <Lock size={13} />
                                  <span>Lock</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUPERVISORY AUDIT LEDGER */}
      {activeAdminTab === 'AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Audit Filters */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by actor, patient, or description..."
                  value={logQuery}
                  onChange={(e) => setLogQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <select
                value={logSeverity}
                onChange={(e) => setLogSeverity(e.target.value)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  background: 'var(--bg-card)'
                }}
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button
              onClick={loadAuditLogs}
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '0.55rem 0.85rem' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Audit Events List */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading master audit records...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No audit events recorded under this filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {auditLogs.map((log) => {
                  let sevBg = '#f8fafc';
                  let sevColor = 'var(--text-secondary)';
                  let SevIcon = Activity;

                  if (log.severity === 'WARNING') {
                    sevBg = '#fffbeb';
                    sevColor = '#b45309';
                    SevIcon = AlertTriangle;
                  } else if (log.severity === 'CRITICAL') {
                    sevBg = '#fef2f2';
                    sevColor = '#b91c1c';
                    SevIcon = AlertCircle;
                  }

                  return (
                    <div
                      key={log.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: sevBg,
                        border: `1px solid ${log.severity === 'WARNING' ? '#fde68a' : log.severity === 'CRITICAL' ? '#fecaca' : 'var(--border-light)'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem'
                      }}
                    >
                      <div style={{ marginTop: '0.15rem' }}>
                        <SevIcon size={18} color={sevColor} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.86rem', color: sevColor }}>
                            {log.eventType}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                          {log.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          <span><strong>Actor:</strong> {log.actor || 'System'}</span>
                          {log.patientName && <span><strong>Subject Patient:</strong> {log.patientName}</span>}
                          <span><strong>Log ID:</strong> #{log.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ACTION CONFIRMATION MODAL (BLOCK / REJECT) */}
      {actionTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {actionTarget.type === 'REJECT' ? 'Reject Professional Credential' : 'Suspend & Lock User Account'}
              </h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {actionTarget.type === 'REJECT' ? (
                <>You are rejecting the registration of <strong>{actionTarget.user.fullName}</strong>. Their account will be blocked from accessing the system.</>
              ) : (
                <>You are placing an immediate security hold on <strong>{actionTarget.user.fullName}</strong> (@{actionTarget.user.username}). All active JWT tokens will be rejected immediately with <strong>HTTP 403 Forbidden</strong>.</>
              )}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Audit Reason / Justification:
              </label>
              <textarea
                rows={3}
                placeholder="Enter justification (e.g., fraudulent drug license number, reported adverse misconduct, security investigation)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setActionTarget(null)}
                className="btn btn-outline"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                className="btn btn-danger"
                disabled={submittingAction}
              >
                {submittingAction ? 'Executing...' : actionTarget.type === 'REJECT' ? 'Confirm Rejection' : 'Lock Account Immediately'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRINTABLE USER DOSSIER MODAL */}
      {showDossierModal && (
        <div className="modal-overlay print-target-overlay">
          <div className="modal-content print-dossier-card" style={{ maxWidth: '820px', padding: '2rem' }}>
            
            {/* Top Toolbar (Hidden during print) */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                CONFIDENTIAL CLINICAL DOSSIER
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary print-include"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Printer size={15} />
                  <span>Print / Export PDF</span>
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  Close
                </button>
              </div>
            </div>

            {loadingDossier ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Compiling clinical records and audit dossier...
              </div>
            ) : !dossierData ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
                Failed to compile dossier records.
              </div>
            ) : (
              <div>
                {/* Dossier Official Header */}
                <div style={{
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                      MEDADHERE AI CLINICAL PLATFORM &bull; BOARD OF CLINICAL GOVERNANCE
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.25rem 0', color: '#0f172a' }}>
                      Patient & Practitioner Report Card
                    </h1>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Dossier Ref: {dossierData.dossierGeneratedAt ? `DOS-${new Date(dossierData.dossierGeneratedAt).getTime().toString().slice(-6)}` : 'DOS-OFFICIAL'} &bull; Generated: {dossierData.dossierGeneratedAt ? new Date(dossierData.dossierGeneratedAt).toLocaleString() : 'Today'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', border: '2px solid #0f172a', padding: '0.35rem 0.75rem', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                      OFFICIAL COPY
                    </div>
                  </div>
                </div>

                {/* Section A: Demographics & Profile */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    1. SUBJECT IDENTIFICATION & CLINICAL STANDING
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.86rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>FULL LEGAL NAME:</span>
                      <strong>{dossierData.user?.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>SYSTEM ROLE:</span>
                      <strong>{dossierData.user?.role}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ACCOUNT STATUS:</span>
                      <strong>{dossierData.user?.status}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>PHONE / SECURE LINE:</span>
                      <strong>{dossierData.user?.phoneNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>REGISTRATION / LICENSE ID:</span>
                      <strong>{dossierData.user?.licenseNumber || dossierData.user?.familyLinkCode || 'Not applicable'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>PHYSICAL RESIDENCE / FACILITY:</span>
                      <strong>{dossierData.user?.address || '—'}</strong>
                    </div>
                    {dossierData.user?.chronicConditions && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>CHRONIC CONDITIONS:</span>
                        <strong style={{ color: '#b91c1c' }}>{dossierData.user.chronicConditions}</strong>
                      </div>
                    )}
                    {dossierData.user?.emergencyContact && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>EMERGENCY CONTACT & RELATION:</span>
                        <strong>{dossierData.user.emergencyContact}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section B: Linked Clinical Network */}
                {dossierData.network && (
                  <div style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      2. ASSIGNED CLINICAL CARE TEAM & FULFILLMENT NETWORK
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                      {dossierData.network.caretaker && (
                        <div style={{ background: '#f5f3ff', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.74rem', color: '#6b21a8', fontWeight: 700 }}>PRIMARY CARETAKER</span>
                          <div style={{ fontWeight: 800, color: '#4c1d95', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                            {dossierData.network.caretaker.fullName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#6b21a8' }}>{dossierData.network.caretaker.phoneNumber}</div>
                        </div>
                      )}
                      {dossierData.network.chemist && (
                        <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.74rem', color: '#065f46', fontWeight: 700 }}>FULFILLMENT PHARMACY</span>
                          <div style={{ fontWeight: 800, color: '#064e3b', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                            {dossierData.network.chemist.fullName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#065f46' }}>{dossierData.network.chemist.phoneNumber}</div>
                        </div>
                      )}
                      {dossierData.network.linkedPatients && (
                        <div style={{ gridColumn: '1 / -1', background: '#eff6ff', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700 }}>MONITORED PATIENTS ({dossierData.network.linkedPatients.length})</span>
                          <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {dossierData.network.linkedPatients.map(p => (
                              <span key={p.id} style={{ background: '#fff', border: '1px solid #bfdbfe', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                                {p.fullName} (Age {p.age || '—'})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section C: Adherence Scorecard */}
                {dossierData.adherence && (
                  <div style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    background: '#f8fafc'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      3. CLINICAL ADHERENCE SCORECARD (30-DAY TELEMETRY)
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>
                          {dossierData.adherence.rate}%
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>ADHERENCE RATE</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', flex: 1, fontSize: '0.84rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>SCHEDULED DOSES:</span>
                          <div style={{ fontWeight: 800 }}>{dossierData.adherence.totalSchedules}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--success)', fontSize: '0.74rem' }}>CONFIRMED TAKEN:</span>
                          <div style={{ fontWeight: 800, color: 'var(--success)' }}>{dossierData.adherence.taken}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>MISSED ESCALATIONS:</span>
                          <div style={{ fontWeight: 800, color: 'var(--danger)' }}>{dossierData.adherence.missed}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section D: Active Prescribed Medications */}
                {dossierData.prescriptions && dossierData.prescriptions.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      4. ACTIVE PRESCRIBED PHARMACOLOGICAL REGIMEN
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Medication Name</th>
                          <th style={{ padding: '0.5rem' }}>Dosage & Frequency</th>
                          <th style={{ padding: '0.5rem' }}>Instructions</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Stock On Hand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dossierData.prescriptions.map((m) => (
                          <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 700 }}>{m.name}</td>
                            <td style={{ padding: '0.5rem' }}>{m.dosage} &bull; {m.frequency}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{m.instructions}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: m.currentStock <= m.lowStockThreshold ? 'var(--danger)' : 'var(--text-main)' }}>
                              {m.currentStock} units
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section E: Audit & Compliance History */}
                {dossierData.auditHistory && dossierData.auditHistory.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      5. CHRONOLOGICAL AUDIT LEDGER TRAIL
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                      {dossierData.auditHistory.map((log) => (
                        <div key={log.id} style={{ padding: '0.4rem 0.6rem', background: '#f8fafc', borderLeft: '3px solid var(--primary)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span><strong>{log.eventType}</strong>: {log.description}</span>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dossier Sign-off Footer */}
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-medium)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)'
                }}>
                  <div>
                    Digitally validated via MedAdhere Clinical Master Audit Trail.<br />
                    System ID: MEDADHERE-PROD-2026 &bull; Authorized by Dr. Rajesh Nair (Medical Director)
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ borderBottom: '1px dashed #94a3b8', width: '180px', marginBottom: '0.25rem' }}></div>
                    Authorized Administrator Signature
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
