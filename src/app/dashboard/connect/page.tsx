'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PowerOff,
  Smartphone,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errors';

export default function WhatsAppConnectPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Pairing code mode states (for single device users)
  const [connectMethod, setConnectMethod] = useState<'pairing_code' | 'qr'>('pairing_code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        const current =
          data.session ||
          (data.bridgeStatus?.status === 'connected'
            ? {
                status: 'connected',
                phone_number: data.bridgeStatus.phoneNumber,
                push_name: data.bridgeStatus.pushName,
              }
            : null);
        setSession(current);

        if (data.bridgeStatus?.pairingCode && !pairingCode) {
          setPairingCode(data.bridgeStatus.pairingCode);
        }

        if (data.bridgeStatus?.qr) {
          const url = await QRCode.toDataURL(data.bridgeStatus.qr, {
            width: 260,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrCodeDataUrl(url);
        } else if (data.bridgeStatus?.status === 'connected') {
          setQrCodeDataUrl(null);
          setPairingCode(null);
        }
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/whatsapp/session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to start session');
        return;
      }
      if (data.qr) {
        const url = await QRCode.toDataURL(data.qr, {
          width: 260,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(url);
        toast.success('QR Code ready. Scan with WhatsApp to link.');
      }
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error communicating with bridge service';
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your WhatsApp phone number with country code (e.g. +234...)');
      return;
    }

    setRequestingCode(true);
    setPairingCode(null);

    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pairing-code',
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(getUserFriendlyError(data.error, 'Could not generate pairing code. Please try again.'));
        return;
      }

      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        toast.success('Pairing code generated! Enter it in WhatsApp on this phone.');
      }
      checkStatus();
    } catch (err: unknown) {
      toast.error(getUserFriendlyError(err, 'Connection timed out. Please click "Generate New Code" and enter it in WhatsApp.'));
    } finally {
      setRequestingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    toast.success('Pairing code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) return;
    setLoading(true);
    try {
      await fetch('/api/whatsapp/session', { method: 'DELETE' });
      setQrCodeDataUrl(null);
      setPairingCode(null);
      setSession(null);
      toast.success('WhatsApp session disconnected');
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = session?.status === 'connected' || session?.bridgeStatus?.status === 'connected';

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          WhatsApp Connection
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Link your WhatsApp account to enable automated group monitoring and AI digests
        </p>
      </div>

      {/* Account Safety Advisory Card */}
      <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-900">
              Safety Advisory &amp; Best Practices
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              ChatDigest connects as a WhatsApp Web device via Baileys multi-device protocol.
              To protect your WhatsApp account from automated restrictions:
            </p>
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5 mt-2 font-medium">
              <li>Do not use for spam or unsolicited broadcast messages.</li>
              <li>Only monitor groups you are an authorized participant of.</li>
              <li>Maintain a stable network connection.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Connection Card */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center p-3 border ${
                isConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
            >
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {isConnected ? 'WhatsApp Session Linked' : 'No Active Connection'}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {session?.status || 'disconnected'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isConnected
                  ? `Connected: ${session?.push_name || 'Account'} (${session?.phone_number || 'Linked device'})`
                  : 'Connect with an 8-character pairing code (no 2nd device needed) or scan a QR code.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors flex items-center gap-2"
              >
                <PowerOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Not Connected: Method Selector Tabs */}
        {!isConnected && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200 max-w-md">
              <button
                type="button"
                onClick={() => setConnectMethod('pairing_code')}
                className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  connectMethod === 'pairing_code'
                    ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/60'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pair with Phone Number</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                  1 Device
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConnectMethod('qr')}
                className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  connectMethod === 'qr'
                    ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/60'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scan QR Code</span>
              </button>
            </div>

            {/* TAB 1: Single-Device Phone Number Pairing Code */}
            {connectMethod === 'pairing_code' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
                {/* Form to Request Code */}
                <div className="space-y-5 p-6 rounded-xl bg-gray-50/60 border border-gray-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Link Directly on This Phone
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      No second phone or camera required. Enter your WhatsApp phone number with your international country code to receive an 8-character code.
                    </p>
                  </div>

                  <form onSubmit={handleRequestPairingCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        WhatsApp Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+234 812 345 6789 or 2348123456789"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={requestingCode || !phoneNumber}
                      className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {requestingCode ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Pairing Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Get 8-Digit Pairing Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Generated Code Display Box */}
                  {pairingCode && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-300">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                        Your WhatsApp Pairing Code
                      </span>
                      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-emerald-300 shadow-2xs">
                        <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-900">
                          {pairingCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Code expires in 60 seconds. Enter this code inside WhatsApp now.
                      </p>
                    </div>
                  )}
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-4 max-w-md">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    How to Link on the Same Device:
                  </h4>
                  <ol className="space-y-3 text-xs text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </span>
                      <span className="leading-relaxed">
                        Copy the <strong>8-character pairing code</strong> generated on the left.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </span>
                      <span className="leading-relaxed">
                        Open <strong>WhatsApp</strong> on this phone.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </span>
                      <span className="leading-relaxed">
                        Tap <strong>Settings</strong> (or 3 dots on Android) &gt;{' '}
                        <strong>Linked Devices</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        4
                      </span>
                      <span className="leading-relaxed">
                        Tap <strong>Link a Device</strong>, then at the bottom tap{' '}
                        <strong className="text-emerald-700">&quot;Link with phone number instead&quot;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        5
                      </span>
                      <span className="leading-relaxed">
                        Paste or type the 8-character code. Your device will link instantly!
                      </span>
                    </li>
                  </ol>

                  <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp verifies this via end-to-end encrypted multi-device pairing.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Classic QR Code Scan */}
            {connectMethod === 'qr' && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-4">
                <div className="flex flex-col items-center">
                  <div className="w-70 h-70 bg-white p-3 rounded-xl border-2 border-gray-200 shadow-sm flex items-center justify-center">
                    {qrCodeDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-full h-full object-contain rounded"
                      />
                    ) : connecting ? (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Generating QR Session...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 text-center p-4">
                        <QrCode className="w-12 h-12 text-gray-300 stroke-[1.5]" />
                        <button
                          type="button"
                          onClick={handleStartSession}
                          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                        >
                          Generate QR Code
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    QR code refreshes automatically
                  </p>
                </div>

                <div className="max-w-md space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    QR Pairing Instructions
                  </h4>
                  <ol className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        1
                      </span>
                      <span>Open WhatsApp on your mobile phone.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        2
                      </span>
                      <span>
                        Tap <strong>Menu</strong> or <strong>Settings</strong> &gt;{' '}
                        <strong>Linked Devices</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        3
                      </span>
                      <span>Tap <strong>Link a Device</strong> and point your camera at this QR code.</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connected Success state */}
        {isConnected && (
          <div className="mt-8 p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">Your WhatsApp is active!</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
              The ChatDigest bridge service is listening for group messages and keyword triggers.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/dashboard/groups"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                <span>Choose Groups to Monitor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
