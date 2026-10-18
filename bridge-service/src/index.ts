import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WAMessage,
} from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const SESSIONS_DIR = path.resolve(process.env.AUTH_SESSIONS_DIR || './auth_sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bogkfyqaoczlejgaksee.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Dedicated Official Bot Session Identifier
const SYSTEM_BOT_USER_ID = 'system_official_bot';

// Helper to send a WhatsApp notification via the Official Bot or fallback to user socket
async function sendWhatsAppBotNotification(recipientPhoneOrJid: string, text: string, userFallbackSession?: any) {
  try {
    let targetJid = recipientPhoneOrJid;
    if (!targetJid.includes('@')) {
      const cleanPhone = recipientPhoneOrJid.replace(/[^0-9]/g, '');
      targetJid = `${cleanPhone}@s.whatsapp.net`;
    }

    // 1. Try dedicated official bot session if active and connected
    const botSession = activeSessions.get(SYSTEM_BOT_USER_ID);
    if (botSession && botSession.status === 'connected' && botSession.socket) {
      await botSession.socket.sendMessage(targetJid, { text });
      logger.info(`[Bot Notification] Sent via Official Bot to ${targetJid}`);
      return true;
    }

    // 2. Fallback: if user session provided and connected, send directly to user
    if (userFallbackSession && userFallbackSession.status === 'connected' && userFallbackSession.socket) {
      await userFallbackSession.socket.sendMessage(targetJid, { text });
      logger.info(`[Bot Notification] Sent via User Connected Session to ${targetJid}`);
      return true;
    }

    logger.warn(`[Bot Notification] Could not send message to ${targetJid}. Neither official bot nor user socket connected.`);
    return false;
  } catch (err: any) {
    logger.error(`[Bot Notification Error] Failed to send message to ${recipientPhoneOrJid}: ${err.message}`);
    return false;
  }
}

// In-memory active sockets & QR storage
interface MonitoredGroupConfig {
  groupJid: string;
  groupName: string;
  keywords: string[];
  isActive: boolean;
}

interface IngestedMessage {
  id?: string;
  groupJid: string;
  senderJid: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface ActiveSession {
  userId: string;
  userEmail?: string;
  socket: any;
  qr: string | null;
  pairingCode?: string | null;
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'failed';
  phoneNumber?: string;
  pushName?: string;
  monitoredGroups?: Map<string, MonitoredGroupConfig>;
  recentAlerts?: Array<{
    id: string;
    keyword: string;
    groupJid: string;
    groupName: string;
    senderName: string;
    messageContent: string;
    createdAt: string;
  }>;
  groupMessages?: Map<string, IngestedMessage[]>;
}

const activeSessions = new Map<string, ActiveSession>();

const logger = pino({ level: 'info' });

// Function to start or restore Baileys connection for a user
async function startWhatsAppSession(userId: string): Promise<ActiveSession> {
  if (activeSessions.has(userId)) {
    const existing = activeSessions.get(userId)!;
    if (existing.status === 'connected') {
      return existing;
    }
  }

  const userSessionDir = path.join(SESSIONS_DIR, userId);
  const { state, saveCreds } = await useMultiFileAuthState(userSessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const existing = activeSessions.get(userId);
  const monitoredConfigFile = path.join(userSessionDir, 'monitored_groups.json');
  const alertsFile = path.join(userSessionDir, 'recent_alerts.json');

  let initialGroups = existing?.monitoredGroups || new Map<string, MonitoredGroupConfig>();
  let initialAlerts = existing?.recentAlerts || [];

  // If memory was empty, restore from disk file
  if (initialGroups.size === 0 && fs.existsSync(monitoredConfigFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(monitoredConfigFile, 'utf-8'));
      for (const item of data) {
        initialGroups.set(item.groupJid, item);
      }
    } catch {}
  }

  if (initialAlerts.length === 0 && fs.existsSync(alertsFile)) {
    try {
      initialAlerts = JSON.parse(fs.readFileSync(alertsFile, 'utf-8'));
    } catch {}
  }
  const messagesFile = path.join(userSessionDir, 'group_messages.json');
  let initialMessages = existing?.groupMessages || new Map<string, IngestedMessage[]>();

  if (initialMessages.size === 0 && fs.existsSync(messagesFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
      for (const [jid, list] of Object.entries(data)) {
        initialMessages.set(jid, list as IngestedMessage[]);
      }
    } catch {}
  }

  const sessionObj: ActiveSession = {
    userId,
    socket: null,
    qr: null,
    status: 'connecting',
    monitoredGroups: initialGroups,
    recentAlerts: initialAlerts,
    groupMessages: initialMessages,
  };
  activeSessions.set(userId, sessionObj);

  // Pre-load monitored groups from Supabase if accessible
  try {
    const { data: dbGroups } = await supabase
      .from('monitored_groups')
      .select('*')
      .eq('user_id', userId);
    if (dbGroups && dbGroups.length > 0) {
      if (!sessionObj.monitoredGroups) sessionObj.monitoredGroups = new Map();
      for (const dg of dbGroups) {
        sessionObj.monitoredGroups.set(dg.group_jid, {
          groupJid: dg.group_jid,
          groupName: dg.group_name,
          keywords: dg.keywords || [],
          isActive: dg.is_active !== false,
        });
      }
      fs.writeFileSync(monitoredConfigFile, JSON.stringify(Array.from(sessionObj.monitoredGroups.values()), null, 2));
      logger.info(`[${userId}] Pre-loaded ${dbGroups.length} monitored group(s) into memory`);
    }
  } catch (err: any) {
    logger.warn(`[${userId}] Note: could not pre-load groups directly: ${err.message}`);
  }

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 250,
    emitOwnEvents: false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  sessionObj.socket = sock;

  // Credential update handler
  sock.ev.on('creds.update', saveCreds);

  // Connection update handler (QR, Disconnect, Connect)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Only update and store QR if the user is not in pairing code mode
    if (qr && !sessionObj.pairingCode) {
      sessionObj.qr = qr;
      sessionObj.status = 'qr_ready';
      logger.info(`[${userId}] QR code generated`);

      try {
        await supabase.from('whatsapp_sessions').upsert(
          {
            user_id: userId,
            status: 'qr_ready',
          },
          { onConflict: 'user_id' }
        );
      } catch {}
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const wasRegistered = !!sock.authState?.creds?.registered;
      logger.warn(`[${userId}] Connection closed. Reason: ${statusCode}, LoggedOut: ${isLoggedOut}, Registered: ${wasRegistered}`);

      sessionObj.status = 'disconnected';
      sessionObj.qr = null;

      try {
        await supabase.from('whatsapp_sessions').upsert(
          {
            user_id: userId,
            status: 'disconnected',
          },
          { onConflict: 'user_id' }
        );
      } catch {}

      // If genuinely logged out by user on an existing linked account, clear session
      if (isLoggedOut && wasRegistered) {
        logger.info(`[${userId}] User officially logged out. Clearing credentials.`);
        fs.rmSync(userSessionDir, { recursive: true, force: true });
        activeSessions.delete(userId);
      } else if (wasRegistered) {
        // Automatic reconnection for already registered sessions
        const delay = statusCode === 408 ? 5000 : 3000;
        logger.info(`[${userId}] Scheduling automatic reconnection in ${delay}ms...`);
        setTimeout(() => {
          startWhatsAppSession(userId);
        }, delay);
      } else {
        // Unregistered session (e.g. pending pairing code or QR scan expired)
        logger.info(`[${userId}] Unregistered socket closed (code ${statusCode}). Ready for next attempt.`);
      }
    } else if (connection === 'open') {
      logger.info(`[${userId}] WhatsApp successfully connected!`);
      sessionObj.status = 'connected';
      sessionObj.qr = null;

      const userJid = sock.user?.id || '';
      const pushName = sock.user?.name || 'WhatsApp User';
      const phoneNumber = userJid.split(':')[0] || userJid.split('@')[0];

      sessionObj.phoneNumber = phoneNumber;
      sessionObj.pushName = pushName;

      try {
        await supabase.from('whatsapp_sessions').upsert(
          {
            user_id: userId,
            status: 'connected',
            phone_number: phoneNumber,
            push_name: pushName,
            last_active: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch {}

      // Send Welcome Message if not already sent (only for real users, not the system bot)
      if (userId !== SYSTEM_BOT_USER_ID) {
        try {
          const metaFilePath = path.join(userSessionDir, 'session_meta.json');
          let sessionMeta: any = {};
          if (fs.existsSync(metaFilePath)) {
            try {
              sessionMeta = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));
            } catch {}
          }

          if (!sessionMeta.welcome_sent) {
            // 1. Determine user email
            let resolvedEmail = sessionObj.userEmail || sessionMeta.user_email || null;
            let dbTier = 'free';

            try {
              const { data: userProfile } = await supabase
                .from('users')
                .select('subscription_tier, email')
                .eq('id', userId)
                .maybeSingle();

              if (userProfile?.subscription_tier) {
                dbTier = userProfile.subscription_tier;
              }
              if (!resolvedEmail && userProfile?.email) {
                resolvedEmail = userProfile.email;
              }
            } catch {}

            // 2. If email still not found, check auth.users directly
            if (!resolvedEmail) {
              try {
                const { data: authUser } = await supabase.auth.admin.getUserById(userId);
                if (authUser?.user?.email) {
                  resolvedEmail = authUser.user.email;
                  if (authUser.user.user_metadata?.subscription_tier) {
                    dbTier = authUser.user.user_metadata.subscription_tier;
                  }
                }
              } catch {}
            }

            // 3. Reconcile with live Flutterwave payments if still resolving to free
            let resolvedTier = dbTier;
            if (resolvedTier === 'free' && resolvedEmail) {
              try {
                const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-1e8a9756e3101a8eacead3470be58ee3-1a14ebc76c0vt-X';
                const flwRes = await fetch(
                  `https://api.flutterwave.com/v3/transactions?customer_email=${encodeURIComponent(resolvedEmail)}&status=successful`,
                  {
                    headers: { Authorization: `Bearer ${flwSecret}` },
                  }
                );
                if (flwRes.ok) {
                  const flwData = await flwRes.json();
                  if (flwData.status === 'success' && Array.isArray(flwData.data)) {
                    const validTx = flwData.data.find((tx: any) => {
                      if (tx.status !== 'successful') return false;
                      const txDate = new Date(tx.created_at).getTime();
                      return Date.now() - txDate < 30 * 24 * 60 * 60 * 1000;
                    });
                    if (validTx) {
                      const detected = validTx.meta?.tier || 'basic';
                      resolvedTier = detected;
                      logger.info(`[Welcome Message] Reconciled live Flutterwave payment for ${resolvedEmail}: Tier is ${detected}`);
                    }
                  }
                }
              } catch (flwErr) {
                logger.warn(`[Welcome Message] FLW check error: ${flwErr}`);
              }
            }

            // 4. Set accurate plan presentation
            let tierName = 'Free';
            let maxGroups = 1;
            let keywordsCount = 2;
            let summaryInfo = '1 AI summary lifetime';

            if (resolvedTier === 'basic') {
              tierName = 'Basic (₦2,000/mo)';
              maxGroups = 3;
              keywordsCount = 2;
              summaryInfo = '1 AI summary per day';
            } else if (resolvedTier === 'pro') {
              tierName = 'Pro (₦5,000/mo)';
              maxGroups = 6;
              keywordsCount = 3;
              summaryInfo = '3 AI summaries per day';
            } else if (resolvedTier === 'max') {
              tierName = 'Max (₦10,000/mo)';
              maxGroups = 10;
              keywordsCount = 4;
              summaryInfo = '5 AI summaries per day';
            } else if (resolvedTier === 'enterprise') {
              tierName = 'Enterprise (₦50,000/mo)';
              maxGroups = 20;
              keywordsCount = 10;
              summaryInfo = '10 AI summaries per day';
            }

            const welcomeText = 
`👋 *Welcome to ChatDigest!*

Your WhatsApp session is now actively connected.

📋 *Your Current Plan:* ${tierName}
• *Monitored Groups Allowance:* Up to ${maxGroups} group(s)
• *Keywords:* ${keywordsCount} keywords per group
• *AI Summaries:* ${summaryInfo}

⚡ *What you can do:*
1. *Keyword Alerts:* When any of your chosen words are mentioned in your monitored groups, you'll receive an instant notification here.
2. *AI Summaries & Meeting Notes:* Log in to your dashboard to generate concise executive summaries, view action items, and review discussions.

🔗 *Access Dashboard:* https://www.chatdigest.site/dashboard
💳 *Manage or Upgrade Plan:* https://www.chatdigest.site/dashboard/subscription

_Thank you for choosing ChatDigest!_`;

            // Wait 2 seconds to ensure socket handshake is stable
            setTimeout(async () => {
              const sent = await sendWhatsAppBotNotification(phoneNumber, welcomeText, sessionObj);
              if (sent) {
                sessionMeta.welcome_sent = true;
                sessionMeta.welcome_sent_at = new Date().toISOString();
                fs.writeFileSync(metaFilePath, JSON.stringify(sessionMeta, null, 2));
              }
            }, 2500);
          }
        } catch (welcomeErr) {
          logger.warn(`[${userId}] Failed to send welcome onboarding message: ${welcomeErr}`);
        }
      }
    }
  });

  // Message ingestion handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      const jid = msg.key.remoteJid;
      if (!jid || !jid.endsWith('@g.us')) continue; // Group chats only

      const isFromMe = !!msg.key.fromMe;
      // Allow user messages to also be evaluated if sent by self (for live testing)
      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!messageContent.trim()) continue;

      const senderJid = msg.key.participant || msg.key.remoteJid || (isFromMe ? sock.user?.id : '');
      const senderName = isFromMe ? 'You' : (msg.pushName || 'Participant');
      const timestamp = new Date((Number(msg.messageTimestamp) || Date.now() / 1000) * 1000).toISOString();

      logger.info(`[${userId}] Ingesting group msg from ${senderName} in ${jid}: "${messageContent.slice(0, 40)}"`);

      // 1. Resolve monitored group configuration: check in-memory map first, then fall back to Supabase query
      let monitoredGroup = sessionObj.monitoredGroups?.get(jid);
      if (!monitoredGroup) {
        try {
          const { data } = await supabase
            .from('monitored_groups')
            .select('*')
            .eq('user_id', userId)
            .eq('group_jid', jid)
            .maybeSingle();
          if (data) {
            monitoredGroup = {
              groupJid: data.group_jid,
              groupName: data.group_name,
              keywords: data.keywords || [],
              isActive: data.is_active !== false,
            };
            sessionObj.monitoredGroups?.set(jid, monitoredGroup);
          }
        } catch {
          // Ignored
        }
      }

      const keywords: string[] = monitoredGroup?.keywords || [];
      const lowerText = messageContent.toLowerCase();
      // Case-insensitive check for configured keywords
      const matched = keywords.filter((kw) => lowerText.includes(kw.trim().toLowerCase()));

      logger.info(`[${userId}] Keyword check in ${jid} - Keywords: [${keywords.join(', ')}] - Matched: [${matched.join(', ')}]`);

      // 2. Store in group messages buffer for instant AI Summarization
      if (!sessionObj.groupMessages) sessionObj.groupMessages = new Map();
      const groupList = sessionObj.groupMessages.get(jid) || [];
      groupList.push({
        groupJid: jid,
        senderJid: senderJid || '',
        senderName,
        content: messageContent,
        timestamp,
      });
      // Keep up to 1000 messages per group
      if (groupList.length > 1000) groupList.splice(0, groupList.length - 1000);
      sessionObj.groupMessages.set(jid, groupList);

      // Persist group messages buffer to disk asynchronously (merging with existing file)
      try {
        const filePath = path.join(userSessionDir, 'group_messages.json');
        let existingDisk: Record<string, IngestedMessage[]> = {};
        if (fs.existsSync(filePath)) {
          try {
            existingDisk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {}
        }
        for (const [gJid, msgs] of sessionObj.groupMessages.entries()) {
          existingDisk[gJid] = msgs;
        }
        fs.writeFileSync(filePath, JSON.stringify(existingDisk, null, 2));
      } catch {}

      // Insert into messages table
      try {
        await supabase.from('messages').insert({
          group_jid: jid,
          sender_jid: senderJid || '',
          sender_name: senderName,
          content: messageContent,
          timestamp,
          processed: false,
          has_keyword_match: matched.length > 0,
          matched_keywords: matched,
        });
      } catch {}

      // 3. If keywords matched, log instant alert for user
      if (matched.length > 0) {
        const groupTitle = monitoredGroup?.groupName || 'WhatsApp Group';

        for (const kw of matched) {
          logger.info(`🚨 [${userId}] KEYWORD ALERT TRIGGERED! Keyword: "${kw}" in "${groupTitle}" by ${senderName}`);

          const alertRecord = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            user_id: userId,
            group_jid: jid,
            group_name: groupTitle,
            sender_name: senderName,
            keyword: kw,
            message_content: messageContent,
            created_at: new Date().toISOString(),
          };

          // Store in bridge session memory for instant dashboard fetch
          if (!sessionObj.recentAlerts) sessionObj.recentAlerts = [];
          sessionObj.recentAlerts.unshift({
            id: alertRecord.id,
            keyword: kw,
            groupJid: jid,
            groupName: groupTitle,
            senderName,
            messageContent,
            createdAt: alertRecord.created_at,
          });
          if (sessionObj.recentAlerts.length > 100) {
            sessionObj.recentAlerts = sessionObj.recentAlerts.slice(0, 100);
          }

          // Persist alerts to disk
          try {
            const userDir = path.join(SESSIONS_DIR, userId);
            fs.writeFileSync(path.join(userDir, 'recent_alerts.json'), JSON.stringify(sessionObj.recentAlerts, null, 2));
          } catch {}

          // Push to Next.js internal endpoint
          fetch('http://localhost:3000/api/alerts/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertRecord),
          }).catch((err) => {
            logger.warn(`Failed to push alert to Next.js internal endpoint: ${err.message}`);
          });

          // Also attempt Supabase insert directly
          try {
            await supabase.from('keyword_alerts').insert(alertRecord);
          } catch {}

          // 4. Send WhatsApp DM Alert to the user (via Official Bot or User fallback)
          if (sessionObj.phoneNumber) {
            const previewSnippet = messageContent.length > 90
              ? `"${messageContent.slice(0, 90)}..."`
              : `"${messageContent}"`;

            const alertWhatsAppMessage =
`🚨 *ChatDigest Keyword Alert!*

📌 *Group:* ${groupTitle}
👤 *Sender:* ${senderName}
🔑 *Trigger Word:* \`${kw}\`

💬 *Snippet:* ${previewSnippet}

📊 *Full Context & AI Digest:*
To read the entire conversation context and run AI summaries, view your dashboard:
👉 https://www.chatdigest.site/dashboard/alerts`;

            sendWhatsAppBotNotification(sessionObj.phoneNumber, alertWhatsAppMessage, sessionObj).catch((e) => {
              logger.warn(`Failed to send WhatsApp alert to ${sessionObj.phoneNumber}: ${e}`);
            });
          }
        }
      }
    }
  });

  return sessionObj;
}

