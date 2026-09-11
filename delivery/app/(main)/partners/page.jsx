'use client'

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { getImageUrl } from "@/Functions";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN = '#10B981';
const GREEN_DIM = '#059669';
const GREEN_PALE = '#A7F3D0';

const STATUS_CONFIG = {
    approved: {
        bg: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.10) 100%)',
        border: 'rgba(16,185,129,0.35)',
        text: '#10B981',
        dot: '#10B981',
        label: "Approved",
    },
    pending: {
        bg: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.10) 100%)',
        border: 'rgba(245,158,11,0.35)',
        text: '#F59E0B',
        dot: '#F59E0B',
        label: "Pending",
    },
    rejected: {
        bg: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(185,28,28,0.10) 100%)',
        border: 'rgba(239,68,68,0.35)',
        text: '#EF4444',
        dot: '#EF4444',
        label: "Rejected",
    },
    suspended: {
        bg: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.10) 100%)',
        border: 'rgba(245,158,11,0.35)',
        text: '#F59E0B',
        dot: '#F59E0B',
        label: "Suspended",
    },
    not_started: {
        bg: 'linear-gradient(135deg, rgba(100,116,139,0.18) 0%, rgba(71,85,105,0.10) 100%)',
        border: 'rgba(100,116,139,0.25)',
        text: '#94A3B8',
        dot: '#64748B',
        label: "Not started",
    },
};

