const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const P = require('pino');
const config = require('./setting');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
const port = Number(process.env.PORT || 9090);
const authFolder = path.join(__dirname, 'auth_info_baileys');
let sock;
const pairingState = {
  qrCode: null,
  pairCode: null,
  botNumber: null,
  sessionPassword: null,
  isConnected: false,
  connectionTime: null,
  error: null,
  lastUpdate: null
};

const settingsFile = path.join(__dirname, 'bot-settings.json');
const defaultSettings = {
  adminPassword: '6K92OG23',
  prefix: config.PREFIX || '.',
  welcomeText: '🎭 *සාදරයෙන් පිළිගනිමු! PS MD බොට් සම්බන්ධ වී ඇත!* 🎭\n\n*බොට් සාර්ථකව සම්බන්ධ වී ඇත. ඔබට සුබ පැතුම්!*\n\n*භාවිතා කිරීමට .menu ටයිප් කරන්න.*\n\n*අපගේ PS MD තේමය සමඟ භාවිතා කරන්න!*',
  currentSessionPassword: null
};

function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) {
      fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2), 'utf8');
      return { ...defaultSettings };
    }
    const data = fs.readFileSync(settingsFile, 'utf8');
    return Object.assign({}, defaultSettings, JSON.parse(data || '{}'));
  } catch (error) {
    console.error('Failed to load settings:', error.message);
    return { ...defaultSettings };
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error.message);
    return false;
  }
}

function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function getOwnerJid() {
  if (!config.OWNER_NUMBER) return null;
  return config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
}

if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

function createPairCode() {
  return Math.random().toString().slice(2, 14).padEnd(12, '0');
}

