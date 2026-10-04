import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  FileCode2,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import { login, MASTER_CREDENTIALS, AuthUser } from '../utils/auth';

interface LoginScreenProps {
  onSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your vault password.');
      return;
    }

    setIsLoading(true);

    // Short simulated authentication check for crisp UX feedback
    setTimeout(() => {
      const result = login(email, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    }, 250);
  };

  const handleQuickFill = () => {
    setEmail(MASTER_CREDENTIALS.email);
    setPassword(MASTER_CREDENTIALS.password);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0714] text-[#faf5ff] flex items-center justify-center p-4 selection:bg-[#ec4899] selection:text-white font-['Space_Grotesk',sans-serif]">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ec4899]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#7928ca]/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Main Vault Auth Card */}
        <div className="bg-[#150d24] border border-[#2e1c52] rounded-[10px] p-7 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-[8px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-center mb-3 shadow-inner relative group">
              <Lock className="w-6 h-6 text-[#ec4899] transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#150d24]" title="Security Active" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#1f1338] border border-[#2e1c52] text-[10px] font-['Space_Mono',monospace] text-[#c084fc] mb-2 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-[#ec4899]" />
              <span>PKM Security Gateway</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#faf5ff]">
              Vault Authentication
            </h1>
            <p className="text-xs text-[#c084fc] mt-1">
              Authenticate to unlock your personal notes, graph, and directories.
            </p>
          </div>

          {/* Quick-fill Master Credentials Helper */}
          <div className="mb-5 bg-[#1f1338]/70 border border-[#2e1c52] rounded-[6px] p-3 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#faf5ff]/80 truncate">
              <KeyRound className="w-4 h-4 text-[#ec4899] shrink-0" />
              <div className="truncate text-[11px]">
                <span className="text-[#c084fc]">Authorized ID: </span>
                <span className="font-mono text-[#faf5ff]">{MASTER_CREDENTIALS.email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="shrink-0 px-2.5 py-1 text-[11px] font-medium bg-[#ec4899]/15 hover:bg-[#ec4899] hover:text-[#faf5ff] border border-[#ec4899]/40 rounded-[4px] transition-all cursor-pointer inline-flex items-center gap-1"
              title="Pre-fill authorized master credentials"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto Fill</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-[6px] bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#c084fc] mb-1.5" htmlFor="auth-email">
                Account Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#c084fc]/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="emixup23@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#1f1338] border border-[#2e1c52] rounded-[6px] text-xs text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-none focus:border-[#ec4899] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#c084fc]" htmlFor="auth-password">
                  Vault Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#c084fc]/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[#1f1338] border border-[#2e1c52] rounded-[6px] text-xs text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-none focus:border-[#ec4899] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember device check */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#c084fc] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#1f1338] border border-[#2e1c52] text-[#ec4899] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#ec4899]"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#ec4899] hover:bg-[#db2777] active:bg-[#be185d] text-[#faf5ff] text-xs font-semibold rounded-[6px] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Knowledge Vault</span>
                </>
              )}
            </button>
          </form>

          {/* Features / Capabilities Pill List */}
          <div className="mt-6 pt-5 border-t border-[#2e1c52]/60 grid grid-cols-2 gap-2 text-[10px] text-[#c084fc] font-['Space_Mono',monospace]">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3 text-[#ec4899]" />
              <span>Markdown .md Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FolderTree className="w-3 h-3 text-[#ec4899]" />
              <span>Hierarchy & Tags</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-[#c084fc]/60 font-['Space_Mono',monospace]">
          Encrypted Session • Offline-First PWA • Private
        </div>
      </div>
    </div>
  );
};