// ─── PartnerAvatar ─────────────────────────────────────────────────────────────
function PartnerAvatar({ logo, businessName, size = 48 }) {
    const [imgError, setImgError] = useState(false);
    const initials = businessName
        ? businessName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
        : "?";

    const avatarStyle = {
        width: size,
        height: size,
        borderRadius: 12,
        flexShrink: 0,
        overflow: 'hidden',
    };


    if (logo && !imgError) {
        return (
            <div style={avatarStyle}>
                <img
                    src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(logo, 'thumbnail')}
                    alt={businessName}
                    onError={() => setImgError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    return (
        <div style={{
            ...avatarStyle,
            background: `linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 100%)`,
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.34,
            color: GREEN,
            letterSpacing: '0.03em',
        }}>
            {initials}
        </div>
    );
}

// ─── PartnerCard ───────────────────────────────────────────────────────────────
function PartnerCard({ partner, index }) {
    const [hovered, setHovered] = useState(false);
    const profile = partner.partnerProfile || {};
    const status = STATUS_CONFIG[profile.verificationStatus] || STATUS_CONFIG.not_started;
    const fullName = [partner.firstName, partner.lastName].filter(Boolean).join(" ");
    const driverCount = profile.totalDrivers ?? 0;

    return (
        <Link
            href={`/partners/${partner.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)',
                border: hovered
                    ? `1px solid rgba(16,185,129,0.4)`
                    : `1px solid rgba(255,255,255,0.07)`,
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: hovered
                    ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)`
                    : `0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`,
                backdropFilter: 'blur(12px)',
                transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
                animationDelay: `${index * 50}ms`,
                textDecoration: 'none',
            }}
        >
            <PartnerAvatar logo={profile.logo} businessName={profile.businessName} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#F1F5F9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                }}>
                    {profile.businessName || "Unnamed Business"}
                </p>
                <p style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {fullName || partner.email}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 20,
                    background: status.bg,
                    color: status.text,
                    border: `1px solid ${status.border}`,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: status.dot, flexShrink: 0,
                    }} />
                    {status.label}
                </span>
                <span style={{
                    fontSize: 11,
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="7" r="4" stroke="#475569" strokeWidth="2" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {driverCount} driver{driverCount !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Chevron */}
            <div style={{
                color: hovered ? GREEN : '#334155',
                transition: 'all 0.2s ease',
                transform: hovered ? 'translateX(2px)' : 'translateX(0)',
                flexShrink: 0,
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </Link>
    );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard({ opacity }) {
    return (
        <div style={{
            height: 76,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.7) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            opacity,
            overflow: 'hidden',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                animation: 'shimmer 1.8s infinite',
            }} />
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PartnersListPage() {
    const router = useRouter();
    const [partners, setPartners] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

    const fetchPartners = useCallback(async (searchVal, pageNum) => {
        setLoading(true);
        setError(null);
        try {
            const searchFilter = searchVal
                ? `&filters[partnerProfile][verificationStatus][$eq]=approved&filters[partnerProfile][businessName][$containsi]=${encodeURIComponent(searchVal)}`
                : `&filters[partnerProfile][verificationStatus][$eq]=approved`;

            const res = await apiClient.get(
                `/users?populate[partnerProfile][populate]=logo${searchFilter}&pagination[page]=${pageNum}&pagination[pageSize]=${PAGE_SIZE}`
            );
            const items = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
            const meta = res?.meta?.pagination;
            const filtered = items.filter((u) => u.partnerProfile?.verificationStatus === "approved");
            setPartners(filtered);
            setPageCount(meta?.pageCount ?? 1);
            setTotalCount(meta?.total ?? filtered.length);
        } catch (err) {
            setError("Failed to load partners. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchPartners(search, 1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchPartners]);

    useEffect(() => {
        fetchPartners(search, page);
    }, [page]);

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .partner-card-anim {
                    animation: fadeSlideIn 0.35s ease both;
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
                padding: '0 0 80px',
            }}>
                {/* Ambient glow */}
                <div style={{
                    position: 'fixed',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
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
                            Back
                        </button>
                    </div>

                    {/* ── Header ── */}
                    <div style={{ paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.12) 100%)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="9 22 9 12 15 12 15 22" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: '#F1F5F9',
                                    letterSpacing: '-0.02em',
                                }}>
                                    Fleet Partners
                                </h1>
                                <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                                    {loading ? 'Loading…' : `${totalCount} approved partner${totalCount !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Search ── */}
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <div style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: '#475569',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search partners by business name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '11px 40px 11px 42px',
                                background: 'rgba(30,41,59,0.7)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 12,
                                color: '#F1F5F9',
                                fontSize: 14,
                                outline: 'none',
                                backdropFilter: 'blur(8px)',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(16,185,129,0.5)';
                                e.target.style.boxShadow = `0 0 0 3px rgba(16,185,129,0.08)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(100,116,139,0.2)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 5,
                                    borderRadius: 6,
                                    color: '#94A3B8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    lineHeight: 1,
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* ── Content ── */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 0.8, 0.6, 0.4, 0.25].map((op, i) => (
                                <SkeletonCard key={i} opacity={op} />
                            ))}
                        </div>
                    ) : error ? (
                        <div style={{
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(185,28,28,0.08) 100%)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 14,
                            color: '#FCA5A5',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {error}
                        </div>
                    ) : partners.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 1rem',
                            color: '#475569',
                        }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 18,
                                background: 'rgba(30,41,59,0.6)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="9 22 9 12 15 12 15 22" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#64748B' }}>
                                {search ? `No partners matching "${search}"` : "No approved partners"}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>
                                {search ? 'Try a different search term' : 'Partners will appear here once approved'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {search && (
                                <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px', letterSpacing: '0.02em' }}>
                                    {partners.length} result{partners.length !== 1 ? 's' : ''} for "{search}"
                                </p>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {partners.map((partner, i) => (
                                    <div key={partner.id} className="partner-card-anim" style={{ animationDelay: `${i * 40}ms` }}>
                                        <PartnerCard
                                            partner={partner}
                                            index={i}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* ── Pagination ── */}
                            {pageCount > 1 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    marginTop: '2rem',
                                }}>
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: page === 1 ? 'transparent' : 'rgba(30,41,59,0.7)',
                                            color: page === 1 ? '#334155' : '#94A3B8',
                                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                                        const p = i + 1;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    border: p === page ? `1px solid ${GREEN}` : '1px solid rgba(255,255,255,0.08)',
                                                    background: p === page
                                                        ? `linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 100%)`
                                                        : 'rgba(30,41,59,0.5)',
                                                    color: p === page ? GREEN : '#64748B',
                                                    fontSize: 13,
                                                    fontWeight: p === page ? 700 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: p === page ? `0 0 12px rgba(16,185,129,0.2)` : 'none',
                                                }}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                                        disabled={page === pageCount}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: page === pageCount ? 'transparent' : 'rgba(30,41,59,0.7)',
                                            color: page === pageCount ? '#334155' : '#94A3B8',
                                            cursor: page === pageCount ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}