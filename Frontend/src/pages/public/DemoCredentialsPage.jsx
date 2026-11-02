import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Award,
  Briefcase,
  GraduationCap,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';

const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    roleName: 'Institution Officer',
    badge: 'Executive Oversight',
    personaName: 'Dr. R. Kumar',
    staffId: 'EMP-ADMIN-01',
    email: 'admin@codebuffet.edu',
    password: 'CodeBuffet@2026!',
    icon: Building2,
    accentColor: '#2563EB',
    bgColor: '#EFF6FF',
    targetDashboard: '/institution/dashboard',
    desc: 'Campus executive analytics, 50,008 student records, department risk metrics & institutional governance.',
  },
  {
    key: 'mentor',
    roleName: 'Faculty Mentor',
    badge: 'Academic Mentoring',
    personaName: 'Prof. Rajesh Kumar',
    staffId: 'FAC-CSE-104',
    email: 'rajesh.kumar@codebuffet.edu',
    password: 'Mentor@2026!',
    icon: Award,
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    targetDashboard: '/mentor/dashboard',
    desc: 'Assigned mentee caseload monitoring, active backlog intervention logs & AI academic mentoring copilot.',
  },
  {
    key: 'tpo',
    roleName: 'Placement Officer',
    badge: 'Career & Placements',
    personaName: 'Vikram Malhotra',
    staffId: 'TPO-OFFICER-02',
    email: 'vikram.tpo@codebuffet.edu',
    password: 'TPO@2026!',
    icon: Briefcase,
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
    targetDashboard: '/placement/dashboard',
    desc: 'Placement pipeline, candidate-to-job eligibility matching, recruitment stages & corporate outreach.',
  },
  {
    key: 'student',
    roleName: 'Student',
    badge: 'Personal Cockpit',
    personaName: 'Aarav Sharma',
    staffId: 'STU-2024-042',
    email: 'stu-2024-042@codebuffet.edu',
    password: 'Student@2026!',
    icon: GraduationCap,
    accentColor: '#10B981',
    bgColor: '#ECFDF5',
    targetDashboard: '/student/dashboard',
    desc: 'Personal student cockpit, academic risk factors, What-If simulator & AI career assistant.',
  },
];

