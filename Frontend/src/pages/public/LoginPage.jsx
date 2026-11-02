import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

const DEMO_ROLES = [
  {
    key: 'admin',
    portalRole: 'admin',
    label: 'Institution Officer',
    badge: 'DEMO ACCESS',
    name: 'Dr. R. Kumar',
    staffId: 'EMP-ADMIN-01',
    email: 'admin@codebuffet.edu',
    password: 'CodeBuffet@2026!',
    icon: Building2,
    color: '#2563EB',
    path: '/institution/dashboard',
    desc: 'Campus executive analytics, 50k cohort distribution, cross-department risk metrics & institutional governance.',
  },
  {
    key: 'mentor',
    portalRole: 'admin',
    label: 'Faculty Mentor',
    badge: 'DEMO ACCESS',
    name: 'Prof. Rajesh Kumar',
    staffId: 'FAC-CSE-104',
    email: 'rajesh.kumar@codebuffet.edu',
    password: 'Mentor@2026!',
    icon: Award,
    color: '#8B5CF6',
    path: '/mentor/dashboard',
    desc: 'Assigned mentee caseload monitoring, active backlog interventions & AI academic mentoring copilot.',
  },
  {
    key: 'tpo',
    portalRole: 'admin',
    label: 'Placement Officer',
    badge: 'DEMO ACCESS',
    name: 'Vikram Malhotra',
    staffId: 'TPO-OFFICER-02',
    email: 'vikram.tpo@codebuffet.edu',
    password: 'TPO@2026!',
    icon: Briefcase,
    color: '#D97706',
    path: '/placement/dashboard',
    desc: 'Placement pipeline, eligibility matching & company recruitment funnel.',
  },
  {
    key: 'student',
    portalRole: 'student',
    label: 'Student',
    badge: 'DEMO ACCESS',
    name: 'Aarav Sharma',
    staffId: 'STU-2024-042',
    email: 'stu-2024-042@codebuffet.edu',
    password: 'Student@2026!',
    icon: GraduationCap,
    color: '#10B981',
    path: '/student/dashboard',
    desc: 'Personal success cockpit, academic risk factors, What-If simulation & AI assistant.',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithDemo, authLoading } = useAuth();

  const [selectedDemoKey, setSelectedDemoKey] = useState('admin');
  const [error, setError] = useState('');
  const [launchingRole, setLaunchingRole] = useState(null);

  // Execute Demo Login using existing backend authentication endpoint
  const handleLaunchDemo = async (roleKey) => {
    const targetKey = roleKey || selectedDemoKey;
    setError('');
    setLaunchingRole(targetKey);

    try {
      const res = await loginWithDemo(targetKey);
      if (res?.user) {
        if (res.user.role === 'student') {
          navigate('/student/dashboard');
        } else if (res.user.role === 'mentor') {
          navigate('/mentor/dashboard');
        } else if (res.user.role === 'tpo') {
          navigate('/placement/dashboard');
        } else {
          navigate('/institution/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Demo authentication failed. Please verify that the backend is running.');
    } finally {
      setLaunchingRole(null);
    }
  };

  const selectedDemoMeta = DEMO_ROLES.find((d) => d.key === selectedDemoKey) || DEMO_ROLES[0];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      className="login-container"
    >
      {/* =========================================================================
          LEFT SIDE: DEMO ACCESS PORTAL & ROLE SELECTOR
          ========================================================================= */}
      <div
        style={{
          flex: '1 1 52%',
          maxWidth: '680px',
          padding: '2.25rem 3.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          zIndex: 5,
        }}
        className="login-form-wrapper"
      >
        {/* Top Header: Nav controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <Link
            to="/demo-credentials"
            style={{
              color: 'var(--color-navy, #0F172A)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#F1F5F9',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
          >
            <ArrowLeft size={14} />
            <span>Demo Credentials</span>
          </Link>

          <Link
            to="/platform"
            style={{
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.84rem',
            }}
          >
            Platform Overview →
          </Link>
        </div>

        {/* Center Main Content */}
        <div style={{ maxWidth: '520px', width: '100%', margin: '0 auto' }}>
          {/* Centered Brand Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', textAlign: 'center' }}>
            <BrandLogo variant="light" size="large" />
            <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Student Success Intelligence Platform
            </div>
          </div>

          {/* Eyebrow Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} />
              <span>DEMO EVALUATION PORTAL</span>
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '1.85rem',
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.2,
              marginBottom: '0.35rem',
            }}
          >
            Welcome to CODEBUFFET<span style={{ color: '#2563EB' }}>.</span>
          </h1>

          <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Select an evaluation persona below to instantly launch into that role’s dashboard with verified institutional telemetry.
          </p>

          {/* Error Message Banner */}
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '0.75rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* 4 Demo Role Selection Cards */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Choose a Demo Role:
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '14px',
              }}
              className="role-grid"
            >
              {DEMO_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedDemoKey === r.key;
                const isLaunching = launchingRole === r.key;

                return (
                  <div
                    key={r.key}
                    onClick={() => {
                      setSelectedDemoKey(r.key);
                      setError('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? r.color : '#E2E8F0'}`,
                      backgroundColor: isSelected ? `${r.color}0A` : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? `0 4px 12px ${r.color}25` : 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: `${r.color}15`,
                            color: r.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? r.color : '#E2E8F0',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {r.badge}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchDemo(r.key);
                      }}
                      disabled={authLoading}
                      style={{
                        marginTop: '10px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? r.color : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#1E293B',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: authLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isLaunching ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Launching...</span>
                        </>
                      ) : (
                        <>
                          <span>1-Click Launch</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Credentials Card for the Selected Persona */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: `1px solid ${selectedDemoMeta.color}35`,
              backgroundColor: `${selectedDemoMeta.color}08`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: selectedDemoMeta.color }} />
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#0F172A' }}>
                  Configured Demo Account: {selectedDemoMeta.label}
                </span>
              </div>
              <span style={{ fontSize: '0.70rem', color: '#64748B', fontWeight: 600 }}>
                {selectedDemoMeta.staffId}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, margin: '0 0 10px 0' }}>
              {selectedDemoMeta.desc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Identifier</div>
                <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedDemoMeta.email}
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Password</div>
                <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700 }}>
                  {selectedDemoMeta.password}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchDemo(selectedDemoKey)}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedDemoMeta.color,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                opacity: authLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 4px 14px ${selectedDemoMeta.color}40`,
                transition: 'all 0.15s ease',
              }}
            >
              {launchingRole ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating {selectedDemoMeta.label}...
                </>
              ) : (
                <>
                  Launch Demo Dashboard as {selectedDemoMeta.label} <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: '#94A3B8',
          }}
        >
          <div>© 2026 CODEBUFFET</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/demo-credentials" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
              View Demo Credentials
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: CAMPUS PHOTOGRAPH BACKGROUND & SPLIT-SCREEN VISUAL
          ========================================================================= */}
      <div
        style={{
          flex: '1 1 48%',
          position: 'relative',
          backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.20) 60%, rgba(15, 23, 42, 0.35) 100%), url('/assets/images/campus_day_login.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '3rem',
          minHeight: '100vh',
        }}
        className="login-visual-panel"
      >
        {/* Organic Curved Wave Divider */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '80px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          className="login-wave-divider"
        >
          <path
            d="M 0,0 
               C 40,250 80,350 40,500 
               C 0,650 60,850 0,1000 
               L 0,1000 L 0,0 Z"
            fill="#FFFFFF"
          />
        </svg>

        {/* Floating Glass Metric Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            maxWidth: '380px',
            marginLeft: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E6BFF',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0F172A' }}>
                Student Success Intelligence
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>50,008 student records analyzed</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Academic Risk Detection</span>
                <strong style={{ color: '#0F172A' }}>99.2%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '99.2%', height: '100%', backgroundColor: '#2563EB', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Placement Readiness</span>
                <strong style={{ color: '#0F172A' }}>78.6%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '78.6%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>AI Intervention Accuracy</span>
                <strong style={{ color: '#0F172A' }}>94.1%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '94.1%', height: '100%', backgroundColor: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles for Split-Screen Layout */}
      <style>{`
        .login-container {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
        }
        .login-form-wrapper {
          flex: 1 1 52%;
          max-width: 680px;
          padding: 2.25rem 3.25rem;
          overflow-y: auto;
        }
        .login-visual-panel {
          flex: 1 1 48%;
          position: relative;
          min-height: 100vh;
        }
        .login-wave-divider {
          display: block;
        }
        @media (max-width: 1024px) {
          .login-container {
            flex-direction: column;
          }
          .login-form-wrapper {
            max-width: 100%;
            padding: 2rem 1.5rem;
            flex: 1 1 auto;
          }
          .login-visual-panel {
            flex: 1 1 auto;
            min-height: 320px;
            padding: 2rem 1.5rem;
          }
          .login-wave-divider {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .login-form-wrapper {
            padding: 1.5rem 1rem;
          }
          .role-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
