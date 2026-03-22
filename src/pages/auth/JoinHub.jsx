import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, LogIn, User, Mail, Smartphone, Lock, 
  Eye, EyeOff, Ticket, Check, ArrowLeft, History, 
  Star, Bolt, ShieldCheck, UserCircle
} from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const JoinHub = () => {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  const [referralStatus, setReferralStatus] = useState({ checking: false, valid: false, message: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('login') === '1') setActiveTab('login');
    
    if (user) {
      const ret = params.get('return') || '/profile';
      navigate(ret);
    }
  }, [user, location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(loginData.email, loginData.password);
      // AuthContext handles redirect or state update
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      const fullName = `${registerData.firstName} ${registerData.lastName}`;
      await signup(registerData.email, registerData.password, {
        name: fullName,
        phone: registerData.phone,
        usedReferralCode: registerData.referralCode || null
      });
      setSuccess(`Account created! Welcome, ${registerData.firstName} 🎉`);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const validateReferral = async (code) => {
    if (!code) {
      setReferralStatus({ checking: false, valid: false, message: '' });
      return;
    }
    setReferralStatus({ checking: true, valid: false, message: 'checking...' });
    try {
      const snap = await getDoc(doc(db, "referralCodes", code.toUpperCase()));
      if (snap.exists()) {
        const d = snap.data();
        setReferralStatus({ 
          checking: false, 
          valid: true, 
          message: `${d.discountPercent}% discount unlocked!` 
        });
      } else {
        setReferralStatus({ checking: false, valid: false, message: 'invalid referral code' });
      }
    } catch (e) {
      setReferralStatus({ checking: false, valid: false, message: 'error validating' });
    }
  };

  return (
    <div className="min-h-screen py-20 flex flex-col">
      {/* Hero */}
      <section className="text-center mb-12">
        <div className="container mx-auto px-6">
          <div className="inline-block px-4 py-1 rounded-full border border-cyan-primary/20 bg-cyan-primary/5 text-cyan-primary text-[10px] font-mono uppercase tracking-widest mb-6">
            <Bolt className="inline-block mr-2" size={12} /> Free Account
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Join <span className="text-cyan-primary text-glow">TN WEB RATS</span></h1>
          <p className="text-sm text-light-gray opacity-50 font-mono tracking-wider">
            Create an account to track orders & get exclusive discounts
          </p>
        </div>
      </section>

      {/* Main Card */}
      <section className="flex-grow flex items-center justify-center px-6">
        <Card className="w-full max-w-[540px] p-8 md:p-10 relative overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-primary-dark/50 border border-white/10 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'register' ? 'bg-cyan-primary/10 text-cyan-primary shadow-[inset_0_0_20px_rgba(103, 248, 29,0.05)]' : 'text-white/30 hover:text-white/60'}`}
            >
              <UserPlus size={16} /> Create Account
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'login' ? 'bg-cyan-primary/10 text-cyan-primary shadow-[inset_0_0_20px_rgba(103, 248, 29,0.05)]' : 'text-white/30 hover:text-white/60'}`}
            >
              <LogIn size={16} /> Sign In
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'register' ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-primary text-xs font-mono">{success}</div>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                      <input 
                        required
                        className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                        placeholder="Aarav"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                      <input 
                        required
                        className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                        placeholder="Kumar"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                    <input 
                      required type="email"
                      className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">WhatsApp / Phone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                    <input 
                      required type="tel"
                      className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                      placeholder="+91 98765 43210"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                      <input 
                        required type={showPassword ? "text" : "password"}
                        className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                        placeholder="Min 8 chars"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                      <input 
                        required type={showPassword ? "text" : "password"}
                        className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm"
                        placeholder="Repeat password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Referral Code (Optional)</label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                    <input 
                      className="w-full bg-primary-dark border border-white/10 rounded-lg px-10 py-2.5 outline-none focus:border-cyan-primary text-sm uppercase"
                      placeholder="TNWR-XXX"
                      value={registerData.referralCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setRegisterData({...registerData, referralCode: val});
                        validateReferral(val);
                      }}
                    />
                  </div>
                  <div className={`text-[10px] font-mono mt-1 ${referralStatus.valid ? 'text-cyan-primary' : 'text-white/20'}`}>
                    {referralStatus.message || '\u00A0'}
                  </div>
                </div>

                <div className="p-4 bg-primary-dark/50 rounded-lg border border-white/5 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded border border-cyan-primary/30 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer bg-cyan-primary/5">
                    <Check size={12} className="text-cyan-primary" />
                  </div>
                  <p className="text-[10px] text-light-gray opacity-40 leading-relaxed">
                    I agree to the <Link to="/help" className="text-cyan-primary hover:underline">Terms of Service</Link> and understand TN WEB RATS may contact me via the provided details.
                  </p>
                </div>

                <Button className="w-full py-3" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} className="ml-2" />
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">{error}</div>}
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                    <input 
                      required type="email"
                      className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-cyan-primary text-sm"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                    <input 
                      required type={showPassword ? "text" : "password"}
                      className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-cyan-primary text-sm"
                      placeholder="Your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-cyan-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button className="w-full py-4 text-base" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'} <LogIn size={20} className="ml-2" />
                </Button>

                <div className="text-center">
                  <Link to="/forgot-password" size="sm" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center">
        <div className="container mx-auto px-6 space-x-4">
          <Link to="/" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
            ← Back to Home
          </Link>
          <span className="text-white/5">|</span>
          <Link to="/book" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
            Book a Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default JoinHub;