export default function DemoCredentialsPage() {
  const navigate = useNavigate();
  // State to toggle show/hide for passwords on each card
  const [showPasswordMap, setShowPasswordMap] = useState({});
  // State to track copied feedback: key could be `${roleKey}-all`, `${roleKey}-email`, `${roleKey}-password`
  const [copiedKey, setCopiedKey] = useState('');

  const togglePasswordVisibility = (roleKey) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey('');
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleContinueToPortals = () => {
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* =========================================================================
          TOP NAVBAR
          ========================================================================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#061A33',
          borderBottom: '1px solid rgba(228, 233, 240, 0.12)',
          padding: '0.85rem 1.75rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              to="/platform"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <ArrowLeft size={15} />
              <span>Back to Platform</span>
            </Link>
            <BrandLogo variant="dark" size="default" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleContinueToPortals}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1D4ED8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explore Demo Portals</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO BANNER
          ========================================================================= */}
      <section
        style={{
          background: 'linear-gradient(180deg, #061A33 0%, #0F2A4A 60%, #16365C 100%)',
          color: '#FFFFFF',
          padding: '3rem 1.5rem 3.5rem',
          borderBottom: '1px solid rgba(228, 233, 240, 0.1)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#93C5FD',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            <KeyRound size={14} />
            <span>Configured Demo Credentials</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 1rem 0',
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
            }}
          >
            Institutional Evaluation Accounts
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '720px',
              margin: '0 auto 1.75rem',
              lineHeight: 1.6,
            }}
          >
            Use the four pre-configured credentials below to test CODEBUFFET across each institutional stakeholder workflow.
            You can copy the credentials or proceed to the Demo Portals page for 1-click access.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleContinueToPortals}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.80rem 1.75rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1D4ED8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explore Demo Portals</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOUR ROLE CARDS GRID
          ========================================================================= */}
      <main style={{ maxWidth: '1240px', margin: '-1.5rem auto 3rem', padding: '0 1.5rem', width: '100%', flex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
          className="credentials-grid"
        >
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isPasswordVisible = !!showPasswordMap[account.key];
            const isCopiedAll = copiedKey === `${account.key}-all`;
            const isCopiedEmail = copiedKey === `${account.key}-email`;
            const isCopiedPassword = copiedKey === `${account.key}-password`;

            return (
              <div
                key={account.key}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                  padding: '1.75rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 30px rgba(15, 23, 42, 0.12)`;
                  e.currentTarget.style.borderColor = account.accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.06)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                {/* Accent top stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: account.accentColor,
                  }}
                />

                {/* Card Top: Icon & Badge */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: account.bgColor,
                        color: account.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: account.bgColor,
                        color: account.accentColor,
                        border: `1px solid ${account.accentColor}30`,
                      }}
                    >
                      {account.badge}
                    </span>
                  </div>

                  {/* Role & Persona Name */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      margin: '0 0 2px 0',
                    }}
                  >
                    {account.roleName}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#64748B',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{account.personaName}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>{account.staffId}</span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      margin: '0 0 1.25rem 0',
                    }}
                  >
                    {account.desc}
                  </p>

                  {/* Credentials Box */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '12px 14px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Identifier / Email */}
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748B',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Demo Email / Identifier</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(account.email, `${account.key}-email`)}
                          title="Copy Email"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            color: isCopiedEmail ? '#059669' : '#64748B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                          }}
                        >
                          {isCopiedEmail ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopiedEmail ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          backgroundColor: '#FFFFFF',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                        }}
                      >
                        {account.email}
                      </div>
                    </div>

                    {/* Configured Password */}
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748B',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Configured Password</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(account.key)}
                            title={isPasswordVisible ? 'Hide password' : 'Show password'}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px 4px',
                              cursor: 'pointer',
                              color: '#64748B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                            }}
                          >
                            {isPasswordVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span>{isPasswordVisible ? 'Hide' : 'Show'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(account.password, `${account.key}-password`)}
                            title="Copy Password"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px 4px',
                              cursor: 'pointer',
                              color: isCopiedPassword ? '#059669' : '#64748B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                            }}
                          >
                            {isCopiedPassword ? <Check size={12} /> : <Copy size={12} />}
                            <span>{isCopiedPassword ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          backgroundColor: '#FFFFFF',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{isPasswordVisible ? account.password : '••••••••••••'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Copy Credentials Button */}
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `Role: ${account.roleName}\nEmail: ${account.email}\nPassword: ${account.password}`,
                        `${account.key}-all`
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: isCopiedAll ? '#ECFDF5' : '#FFFFFF',
                      color: isCopiedAll ? '#059669' : '#334155',
                      fontSize: '0.80rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCopiedAll) {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.borderColor = '#94A3B8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopiedAll) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }
                    }}
                  >
                    {isCopiedAll ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedAll ? 'Credentials Copied!' : 'Copy Credentials'}</span>
                  </button>

                  {/* Continue to Demo Portals Button */}
                  <button
                    type="button"
                    onClick={handleContinueToPortals}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: account.accentColor,
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: `0 4px 12px ${account.accentColor}35`,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.92';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>Continue to Demo Portals</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            PROMINENT BOTTOM CALLOUT CARD
            ========================================================================= */}
        <div
          style={{
            backgroundColor: '#061A33',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '2.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            border: '1px solid rgba(228, 233, 240, 0.12)',
            boxShadow: '0 12px 36px rgba(6, 26, 51, 0.25)',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#60A5FA',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} />
              <span>Next Step in Evaluation Flow</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
              Ready to Explore the Live Dashboards?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.55 }}>
              Proceed to the Demo Portals selector to select your preferred role and launch directly with 1-click verified authentication.
            </p>
          </div>

          <button
            onClick={handleContinueToPortals}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.90rem 2rem',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1D4ED8';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Explore Demo Portals</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.80rem',
          color: '#64748B',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>© 2026 CODEBUFFET • Student Success Intelligence Platform</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/platform" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Platform Overview</Link>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Demo Portals</Link>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 860px) {
          .credentials-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
