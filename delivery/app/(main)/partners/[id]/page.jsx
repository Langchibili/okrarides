'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import useAuth from "@/lib/hooks/useAuth";
import { getImageUrl } from "@/Functions";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN = '#10B981';
const GREEN_DIM = '#059669';

const STATUS_STYLES = {
    approved: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.10) 100%)', border: 'rgba(16,185,129,0.35)', color: '#10B981', dot: '#10B981', label: "Approved" },
    pending: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.10) 100%)', border: 'rgba(245,158,11,0.35)', color: '#F59E0B', dot: '#F59E0B', label: "Pending review" },
    rejected: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(185,28,28,0.10) 100%)', border: 'rgba(239,68,68,0.35)', color: '#EF4444', dot: '#EF4444', label: "Rejected" },
    suspended: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.10) 100%)', border: 'rgba(245,158,11,0.35)', color: '#F59E0B', dot: '#F59E0B', label: "Suspended" },
    not_started: { bg: 'linear-gradient(135deg, rgba(100,116,139,0.18) 0%, rgba(71,85,105,0.10) 100%)', border: 'rgba(100,116,139,0.25)', color: '#94A3B8', dot: '#64748B', label: "Not started" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch { }
    document.body.removeChild(ta);
    return Promise.resolve();
}

// ─── PartnerAvatar ─────────────────────────────────────────────────────────────
function PartnerAvatar({ logo, businessName, size = 60 }) {
    const [imgError, setImgError] = useState(false);
    const initials = businessName
        ? businessName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
        : "?";

    if (logo && !imgError) {
        return (
            <img src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(logo, 'thumbnail')}
                alt={businessName} onError={() => setImgError(true)}
                style={{
                    width: size, height: size, borderRadius: 14, objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0
                }}
            />
        )
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.12) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: size * 0.32, color: GREEN, flexShrink: 0, letterSpacing: '0.02em',
        }}>
            {initials}
        </div>
    );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accent }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)',
            border: `1px solid ${accent ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 16, overflow: 'hidden', marginBottom: 10,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}>
            {title && (
                <div style={{
                    padding: '10px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: 7
                }}>
                    {icon && <span style={{ color: '#475569' }}>{icon}</span>}
                    <p style={{
                        margin: 0, fontSize: 10, fontWeight: 700, color: '#475569',
                        textTransform: 'uppercase', letterSpacing: '0.1em'
                    }}>
                        {title}
                    </p>
                </div>
            )}
            <div style={{ padding: '12px 16px' }}>{children}</div>
        </div>
    );
}

// ─── MetricTile ────────────────────────────────────────────────────────────────
function MetricTile({ label, value, icon, highlight }) {
    return (
        <div style={{
            background: highlight
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)'
                : 'rgba(15,23,42,0.5)',
            border: highlight ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12, padding: '10px 12px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <span style={{ color: highlight ? GREEN : '#475569' }}>{icon}</span>
                <p style={{
                    margin: 0, fontSize: 10, color: '#475569', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase'
                }}>{label}</p>
            </div>
            <p style={{
                margin: 0, fontWeight: 700, fontSize: 16,
                color: highlight ? GREEN : '#E2E8F0', letterSpacing: '-0.01em'
            }}>{value}</p>
        </div>
    );
}

// ─── ContactRow — mirrors HelpPage style ──────────────────────────────────────
function ContactRow({ value, type, last }) {
    const [copied, setCopied] = useState(false);
    const color = type === 'phone' ? GREEN : '#3B82F6';
    const bgAlpha = type === 'phone' ? '16,185,129' : '59,130,246';

    const handleCopy = () => {
        copyToClipboard(value).finally(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleAction = () => {
        if (type === 'phone') {
            window.location.href = `tel:${value.replace(/\s/g, '')}`;
        } else {
            window.location.href = `mailto:${value}`;
        }
    };

    const handleWhatsApp = () => {
        window.open(`https://wa.me/${value.replace(/\D/g, '')}?text=Hello%2C%20I%20need%20support`, '_blank');
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0',
            borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
        }}>
            {/* Icon tile */}
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `rgba(${bgAlpha}, 0.12)`,
                border: `1px solid rgba(${bgAlpha}, 0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {type === 'phone' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.54-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.07 16a2 2 0 0 1 .93.92z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="22,6 12,13 2,6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>

            {/* Value */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#475569', marginBottom: 1 }}>
                    {type === 'phone' ? 'Phone' : 'Email'}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', fontWeight: 500, wordBreak: 'break-all' }}>
                    {value}
                </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Tap-to-call / Tap-to-email */}
                <button onClick={handleAction} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `rgba(${bgAlpha}, 0.12)`,
                    border: `1px solid rgba(${bgAlpha}, 0.25)`,
                    cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = `rgba(${bgAlpha}, 0.22)`}
                    onMouseLeave={e => e.currentTarget.style.background = `rgba(${bgAlpha}, 0.12)`}
                    title={type === 'phone' ? 'Call' : 'Send email'}
                >
                    {type === 'phone' ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.54-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.07 16a2 2 0 0 1 .93.92z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>

                {/* Copy */}
                <button onClick={handleCopy} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    color: copied ? GREEN : '#64748B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                }} title="Copy">
                    {copied ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>

                {/* WhatsApp (phone only) */}
                {type === 'phone' && (
                    <button onClick={handleWhatsApp} style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(37,211,102,0.1)',
                        border: '1px solid rgba(37,211,102,0.25)',
                        cursor: 'pointer', color: '#25D366',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.10)'}
                        title="WhatsApp"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── SwitchPartnerModal ────────────────────────────────────────────────────────
// The *logged-in driver* calls this to move themselves to a new partner.
function SwitchPartnerModal({ currentPartnerId, onClose, onSuccess }) {
    const [partners, setPartners] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth()
    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.get(
                    `/users?populate[partnerProfile][populate]=logo&filters[partnerProfile][verificationStatus][$eq]=approved&pagination[pageSize]=100`
                );
                const items = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
                setPartners(items.filter(
                    (u) => u.partnerProfile?.verificationStatus === "approved" && u.id !== currentPartnerId
                ));
            } catch {
                setError("Could not load partners.");
            } finally {
                setLoading(false);
            }
        })();
    }, [currentPartnerId]);

    async function handleSwitch() {
        if (!selected) return;
        setSwitching(true);
        setError(null);
        try {
            // Driver switches themselves: POST to /partner/switch with the new partner id
            await apiClient.post(`/partner/drivers/${user?.id}/switch-partner`, {
                newPartnerId: selected.id,
                currentPartner: user?.partner
            });
            onSuccess(selected);
        } catch (err) {
            setError(err?.message || "Failed to switch partner.");
        } finally {
            setSwitching(false);
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                padding: '24px', width: '100%', maxWidth: 460,
                maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 14,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
                            Switch Partner Company
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>
                            Choose the company you want to join
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(30,41,59,0.5)', cursor: 'pointer',
                        color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div style={{
                    padding: '10px 14px', background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10,
                    fontSize: 13, color: '#94A3B8', lineHeight: 1.5,
                }}>
                    Selecting a new partner will move you to that company. Notifications will be sent automatically.
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10,
                        color: '#FCA5A5', fontSize: 13,
                    }}>{error}</div>
                )}

                {/* Partner list */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {loading ? (
                        <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
                            Loading partners…
                        </p>
                    ) : partners.length === 0 ? (
                        <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
                            No other approved partners available.
                        </p>
                    ) : (
                        partners.map((p) => {
                            const prof = p.partnerProfile || {};
                            const isSel = selected?.id === p.id;
                            return (
                                <div key={p.id} onClick={() => setSelected(p)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px', borderRadius: 12,
                                    border: isSel ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.06)',
                                    background: isSel
                                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)'
                                        : 'rgba(30,41,59,0.4)',
                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                    boxShadow: isSel ? '0 0 16px rgba(16,185,129,0.12)' : 'none',
                                }}>
                                    <PartnerAvatar logo={prof.logo} businessName={prof.businessName} size={38} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>
                                            {prof.businessName || "Unnamed"}
                                        </p>
                                        {prof.businessPhone && (
                                            <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{prof.businessPhone}</p>
                                        )}
                                    </div>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                        border: isSel ? `2px solid ${GREEN}` : '2px solid rgba(100,116,139,0.4)',
                                        background: isSel ? GREEN : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s',
                                    }}>
                                        {isSel && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <button onClick={handleSwitch} disabled={!selected || switching} style={{
                    width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                    background: !selected || switching
                        ? 'rgba(30,41,59,0.5)'
                        : `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`,
                    color: !selected || switching ? '#475569' : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: !selected || switching ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selected && !switching ? `0 6px 20px rgba(16,185,129,0.35)` : 'none',
                    letterSpacing: '0.01em', fontFamily: 'inherit',
                }}>
                    {switching ? 'Switching…' : selected ? `Join ${selected.partnerProfile?.businessName}` : 'Select a partner first'}
                </button>
            </div>
        </div>
    );
}

// ─── Main PartnerDetailPage ────────────────────────────────────────────────────
export default function PartnerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const partnerId = params?.id;
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    // ── Snackbar state ──────────────────────────────────────────────────────────
    const [snackbar, setSnackbar] = useState({ message: '', visible: false });

    useEffect(() => {
        if (!snackbar.visible) return;
        const t = setTimeout(() => setSnackbar(s => ({ ...s, visible: false })), 3000);
        return () => clearTimeout(t);
    }, [snackbar.visible]);

    useEffect(() => {
        if (snackbar.visible) {
            const timer = setTimeout(() => {
                setSnackbar({ visible: false, message: '' });
                // Redirect after snackbar disappears
                router.push('/');
            }, 2000); // 👈 Change to 20000 if you want 20 seconds
            return () => clearTimeout(timer);
        }
    }, [snackbar.visible, router]);
    // ───────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!partnerId) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const userData = await apiClient.get(
                    `/users/${partnerId}?populate[partnerProfile][populate]=logo&populate[country]=true`
                );
                setPartner(userData);
            } catch (err) {
                setError("Failed to load partner details.");
            } finally {
                setLoading(false);
            }
        })();
    }, [partnerId]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)', padding: '2rem 16px' }}>
                <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[120, 180, 140, 160].map((h, i) => (
                        <div key={i} style={{
                            height: h, borderRadius: 16,
                            background: 'rgba(30,41,59,0.6)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            opacity: 1 - i * 0.15,
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !partner) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)', padding: '2rem 16px' }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    <p style={{ color: '#FCA5A5', fontSize: 14 }}>{error || "Partner not found."}</p>
                </div>
            </div>
        );
    }

    const profile = partner.partnerProfile || {};
    const status = STATUS_STYLES[profile.verificationStatus] || STATUS_STYLES.not_started;
    const fullName = [partner.firstName, partner.lastName].filter(Boolean).join(" ");

    // Build contact lists
    const phones = [profile.businessPhone, profile.whatsappNumber, partner.phoneNumber].filter(Boolean);
    const emails = [profile.businessEmail, profile.emailAddress,
    partner.email?.startsWith('unset_') ? null : partner.email
    ].filter(Boolean);
    // Deduplicate
    const uniquePhones = [...new Set(phones)];
    const uniqueEmails = [...new Set(emails)];

    return (
        <>
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .detail-section { animation: fadeSlideIn 0.3s ease both; }
                @keyframes snackbarIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
                paddingBottom: 80, position: 'relative',
            }}>
                {/* Ambient glow */}
                <div style={{
                    position: 'fixed', top: -80, left: -80, width: 360, height: 360,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0,
                }} />

                <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 1 }}>

                    {/* ── Back ── */}
                    <div style={{ paddingTop: '1.5rem', marginBottom: '1.25rem' }}>
                        <button onClick={() => router.back()} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px 7px 10px',
                            background: 'rgba(30,41,59,0.6)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 10, cursor: 'pointer', color: '#94A3B8',
                            fontSize: 13, fontWeight: 500, transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.color = GREEN; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94A3B8'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            All partners
                        </button>
                    </div>

                    {/* ── Hero ── */}
                    <div className="detail-section" style={{ animationDelay: '0ms' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.9) 100%)',
                            border: '1px solid rgba(16,185,129,0.15)', borderRadius: 20,
                            padding: '20px', marginBottom: 10,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                            backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                                background: `linear-gradient(90deg, transparent, ${GREEN}40, transparent)`,
                            }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                                <PartnerAvatar logo={profile.logo} businessName={profile.businessName} size={60} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                                        <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
                                            {profile.businessName || "Unnamed Business"}
                                        </h2>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            fontSize: 10, fontWeight: 700, padding: '3px 10px',
                                            borderRadius: 20, background: status.bg, color: status.color,
                                            border: `1px solid ${status.border}`,
                                            letterSpacing: '0.08em', textTransform: 'uppercase',
                                        }}>
                                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                                            {status.label}
                                        </span>
                                    </div>
                                    {fullName && (
                                        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                                            Owner: <span style={{ color: '#94A3B8' }}>{fullName}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <MetricTile label="Drivers" value={profile.totalDrivers ?? 0} highlight
                                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" /></svg>}
                                />
                                <MetricTile label="Country" value={partner.country?.name ?? "—"}
                                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>}
                                />
                                <MetricTile label="Approved"
                                    value={profile.approvedAt ? new Date(profile.approvedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' }) : "—"}
                                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" /></svg>}
                                />
                            </div>

                            {/* Switch partner CTA */}
                            <button onClick={() => setShowSwitchModal(true)} style={{
                                marginTop: 14, width: '100%', padding: '11px',
                                borderRadius: 12, border: `1px solid rgba(16,185,129,0.3)`,
                                background: 'rgba(16,185,129,0.08)',
                                color: GREEN, fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Switch to a Different Partner
                            </button>
                        </div>
                    </div>

                    {/* ── Contact ── */}
                    {(uniquePhones.length > 0 || uniqueEmails.length > 0) && (
                        <div className="detail-section" style={{ animationDelay: '60ms' }}>
                            <SectionCard title="Contact"
                                icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.54-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.07 16a2 2 0 0 1 .93.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            >
                                {uniquePhones.length > 0 && (
                                    <>
                                        <p style={{ margin: '0 0 4px', fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                            📞 Phone Numbers
                                        </p>
                                        {uniquePhones.map((ph, i) => (
                                            <ContactRow key={i} value={ph} type="phone" last={i === uniquePhones.length - 1 && uniqueEmails.length === 0} />
                                        ))}
                                    </>
                                )}
                                {uniqueEmails.length > 0 && (
                                    <>
                                        <p style={{ margin: `${uniquePhones.length > 0 ? '12px' : '0'} 0 4px`, fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                            ✉️ Email Addresses
                                        </p>
                                        {uniqueEmails.map((em, i) => (
                                            <ContactRow key={i} value={em} type="email" last={i === uniqueEmails.length - 1} />
                                        ))}
                                    </>
                                )}
                            </SectionCard>
                        </div>
                    )}

                    {/* ── Address ── */}
                    {partner.address && (
                        <div className="detail-section" style={{ animationDelay: '100ms' }}>
                            <SectionCard title="Location"
                                icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>}
                            >
                                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                                    {partner.address}
                                </p>
                            </SectionCard>
                        </div>
                    )}

                    {/* ── Notes ── */}
                    {profile.notes && (
                        <div className="detail-section" style={{ animationDelay: '130ms' }}>
                            <SectionCard title="About this Partner"
                                icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                accent
                            >
                                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.7 }}>
                                    {profile.notes}
                                </p>
                            </SectionCard>
                        </div>
                    )}

                    {/* ── Verification notes (admin-visible context) ── */}
                    {profile.verificationNotes && (
                        <div className="detail-section" style={{ animationDelay: '150ms' }}>
                            <SectionCard title="Verification Notes"
                                icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            >
                                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.7 }}>
                                    {profile.verificationNotes}
                                </p>
                            </SectionCard>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Switch Modal ── */}
            {showSwitchModal && (
                <SwitchPartnerModal
                    currentPartnerId={partnerId}
                    onClose={() => setShowSwitchModal(false)}
                    onSuccess={(newPartner) => {
                        setShowSwitchModal(false);
                        setSnackbar({ message: `You have been moved to ${newPartner.partnerProfile?.businessName}. Notifications sent.`, visible: true });
                    }}
                />
            )}

            {/* ── Snackbar ── */}
            {snackbar.visible && (
                <div style={{
                    position: 'fixed', top: 28, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.97) 0%, rgba(5,150,105,0.97) 100%)',
                    color: '#fff', padding: '12px 20px', borderRadius: 12,
                    fontSize: 13, fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1)',
                    zIndex: 2000, whiteSpace: 'nowrap',
                    backdropFilter: 'blur(12px)',
                    animation: 'snackbarIn 0.25s ease both',
                    display: 'flex', alignItems: 'center', gap: 8,
                    maxWidth: 'calc(100vw - 32px)',
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{snackbar.message}</span>
                </div>
            )}
        </>
    );
}