# ChatDigest 🚀
**WhatsApp Group Summarization & Keyword Alert SaaS Platform**

ChatDigest is a full-stack SaaS application that allows users to link their WhatsApp account via a secure Baileys bridge, select specific groups to monitor, track custom trigger keywords in real time, and receive automated executive AI bullet summaries and action items.

---

## 🏗 System Architecture

```mermaid
graph TD
  User([User / Browser]) <--> NextApp[Next.js App Router / Dashboard]
  NextApp <--> Supabase[(Supabase Database & Auth)]
  NextApp <--> OpenAI[OpenAI API (GPT-4o-mini)]
  NextApp <--> Bridge[Baileys Bridge Service (Node.js)]
  Bridge <--> WhatsApp[WhatsApp Web Protocol (Multi-Device)]
  Bridge <--> Supabase
```

1. **Frontend & Backend (Next.js 16 + Tailwind CSS):**
   - User authentication (Email/Password + **Google OAuth**).
   - Protected dashboard with multi-view navigation.
   - Real-time QR Code pairing display with live polling.
   - Group monitoring manager with tier limit gating (Base: 1, Pro: 3, Max: 10).
   - Keyword manager per group for instant triggers.
   - On-demand and scheduled AI group summaries.
   - Subscription tier switcher & pricing comparison.

2. **Supabase Backend & Security:**
   - Pre-configured with your Supabase credentials:
     - URL: `https://bogkfyqaoczlejgaksee.supabase.co`
     - Publishable Key configured in `.env.local`
   - Complete database schema with Row Level Security (RLS) policies in [`supabase_schema.sql`](file:///c:/Users/Admin/Documents/GitHub/chat-digest/supabase_schema.sql).

3. **WhatsApp Bridge Service (`bridge-service/`):**
   - Built with `@whiskeysockets/baileys` multi-device protocol.
   - Listens for `messages.upsert` from active groups.
   - Filters messages against user-defined keywords and immediately registers keyword alerts in Supabase.
   - Provides REST endpoints for session initiation, QR code fetching, live group discovery, and scheduled message dispatching.

---

## 🗄 1. Run the Supabase SQL Schema

Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/bogkfyqaoczlejgaksee/sql) and run the contents of [`supabase_schema.sql`](file:///c:/Users/Admin/Documents/GitHub/chat-digest/supabase_schema.sql):

- Creates tables: `users`, `whatsapp_sessions`, `monitored_groups`, `messages`, `summaries`, `scheduled_messages`, and `keyword_alerts`.
- Adds triggers to auto-create profile rows upon sign-up.
- Configures RLS policies for complete multi-tenant privacy.

For an existing installation, also run [`supabase_summary_sharing.sql`](./supabase_summary_sharing.sql) before deploying public summary links. Summary links expose only the saved digest, are unlisted, and can be revoked by the owner.

---

## 🔑 2. Configure Google Authentication in Supabase

1. Go to your **Google Cloud Console** > **APIs & Services** > **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Set Authorized Redirect URI to:
   ```
   https://bogkfyqaoczlejgaksee.supabase.co/auth/v1/callback
   ```
4. In your [Supabase Dashboard](https://supabase.com/dashboard/project/bogkfyqaoczlejgaksee/auth/providers), navigate to **Authentication** > **Providers** > **Google**.
5. Enable Google and paste your Client ID and Client Secret.

---

## 💻 3. Running Locally

### Start Next.js App:
```bash
npm run dev
```
Runs at: [http://localhost:3000](http://localhost:3000)

### Start Baileys Bridge Service:
```bash
cd bridge-service
npm run dev
# or npm run build && npm start
```
Runs at: [http://localhost:5001](http://localhost:5001)

---

## 💰 Subscription Gating Overview

| Tier | Price | Max Groups | Features |
|---|---|---|---|
| **Base** | ₦1,500/mo | 1 | Real-time keyword alerts (up to 5 keywords) |
| **Pro** | ₦5,000/mo | 3 | Keyword alerts + Daily AI bullet digests & action items |
| **Max** | ₦10,000/mo | 10 | Keyword alerts + AI summaries + Weekly digests + Archive search |

---

## 🛡 WhatsApp Safety & Disclaimers

The user interface includes safety guidance advising users to use ChatDigest responsibly to avoid account bans.
