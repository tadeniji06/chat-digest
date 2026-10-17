'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PowerOff,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppConnectPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        const current = data.session || (data.bridgeStatus?.status === 'connected' ? { status: 'connected', phone_number: data.bridgeStatus.phoneNumber, push_name: data.bridgeStatus.pushName } : null);
        setSession(current);

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
    const interval = setInterval(checkStatus, 4000);
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

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) return;
    setLoading(true);
    try {
      await fetch('/api/whatsapp/session', { method: 'DELETE' });
      setQrCodeDataUrl(null);
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
              Safety Advisory & Best Practices
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
      <div className="p-8 rounded-xl bg-white border border-gray-200 shadow-sm">
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
                  : 'Scan the QR code with WhatsApp on your phone to link.'}
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
            ) : (
              <button
                onClick={handleStartSession}
                disabled={connecting}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                <span>Generate QR Code</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code Presentation Box */}
        {!isConnected && (
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-10 py-4">
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
                    <span className="text-xs font-medium text-gray-500">
                      Click &quot;Generate QR Code&quot; to begin pairing
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                QR code refreshes automatically
              </p>
            </div>

            <div className="max-w-md space-y-3.5">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Pairing Instructions
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
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                    4
                  </span>
                  <span>
                    Once linked, your groups will appear under <strong>Monitored Groups</strong>.
                  </span>
                </li>
              </ol>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Encrypted credentials are saved securely in your private database.</span>
              </div>
            </div>
          </div>
        )}

        {/* Connected Success state */}
        {isConnected && (
          <div className="mt-8 p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">Your WhatsApp is active!</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
              The Baileys bridge service is listening for group messages and keyword triggers.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href="/dashboard/groups"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                Choose Groups to Monitor &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
