'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Quiz config ─────────────────────────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: 'curl',
    question: 'What best describes your hair texture?',
    subtitle: 'Choose the closest match to your natural, unprocessed hair.',
    multi: false,
    options: [
      { value: '1', label: 'Straight', desc: 'No curl or wave pattern' },
      { value: '2', label: 'Wavy', desc: 'Loose S-shaped bends' },
      { value: '3', label: 'Curly', desc: 'Defined loops and spirals' },
      { value: '4', label: 'Coily', desc: 'Tight Z or S-shaped coils' },
    ],
  },
  {
    id: 'subtype',
    question: 'How would you refine that?',
    subtitle: 'This helps us dial in your exact texture.',
    multi: false,
    options: [],
  },
  {
    id: 'porosity',
    question: 'How does your hair handle water?',
    subtitle: 'This determines which products will actually absorb.',
    multi: false,
    options: [
      {
        value: 'low',
        label: 'Takes ages to get wet',
        desc: 'Water beads and rolls off. Products sit on top.',
      },
      {
        value: 'medium',
        label: 'Gets wet normally',
        desc: 'Absorbs moisture well and holds it.',
      },
      {
        value: 'high',
        label: 'Soaks up instantly, dries fast',
        desc: 'Absorbs fast but loses moisture just as quickly.',
      },
      {
        value: 'unsure',
        label: 'Not sure yet',
        desc: "We'll help you figure this out.",
      },
    ],
  },
  {
    id: 'goals',
    question: 'What do you want to achieve?',
    subtitle: "Pick all that apply. We'll tailor everything to these.",
    multi: true,
    options: [
      { value: 'moisture', label: 'More moisture' },
      { value: 'growth', label: 'Length retention' },
      { value: 'definition', label: 'Curl definition' },
      { value: 'frizz', label: 'Less frizz' },
      { value: 'damage', label: 'Repair damage' },
      { value: 'volume', label: 'More volume' },
    ],
  },
];

