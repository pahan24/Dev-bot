# DEW-MD WhatsApp Bot - Setup Guide

## ✅ Issues Fixed

1. **Session Format Error** - Fixed validation to allow QR code scanning when no session exists
2. **Plugin Loading Bug** - Fixed incorrect `pluginsDir.join()` call (was using module instead of path)
3. **Error Handling** - Added robust error handling for failed plugin downloads
4. **QR Code Display** - Enabled QR code printing in terminal for WhatsApp scanning

## 🚀 How to Run the Bot

### Method 1: Fresh Connection (QR Code Scan)

1. Make sure `config.env` has:
   ```
   SESSION_ID=your_session_id_here
   ```

2. Run the bot:
   ```bash
   npm start
   ```
   Or:
   ```bash
   node index.js
   ```

3. When the bot starts, it will display a QR code in the terminal
4. Open WhatsApp on your phone
5. Go to Settings → Linked Devices → Link a Device
6. Scan the QR code with your phone camera
7. Wait for the message: **"DEW-MD ♻ Bot connected to whatsapp ✅"**

### Method 2: Using Existing Session (Fast Reconnection)

If you already have a session:

1. Get your session ID (format: `DEW-MD~<base64-encoded>`)
2. Add it to `config.env`:
   ```
   SESSION_ID=DEW-MD~your_base64_encoded_session_here
   ```
3. Run: `npm start`

## 🔧 Configuration Options

Edit `config.env` to customize:

```env
# Your WhatsApp number
OWNER_NUMBER=94763079634

# Bot prefix for commands
PREFIX=.

# Bot name
BOT_NAME=RAVINDU_MD

# Send welcome message on startup
SEND_WELCOME=true

# Auto read messages
READ_MESSAGE=true

# Auto status reply
AUTO_STATUS_REPLY=false

# Anti-call (reject calls)
ANTI_CALL=true
```

## 📝 Available Commands

Use prefix (default: `.`) followed by command. Example:
- `.menu` - Show all commands
- `.help` - Show help
- `.ping` - Check bot status

## ⚙️ For Production (PM2)

```bash
# Start with PM2
npm start

# Stop the bot
npm stop

# Restart the bot
npm restart

# Check logs
pm2 logs DEW-MD
```

## 🐛 Troubleshooting

### Bot won't connect
- Check internet connection
- Delete `auth_info_baileys/` folder and rescan QR code
- Verify WhatsApp number is correct

### Plugins not loading
- Check `plugins/` folder exists
- Run `npm install` to ensure all dependencies installed
- Check console for specific plugin errors

### Session expired
- Delete `auth_info_baileys/creds.json`
- Remove SESSION_ID from config.env
- Rescan QR code

## 📦 Useful npm Commands

```bash
# Install dependencies
npm install

# Start bot
npm start

# Stop bot
npm stop

# Restart bot
npm restart
```

## ✨ Features

- ✅ WhatsApp bot with command system
- ✅ Plugin support (auto-loads from `plugins/` folder)
- ✅ Anti-call protection
- ✅ Auto status reply/reaction
- ✅ Message reading/responding
- ✅ Group management
- ✅ Download capabilities
- ✅ AI commands
- ✅ Music/movie features
- ✅ And many more!

## 🔗 Important Folders

- `plugins/` - Load custom commands here
- `lib/` - Core bot functions
- `auth_info_baileys/` - Session credentials (auto-generated)

## 📞 Support

Check the plugin files for available commands or type `.menu` when bot is running.
