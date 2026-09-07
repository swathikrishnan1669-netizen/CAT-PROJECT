import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function ManualFallbackModal({ isOpen, onClose, handover, onSuccess }) {
  const { showToast } = useApp();

  const [temp, setTemp] = useState('4.5');
  const [operator, setOperator] = useState('Operator John');
  const [reason, setReason] = useState('Digital probe sensor unavailable during transfer');
  const [approxLocation, setApproxLocation] = useState(handover?.location || 'Collection Point Bay');
  const [doorStatus, setDoorStatus] = useState('CLOSED');
  const [notes, setNotes] = useState('Verified with secondary handheld bimetallic thermometer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempNum = parseFloat(temp);
    if (isNaN(tempNum) || tempNum < -5 || tempNum > 35) {
      showToast('Please enter a valid temperature (-5°C to 35°C)', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitManualReading({
        handover_id: handover.id,
        vehicle_id: handover.vehicle_id,
        route_id: handover.route_id,
        manually_entered_temperature: tempNum,
        approximate_location: approxLocation,
        door_status: doorStatus,
        reason,
        operator_name: operator,
        notes,
      });

      showToast(`Manual fallback reading (${tempNum}°C) recorded with source='MANUAL'`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to record manual reading', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2d47', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>
              📝 Operator Manual Fallback Entry
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Handover: <strong>{handover?.id}</strong> | Vehicle: <strong>{handover?.vehicle_id}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '12px', color: '#c084fc' }}>
            ℹ️ <strong>System Note:</strong> This record will be explicitly marked <code>source = 'MANUAL'</code> and entered into the immutable audit ledger. It will not overwrite raw sensor hardware streams.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Observed Temperature (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Door Status *
              </label>
              <select
                value={doorStatus}
                onChange={(e) => setDoorStatus(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="CLOSED">CLOSED</option>
                <option value="OPEN">OPEN</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Approximate Location *
            </label>
            <input
              type="text"
              value={approxLocation}
              onChange={(e) => setApproxLocation(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#0d1322',
                border: '1px solid #1f2d47',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Reason for Manual Fallback *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                background: '#0d1322',
                border: '1px solid #1f2d47',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '13px'
              }}
            >
              <option value="Digital probe sensor unavailable during transfer">Digital probe sensor unavailable during transfer</option>
              <option value="GPS hardware blind spot / satellite loss">GPS hardware blind spot / satellite loss</option>
              <option value="Sensor power / battery failure">Sensor power / battery failure</option>
              <option value="Suspected thermal drift - field verification">Suspected thermal drift - field verification</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Operator / Driver Name *
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Calibration Notes / Device
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #1f2d47', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : '💾 Save Manual Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
