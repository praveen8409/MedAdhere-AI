import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Search, 
  Users, 
  Pill, 
  FileText, 
  ChevronRight, 
  Calendar, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Filter, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../api';

export default function ChemistPortal({
  summary,
  onUpdateOrderStatus,
  currentUser,
  chemistTab,
  setChemistTab
}) {
  const [localTab, setLocalTab] = useState('ORDERS'); // 'ORDERS' or 'PATIENTS'
  const activeTab = chemistTab || localTab;
  const setActiveTab = setChemistTab || setLocalTab;
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientOrders, setPatientOrders] = useState([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [creatingRefill, setCreatingRefill] = useState(false);

  const orders = summary?.activeRefillOrders || [];

  // Load all patients in the pharmacy network on mount
  useEffect(() => {
    loadPatients();
  }, [currentUser]);

  const loadPatients = async () => {
    try {
      const data = currentUser?.id 
        ? await api.getPatientsByChemist(currentUser.id)
        : [];
      setAllPatients(data || []);
      if (data && data.length > 0) {
        if (!selectedPatient || !data.some(p => p.id === selectedPatient.id)) {
          handleSelectPatient(data[0]);
        }
      } else {
        setSelectedPatient(null);
        setPatientMeds([]);
        setPatientOrders([]);
      }
    } catch (err) {
      console.error('Failed to load mapped patients directory:', err);
    }
  };

  // When a chemist selects a patient to inspect their full clinical dispensing file
  const handleSelectPatient = async (p) => {
    setSelectedPatient(p);
    setLoadingPatientData(true);
    try {
      const [meds, ords] = await Promise.all([
        api.getMedicinesByPatient(p.id).catch(() => []),
        api.getRefillsByPatient(p.id).catch(() => [])
      ]);
      setPatientMeds(meds || []);
      setPatientOrders(ords || []);
    } catch (err) {
      console.error('Failed to load patient profile data:', err);
    } finally {
      setLoadingPatientData(false);
    }
  };

  // Step 1: Pack 30-Day Strip -> status PACKED
  const handlePackOrder = async (order) => {
    setUpdatingId(order.id);
    const notes = 'Tamper-evident 30-day strip packaged and sealed by Apollo Pharmacy QC team.';
    await onUpdateOrderStatus(order.id, 'PACKED', notes);
    setUpdatingId(null);
    if (selectedPatient) handleSelectPatient(selectedPatient);
  };

  // Step 2: Handover to courier -> status OUT_FOR_DELIVERY
  const handleCourierDispatch = async (order) => {
    setUpdatingId(order.id);
    const notes = 'Dispatched via Apollo Express Courier. Estimated doorstep delivery within 45 mins.';
    await onUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY', notes);
    setUpdatingId(null);
    if (selectedPatient) handleSelectPatient(selectedPatient);
  };

  // Step 3: Confirm Delivery -> status DELIVERED (+30 tabs restocked atomically)
  const handleConfirmDelivery = async (order) => {
    setUpdatingId(order.id);
    const notes = 'Doorstep verification completed. 30-day supply delivered and patient inventory restocked.';
    await onUpdateOrderStatus(order.id, 'DELIVERED', notes);
    setUpdatingId(null);
    if (selectedPatient) handleSelectPatient(selectedPatient);
  };

  // 1-Click Fast Refill Dispatch
  const handleQuickFulfill = async (order) => {
    setUpdatingId(order.id);
    const notes = 'Express fulfillment executed by Apollo Pharmacy Desk.';
    await onUpdateOrderStatus(order.id, 'DELIVERED', notes);
    setUpdatingId(null);
    if (selectedPatient) handleSelectPatient(selectedPatient);
  };

  // Create an extra refill order from chemist desk
  const handleCreatePrescriptionRefill = async (med) => {
    if (!selectedPatient || !med) return;
    setCreatingRefill(true);
    try {
      await api.createRefill({
        medicineId: med.id,
        patientId: selectedPatient.id,
        chemistId: currentUser?.id || 2,
        quantity: 30,
        urgencyLevel: 'NORMAL',
        trackingNotes: `Pharmacy-initiated 30-day refill strip for ${med.name}`
      });
      await loadPatients();
      handleSelectPatient(selectedPatient);
    } catch (err) {
      console.error('Failed to create refill order:', err);
    } finally {
      setCreatingRefill(false);
    }
  };

  // Filter orders by search and status
  const filteredOrders = orders.filter(order => {
    const patName = order.patient?.fullName || '';
    const careName = order.patient?.caretaker?.fullName || '';
    const medName = order.medicine?.name || '';
    const matchesSearch = 
      patName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      careName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return order.orderStatus === 'REQUESTED';
    if (statusFilter === 'PACKED') return order.orderStatus === 'PACKED';
    if (statusFilter === 'IN_TRANSIT') return order.orderStatus === 'OUT_FOR_DELIVERY';
    if (statusFilter === 'DELIVERED') return order.orderStatus === 'DELIVERED';
    return true;
  });

  const pendingCount = orders.filter(o => o.orderStatus === 'REQUESTED').length;
  const inTransitCount = orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'PACKED').length;
  const fulfilledCount = orders.filter(o => o.orderStatus === 'DELIVERED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Pharmacy Header Card */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(2, 132, 199, 0.06))',
        border: '1px solid rgba(16, 185, 129, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <Store size={26} color="#10b981" />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {currentUser?.fullName || 'Apollo Pharmacy Main Market'}
              </h1>
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                <CheckCircle2 size={12} /> Verified Dispensing Partner
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Address: <strong>{currentUser?.address || 'Shop 14, Apollo Medical Complex, Main Market'}</strong> &bull; Phone: <strong>{currentUser?.phoneNumber || '+91 98222-33445'}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--warning)' }}>{pendingCount}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>New Requests</div>
            </div>
            <div style={{
              background: 'var(--bg-card)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>{inTransitCount}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Fulfillment</div>
            </div>
            <div style={{
              background: 'var(--bg-card)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>{fulfilledCount}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Restocked</div>
            </div>
          </div>
        </div>

        {/* Chemist Workspace Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1.25rem',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '0.85rem'
        }}>
          <button
            onClick={() => setActiveTab('ORDERS')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'ORDERS' ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === 'ORDERS' ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: activeTab === 'ORDERS' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <Package size={16} />
            <span>Refill Orders Dashboard ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PATIENTS')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'PATIENTS' ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === 'PATIENTS' ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: activeTab === 'PATIENTS' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <Users size={16} />
            <span>Patient & Caretaker Directory ({allPatients.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ORDERS & DISPATCH DESK */}
      {activeTab === 'ORDERS' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          {/* Filter & Search Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by Patient Name, Caretaker Name, or Medication..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'PENDING', label: 'New Requests' },
                { id: 'PACKED', label: 'Packed' },
                { id: 'IN_TRANSIT', label: 'In Transit' },
                { id: 'DELIVERED', label: 'Fulfilled' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: statusFilter === f.id ? 'var(--primary)' : 'var(--bg-main)',
                    color: statusFilter === f.id ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)'
            }}>
              No orders found matching the filter criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem' }}>
              {filteredOrders.map(order => {
                const isDelivered = order.orderStatus === 'DELIVERED';
                const isPacked = order.orderStatus === 'PACKED';
                const isOutForDelivery = order.orderStatus === 'OUT_FOR_DELIVERY';
                const isRequested = order.orderStatus === 'REQUESTED';
                const isLoading = updatingId === order.id;

                const patientObj = order.patient || {};
                const caretakerObj = order.patient?.caretaker || {};

                return (
                  <div
                    key={order.id}
                    style={{
                      background: 'var(--bg-main)',
                      border: isDelivered 
                        ? '1.5px solid var(--success-border)' 
                        : isRequested 
                        ? '2px solid var(--warning-border)' 
                        : '1.5px solid var(--primary-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      {/* Top Order Badge & Timing */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          ORDER #{order.id}
                        </span>
                        
                        {isDelivered && (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            <CheckCircle2 size={12} /> RESTOCKED (+{order.quantity || 30} TABS)
                          </span>
                        )}
                        {isRequested && (
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                            <Clock size={12} /> INCOMING AUTO-REFILL
                          </span>
                        )}
                        {isPacked && (
                          <span className="badge badge-primary" style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4338ca' }}>
                            <Package size={12} /> READY FOR COURIER
                          </span>
                        )}
                        {isOutForDelivery && (
                          <span className="badge badge-primary" style={{ fontSize: '0.72rem', background: '#f3e8ff', color: '#7e22ce' }}>
                            <Truck size={12} /> OUT FOR DELIVERY
                          </span>
                        )}
                      </div>

                      {/* Medicine Info */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                        <div style={{
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: 'var(--primary)',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          display: 'flex'
                        }}>
                          <Pill size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {order.medicine?.name || 'Metformin Glycomet (500mg)'}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                            Course Spec: <strong>{order.quantity || 30}-tablet monthly strip</strong> ({order.medicine?.dosage || '500mg'})
                          </p>
                        </div>
                      </div>

                      {/* Correctly Mapped Patient & Caretaker Card */}
                      <div style={{
                        background: 'var(--bg-card)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>Patient:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{patientObj.fullName || 'Patient'}</span> {patientObj.age ? `(${patientObj.age} yrs)` : ''}
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('PATIENTS');
                              handleSelectPatient(patientObj);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: 0
                            }}
                          >
                            <span>Profile</span> <ChevronRight size={13} />
                          </button>
                        </div>

                        <div>
                          <strong>Address:</strong> <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {patientObj.address || 'Address not listed'}
                        </div>

                        {caretakerObj.fullName && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>Caretaker:</strong> {caretakerObj.fullName}
                            </div>
                            {caretakerObj.phoneNumber && (
                              <a
                                href={`tel:${caretakerObj.phoneNumber}`}
                                style={{
                                  color: 'var(--primary)',
                                  textDecoration: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                <Phone size={12} /> Call
                              </a>
                            )}
                          </div>
                        )}

                        {order.trackingNotes && (
                          <div style={{ marginTop: '0.2rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            "{order.trackingNotes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dispensing Actions Pipeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                      {isRequested && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handlePackOrder(order)}
                            disabled={isLoading}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', fontWeight: 800 }}
                          >
                            <Package size={15} />
                            <span>{isLoading ? 'Packaging...' : 'Pack 30-Day Strip'}</span>
                          </button>
                          <button
                            onClick={() => handleQuickFulfill(order)}
                            disabled={isLoading}
                            className="btn btn-success"
                            style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: 800 }}
                            title="Instant Restock (+30 tablets)"
                          >
                            <span>⚡ Quick Restock</span>
                          </button>
                        </div>
                      )}

                      {isPacked && (
                        <button
                          onClick={() => handleCourierDispatch(order)}
                          disabled={isLoading}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', fontWeight: 800 }}
                        >
                          <Truck size={15} />
                          <span>{isLoading ? 'Updating...' : 'Handover to Courier (Out for Delivery)'}</span>
                        </button>
                      )}

                      {isOutForDelivery && (
                        <button
                          onClick={() => handleConfirmDelivery(order)}
                          disabled={isLoading}
                          className="btn btn-success"
                          style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', fontWeight: 800 }}
                        >
                          <CheckCircle2 size={16} />
                          <span>{isLoading ? 'Confirming...' : 'Confirm Delivery & Restock (+30 Tabs)'}</span>
                        </button>
                      )}

                      {isDelivered && (
                        <div style={{
                          textAlign: 'center',
                          padding: '0.5rem',
                          background: 'var(--success-light)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--success)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}>
                          <CheckCircle2 size={15} />
                          <span>Fulfilled & Restocked in Box</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PATIENT & CARETAKER DIRECTORY */}
      {activeTab === 'PATIENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('ORDERS')}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>← Back to Refill Orders Home</span>
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Viewing Patient Clinical & Prescription Dispensing Records
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left Column: Patient List */}
          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.85rem 0' }}>
              Mapped Patients ({allPatients.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allPatients.length === 0 ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-main)'
                }}>
                  No patients mapped yet. Once a primary caretaker approves an assignment request and designates your pharmacy, the patient will appear here.
                </div>
              ) : (
                allPatients.map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                          {p.fullName}
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {p.age} yrs
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Caretaker: <strong>{p.caretaker?.fullName || 'Family Caretaker'}</strong>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <MapPin size={11} style={{ display: 'inline' }} /> {p.address || 'Address listed'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Patient Clinical & Dispensing File */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {selectedPatient ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Patient Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        {selectedPatient.fullName}
                      </h2>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        Active Patient File
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                      Age: <strong>{selectedPatient.age} years</strong> &bull; Link Code: <strong>{selectedPatient.familyLinkCode || 'CARE01'}</strong> &bull; Phone: <strong>{selectedPatient.phoneNumber}</strong>
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                      Delivery Address: <strong>{selectedPatient.address}</strong>
                    </p>
                  </div>

                  {selectedPatient.caretaker && (
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PRIMARY CARETAKER</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedPatient.caretaker.fullName}</div>
                      {selectedPatient.caretaker.phoneNumber && (
                        <a
                          href={`tel:${selectedPatient.caretaker.phoneNumber}`}
                          className="btn btn-primary"
                          style={{
                            marginTop: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={12} /> {selectedPatient.caretaker.phoneNumber}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 1: Prescribed Medications & Stock Levels */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Pill size={18} color="var(--primary)" />
                    <span>Prescribed Regimens & Box Stock Telemetry</span>
                  </h3>

                  {loadingPatientData ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading prescription records...</div>
                  ) : patientMeds.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
                      No active prescriptions on file for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      {patientMeds.map(m => {
                        const daily = Math.max(1, m.dailyDoseCount);
                        const daysLeft = Math.floor(m.remainingTablets / daily);
                        const isLow = daysLeft <= 5;

                        return (
                          <div
                            key={m.id}
                            style={{
                              background: 'var(--bg-main)',
                              padding: '1rem',
                              borderRadius: 'var(--radius-md)',
                              border: isLow ? '2px solid var(--warning-border)' : '1px solid var(--border-light)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                {m.name}
                              </div>
                              {isLow ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                                  LOW STOCK ({daysLeft}d left)
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                                  SUFFICIENT ({daysLeft}d left)
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                              Dosage: <strong>{m.dosage}</strong> &bull; Freq: <strong>{m.dailyDoseCount}x daily</strong>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                              Instructions: {m.instructions}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--bg-card)',
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem'
                            }}>
                              <span>Current Stock: <strong>{m.remainingTablets} tablets</strong></span>
                              <button
                                onClick={() => handleCreatePrescriptionRefill(m)}
                                disabled={creatingRefill}
                                style={{
                                  background: 'var(--primary)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '0.3rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Dispense Strip
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Refill Order History for this Patient */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Package size={18} color="var(--primary)" />
                    <span>Supply Chain & Refill History</span>
                  </h3>

                  {patientOrders.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
                      No previous refill orders on record for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {patientOrders.map(ord => (
                        <div
                          key={ord.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg-main)',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                              {ord.medicine?.name || 'Medication Strip'} ({ord.quantity || 30} tablets)
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Notes: {ord.trackingNotes || 'Standard delivery order'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span className={`badge ${ord.orderStatus === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                              {ord.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a patient from the directory on the left to view their complete clinical profile and dispensing records.
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
