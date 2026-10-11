import React, { useState } from 'react';
import { X, Lock, ShieldAlert, KeyRound, Mail, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { setAdminToken } from '../utils/adminAuth';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Forgot Password Flow States
  const [mode, setMode] = useState<'login' | 'forgot' | 'otp' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          setAdminToken(data.token);
        }
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Invalid admin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your registered email or phone.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    // Mock network delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg('OTP sent to your registered contact.');
      setMode('otp');
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otp })
      });
      const data = await res.json();
      if (data.success) {
        setError('');
        setSuccessMsg('Code Verified! Please enter your new password.');
        setMode('reset');
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch (err) {
      setError('Network error verifying code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, token: otp })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Password changed successfully! You can now log in.');
        setMode('login');
        setPassword('');
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0D121F] rounded-3xl w-full max-w-sm shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-amber-500/30 ring-1 ring-amber-500/20 flex flex-col overflow-hidden relative text-slate-100">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#111728]/80 text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto w-12 h-12 bg-black/60 border border-amber-500/40 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
            {mode === 'login' && <Lock className="w-5 h-5 text-amber-400" />}
            {mode === 'forgot' && <Mail className="w-5 h-5 text-amber-400" />}
            {mode === 'otp' && <KeyRound className="w-5 h-5 text-amber-400" />}
            {mode === 'reset' && <CheckCircle className="w-5 h-5 text-amber-400" />}
          </div>

          <h2 className="text-xl font-bold text-white">
            {mode === 'login' && 'Owner Access'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'otp' && 'Verify OTP'}
            {mode === 'reset' && 'Create New Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Authenticate to manage website properties.'}
            {mode === 'forgot' && 'Begin password reset flow.'}
            {mode === 'otp' && 'Enter your Authenticator code.'}
            {mode === 'reset' && 'Secure your account with a new password.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-950/50 text-red-300 rounded-xl text-xs font-medium border border-red-500/40">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {successMsg && mode !== 'login' && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-950/50 text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/40">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              {successMsg}
            </div>
          )}

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/50 text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/40">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  {successMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-[#080B14] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 block">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-[#080B14] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 px-5 py-3 text-sm font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'Authenticating...' : 'Login to Admin Panel'}</span>
                <span className="text-[11px] font-normal text-slate-900 bg-amber-500/30 px-2 py-0.5 rounded-md ml-1 font-mono"> ↗</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 text-center">
                If you have set up a TOTP Authenticator, you will need to provide a code to reset your password.
              </p>

              <button
                type="button"
                onClick={() => { setMode('otp'); setError(''); }}
                className="w-full mt-4 px-5 py-3 text-sm font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Proceed to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full text-xs font-semibold text-slate-400 hover:text-slate-200 text-center mt-2 cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* OTP MODE */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Authenticator Code (TOTP)</label>
                <input
                  required
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-[#080B14] text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 tracking-widest text-center text-lg font-bold font-mono"
                  placeholder="123 456"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 px-5 py-3 text-sm font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          {/* RESET PASSWORD MODE */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-[#080B14] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-[#080B14] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 px-5 py-3 text-sm font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
