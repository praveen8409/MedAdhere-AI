import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Lock, 
  User, 
  ShieldCheck, 
  Store, 
  UserCheck, 
  Phone, 
  MapPin, 
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle,
  X,
  FileBadge
} from 'lucide-react';
import { api } from '../api';

export default function AuthScreen({ onLogin, onRegister }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Login form state - clean production values (no demo autofill)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state - clean genuine registration
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('ROLE_PATIENT');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regLicenseNumber, setRegLicenseNumber] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccessNotice, setRegSuccessNotice] = useState(null);

  // OTP Reset Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');
  const [otpSimulatedCode, setOtpSimulatedCode] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await onLogin({ username: loginUsername.trim(), password: loginPassword });
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessNotice(null);
    setIsSubmitting(true);
    try {
      await onRegister({
        username: regUsername.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        role: regRole,
        phoneNumber: regPhone.trim(),
        address: regAddress.trim(),
        age: regRole === 'ROLE_PATIENT' && regAge ? parseInt(regAge, 10) : null,
        licenseNumber: regLicenseNumber ? regLicenseNumber.trim() : null
      });

      if (regRole === 'ROLE_CARETAKER' || regRole === 'ROLE_CHEMIST') {
        setRegSuccessNotice('Account registered! Status: PENDING_APPROVAL. An administrator will verify your credentials shortly.');
      } else {
        setRegSuccessNotice('Account successfully created! Redirecting to your secure clinical dashboard...');
      }
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please check the form data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Step 1: Send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setOtpErrorMsg('');
    try {
      const res = await api.forgotPassword(otpIdentifier.trim());
      setOtpSimulatedCode(res.simulatedOtp || '482910');
      setOtpCodeInput(res.simulatedOtp || '482910');
      setOtpStep(2);
    } catch (err) {
      setOtpErrorMsg(err.message || 'Could not send verification code');
    }
  };

  // OTP Step 2: Reset Password
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setOtpErrorMsg('');
    try {
      const res = await api.resetPassword({
        emailOrUsername: otpIdentifier.trim(),
        code: otpCodeInput.trim(),
        newPassword: otpNewPassword
      });
      setOtpSuccessMsg(res.message || 'Password updated successfully! Logging you in...');
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpStep(1);
        setLoginUsername(otpIdentifier.trim());
        setLoginPassword(otpNewPassword);
      }, 1500);
    } catch (err) {
      setOtpErrorMsg(err.message || 'Verification failed. Please check the code.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.05) 90%), var(--bg-main)',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden'
      }}>
        {/* Left Column: Hero Branding & Connected Healthcare Mesh Info */}
        <div style={{
          background: 'linear-gradient(145deg, #0284c7, #0369a1)',
          color: '#fff',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.65rem',
                borderRadius: '14px',
                backdropFilter: 'blur(8px)'
              }}>
                <HeartHandshake size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  MedAdhere AI
                </h1>
                <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>
                  Clinical Governance & Closed-Loop Refill Mesh
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.98rem', lineHeight: '1.6', opacity: 0.95, marginBottom: '1.75rem' }}>
              An enterprise connected health ecosystem bridging <strong>Patients</strong>, <strong>Caretakers</strong>, and <strong>Community Chemists</strong> with real-time prescription tracking, telemetry alerts, and automated refill fulfillment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '0.4rem', flexShrink: 0, marginTop: '2px' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Patient Terminal</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                    Search for caretakers by name or mobile number, submit clinical assignment requests with prescription documents, and log daily doses with one tap.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '0.4rem', flexShrink: 0, marginTop: '2px' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Caretaker Dashboard</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                    Review incoming patient requests, verify prescriptions, author dosage regimens, bind local pharmacies, and monitor missed dose radar.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '0.4rem', flexShrink: 0, marginTop: '2px' }}>
                  <Store size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chemist Refill Hub</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                    Receive automated refill orders when patient medication runs low, view delivery addresses and caretaker emergency contacts, and dispatch refills.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.78rem', opacity: 0.9 }}>
            🔒 HIPAA-Compliant Privacy &bull; Role-Based Access Control &bull; Real-Time SSE Telemetry
          </div>
        </div>

        {/* Right Column: Clean Authentication (Login & Genuine Registration) */}
        <div style={{ padding: '2.25rem' }}>
          {/* Form Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            padding: '0.3rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setLoginError(''); setRegError(''); setRegSuccessNotice(null); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '8px',
                background: isLoginTab ? 'var(--bg-card)' : 'transparent',
                color: isLoginTab ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isLoginTab ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isLoginTab ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setLoginError(''); setRegError(''); setRegSuccessNotice(null); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '8px',
                background: !isLoginTab ? 'var(--bg-card)' : 'transparent',
                color: !isLoginTab ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: !isLoginTab ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: !isLoginTab ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* TAB 1: Real-Time Login */}
          {isLoginTab && (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Sign In to MedAdhere
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Enter your registered username and password to access your role dashboard.
                </p>
              </div>

              {loginError && (
                <div style={{
                  background: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowOtpModal(true); setOtpStep(1); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 800 }}
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* TAB 2: Clean Production Registration */}
          {!isLoginTab && (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  Register New Account
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Select your clinical role and enter your genuine details.
                </p>
              </div>

              {regError && (
                <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  {regError}
                </div>
              )}

              {regSuccessNotice && (
                <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                  {regSuccessNotice}
                </div>
              )}

              {/* Role Selection */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  I am registering as: *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setRegRole('ROLE_PATIENT')}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: 'var(--radius-sm)',
                      border: regRole === 'ROLE_PATIENT' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                      background: regRole === 'ROLE_PATIENT' ? 'var(--primary-light)' : 'var(--bg-main)',
                      color: regRole === 'ROLE_PATIENT' ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    👴 Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('ROLE_CARETAKER')}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: 'var(--radius-sm)',
                      border: regRole === 'ROLE_CARETAKER' ? '2px solid #8b5cf6' : '1px solid var(--border-medium)',
                      background: regRole === 'ROLE_CARETAKER' ? '#ede9fe' : 'var(--bg-main)',
                      color: regRole === 'ROLE_CARETAKER' ? '#6d28d9' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    👩‍⚕️ Caretaker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('ROLE_CHEMIST')}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: 'var(--radius-sm)',
                      border: regRole === 'ROLE_CHEMIST' ? '2px solid #10b981' : '1px solid var(--border-medium)',
                      background: regRole === 'ROLE_CHEMIST' ? '#ecfdf5' : 'var(--bg-main)',
                      color: regRole === 'ROLE_CHEMIST' ? '#047857' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    🏥 Chemist
                  </button>
                </div>
              </div>

              {/* Informative Guidance Banner based on selected role */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.85rem'
              }}>
                {regRole === 'ROLE_PATIENT' && (
                  <span>
                    💡 <strong>Clean Patient Registration:</strong> No caretaker or pharmacy is pre-selected. After registration, sign in to search for your caretaker by Name or Mobile Number and submit your prescription notes.
                  </span>
                )}
                {regRole === 'ROLE_CARETAKER' && (
                  <span>
                    💡 <strong>Caretaker Role:</strong> Once registered, patients will be able to find you via live search and transmit care assignment requests with prescription documents.
                  </span>
                )}
                {regRole === 'ROLE_CHEMIST' && (
                  <span>
                    💡 <strong>Registered Pharmacy:</strong> Once mapped to a patient by their caretaker, you will securely receive their fulfillment details, medication supply orders, and caretaker contact info.
                  </span>
                )}
              </div>

              {/* Credentials: Username & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose username"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Full Name & Phone Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {regRole === 'ROLE_CHEMIST' ? 'Pharmacy / Store Name *' : 'Full Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={regRole === 'ROLE_CHEMIST' ? 'e.g. Apollo Pharmacy Sector 14' : 'e.g. Ramesh Sharma'}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Role-Specific Secondary Fields */}
              {regRole === 'ROLE_PATIENT' && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Patient Age (Years) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    required
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="e.g. 72"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {regRole === 'ROLE_CHEMIST' && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Pharmacy Drug License Number (Required for validation) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-KA-2024-88412"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {regRole === 'ROLE_CARETAKER' && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Nurse Reg. No. / Govt ID / Family Credential (Optional)
                  </label>
                  <input
                    type="text"
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder="e.g. NURSE-REG-KA-2024 or GOVT-ID-XXXX"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Delivery / Physical Address */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {regRole === 'ROLE_PATIENT' ? 'Home Delivery Address (For Medicine Drops) *' : regRole === 'ROLE_CHEMIST' ? 'Store Physical Address *' : 'Residential / Clinic Address *'}
                </label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street address, apartment, locality, city"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <span>{isSubmitting ? 'Registering Account...' : 'Complete Registration'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2-Step OTP Password Reset Modal */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              borderBottom: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  OTP Password Recovery
                </h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {otpErrorMsg && (
                <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  {otpErrorMsg}
                </div>
              )}

              {otpSuccessMsg && (
                <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                  {otpSuccessMsg}
                </div>
              )}

              {otpStep === 1 && (
                <form onSubmit={handleRequestOtp}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Enter your registered username to receive a 6-digit one-time password (OTP).
                  </p>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Registered Username
                    </label>
                    <input
                      type="text"
                      required
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      placeholder="Enter username"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.88rem' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }}>
                    Send Verification Code
                  </button>
                </form>
              )}

              {otpStep === 2 && (
                <form onSubmit={handleVerifyAndReset}>
                  <div style={{
                    background: 'var(--bg-main)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Verification code dispatched. Enter the 6-digit OTP code below (Test OTP: <strong style={{ color: 'var(--primary)' }}>482910</strong>).
                  </div>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      placeholder="482910"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.1em', textAlign: 'center' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Set New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-main)', fontSize: '0.88rem' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }}>
                    Verify & Reset Password
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
