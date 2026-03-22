import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, LogIn, User, Mail, Smartphone, Lock,
  Eye, EyeOff, Ticket, Check, ArrowRight, KeyRound,
  Bolt, ShieldCheck, Users
} from 'lucide-react';
import { Button, Card } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/* ─── Role routing ─────────────────────────────────────────── */
const ROLE_ROUTES = {
  client:     '/profile',
  worker:     '/dashboard',
  manager:    '/dashboard',
  admin:      '/dashboard',
  superadmin: '/dashboard',
  owner:      '/dashboard',
};

/* ─── Reusable field ───────────────────────────────────────── */
function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />}
        {children}
      </div>
    </div>
  );
}

const inputCls = (pl = 'pl-10') =>
  `w-full bg-primary-dark border border-white/10 rounded-xl ${pl} pr-4 py-3 outline-none focus:border-cyan-primary text-sm transition-colors placeholder:text-white/20`;

/* ─── Main Component ──────────────────────────────────────── */
const JoinHub = () => {
  const { login, signup, staffSignup, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params    = new URLSearchParams(location.search);
  const initTab   = params.get('tab') === 'staff' ? 'staff'
                  : params.get('login') === '1'   ? 'login'
                  : 'register';

  const [tab, setTab]               = useState(initTab);
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  /* redirect if already logged in */
  useEffect(() => {
    if (user) navigate(ROLE_ROUTES[user.role] || '/profile', { replace: true });
  }, [user, navigate]);

  /* --- form state --- */
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData]     = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', referralCode: ''
  });
  const [staffData, setStaffData] = useState({
    inviteKey: '', firstName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: ''
  });
  const [refStatus, setRefStatus] = useState({ valid: false, msg: '' });

  const reset = () => { setError(''); setSuccess(''); };
  const switchTab = (t) => { reset(); setShowPass(false); setTab(t); };

  /* --- referral validation --- */
  const validateReferral = async (code) => {
    if (!code) { setRefStatus({ valid: false, msg: '' }); return; }
    try {
      const snap = await getDoc(doc(db, 'referralCodes', code.toUpperCase()));
      if (snap.exists()) {
        const d = snap.data();
        setRefStatus({ valid: true, msg: `✓ ${d.discountPercent}% discount unlocked!` });
      } else {
        setRefStatus({ valid: false, msg: '✗ Invalid referral code' });
      }
    } catch { setRefStatus({ valid: false, msg: 'Could not validate' }); }
  };

  /* --- handlers --- */
  const handleLogin = async (e) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const data = await login(loginData.email, loginData.password);
      const role = (data?.role || 'client').toLowerCase();
      navigate(ROLE_ROUTES[role] || '/profile', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); reset();
    if (regData.password !== regData.confirmPassword) return setError('Passwords do not match.');
    if (regData.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await signup(regData.email, regData.password, {
        name:            `${regData.firstName} ${regData.lastName}`,
        phone:           regData.phone,
        usedReferralCode: regData.referralCode || null,
      });
      setSuccess(`Account created! Welcome, ${regData.firstName} 🎉`);
      setTimeout(() => navigate('/profile'), 1800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStaffSignup = async (e) => {
    e.preventDefault(); reset();
    if (staffData.password !== staffData.confirmPassword) return setError('Passwords do not match.');
    if (staffData.password.length < 8) return setError('Password must be at least 8 characters.');
    if (!staffData.inviteKey) return setError('Invite key is required.');
    setLoading(true);
    try {
      const { role } = await staffSignup(staffData.email, staffData.password, {
        inviteKey:  staffData.inviteKey.trim().toUpperCase(),
        firstName:  staffData.firstName,
        lastName:   staffData.lastName,
        phone:      staffData.phone,
      });
      setSuccess('Staff account created! Redirecting to dashboard...');
      setTimeout(() => navigate(ROLE_ROUTES[role] || '/dashboard'), 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Tabs config ── */
  const TABS = [
    { id: 'register', label: 'Create Account', icon: UserPlus },
    { id: 'login',    label: 'Sign In',        icon: LogIn },
    { id: 'staff',    label: 'Join as Staff',  icon: Users },
  ];

  return (
    <div className="min-h-screen py-20 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1 rounded-full border border-cyan-primary/20 bg-cyan-primary/5 text-cyan-primary text-[10px] font-mono uppercase tracking-widest mb-4">
          <Bolt className="inline-block mr-1" size={10} /> TN WEB RATS Portal
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3">
          {tab === 'staff' ? 'Join the ' : tab === 'login' ? 'Welcome ' : 'Create Your '}
          <span className="text-cyan-primary">
            {tab === 'staff' ? 'Team' : tab === 'login' ? 'Back' : 'Account'}
          </span>
        </h1>
        <p className="text-sm text-light-gray/50 font-mono">
          {tab === 'login'    && 'Sign in to manage your orders & profile'}
          {tab === 'register' && 'Track orders, get discounts, and more'}
          {tab === 'staff'    && 'Staff registration with invite key'}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg">
        {/* Tab Bar */}
        <div className="flex bg-primary-dark/60 border border-white/10 rounded-2xl p-1 mb-6 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-300 ${
                tab === id
                  ? 'bg-cyan-primary/10 text-cyan-primary border border-cyan-primary/20'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <Card className="p-8 relative overflow-hidden">
          {/* Alert */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mb-5 p-3 rounded-xl text-xs font-mono border ${
                  error
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-cyan-primary/10 border-cyan-primary/20 text-cyan-primary'
                }`}
              >
                {error || success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ── Register ── */}
            {tab === 'register' && (
              <motion.form key="register"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" icon={User}>
                    <input required className={inputCls()} placeholder="Aarav"
                      value={regData.firstName} onChange={e => setRegData({ ...regData, firstName: e.target.value })} />
                  </Field>
                  <Field label="Last Name" icon={User}>
                    <input required className={inputCls()} placeholder="Kumar"
                      value={regData.lastName} onChange={e => setRegData({ ...regData, lastName: e.target.value })} />
                  </Field>
                </div>

                <Field label="Email" icon={Mail}>
                  <input required type="email" className={inputCls()} placeholder="you@example.com"
                    value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
                </Field>

                <Field label="WhatsApp / Phone" icon={Smartphone}>
                  <input required type="tel" className={inputCls()} placeholder="+91 98765 43210"
                    value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password" icon={Lock}>
                    <input required type={showPass ? 'text' : 'password'} className={inputCls()} placeholder="Min 8 chars"
                      value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} />
                  </Field>
                  <Field label="Confirm" icon={Lock}>
                    <input required type={showPass ? 'text' : 'password'} className={inputCls()} placeholder="Repeat"
                      value={regData.confirmPassword} onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })} />
                  </Field>
                </div>

                <Field label="Referral Code (Optional)" icon={Ticket}>
                  <input className={`${inputCls()} uppercase`} placeholder="TNWR-XXX"
                    value={regData.referralCode}
                    onChange={e => {
                      const v = e.target.value.toUpperCase();
                      setRegData({ ...regData, referralCode: v });
                      validateReferral(v);
                    }} />
                  {refStatus.msg && (
                    <p className={`text-[10px] font-mono mt-1 ${refStatus.valid ? 'text-cyan-primary' : 'text-red-400'}`}>
                      {refStatus.msg}
                    </p>
                  )}
                </Field>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="w-4 h-4 rounded border border-cyan-primary/30 bg-cyan-primary/5 flex items-center justify-center">
                    <Check size={10} className="text-cyan-primary" />
                  </div>
                  <span className="text-[10px] text-light-gray/40">
                    I agree to the <Link to="/help" className="text-cyan-primary hover:underline">Terms of Service</Link>
                  </span>
                </label>

                <Button className="w-full py-3" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} className="ml-1" />
                </Button>
              </motion.form>
            )}

            {/* ── Login ── */}
            {tab === 'login' && (
              <motion.form key="login"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} className="space-y-5"
              >
                <Field label="Email" icon={Mail}>
                  <input required type="email" className={inputCls()} placeholder="you@example.com"
                    value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
                </Field>

                <Field label="Password" icon={Lock}>
                  <input required type={showPass ? 'text' : 'password'} className={inputCls('pl-10 pr-10')}
                    placeholder="Your password"
                    value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-cyan-primary transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </Field>

                <Button className="w-full py-3" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'} <LogIn size={16} className="ml-1" />
                </Button>

                <p className="text-center text-[10px] font-mono text-white/20">
                  <Link to="/forgot-password" className="hover:text-cyan-primary transition-colors">
                    Forgot your password?
                  </Link>
                </p>
              </motion.form>
            )}

            {/* ── Staff Signup ── */}
            {tab === 'staff' && (
              <motion.form key="staff"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStaffSignup} className="space-y-4"
              >
                <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-primary/5 border border-cyan-primary/15 mb-2">
                  <ShieldCheck size={18} className="text-cyan-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-light-gray/50 leading-relaxed">
                    Staff registration is invite-only. You need a valid invite key from your team lead or admin.
                  </p>
                </div>

                <Field label="Invite Key" icon={KeyRound}>
                  <input required className={`${inputCls()} uppercase tracking-widest`}
                    placeholder="TNWR-XXXX-XXXX"
                    value={staffData.inviteKey}
                    onChange={e => setStaffData({ ...staffData, inviteKey: e.target.value.toUpperCase() })} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" icon={User}>
                    <input required className={inputCls()} placeholder="First"
                      value={staffData.firstName} onChange={e => setStaffData({ ...staffData, firstName: e.target.value })} />
                  </Field>
                  <Field label="Last Name" icon={User}>
                    <input required className={inputCls()} placeholder="Last"
                      value={staffData.lastName} onChange={e => setStaffData({ ...staffData, lastName: e.target.value })} />
                  </Field>
                </div>

                <Field label="Email" icon={Mail}>
                  <input required type="email" className={inputCls()} placeholder="you@tnwebrats.com"
                    value={staffData.email} onChange={e => setStaffData({ ...staffData, email: e.target.value })} />
                </Field>

                <Field label="Phone" icon={Smartphone}>
                  <input required type="tel" className={inputCls()} placeholder="+91 98765 43210"
                    value={staffData.phone} onChange={e => setStaffData({ ...staffData, phone: e.target.value })} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password" icon={Lock}>
                    <input required type={showPass ? 'text' : 'password'} className={inputCls()} placeholder="Min 8 chars"
                      value={staffData.password} onChange={e => setStaffData({ ...staffData, password: e.target.value })} />
                  </Field>
                  <Field label="Confirm" icon={Lock}>
                    <input required type={showPass ? 'text' : 'password'} className={inputCls()} placeholder="Repeat"
                      value={staffData.confirmPassword} onChange={e => setStaffData({ ...staffData, confirmPassword: e.target.value })} />
                  </Field>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowPass(!showPass)}>
                  <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                    showPass ? 'border-cyan-primary bg-cyan-primary/20' : 'border-white/20'
                  }`}>
                    {showPass && <Check size={10} className="text-cyan-primary" />}
                  </div>
                  <span className="text-[10px] text-light-gray/40">Show passwords</span>
                </label>

                <Button className="w-full py-3" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Staff Account'} <ArrowRight size={16} className="ml-1" />
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-x-4">
          <Link to="/" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
            ← Back to Home
          </Link>
          <span className="text-white/5">|</span>
          <Link to="/book" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
            Book a Service →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JoinHub;
