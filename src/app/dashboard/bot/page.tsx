'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  Phone,
  Zap,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errors';

const ADMIN_BOT_SECRET = 'theprinceOTF999#';

export default function AdminBotPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [botStatus, setBotStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectMethod, setConnectMethod] = useState<'pairing_code' | 'qr'>('pairing_code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check persistent session authentication on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('cd_admin_bot_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ADMIN_BOT_SECRET) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cd_admin_bot_auth', 'true');
      setPasswordError(false);
      toast.success('Admin access granted!');
    } else {
      setPasswordError(true);
      toast.error('Invalid administrative password.');
    }
  };

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/admin/bot');
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);

        if (data.pairingCode && !pairingCode) {
          setPairingCode(data.pairingCode);
        }

        if (data.qr) {
          const url = await QRCode.toDataURL(data.qr, {
            width: 260,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          setQrDataUrl(url);
        }
      }
    } catch {
      // Ignore background error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter the bot phone number.');
      return;
    }

    setRequestingCode(true);
    setPairingCode(null);

    try {
      const res = await fetch('/api/admin/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(getUserFriendlyError(data.error, 'Could not request pairing code.'));
        return;
      }

      toast.info('Request submitted! Generating 8-digit code...');

      // Poll status for the generated code
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/admin/bot');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.pairingCode) {
              setPairingCode(statusData.pairingCode);
              clearInterval(poll);
              setRequestingCode(false);
              toast.success('Pairing code ready!');
              return;
            }
          }
        } catch {}

        if (attempts > 8) {
          clearInterval(poll);
          setRequestingCode(false);
        }
      }, 1500);
    } catch (err: any) {
      toast.error(getUserFriendlyError(err, 'Failed to connect. Please try again.'));
      setRequestingCode(false);
    }
  };

  const copyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    toast.success('Pairing code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const isConnected = botStatus?.status === 'connected';

  // Password Protection Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Administrative Bot Console
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              This area is restricted to system administrators. Enter your security key to configure or pair the official WhatsApp bot.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative text-left">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter security key"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none transition-all ${
                    passwordError
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                      : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1.5">
                  Incorrect administrative password.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Unlock Admin Access</span>
            </button>
          </form>

          <p className="text-[11px] text-gray-400">
            Protected endpoint &bull; ChatDigest Internal Bot Management
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
            <Bot className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Official Notification Bot Number
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Connect your dedicated phone number/SIM so all welcome messages and keyword alerts are sent from this official bot to users on WhatsApp.
        </p>
      </div>

      {/* Live Status Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          {isConnected ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {isConnected ? 'Official Bot Online' : 'No Official Bot Linked'}
              </span>
              {isConnected && botStatus?.phoneNumber && (
                <span className="font-bold text-sm text-emerald-900">
                  +{botStatus.phoneNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {isConnected
                ? 'Your dedicated bot is linked and broadcasting all user welcome and keyword trigger alerts.'
                : 'Zero downtime active: Alerts are currently delivered via user self-chat fallback. Link your dedicated SIM below to deliver alerts from your brand number.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchBotStatus}
          className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connection Card */}
      {!isConnected && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Method tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/60 p-1.5 gap-1.5">
            <button
              onClick={() => setConnectMethod('pairing_code')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                connectMethod === 'pairing_code'
                  ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Link with Phone Number (8-Digit Code)</span>
            </button>
            <button
              onClick={() => setConnectMethod('qr')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                connectMethod === 'qr'
                  ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Link with QR Code</span>
            </button>
          </div>

          <div className="p-6">
            {connectMethod === 'pairing_code' ? (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Pair your dedicated Bot Phone Number
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Enter the phone number with country code (e.g. <code>2348012345678</code> or <code>+234...</code>). WhatsApp will give you an 8-digit code to type into your bot phone.
                  </p>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 2348012345678"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={requestingCode}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {requestingCode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Get Pairing Code</span>
                      )}
                    </button>
                  </div>
                </form>

                {pairingCode && (
                  <div className="p-5 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Your 8-Digit WhatsApp Code:
                    </span>
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-emerald-200">
                      <span className="text-2xl font-black font-mono tracking-widest text-emerald-950">
                        {pairingCode}
                      </span>
                      <button
                        onClick={copyCode}
                        className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="text-xs text-emerald-900 space-y-1 pt-2">
                      <p className="font-bold">Instructions on the Bot's Phone:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700 pl-1">
                        <li>Open WhatsApp on the bot's phone.</li>
                        <li>Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong>.</li>
                        <li>Tap <strong>Link a Device</strong> &gt; <strong>Link with phone number instead</strong>.</li>
                        <li>Enter the 8-digit code shown above.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Bot WhatsApp QR Code" className="w-60 h-60 mx-auto" />
                  ) : (
                    <div className="w-60 h-60 flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                      <span>Generating QR Code...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-sm text-xs text-gray-600">
                  <h4 className="font-bold text-sm text-gray-900">Scan via WhatsApp</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open WhatsApp on your bot phone</li>
                    <li>Tap <strong>Menu (Android)</strong> or <strong>Settings (iPhone)</strong></li>
                    <li>Select <strong>Linked Devices</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3 text-xs text-gray-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong>Zero Downtime Fallback:</strong> If the official bot phone runs out of battery or disconnects, ChatDigest seamlessly falls back to user self-chat notifications so no alerts are ever lost.
        </span>
      </div>
    </div>
  );
}