async function createQrCodeData(qrString) {
  const qrDataUrl = await qrcode.toDataURL(qrString, { type: 'image/png', width: 400 });
  return qrDataUrl.split(',')[1];
}

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    let version = [3, 5, 4];

    try {
      const update = await fetchLatestBaileysVersion();
      version = update.version || version;
    } catch (error) {
      console.log('⚠️ Could not fetch latest Baileys version, using fallback version');
    }

    sock = makeWASocket({
      logger: P({ level: 'silent' }),
      browser: ['PS', 'MD', '1.0.0'],
      auth: state,
      version,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      pairingState.lastUpdate = new Date().toISOString();
      const { connection, lastDisconnect, qr } = update;
      console.log('🔄 connection.update', JSON.stringify(update));

      if (qr) {
        pairingState.qrCode = await createQrCodeData(qr);
        pairingState.pairCode = pairingState.pairCode || createPairCode();
        pairingState.isConnected = false;
        pairingState.connectionTime = null;
        pairingState.error = null;
        console.log('🔗 QR code generated. Open /pairing to scan.');
      }

      if (connection === 'open') {
        pairingState.isConnected = true;
        pairingState.connectionTime = new Date().toLocaleString();
        pairingState.botNumber = sock.user?.id || null;
        pairingState.qrCode = null;
        pairingState.pairCode = null;
        pairingState.error = null;

        const settings = loadSettings();
        const sessionPassword = generatePassword(8);
        settings.currentSessionPassword = sessionPassword;
        saveSettings(settings);
        pairingState.sessionPassword = sessionPassword;

        const connectMessage = `*🎭 PS MD බොට් සම්බන්ධ වෙමින් පවතී... 🔄*

*කරුණාකර මිනිත්තු 5ක් රැඳී සිටින්න... ⏳*
* _ඉන්පසු .alive විධානය භාවිතා කරන්න_

*මිනිත්තු 5කට පසු කිසිදු ප්‍රතිචාරයක් නොලැබේ නම් පමණක්:*
* _කරුණාකර ඔබේ උපාංගය නැවත සම්බන්ධ කරන්න ( ʀᴇ-ʟɪɴᴋ ᴅᴇᴠɪᴄᴇ ) 🔁_

🔐 *ඔබේ මුරපදය:* \`${sessionPassword}\` 
🛠 *සැකසුම් වෙනස් කිරීමට මෙම මුරපදය භාවිතා කරන්න*`;
        const botId = sock.user?.id;

        if (botId) {
          await sock.sendMessage(botId, { text: connectMessage });
        }

        const ownerJid = getOwnerJid();
        if (ownerJid) {
          await sock.sendMessage(ownerJid, { text: connectMessage });
        }

        console.log('✅ PS MD is connected to WhatsApp.');
      }

      if (connection === 'close') {
        pairingState.isConnected = false;
        console.log('❌ WhatsApp connection closed:', JSON.stringify(lastDisconnect || {}));
        if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
          console.log('⚠️ Logged out from WhatsApp. Clearing session and exiting.');
          fs.rmSync(authFolder, { recursive: true, force: true });
          process.exit(0);
        } else {
          console.log('⚠️ Connection closed. Reconnecting in 5 seconds...');
          setTimeout(connectToWhatsApp, 5000);
        }
      }
    });

    sock.ev.on('messages.upsert', async (messageUpsert) => {
      try {
        const messages = messageUpsert.messages || [];
        const message = messages[0];
        if (!message || !message.message) return;

        const type = getContentType(message.message);
        const from = message.key.remoteJid;
        const text =
          type === 'conversation'
            ? message.message.conversation
            : type === 'extendedTextMessage'
            ? message.message.extendedTextMessage.text || ''
            : '';

        if (!text || !from || from === 'status@broadcast') return;

        const settings = loadSettings();
        const prefix = settings.prefix || config.PREFIX;
        const trimmed = text.trim();
        const command = trimmed.startsWith(prefix)
          ? trimmed.slice(prefix.length).split(' ')[0].toLowerCase()
          : null;
        const args = trimmed.split(' ').slice(1);
        const q = args.join(' ');

        const menuResponses = {
          system: `🖥️ System status is stable. Use .alive to check bot connectivity.`,
          bot: `🤖 PS MD is ready. Use .menu to explore commands.`,
          privacy: `🔒 Privacy command received. Visit /settings to configure bot security and privacy options.`,
          setting: `⚙️ Open the settings page at /settings to update bot configuration and password.`,
          getdp: `📸 getdp is available. This command will fetch a profile picture once integrated.`,
          csong: `🎵 csong command is available. Use it for custom song tools.`,
          setsudo: `🛡️ setsudo command is available. Manage sudo users from the settings page.`,
          delsudo: `❌ delsudo is available. Manage sudo users from the settings page.`,
          setcall: `📞 setcall command is available. Configure call handling from settings.`,
          delcall: `🗑️ delcall is available.`,
          ban: `⛔ ban command is available. Use it to block users or groups when fully integrated.`,
          unban: `✅ unban command is available.`,
          song: `🎵 Social song search is available.`,
          video: `🎬 Social video download is available.`,
          fb: `📘 Facebook download is available.`,
          tiktok: `🎥 TikTok download is available.`,
          insta: `📷 Instagram download is available.`,
          twitter: `🐦 Twitter download is available.`,
          movie: `🎞️ Movie search is available.`,
          apk: `📦 APK search is available.`,
          img: `🖼️ Image search is available.`,
          xnxx: `🔞 XNXX download is available.`,
          xham: `🔞 Xhamster download is available.`,
          del: `🗑️ del command placeholder.`,
          tagadmins: `🏷️ tagadmins placeholder.`,
          tagall: `📢 tagall placeholder.`,
          hidetag: `🙈 hidetag placeholder.`,
          ginfo: `ℹ️ ginfo placeholder.`,
          glink: `🔗 glink placeholder.`,
          grlink: `🔗 grlink placeholder.`,
          gnlink: `🔗 gnlink placeholder.`,
          gname: `📝 gname placeholder.`,
          gdec: `✍️ gdec placeholder.`,
          gdp: `🖼️ gdp placeholder.`,
          grdp: `🖼️ grdp placeholder.`,
          lock: `🔒 lock placeholder.`,
          unlock: `🔓 unlock placeholder.`,
          close: `🚫 close placeholder.`,
          open: `✅ open placeholder.`,
          addadmin: `➕ addadmin placeholder.`,
          addmember: `➕ addmember placeholder.`,
          join: `🔗 join placeholder.`,
          left: `👋 left placeholder.`,
          gdisappearing: `🕳️ gdisappearing placeholder.`,
          pin: `📌 pin placeholder.`,
          unpin: `📍 unpin placeholder.`,
          gsave: `💾 gsave placeholder.`,
          ganti: `🔄 ganti placeholder.`,
          mychannels: `📺 mychannels placeholder.`,
          setchannel: `📺 setchannel placeholder.`,
          delchannel: `🗑️ delchannel placeholder.`,
          creact: `🎉 creact placeholder.`
        };

        const commandHandlers = {
          menu: async () => {
            const menuText = `📜 *PS MD MENU*\n\n*OWNER MENU*\nprivacy | setting | getdp | csong | setsudo | delsudo | setcall | delcall | ban | unban\n\n*SOCIAL MENU*\nsong | video | fb | tiktok | insta | twitter | movie | apk | img | xnxx | xham\n\n*AI MENU*\nfluxai\n\n*GROUP MENU*\nadd | kick | promote | del | tagadmins | tagall | hidetag | ginfo | glink | grlink | gnlink | gname | gdec | gdp | grdp | lock | unlock | close | open | addadmin | addmember | join | left | gdisappearing | pin | unpin | gsave | ban | unban | ganti\n\n*TOOLS MENU*\nping | system | alive | menu | bot\n\n*EDUCATION MENU*\npaper\n\n*CHANNEL MENU*\nmychannels | setchannel | delchannel | creact`;
            await sock.sendMessage(from, { text: menuText }, { quoted: message });
          },
          alive: async () => {
            const aliveText = `💚 *PS MD is online*\nConnected: ${pairingState.isConnected ? 'Yes' : 'No'}\nBot Number: ${pairingState.botNumber || 'Not available'}\nSession Password: ${pairingState.sessionPassword || 'Not set'}`;
            await sock.sendMessage(from, { text: aliveText }, { quoted: message });
          },
          ping: async () => {
            await sock.sendMessage(from, { text: '🏓 Pong! Bot latency is good.' }, { quoted: message });
          },
          add: async () => {
            if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: 'This command can only be used in groups.' }, { quoted: message });
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentioned.length === 0) return await sock.sendMessage(from, { text: 'Please mention a user to add.' }, { quoted: message });
            try {
              await sock.groupParticipantsUpdate(from, mentioned, 'add');
              await sock.sendMessage(from, { text: `✅ Added ${mentioned.length} user(s) to the group.` }, { quoted: message });
            } catch (error) {
              await sock.sendMessage(from, { text: '❌ Failed to add user(s).' }, { quoted: message });
            }
          },
          kick: async () => {
            if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: 'This command can only be used in groups.' }, { quoted: message });
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentioned.length === 0) return await sock.sendMessage(from, { text: 'Please mention a user to kick.' }, { quoted: message });
            try {
              await sock.groupParticipantsUpdate(from, mentioned, 'remove');
              await sock.sendMessage(from, { text: `✅ Kicked ${mentioned.length} user(s) from the group.` }, { quoted: message });
            } catch (error) {
              await sock.sendMessage(from, { text: '❌ Failed to kick user(s).' }, { quoted: message });
            }
          },
          promote: async () => {
            if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: 'This command can only be used in groups.' }, { quoted: message });
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentioned.length === 0) return await sock.sendMessage(from, { text: 'Please mention a user to promote.' }, { quoted: message });
            try {
              await sock.groupParticipantsUpdate(from, mentioned, 'promote');
              await sock.sendMessage(from, { text: `✅ Promoted ${mentioned.length} user(s) to admin.` }, { quoted: message });
            } catch (error) {
              await sock.sendMessage(from, { text: '❌ Failed to promote user(s).' }, { quoted: message });
            }
          },
          // Add more handlers as needed
        };

        if (command && commandHandlers[command]) {
          await commandHandlers[command]();
        } else if (command && menuResponses[command]) {
          await sock.sendMessage(from, { text: menuResponses[command] }, { quoted: message });
        }

        if (command && menuResponses[command]) {
          return await sock.sendMessage(from, { text: menuResponses[command] }, { quoted: message });
        }
      } catch (error) {
        console.error('Message handler error:', error.message || error);
      }
    });
  } catch (error) {
    console.error('❌ WhatsApp connection error:', error.message || error);
    pairingState.error = error.message || 'Connection error';
    setTimeout(connectToWhatsApp, 5000);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/pairing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pairing.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/api/settings', (req, res) => {
  const settings = loadSettings();
  return res.json({
    success: true,
    settings: {
      prefix: settings.prefix,
      hasPassword: Boolean(settings.adminPassword),
      sessionPassword: pairingState.sessionPassword,
      welcomeText: settings.welcomeText
    }
  });
});

