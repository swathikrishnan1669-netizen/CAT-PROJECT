import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ThresholdSettingsPage() {
  const { role, refreshIndex, showToast, triggerRefresh } = useApp();
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({});
  const [justification, setJustification] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setLoading(true);
        const data = await api.getThresholds();
        setThresholds(data);
        const initialEdits = {};
        data.forEach((t) => {
          initialEdits[t.key] = t.value;
        });
        setEditValues(initialEdits);
      } catch (err) {
        showToast('Failed to load threshold settings', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, [refreshIndex]);

  const handleSave = async (key) => {
    const newVal = parseFloat(editValues[key]);
    if (isNaN(newVal)) {
      showToast('Please enter a valid numeric value', 'danger');
      return;
    }

    setSavingKey(key);
    try {
      await api.updateThreshold(
        key,
        newVal,
        `${role} User`,
        justification || `Threshold updated by ${role}`
      );
      showToast(`Threshold '${key}' updated to ${newVal}. Recorded in audit ledger.`, 'success');
      setJustification('');
      triggerRefresh();
    } catch (err) {
      showToast('Failed to update threshold', 'danger');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Operational Alert Thresholds & Risk Boundaries
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Configure dynamic cold-chain safety limits. Changes are immediately evaluated by the alert engine and preserved in the audit log.
        </p>
      </div>

      {role !== 'ADMIN' && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '13px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>ℹ️</span>
          <span>
            You are logged in as <strong>{role}</strong>. Threshold adjustments are permitted for prototype testing and will be audited under your persona.
          </span>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
          ⚙️ Active Threshold Configuration Table
        </h3>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
            Loading configuration boundaries...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {thresholds.map((t) => (
              <div
                key={t.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '10px',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{t.key}</strong>
                    <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(2, 132, 199, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                      {t.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {t.description}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={editValues[t.key] !== undefined ? editValues[t.key] : t.value}
                      onChange={(e) => setEditValues({ ...editValues, [t.key]: e.target.value })}
                      style={{
                        width: '90px',
                        background: '#111827',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '700',
                        textAlign: 'right'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#94a3b8', minWidth: '24px' }}>{t.unit}</span>
                  </div>

                  <button
                    onClick={() => handleSave(t.key)}
                    disabled={savingKey === t.key}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    {savingKey === t.key ? 'Saving...' : '💾 Update & Audit'}
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Operational Justification / Regulatory Reason (Attached to Audit Trail):
              </label>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="e.g. Summer ambient heat wave protocol adjustment; authorized by Quality Director."
                style={{
                  width: '100%',
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
