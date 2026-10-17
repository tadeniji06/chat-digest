const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity-ide/brain/be58bc35-d657-4f30-80de-bacb3f91dbb7/.system_generated/tasks';
const files = fs.readdirSync(path).filter(f => f.endsWith('.log'));

const messagesByGroup = {};

for (const file of files) {
  try {
    const content = fs.readFileSync(path + '/' + file, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('Ingesting group msg from') && line.includes('@g.us')) {
        try {
          const json = JSON.parse(line);
          const msgStr = json.msg;
          // Example: [userId] Ingesting group msg from Dave Grafics in 120363398128068681@g.us: "Young man, do giveaway jare"
          const prefixMatch = msgStr.match(/Ingesting group msg from (.*?) in (.*?@g\.us):\s*\"([\s\S]*)\"$/);
          if (prefixMatch) {
            const senderName = prefixMatch[1];
            const groupJid = prefixMatch[2];
            const text = prefixMatch[3];

            if (!messagesByGroup[groupJid]) messagesByGroup[groupJid] = [];
            
            // Deduplicate by text and approximate timestamp
            const isDup = messagesByGroup[groupJid].some(m => m.content === text && Math.abs(new Date(m.timestamp).getTime() - json.time) < 5000);
            if (!isDup) {
              messagesByGroup[groupJid].push({
                groupJid,
                senderJid: '',
                senderName,
                content: text,
                timestamp: new Date(json.time).toISOString()
              });
            }
          }
        } catch {}
      }
    }
  } catch {}
}

console.log('Group message counts found in task logs:');
for (const [jid, list] of Object.entries(messagesByGroup)) {
  console.log(`- ${jid}: ${list.length} messages`);
}

// Write to group_messages.json
const destPath = 'auth_sessions/c30dfebe-cf39-4866-b92f-97ef5ca85961/group_messages.json';
let existing = {};
try {
  existing = JSON.parse(fs.readFileSync(destPath, 'utf8'));
} catch {}

for (const [jid, list] of Object.entries(messagesByGroup)) {
  const current = existing[jid] || [];
  const seen = new Set(current.map(m => `${m.content}_${m.timestamp}`));
  for (const m of list) {
    const k = `${m.content}_${m.timestamp}`;
    if (!seen.has(k)) {
      seen.add(k);
      current.push(m);
    }
  }
  existing[jid] = current;
}

fs.writeFileSync(destPath, JSON.stringify(existing, null, 2));
console.log('Successfully written to', destPath);