app.post('/api/settings/update', (req, res) => {
  const { currentPassword, newPassword, prefix, welcomeText } = req.body || {};
  const settings = loadSettings();

  if (settings.adminPassword && currentPassword !== settings.adminPassword) {
    return res.status(401).json({ success: false, message: 'Invalid current password' });
  }

  if (typeof newPassword === 'string' && newPassword.trim()) {
    settings.adminPassword = newPassword.trim();
  }
  if (typeof prefix === 'string' && prefix.trim()) {
    settings.prefix = prefix.trim();
  }
  if (typeof welcomeText === 'string' && welcomeText.trim()) {
    settings.welcomeText = welcomeText.trim();
  }

  saveSettings(settings);
  return res.json({ success: true, message: 'Settings updated successfully' });
});

app.post('/api/generate-pair-code', async (req, res) => {
  const { phoneNumber } = req.body || {};
  if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }

  if (!sock) {
    return res.status(503).json({ success: false, error: 'Bot is not connected yet. Please wait for the server to finish starting.' });
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber);
    pairingState.pairCode = code;
    return res.json({ success: true, pairCode: code });
  } catch (error) {
    console.error('Error generating pair code:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate pair code' });
  }
});

app.get('/api/pairing-info', (req, res) => {
  return res.json({
    success: true,
    qrCode: pairingState.qrCode,
    pairCode: pairingState.pairCode,
    botNumber: pairingState.botNumber,
    connected: pairingState.isConnected,
    connectionTime: pairingState.connectionTime,
    error: pairingState.error,
    lastUpdate: pairingState.lastUpdate
  });
});

app.get('/api/connection-status', (req, res) => {
  return res.json({
    connected: pairingState.isConnected,
    connectionTime: pairingState.connectionTime,
    error: pairingState.error,
    lastUpdate: pairingState.lastUpdate
  });
});

app.post('/api/refresh-qr', (req, res) => {
  if (pairingState.qrCode) {
    return res.json({
      success: true,
      qrCode: pairingState.qrCode,
      message: 'QR code refreshed'
    });
  }

  const message = pairingState.error
    ? `Bot error: ${pairingState.error}`
    : 'QR code not available yet. Please wait for the bot to generate one.';

  return res.json({ success: false, message });
});

app.listen(port, '0.0.0.0', () => {
  console.log('🚀 PS MD server running');
  console.log(`📡 Open http://localhost:${port}/pairing to pair WhatsApp`);
  console.log(`⚙️ Settings page: http://localhost:${port}/settings`);
  console.log(`📊 API status: http://localhost:${port}/api/pairing-info`);
});

connectToWhatsApp();
