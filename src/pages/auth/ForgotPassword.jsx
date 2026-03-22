import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, SendHorizonal } from 'lucide-react';
import { Button, Card } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">
            Reset <span className="text-cyan-primary">Password</span>
          </h1>
          <p className="text-sm text-light-gray/50 font-mono">
            We'll send a reset link to your email
          </p>
        </div>

        <Card className="p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-primary/10 border border-cyan-primary/20 flex items-center justify-center mx-auto">
                <Mail size={28} className="text-cyan-primary" />
              </div>
              <h3 className="text-lg font-bold text-cyan-primary">Check your email!</h3>
              <p className="text-sm text-light-gray/50">
                A password reset link has been sent to <span className="text-cyan-primary font-bold">{email}</span>.
              </p>
              <Link to="join?login=1">
                <Button variant="outline" className="w-full mt-4">
                  <ArrowLeft size={16} /> Back to Sign In
                </Button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl text-xs font-mono bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={16} />
                  <input
                    required type="email"
                    className="w-full bg-primary-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-primary text-sm transition-colors placeholder:text-white/20"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button className="w-full py-3" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'} <SendHorizonal size={16} className="ml-1" />
              </Button>

              <p className="text-center">
                <Link to="/join?login=1" className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30 hover:text-cyan-primary transition-colors">
                  <ArrowLeft className="inline-block mr-1" size={12} /> Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