// REST Endpoints for Next.js

// 1. Start new session (generates QR)
app.post('/api/session/start', async (req, res) => {
  const { userId, userEmail } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const session = await startWhatsAppSession(userId);
    if (userEmail) {
      session.userEmail = userEmail;
      try {
        const userSessionDir = path.join(SESSIONS_DIR, userId);
        const metaFile = path.join(userSessionDir, 'session_meta.json');
        let currentMeta: any = {};
        if (fs.existsSync(metaFile)) {
          try { currentMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8')); } catch {}
        }
        currentMeta.user_email = userEmail;
        fs.writeFileSync(metaFile, JSON.stringify(currentMeta, null, 2));
      } catch {}
    }

    return res.json({
      status: session.status,
      qr: session.qr,
      pairingCode: session.pairingCode || null,
    });
  } catch (err: any) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// 1b. Request 8-digit Pairing Code for Single-Device linking
app.post('/api/session/pairing-code', async (req, res) => {
  const { userId, userEmail, phoneNumber } = req.body;
  if (!userId || !phoneNumber) {
    return res.status(400).json({ error: 'userId and phoneNumber are required' });
  }

  // Clean phone number: remove +, spaces, dashes, brackets
  let cleanNumber = String(phoneNumber).replace(/[^0-9]/g, '');

  // Handle local Nigerian / common international number formats
  if (cleanNumber.startsWith('2340') && cleanNumber.length === 14) {
    cleanNumber = '234' + cleanNumber.slice(4);
  } else if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
    cleanNumber = '234' + cleanNumber.slice(1);
  }

  if (cleanNumber.length < 8) {
    return res.status(400).json({ error: 'Please enter a valid phone number with country code' });
  }

  try {
    let session = activeSessions.get(userId);
    const userSessionDir = path.join(SESSIONS_DIR, userId);

    // If session is already connected, inform user
    if (session && session.status === 'connected') {
      return res.json({
        success: true,
        status: 'connected',
        phoneNumber: session.phoneNumber,
        message: 'WhatsApp session is already connected.',
      });
    }

    // Always reset any dirty unlinked or QR-ready socket so pairing code runs on a pristine handshake
    if (session && session.socket) {
      try {
        session.socket.end(undefined);
      } catch {}
    }
    try {
      if (fs.existsSync(userSessionDir)) {
        fs.rmSync(userSessionDir, { recursive: true, force: true });
      }
    } catch {}
    activeSessions.delete(userId);

    // Start a brand-new socket specifically for pairing
    session = await startWhatsAppSession(userId);

    if (userEmail) {
      session.userEmail = userEmail;
      try {
        const metaFile = path.join(userSessionDir, 'session_meta.json');
        let currentMeta: any = {};
        if (fs.existsSync(metaFile)) {
          try { currentMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8')); } catch {}
        }
        currentMeta.user_email = userEmail;
        fs.writeFileSync(metaFile, JSON.stringify(currentMeta, null, 2));
      } catch {}
    }

    if (!session.socket) {
      return res.status(500).json({ error: 'WhatsApp socket initializing, please retry in 3 seconds' });
    }

    // Wait 2 seconds to ensure WebSocket transport is established before calling requestPairingCode
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Request pairing code from Baileys
    const rawCode = await session.socket.requestPairingCode(cleanNumber);
    const formattedCode =
      rawCode && rawCode.length === 8 && !rawCode.includes('-')
        ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
        : rawCode;

    session.pairingCode = formattedCode;
    logger.info(`[${userId}] Pairing code generated for ${cleanNumber}: ${formattedCode}`);

    return res.json({
      success: true,
      pairingCode: formattedCode,
      rawCode,
      phoneNumber: cleanNumber,
      status: session.status,
    });
  } catch (err: any) {
    logger.error(`[${userId}] Error requesting pairing code: ${err.message}`);
    try {
      const userSessionDir = path.join(SESSIONS_DIR, userId);
      fs.rmSync(userSessionDir, { recursive: true, force: true });
      activeSessions.delete(userId);
    } catch {}
    return res.status(500).json({
      error: `Pairing failed (${err.message}). We refreshed your session, please click "Get 8-Digit Pairing Code" again.`,
    });
  }
});

// 2. Check session status
app.get('/api/session/:userId/status', (req, res) => {
  const { userId } = req.params;
  const session = activeSessions.get(userId);

  if (!session) {
    return res.json({ status: 'disconnected', qr: null, pairingCode: null });
  }

  return res.json({
    status: session.status,
    qr: session.qr,
    pairingCode: session.pairingCode || null,
    phoneNumber: session.phoneNumber,
    pushName: session.pushName,
  });
});

// 3. List all WhatsApp groups the session is part of
app.get('/api/session/:userId/groups', async (req, res) => {
  const { userId } = req.params;
  const session = activeSessions.get(userId);

  if (!session || session.status !== 'connected' || !session.socket) {
    return res.status(400).json({ error: 'WhatsApp session not connected' });
  }

  try {
    const chats = await session.socket.groupFetchAllParticipating();
    const groupsList = Object.values(chats).map((group: any) => ({
      id: group.id,
      name: group.subject,
      participantsCount: group.participants?.length || 0,
      creation: group.creation,
    }));

    // Cross-reference with monitored groups in memory and Supabase
    const memoryGroups = session.monitoredGroups || new Map();
    let dbGroups: any[] = [];
    try {
      const { data } = await supabase
        .from('monitored_groups')
        .select('*')
        .eq('user_id', userId);
      dbGroups = data || [];
    } catch {}

    const dbMap = new Map(dbGroups.map((m: any) => [m.group_jid, m]));

    const combined = groupsList.map((g) => {
      const memConfig = memoryGroups.get(g.id);
      const dbConfig = dbMap.get(g.id);
      const isMon = !!(memConfig ? memConfig.isActive : dbConfig?.is_active);
      const kw = memConfig ? memConfig.keywords : dbConfig?.keywords || [];
      return {
        id: g.id,
        name: g.name,
        isMonitored: isMon,
        keywords: kw,
      };
    });

    return res.json({ groups: combined, isLive: true });
  } catch (err: any) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// 3b. Sync monitored groups directly from Next.js into memory
app.post('/api/session/:userId/monitored-groups', (req, res) => {
  const { userId } = req.params;
  const { groupJid, groupName, keywords, isActive } = req.body;

  let session = activeSessions.get(userId);
  if (!session) {
    session = {
      userId,
      socket: null,
      qr: null,
      status: 'disconnected',
      monitoredGroups: new Map(),
      recentAlerts: [],
    };
    activeSessions.set(userId, session);
  }

  if (!session.monitoredGroups) {
    session.monitoredGroups = new Map();
  }

  if (isActive === false) {
    session.monitoredGroups.delete(groupJid);
    logger.info(`[${userId}] Removed group ${groupJid} from in-memory monitor`);
  } else {
    session.monitoredGroups.set(groupJid, {
      groupJid,
      groupName,
      keywords: keywords || [],
      isActive: true,
    });
    logger.info(`[${userId}] Synced in-memory monitored group "${groupName}" (${groupJid}) with keywords: [${(keywords || []).join(', ')}]`);
  }

  // Persist to user session dir on disk
  try {
    const userDir = path.join(SESSIONS_DIR, userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    fs.writeFileSync(
      path.join(userDir, 'monitored_groups.json'),
      JSON.stringify(Array.from(session.monitoredGroups.values()), null, 2)
    );
  } catch {}

  return res.json({
    success: true,
    monitoredCount: session.monitoredGroups.size,
    monitored: Array.from(session.monitoredGroups.values()),
  });
});

// 3c. Get live memory alerts
app.get('/api/session/:userId/alerts', (req, res) => {
  const { userId } = req.params;
  let session = activeSessions.get(userId);
  let memAlerts = session?.recentAlerts || [];

  // Always merge with persisted disk alerts so nothing is lost
  const alertsFile = path.join(SESSIONS_DIR, userId, 'recent_alerts.json');
  let diskAlerts: any[] = [];
  if (fs.existsSync(alertsFile)) {
    try {
      diskAlerts = JSON.parse(fs.readFileSync(alertsFile, 'utf-8'));
    } catch {}
  }

  // Combine and deduplicate
  const combined = [...memAlerts];
  const seen = new Set(combined.map((a: any) => a.id || `${a.groupJid}_${a.keyword}_${a.messageContent}`));
  for (const da of diskAlerts) {
    const key = da.id || `${da.groupJid}_${da.keyword}_${da.messageContent}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(da);
    }
  }

  // Sort newest first
  combined.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (session) {
    session.recentAlerts = combined;
  }

  return res.json({
    alerts: combined,
  });
});

// 3d. Get group messages within timeframe for AI Summaries
app.get('/api/session/:userId/messages', (req, res) => {
  const { userId } = req.params;
  const { groupJid, hoursBack } = req.query;

  const session = activeSessions.get(userId);
  const userSessionDir = path.join(SESSIONS_DIR, userId);
  const messagesFile = path.join(userSessionDir, 'group_messages.json');

  let allGroupMessages: IngestedMessage[] = [];

  if (session && session.groupMessages && groupJid && session.groupMessages.has(groupJid as string)) {
    allGroupMessages = session.groupMessages.get(groupJid as string) || [];
  } else if (fs.existsSync(messagesFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
      if (groupJid && data[groupJid as string]) {
        allGroupMessages = data[groupJid as string];
      }
    } catch {}
  }

  const hours = Number(hoursBack) || 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).getTime();

  const filtered = allGroupMessages.filter((m) => {
    const t = new Date(m.timestamp).getTime();
    return t >= cutoff;
  });

  return res.json({
    groupJid,
    count: filtered.length,
    messages: filtered,
  });
});

// 4. Logout / disconnect session
app.post('/api/session/:userId/logout', async (req, res) => {
  const { userId } = req.params;
  const session = activeSessions.get(userId);

  if (session && session.socket) {
    try {
      await session.socket.logout();
    } catch {}
  }

  const userSessionDir = path.join(SESSIONS_DIR, userId);
  fs.rmSync(userSessionDir, { recursive: true, force: true });
  activeSessions.delete(userId);

  return res.json({ success: true });
});

// 5. Send message or summary back to WhatsApp group
app.post('/api/message/send', async (req, res) => {
  const { userId, groupJid, text } = req.body;
  const session = activeSessions.get(userId);

  if (!session || session.status !== 'connected' || !session.socket) {
    return res.status(400).json({ error: 'Session not connected' });
  }

  try {
    const result = await session.socket.sendMessage(groupJid, { text });
    return res.json({ success: true, messageId: result.key.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Scheduled message worker: polls scheduled_messages table every 30 seconds
setInterval(async () => {
  try {
    const now = new Date().toISOString();
    const { data: pending, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(10);

    if (error || !pending || pending.length === 0) return;

    for (const item of pending) {
      const session = activeSessions.get(item.user_id);
      if (session && session.status === 'connected' && session.socket) {
        try {
          await session.socket.sendMessage(item.group_jid, { text: item.message_content });
          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', item.id);
          logger.info(`Scheduled message sent to ${item.group_jid}`);
        } catch (err: any) {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'failed', error_message: err.message })
            .eq('id', item.id);
        }
      }
    }
  } catch (err) {
    // Background polling catch
  }
}, 30000);

// 6. Admin Endpoints for Dedicated Official Bot
app.get('/api/admin/bot/status', async (req, res) => {
  const botSession = activeSessions.get(SYSTEM_BOT_USER_ID);
  return res.json({
    status: botSession ? botSession.status : 'disconnected',
    phoneNumber: botSession?.phoneNumber || null,
    pushName: botSession?.pushName || 'Official ChatDigest Bot',
    hasQr: !!botSession?.qr,
    qr: botSession?.qr || null,
    pairingCode: botSession?.pairingCode || null,
  });
});

app.post('/api/admin/bot/pair', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const session = await startWhatsAppSession(SYSTEM_BOT_USER_ID);
    // Clean phone number: remove +, spaces, dashes, brackets
    let cleanNumber = String(phoneNumber).replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('2340') && cleanNumber.length === 14) {
      cleanNumber = '234' + cleanNumber.slice(4);
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
      cleanNumber = '234' + cleanNumber.slice(1);
    }

    // Allow socket 2.5s to initialize before requesting pairing code
    setTimeout(async () => {
      try {
        if (session.socket && session.status !== 'connected') {
          const rawCode = await session.socket.requestPairingCode(cleanNumber);
          const formattedCode =
            rawCode && rawCode.length === 8 && !rawCode.includes('-')
              ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
              : rawCode;
          session.pairingCode = formattedCode;
          logger.info(`[Official Bot] Generated pairing code: ${formattedCode} for phone: ${cleanNumber}`);
        }
      } catch (err: any) {
        logger.error(`[Official Bot] Pairing code generation failed: ${err.message}`);
      }
    }, 2500);

    return res.json({
      message: 'Pairing requested. Check /api/admin/bot/status in 3 seconds for your 8-digit code.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Auto-restore ALL WhatsApp sessions (Official Bot and User sessions) if session directories exist on startup
setTimeout(async () => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sessionId = entry.name;
        const credsFile = path.join(SESSIONS_DIR, sessionId, 'creds.json');
        
        // If creds.json exists, this was an active WhatsApp session
        if (fs.existsSync(credsFile)) {
          logger.info(`[Startup Auto-Restore] Restoring WhatsApp session for: ${sessionId}`);
          try {
            await startWhatsAppSession(sessionId);
            // Stagger multiple restores by 2 seconds to avoid connection rate limits
            await new Promise((r) => setTimeout(r, 2000));
          } catch (err: any) {
            logger.warn(`[Startup Auto-Restore] Could not restore session ${sessionId}: ${err.message}`);
          }
        }
      }
    }
  } catch (err: any) {
    logger.warn(`Could not auto-restore sessions on startup: ${err.message}`);
  }
}, 3000);

app.listen(PORT, () => {
  logger.info(`WhatsApp Baileys Bridge Service listening on port ${PORT}`);
});
