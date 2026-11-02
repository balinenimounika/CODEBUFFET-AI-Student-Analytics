import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import DomainConstellation from '../../components/landing/DomainConstellation';
import { useAuth } from '../../context/AuthContext';

/**
 * CODEBUFFET — Simplified Landing Page
 * Compact, fast, and focused with clear path to login and 1-click demo personas.
 * Removes redundant promotional sections, repeated explanations, and duplicate CTAs.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { loginWithDemo } = useAuth();

  const handleLaunchRole = async (roleKey) => {
    try {
      await loginWithDemo(roleKey);
    } catch {
      // Ignore network errors in demo mode
    }
    if (roleKey === 'student') {
      navigate('/student/dashboard');
    } else if (roleKey === 'mentor') {
      navigate('/mentor/dashboard');
    } else if (roleKey === 'tpo') {
      navigate('/placement/dashboard');
    } else {
      navigate('/institution/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-navy-deep)' }}>
      {/* Top Navigation Bar */}
      <PublicNavbar />

      {/* =========================================================================
          HERO SECTION — Compact CODEBUFFET Campus Intelligence
          ========================================================================= */}
      <section
        id="platform"
        style={{
          position: 'relative',
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(to right, rgba(6, 26, 51, 0.95) 30%, rgba(6, 26, 51, 0.75) 65%, rgba(6, 26, 51, 0.90) 100%), url('/images/landing-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '3.5rem 1.5rem',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(228, 233, 240, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '3rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
          className="hero-grid"
        >
          {/* Left Column: Brand Copy & Direct Login Action */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '1rem',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
              <span>STUDENT SUCCESS INTELLIGENCE</span>
              <span style={{ color: 'var(--color-blue-bright)' }}>·</span>
              <span>BUILT FOR CAMPUS IMPACT</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              Every Student <br />
              Has <span style={{ color: 'var(--color-blue-bright)' }}>Potential.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                lineHeight: 1.65,
                color: 'rgba(255, 255, 255, 0.82)',
                maxWidth: '520px',
                marginBottom: '2rem',
                fontWeight: 400,
              }}
            >
              Unify academic performance, attendance, learning activity, engagement, skills, feedback, and placement readiness into clear insights that help every student move forward.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <Link
                to="/demo-credentials"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--color-blue-primary)',
                  color: '#FFFFFF',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(22, 119, 210, 0.45)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>Explore Demo Portals</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#portals"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  padding: '0.85rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>Demo Portals</span>
                <ArrowRight size={15} style={{ color: 'var(--color-blue-bright)' }} />
              </a>
            </div>
          </div>

          {/* Right Column: 7-Domain Constellation Visual */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '400px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: '1rem',
                backgroundColor: 'rgba(6, 26, 51, 0.85)',
                border: '1px solid rgba(228, 233, 240, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 12px',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.75)',
                textTransform: 'uppercase',
                backdropFilter: 'blur(6px)',
                zIndex: 5,
              }}
            >
              STUDENT SUCCESS INTELLIGENCE NETWORK
            </div>

            <DomainConstellation />

            <div
              style={{
                marginTop: '0.75rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Hover over intelligence nodes to explore AI-driven predictive insights
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 980px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 2.5rem !important;
            }
          }
        `}</style>
      </section>

      {/* =========================================================================
          DEMO PERSONAS GATEWAY — Direct Role Entry Point & Testing
          ========================================================================= */}
      <section
        id="portals"
        style={{
          padding: '4rem 1.5rem 5rem',
          backgroundColor: 'var(--color-navy)',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(228, 233, 240, 0.08)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-blue-bright)',
                fontWeight: 700,
              }}
            >
              STAKEHOLDER WORKFLOWS
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
                fontWeight: 700,
                marginTop: '0.5rem',
                marginBottom: '0.75rem',
                color: '#FFFFFF',
              }}
            >
              Experience CODEBUFFET Portals
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.98rem', lineHeight: 1.6 }}>
              Select a stakeholder role below to explore live dashboards, or sign in with custom credentials.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                key: 'admin',
                roleTitle: 'Institution Administrator',
                name: 'Dr. Sunita Rao / Dr. R. Kumar',
                tag: 'Provost / Dean',
                features: 'Campus KPI cockpit, student intelligence directory, 3D spatial analytics & accreditation reports.',
                btnText: 'Launch Admin View →',
                icon: Building2,
              },
              {
                key: 'mentor',
                roleTitle: 'Faculty Mentor',
                name: 'Prof. Rajesh Kumar',
                tag: 'Computer Science & Engg.',
                features: 'Mentee directory, early academic warning alerts, 1-on-1 intervention logging & attendance tracking.',
                btnText: 'Launch Mentor View →',
                icon: Users,
              },
              {
                key: 'tpo',
                roleTitle: 'Placement Officer (TPO)',
                name: 'Vikram Malhotra',
                tag: 'Corporate Relations',
                features: '2x2 Segmentation matrix, coding benchmarks, company eligibility filters & CSV exports.',
                btnText: 'Launch TPO View →',
                icon: Briefcase,
              },
              {
                key: 'student',
                roleTitle: 'Student Experience',
                name: 'Aarav Sharma',
                tag: '3rd Year B.Tech CSE',
                features: 'Personal Success Score, progress tracking, AI-curated skill roadmaps & feedback submission.',
                btnText: 'Launch Student Portal →',
                icon: GraduationCap,
              },
            ].map((persona) => {
              const RoleIcon = persona.icon;
              return (
                <div
                  key={persona.key}
                  style={{
                    backgroundColor: 'rgba(8, 43, 86, 0.55)',
                    border: '1px solid rgba(228, 233, 240, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.75rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-blue-bright)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 139, 250, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(228, 233, 240, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-blue-bright)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {persona.tag}
                    </span>
                    <RoleIcon size={18} style={{ color: 'var(--color-blue-bright)' }} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      {persona.roleTitle}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      Persona: {persona.name}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55 }}>
                    {persona.features}
                  </p>

                  <button
                    onClick={() => handleLaunchRole(persona.key)}
                    style={{
                      marginTop: 'auto',
                      backgroundColor: 'rgba(37, 139, 250, 0.15)',
                      border: '1px solid var(--color-blue-bright)',
                      color: '#FFFFFF',
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-blue-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37, 139, 250, 0.15)')}
                  >
                    {persona.btnText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Direct Login Callout */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link
              to="/demo-credentials"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <span>Evaluating CODEBUFFET?</span>
              <span style={{ color: 'var(--color-blue-bright)', fontWeight: 700, textDecoration: 'underline' }}>
                Explore Demo Portals →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