const SUBTYPES: Record<string, { value: string; label: string; desc: string }[]> = {
  '1': [
    {
      value: '1A',
      label: 'Fine & flat',
      desc: 'Very straight, thin strands, little volume',
    },
    {
      value: '1B',
      label: 'Medium body',
      desc: 'Straight with some natural movement',
    },
    {
      value: '1C',
      label: 'Coarse & thick',
      desc: 'Straight but thick, can feel wiry',
    },
  ],
  '2': [
    {
      value: '2A',
      label: 'Gentle waves',
      desc: 'Slight S-bend, mostly at the ends',
    },
    {
      value: '2B',
      label: 'Defined waves',
      desc: 'Clear S-pattern from mid-length down',
    },
    {
      value: '2C',
      label: 'Deep waves',
      desc: 'Strong waves that border on curls',
    },
  ],
  '3': [
    {
      value: '3A',
      label: 'Loose curls',
      desc: 'Wide, bouncy spirals',
    },
    {
      value: '3B',
      label: 'Springy curls',
      desc: 'Tighter spirals, lots of volume',
    },
    {
      value: '3C',
      label: 'Tight curls',
      desc: 'Pencil-sized coils packed close together',
    },
  ],
  '4': [
    {
      value: '4A',
      label: 'Soft coils',
      desc: 'Visible coil pattern, springy S-shape',
    },
    {
      value: '4B',
      label: 'Z-pattern coils',
      desc: 'Sharp angles, less defined pattern',
    },
    {
      value: '4C',
      label: 'Tight coils',
      desc: 'Very dense, may look patternless when dry',
    },
  ],
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const todayIdx = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

type Screen = 'signup' | 'splash' | 'welcome' | 'onboard' | 'quiz' | 'reveal' | 'home';

type PopupState =
  | {
      title: string;
      message: string;
      type?: 'success' | 'info' | 'error';
    }
  | null;

type User = { name: string; email: string } | null;

function PopupModal({ popup, onClose }: { popup: PopupState; onClose: () => void }) {
  if (!popup) return null;
  const type = popup.type || 'info';

  return (
    <div className="popup-backdrop">
      <div className={`popup-card popup-${type}`}>
        <div className="popup-icon">✨</div>
        <h2 className="popup-title">{popup.title}</h2>
        <p className="popup-message">{popup.message}</p>
        <button className="popup-button" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<Screen>('signup');
  const SCREENS: Screen[] = ['signup', 'splash', 'welcome', 'onboard', 'quiz', 'reveal', 'home'];
  const [obStep, setObStep] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [routineChecks, setRoutineChecks] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [selectedDay, setSelectedDay] = useState(todayIdx());
  const [popup, setPopup] = useState<PopupState>(null);
  const [user, setUser] = useState<User>(null);

  const shellRef = useRef<HTMLDivElement>(null);

  const mainType = (answers.curl as string) || '';
  const hairType = (answers.subtype as string) || (mainType ? mainType + 'A' : '');
  const quizSteps = QUIZ_STEPS.map((s) =>
    s.id === 'subtype' && mainType ? { ...s, options: SUBTYPES[mainType] || [] } : s,
  );
  const step = quizSteps[quizIdx];

  const routine = profile?.routine || { steps: [], avoid: '' };
  const dayKey = DAYS[selectedDay];
  const dayChecks = routineChecks[dayKey] || {};
  const checkedCount = routine.steps.filter((s: any) => dayChecks[s.id]).length;
  const totalSteps = routine.steps.length;
  const pct = totalSteps > 0 ? Math.round((checkedCount / totalSteps) * 100) : 0;

  const go = useCallback((s: Screen) => {
    setScreen(s);
    shellRef.current?.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (screen === 'splash') {
      fetch('/api/health')
        .then((r) => r.json())
        .then((h) => setServerOk(h.status === 'ok' || h.status === 'partial'))
        .catch(() => setServerOk(false));
      const t = setTimeout(() => go('welcome'), 2200);
      return () => clearTimeout(t);
    }
  }, [screen, go]);

  useEffect(() => {
    if (screen === 'welcome' && serverOk === false) {
      setPopup({
        title: 'Offline mode',
        message:
          'We could not reach the server. We’ll generate a local routine so you can still use the app.',
        type: 'info',
      });
    }
  }, [screen, serverOk]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const p = (answers.porosity as string) || 'unsure';
      const g = (answers.goals as string[]) || [];
      const res = await fetch(
        `/api/hair?type=${hairType}&porosity=${p}&goals=${g.join(',')}`,
      );
      const data = await res.json();
      setProfile(data);
    } catch {
      setProfile({
        hairType,
        porosity: answers.porosity || 'unsure',
        goals: answers.goals || [],
        description: 'Your profile is ready.',
        routine: { steps: [], avoid: '' },
        styles: [],
        porosityTip: { title: 'Offline', tip: 'Could not reach the server.' },
      });
    }
    setLoading(false);
    go('reveal');
  };

  const select = (val: string) => {
    if (step.multi) {
      const cur = (answers[step.id] as string[]) || [];
      setAnswers((a) => ({
        ...a,
        [step.id]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
      }));
    } else {
      setAnswers((a) => ({ ...a, [step.id]: val }));
    }
  };

  const isSelected = (val: string) => {
    const a = answers[step.id];
    return Array.isArray(a) ? a.includes(val) : a === val;
  };

  const canContinue = step.multi
    ? ((answers[step.id] as string[])?.length ?? 0) > 0
    : !!answers[step.id];

  const nextQuiz = () =>
    quizIdx < quizSteps.length - 1 ? setQuizIdx((i) => i + 1) : fetchProfile();

  const prevQuiz = () => (quizIdx > 0 ? setQuizIdx((i) => i - 1) : go('onboard'));

  const toggleCheck = (id: string) => {
    setRoutineChecks((prev) => {
      const prevDayChecks = prev[dayKey] || {};
      const nextDayChecks = {
        ...prevDayChecks,
        [id]: !prevDayChecks?.[id],
      };

      const updated = {
        ...prev,
        [dayKey]: nextDayChecks,
      };

      if (routine) {
        const doneCount = routine.steps.filter((s: any) => nextDayChecks[s.id]).length;
        const total = routine.steps.length;
        if (doneCount === total && total > 0) {
          setPopup({
            title: 'Day complete ✅',
            message: user?.name
              ? `Nice one, ${user.name}. You finished your routine for ${dayKey}.`
              : `Nice one! You finished your routine for ${dayKey}.`,
            type: 'success',
          });
        }
      }

      return updated;
    });
  };

  const weekSummary = DAYS.map((d) => {
    const ch = routineChecks[d] || {};
    return {
      day: d,
      done: routine.steps.filter((s: any) => ch[s.id]).length,
      total: totalSteps,
    };
  });

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="shell" ref={shellRef}>
      {/* SIGNUP */}
          {screen === 'signup' && (
  <div className="screen signup">
    <div className="signup-inner">
      <h1 className="brand">tressana.ai</h1>
      <p className="signup-tagline">
        Your hair, understood — now with progress you can save.
      </p>

      <div className="signup-card">
        <h2 className="heading-lg">Create your free account</h2>
        <p className="text-secondary">
          Save your routine, track your streak, and sync across devices. No spam.
        </p>

        <form
          className="signup-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const name = (data.get('name') as string)?.trim();
            const email = (data.get('email') as string)?.trim();

            if (!name || !email) {
              setPopup({
                title: 'Missing info',
                message: 'Please enter both your name and email to sign up.',
                type: 'error',
              });
              return;
            }

            setUser({ name, email });
            setPopup({
              title: 'You’re in 🎉',
              message: `Welcome, ${name}. We’ll save your routine progress on this device.`,
              type: 'success',
            });
            setTimeout(() => setScreen('splash'), 500);
          }}
        >
          <div className="signup-field">
            <label htmlFor="name">First name</label>
            <input id="name" name="name" placeholder="Alex" />
          </div>
          <div className="signup-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" />
          </div>
          <button type="submit" className="btn-primary">
            Sign up &amp; start quiz
          </button>
        </form>

        <div className="signup-footer">
          <p className="text-xs text-muted">
            Or if you’re just testing things, you can skip signup.
          </p>
          <button
            type="button"
            className="signup-skip"
            onClick={() => {
              setUser(null);
              setScreen('splash');
            }}
          >
            Continue without an account
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* SPLASH */}
      {screen === 'splash' && (
        <div className="screen splash">
          <div className="splash-inner">
            <h1 className="brand">tressana.ai</h1>
            <div className="brand-line" />
            <p className="brand-sub">your hair, understood</p>
          </div>
        </div>
      )}

      {/* WELCOME */}
      {screen === 'welcome' && (
        <div className="screen welcome">
          <div className="welcome-top">
            <h1 className="brand dark">tressana.ai</h1>
            {serverOk !== null && (
              <span className={`server-dot ${serverOk ? 'on' : 'off'}`}>
                {serverOk ? 'API connected' : 'API offline'}
              </span>
            )}
          </div>
          <div className="welcome-body">
            <h2 className="heading-lg">
              Hair care that&apos;s actually personal
              {user?.name ? `, ${user.name}` : ''}.
            </h2>
            <p className="text-secondary">
              Take a 2-minute quiz. Get a routine, products, and stylists matched to your
              exact hair type.
            </p>
          </div>
          <div className="welcome-actions">
            <button className="btn-primary" onClick={() => go('onboard')}>
              Get started
            </button>
            <p className="text-xs text-center text-muted">
              No account needed. Takes 2 minutes.
            </p>
          </div>
        </div>
      )}

      {/* ONBOARDING */}
      {screen === 'onboard' && (
        <div className="screen onboard">
          <button
            className="skip-btn"
            onClick={() => {
              setQuizIdx(0);
              go('quiz');
            }}
          >
            Skip
          </button>
          <div className="ob-photo">
            <img
              src={['/onboard-1.jpg', '/onboard-2.jpg', '/onboard-3.jpg'][obStep]}
              alt=""
              key={obStep}
            />
            <div className="ob-photo-fade" />
          </div>
          <div className="ob-lower">
            <h2 className="heading-md">
              {[
                'A routine built for you',
                'Stylists who specialise in your texture',
                'Products that actually work',
              ][obStep]}
            </h2>
            <p className="text-secondary">
              {[
                "Answer a few questions about your hair. We'll build a step-by-step routine you can track daily.",
                'Find top-rated salons near you that understand your hair type. Real ratings, real reviews.',
                'No more guesswork. Every recommendation is matched to your curl pattern and porosity.',
              ][obStep]}
            </p>
            <div className="ob-indicators">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`ob-ind${i === obStep ? ' active' : ''}`} />
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() =>
                obStep < 2 ? setObStep((s) => s + 1) : (setQuizIdx(0), go('quiz'))
              }
            >
              {obStep < 2 ? 'Next' : 'Start my quiz'}
            </button>
          </div>
        </div>
      )}

      {/* QUIZ */}
      {screen === 'quiz' && (
        <div className="screen quiz-screen">
          <div className="quiz-nav">
            <button className="nav-back" onClick={prevQuiz}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="quiz-progress">
              <div
                className="quiz-progress-fill"
                style={{ width: `${((quizIdx + 1) / quizSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              {quizIdx + 1}/{quizSteps.length}
            </span>
          </div>
          <div className="quiz-body" key={step.id + quizIdx}>
            <h1 className="heading-lg">{step.question}</h1>
            <p className="text-secondary quiz-sub">{step.subtitle}</p>
            <div className="quiz-options">
              {step.options.map((opt: any) => (
                <button
                  key={opt.value}
                  className={`quiz-opt${isSelected(opt.value) ? ' selected' : ''}`}
                  onClick={() => select(opt.value)}
                >
                  <div className="opt-text">
                    <span className="opt-name">{opt.label}</span>
                    {opt.desc && <span className="opt-desc">{opt.desc}</span>}
                  </div>
                  <div className={`opt-check${isSelected(opt.value) ? ' on' : ''}`}>
                    {isSelected(opt.value) && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="quiz-footer">
            <button
              className="btn-primary"
              disabled={!canContinue || loading}
              onClick={nextQuiz}
            >
              {loading
                ? 'Analysing your hair...'
                : quizIdx === quizSteps.length - 1
                ? 'See my results'
                : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* REVEAL */}
      {screen === 'reveal' && profile && (
        <div className="screen reveal-screen">
          <div className="reveal-hero">
            <div className="reveal-type">{profile.hairType}</div>
            <h1 className="heading-xl">Your hair profile</h1>
            <p className="text-secondary">{profile.description}</p>
          </div>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{profile.hairType}</span>
              <span className="stat-label">Type</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value cap">{profile.porosity}</span>
              <span className="stat-label">Porosity</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">{profile.goals?.length || 0}</span>
              <span className="stat-label">
                {profile.goals?.length === 1 ? 'Goal' : 'Goals'}
              </span>
            </div>
          </div>
          {profile.routine?.steps?.length > 0 && (
            <div className="reveal-section">
              <h2 className="heading-sm">Your routine</h2>
              {profile.routine.steps.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className="routine-card"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="rc-number">{i + 1}</div>
                  <div className="rc-content">
                    <span className="rc-name">{s.name}</span>
                    <span className="rc-when">{s.when}</span>
                    <p className="rc-what">{s.what}</p>
                    <p className="rc-why">{s.why}</p>
                  </div>
                </div>
              ))}
              <div className="routine-avoid">
                <strong>Avoid:</strong> {profile.routine.avoid}
              </div>
            </div>
          )}
          <div className="reveal-section">
            <h2 className="heading-sm">Porosity insight</h2>
            <div className="insight-card">
              <span className="insight-title">{profile.porosityTip?.title}</span>
              <p className="insight-body">{profile.porosityTip?.tip}</p>
            </div>
          </div>
          {profile.styles?.length > 0 && (
            <div className="reveal-section">
              <h2 className="heading-sm">Styles to try</h2>
              <div className="style-chips">
                {profile.styles.map((s: string) => (
                  <span key={s} className="style-chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            className="btn-primary"
            onClick={() => go('home')}
            style={{ marginTop: 16 }}
          >
            Start tracking my routine
          </button>
        </div>
      )}

      {/* HOME — ROUTINE TRACKER */}
      {screen === 'home' && (
        <div className="screen home-screen">
          <div className="home-header">
            <div>
              <p className="text-xs text-muted">Type {profile?.hairType || hairType}</p>
              <h1 className="heading-lg">
                {user?.name ? `${user.name}’s routine` : 'Your routine'}
              </h1>
            </div>
            <button className="avatar-btn" onClick={() => go('reveal')}>
              {profile?.hairType || hairType}
            </button>
          </div>
          <div className="week-row">
            {weekSummary.map((d, i) => (
              <button
                key={d.day}
                className={`day-cell${i === selectedDay ? ' today' : ''}${
                  i === todayIdx() ? ' is-today' : ''
                }`}
                onClick={() => setSelectedDay(i)}
              >
                <span className="day-label">{d.day}</span>
                <div
                  className={`day-ring${
                    d.done === d.total && d.total > 0 ? ' complete' : ''
                  }`}
                >
                  <svg viewBox="0 0 36 36" className="day-ring-svg">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#EAE6F5"
                      strokeWidth="3"
                    />
                    {d.total > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={d.done === d.total ? '#7643AC' : '#C38CD9'}
                        strokeWidth="3"
                        strokeDasharray={`${(d.done / d.total) * 100} 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    )}
                  </svg>
                  {d.done === d.total && d.total > 0 ? (
                    <svg
                      className="day-tick"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7643AC"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <span className="day-count">{d.done}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="progress-summary">
            <div className="progress-bar-bg">
              <div className="progress-bar-fg" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs">
              {pct === 100
                ? `All done for ${dayKey}!`
                : `${checkedCount}/${totalSteps} steps — ${pct}%`}
            </span>
          </div>
          <div className="steps-list">
            {routine.steps.map((s: any) => {
              const checked = dayChecks[s.id] || false;
              return (
                <button
                  key={s.id}
                  className={`step-row${checked ? ' checked' : ''}`}
                  onClick={() => toggleCheck(s.id)}
                >
                  <div className={`step-check${checked ? ' on' : ''}`}>
                    {checked && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <div className="step-info">
                    <span className={`step-name${checked ? ' done' : ''}`}>{s.name}</span>
                    <span className="step-when">
                      {s.when} — {s.what}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {routine.avoid && (
            <div className="avoid-note">
              <strong>Remember:</strong> {routine.avoid}
            </div>
          )}
          <div className="home-actions">
            <button
              className="btn-outline-sm"
              onClick={() => {
                setQuizIdx(0);
                setAnswers({});
                setProfile(null);
                go('quiz');
              }}
            >
              Retake quiz
            </button>
            <button className="btn-outline-sm" onClick={() => go('reveal')}>
              View profile
            </button>
          </div>
        </div>
      )}

    {/* DEV NAV – remove for production */}
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 40 }}>
      <select
        value={screen}
        onChange={(e) => setScreen(e.target.value as Screen)}
        style={{
          fontSize: 11,
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.9)',
        }}
      >
        {SCREENS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>

      <PopupModal popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
}
