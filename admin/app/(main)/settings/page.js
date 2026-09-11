// PATH: src/app/(dashboard)/settings/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, FormField } from '@/components/UI';

const SECTION_TABS = [
  { key: 'payment', label: '💳 Payment System' },
  { key: 'commission', label: '📊 Commission' },
  { key: 'rides', label: '🚗 Rides' },
  { key: 'float', label: '🔋 Float' },
  { key: 'affiliate', label: '🔗 Affiliate' },
  { key: 'notifications', label: '🔔 Notifications' },
  { key: 'platform', label: '⚙️ Platform' },
  { key: 'documents', label: '📄 Documents' },
];

export default function SettingsPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');
  const [changed, setChanged] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admn-setting?populate=defaultCurrency');
      const s = res?.data || res;
      setSettings(s || {});
    } catch (err) { toast.error(err.message || 'Failed to load settings'); } finally { setLoading(false); }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setChanged(true);
  };

  const handleSave = async () => {
    if (!canWrite('settings')) return toast.error('Insufficient permissions');
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, defaultCurrency, driverOrderRequestRingtone, ...saveData } = settings;
      await adminAPI.put('/admn-setting', { data: saveData });
      toast.success('Settings saved successfully');
      setChanged(false);
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (!hasPermission('settings')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 200 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
          <div style={{ flex: 1 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 36 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const s = settings;
  return (
    <div>
      <PageHeader title="Platform Settings" subtitle={`OkraRides configuration · ${s.platformName || 'OkraRides'}`}
        actions={canWrite('settings') ? (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !changed}>
            {saving ? 'Saving...' : changed ? '● Save Changes' : 'No Changes'}
          </button>
        ) : undefined} />
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          {SECTION_TABS.map(tab => (
            <button key={tab.key} className={`nav-item ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 2 }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          {activeTab === 'payment' && (
            <SettingsSection title="Payment System">
              <FormField label="Payment System Type" hint="How drivers pay: float-based, subscription-based, or hybrid">
                <select className="input select" value={s.paymentSystemType || 'float_based'} onChange={e => updateSetting('paymentSystemType', e.target.value)} disabled={!canWrite('settings')}>
                  <option value="float_based">Float Based</option>
                  <option value="subscription_based">Subscription Based</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </FormField>
              <FormField label="External Payment Gateway">
                <select className="input select" value={s.externalPaymentGateway || 'lencopay'} onChange={e => updateSetting('externalPaymentGateway', e.target.value)} disabled={!canWrite('settings')}>
                  <option value="lencopay">LencoPay</option>
                </select>
              </FormField>
              <FormField label="Withdrawable Balance Source" hint="Which balance drivers can withdraw from">
                <select className="input select" value={s.withdrawableBalance || 'float'} onChange={e => updateSetting('withdrawableBalance', e.target.value)} disabled={!canWrite('settings')}>
                  <option value="float">Float</option>
                  <option value="earnings">Earnings</option>
                </select>
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Minimum Withdrawal Amount (ZMW)">
                  <input className="input" type="number" value={s.minimumWithdrawAmount || 10} onChange={e => updateSetting('minimumWithdrawAmount', parseInt(e.target.value))} disabled={!canWrite('settings')} />
                </FormField>
                <FormField label="Subscription Grace Period (days)">
                  <input className="input" type="number" value={s.subscriptionGracePeriodDays || 3} onChange={e => updateSetting('subscriptionGracePeriodDays', parseInt(e.target.value))} disabled={!canWrite('settings')} />
                </FormField>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[['cashEnabled', 'Cash Payments'], ['okrapayEnabled', 'OkraPay'], ['allowFloatTopUpWithOkraPay', 'Float Top-up via OkraPay'], ['allowRidePaymentWithOkraPay', 'Ride Payment via OkraPay'], ['autoRenewByDefault', 'Auto Renew by Default']].map(([key, label]) => (
                  <BoolSetting key={key} label={label} value={s[key] ?? true} onChange={v => updateSetting(key, v)} disabled={!canWrite('settings')} />
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'commission' && (
            <SettingsSection title="Commission Settings">
              <FormField label="Commission Type">
                <select className="input select" value={s.commissionType || 'percentage'} onChange={e => updateSetting('commissionType', e.target.value)} disabled={!canWrite('settings')}>
                  <option value="percentage">Percentage</option>
                  <option value="flat_rate">Flat Rate</option>
                  <option value="tiered">Tiered</option>
                </select>
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FormField label="Default Commission %" hint="Used when type is percentage">
                  <input className="input" type="number" step="0.01" value={s.defaultCommissionPercentage || 15} onChange={e => updateSetting('defaultCommissionPercentage', parseFloat(e.target.value))} disabled={!canWrite('settings')} />
                </FormField>
                <FormField label="Flat Commission (ZMW)" hint="Used when type is flat_rate">
                  <input className="input" type="number" step="0.01" value={s.defaultFlatCommission || 0} onChange={e => updateSetting('defaultFlatCommission', parseFloat(e.target.value))} disabled={!canWrite('settings')} />
                </FormField>
                <FormField label="Min Commission (ZMW)">
                  <input className="input" type="number" step="0.01" value={s.minimumCommission || ''} onChange={e => updateSetting('minimumCommission', parseFloat(e.target.value) || null)} disabled={!canWrite('settings')} />
                </FormField>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'rides' && (
            <SettingsSection title="Ride Settings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['maxSimultaneousDriverRequests', 'Max Simultaneous Driver Requests', 1],
                  ['rideRequestTimeoutSeconds', 'Ride Request Timeout (seconds)', 30],
                  ['deliveryRequestTimeoutSeconds', 'Delivery Request Timeout (seconds)', 60],
                  ['driverCancellationCooldownMinutes', 'Driver Cancellation Cooldown (minutes)', 15],
                  ['rideCompletionProximity', 'Ride Completion Proximity (meters)', 100],
                  ['rideBookingRadius', 'Ride Booking Radius (km)', 10],
                  ['appsServerPollingIntervalInSeconds', 'App Polling Interval (seconds)', 20],
                  ['targetRidesForUnlock', 'Target Rides for Device Unlock', 1000],
                ].map(([key, label, def]) => (
                  <FormField key={key} label={label}>
                    <input className="input" type="number" value={s[key] || def} onChange={e => updateSetting(key, parseInt(e.target.value))} disabled={!canWrite('settings')} />
                  </FormField>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[['allowManualCompletion', 'Allow Manual Completion'], ['requireArrivalConfirmation', 'Require Arrival Confirmation'], ['autoApproveDrivers', 'Auto Approve Drivers'], ['autoApproveDeliverers', 'Auto Approve Deliverers']].map(([key, label]) => (
                  <BoolSetting key={key} label={label} value={s[key] ?? false} onChange={v => updateSetting(key, v)} disabled={!canWrite('settings')} />
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'float' && (
            <SettingsSection title="Float Settings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Minimum Float Top-up (ZMW)"><input className="input" type="number" step="0.01" value={s.minimumFloatTopup || 10} onChange={e => updateSetting('minimumFloatTopup', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Maximum Float Top-up (ZMW)"><input className="input" type="number" step="0.01" value={s.maximumFloatTopup || 1000} onChange={e => updateSetting('maximumFloatTopup', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Negative Float Limit (ZMW)" hint="Max negative balance allowed"><input className="input" type="number" step="0.01" value={s.negativeFloatLimit || 0} onChange={e => updateSetting('negativeFloatLimit', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Initial Driver Float (ZMW)" hint="Float given to new drivers"><input className="input" type="number" step="0.01" value={s.initialDriverFloat || 0} onChange={e => updateSetting('initialDriverFloat', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Initial Deliverer Float (ZMW)"><input className="input" type="number" step="0.01" value={s.initialDelivererFloat || 0} onChange={e => updateSetting('initialDelivererFloat', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[['allowNegativeFloat', 'Allow Negative Float'], ['blockCashRidesOnInsufficientFloat', 'Block Cash Rides on Insufficient Float']].map(([key, label]) => (
                  <BoolSetting key={key} label={label} value={s[key] ?? false} onChange={v => updateSetting(key, v)} disabled={!canWrite('settings')} />
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'affiliate' && (
            <SettingsSection title="Affiliate System">
              <BoolSetting label="Affiliate System Enabled" value={s.affiliateSystemEnabled ?? true} onChange={v => updateSetting('affiliateSystemEnabled', v)} disabled={!canWrite('settings')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                <FormField label="Points per Rider Referral"><input className="input" type="number" value={s.pointsPerRiderReferral || 10} onChange={e => updateSetting('pointsPerRiderReferral', parseInt(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Points per Driver Referral"><input className="input" type="number" value={s.pointsPerDriverReferral || 50} onChange={e => updateSetting('pointsPerDriverReferral', parseInt(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Points per First Ride (Rider)"><input className="input" type="number" value={s.pointsPerRiderFirstRide || 20} onChange={e => updateSetting('pointsPerRiderFirstRide', parseInt(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Money per Point (ZMW)"><input className="input" type="number" step="0.01" value={s.moneyPerPoint || 0.1} onChange={e => updateSetting('moneyPerPoint', parseFloat(e.target.value))} disabled={!canWrite('settings')} /></FormField>
                <FormField label="Minimum Points for Redemption"><input className="input" type="number" value={s.minimumPointsForRedemption || 100} onChange={e => updateSetting('minimumPointsForRedemption', parseInt(e.target.value))} disabled={!canWrite('settings')} /></FormField>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'notifications' && (
            <SettingsSection title="Notifications & Channels">
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[['smsEnabled', 'SMS'], ['emailEnabled', 'Email'], ['pushNotificationsEnabled', 'Push Notifications'], ['whatsappEnabled', 'WhatsApp']].map(([key, label]) => (
                  <BoolSetting key={key} label={label} value={s[key] ?? false} onChange={v => updateSetting(key, v)} disabled={!canWrite('settings')} />
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'platform' && (
            <SettingsSection title="Platform Information">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Platform Name"><input className="input" value={s.platformName || ''} onChange={e => updateSetting('platformName', e.target.value)} disabled={!canWrite('settings')} placeholder="OkraRides" /></FormField>
                <FormField label="Support Email"><input className="input" type="email" value={s.supportEmail || ''} onChange={e => updateSetting('supportEmail', e.target.value)} disabled={!canWrite('settings')} placeholder="support@okrarides.com" /></FormField>
                <FormField label="Support Phone"><input className="input" value={s.supportPhone || ''} onChange={e => updateSetting('supportPhone', e.target.value)} disabled={!canWrite('settings')} placeholder="+260..." /></FormField>
                <FormField label="OTP Override Code" hint="Override OTP for testing"><input className="input" value={s.overideOtpCode || ''} onChange={e => updateSetting('overideOtpCode', e.target.value)} disabled={!canWrite('settings')} placeholder="121212" /></FormField>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'documents' && (
            <SettingsSection title="Driver Document Requirements">
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  ['requireDriverLicense', 'Require Driver License'],
                  ['requireNationalId', 'Require National ID'],
                  ['requireProofOfAddress', 'Require Proof of Address'],
                  ['requireInsurance', 'Require Insurance'],
                  ['requireRoadTax', 'Require Road Tax'],
                  ['requireFitnessDocument', 'Require Fitness Document'],
                  ['requireVehicleRegistration', 'Require Vehicle Registration'],
                ].map(([key, label]) => (
                  <BoolSetting key={key} label={label} value={s[key] ?? true} onChange={v => updateSetting(key, v)} disabled={!canWrite('settings')} />
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <FormField label="Free Trial Enabled">
                  <div style={{ display: 'flex', gap: 24 }}>
                    <BoolSetting label="Enable Free Trial" value={s.freeTrialEnabled ?? false} onChange={v => updateSetting('freeTrialEnabled', v)} disabled={!canWrite('settings')} />
                  </div>
                </FormField>
                {s.freeTrialEnabled && (
                  <FormField label="Default Free Trial Days">
                    <input className="input" type="number" value={s.defaultFreeTrialDays || 7} onChange={e => updateSetting('defaultFreeTrialDays', parseInt(e.target.value))} disabled={!canWrite('settings')} style={{ maxWidth: 160 }} />
                  </FormField>
                )}
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: 'var(--text-primary)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  );
}

function BoolSetting({ label, value, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer', fontSize: 13, opacity: disabled ? 0.7 : 1, padding: '8px 0' }}>
      <div onClick={() => !disabled && onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? 'var(--accent)' : 'var(--bg-hover)', border: `1px solid ${value ? 'var(--accent)' : 'var(--border-strong)'}`, position: 'relative', transition: 'all 0.2s', cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: value ? '#000' : 'var(--text-muted)', transition: 'left 0.2s' }} />
      </div>
      <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}
