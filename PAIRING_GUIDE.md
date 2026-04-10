# 🌐 WhatsApp Bot Web Pairing Interface

## Quick Setup (3 Steps)

### 1. Start the Bot
```bash
cd /workspaces/Dev-bot
npm start
```

### 2. Open Pairing Page
- **Local Access**: Open `http://localhost:9090/pairing` in your browser
- **Remote Access**: Open `http://<your-ip>:9090/pairing`

### 3. Pair WhatsApp
Choose one method:

#### **Method A: Scan QR Code**
1. The page displays a QR code
2. Open WhatsApp on your phone
3. Go to **Settings → Linked Devices → Link a Device**
4. Point your phone camera at the QR code on your screen
5. Confirm the pairing on your phone

#### **Method B: Use Pair Code**
1. Click **"Copy Pair Code"** button on the web page
2. Open WhatsApp on your phone
3. Go to **Settings → Linked Devices → Link a Device**
4. Tap **"Link with Phone Number"** (if available) or wait for pairing options
5. Enter or paste the 8-digit pair code
6. Confirm the pairing

---

## 🖥️ Web Interface Features

### Display Elements

**QR Code Section**
- Shows live QR code for scanning
- Click **"🔄 Refresh QR Code"** to generate a new one
- Works best when displayed on a computer screen

**Pair Code Section**
- Shows 8-digit pairing code
- Click **"📋 Copy Pair Code"** to copy to clipboard
- Use this if QR scanning doesn't work

**Connection Status**
- Shows real-time connection status
- Updates every 2 seconds
- Green indicator (✅) = Connected
- Orange indicator (⏳) = Waiting for pairing

**Instructions**
- Easy 5-step guide shown on the page
- Displays recommended pairing method

---

## 📱 Accessing from Different Devices

### From Same Computer
```
http://localhost:9090/pairing
```

### From Same Network (Phone/Tablet)
Replace `192.168.x.x` with your computer's IP:
```
http://192.168.x.x:9090/pairing
```

To find your IP:
- **Linux/Mac**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

### Port Configuration
Edit `config.env` to change the port:
```env
PORT=3000  # Change from default 9090
```

---

## ⚙️ Configuration

### Bot Settings (`config.env`)
```env
# WhatsApp Setup
SESSION_ID=your_session_id_here
OWNER_NUMBER=your_whatsapp_number

# Bot Prefix
PREFIX=.

# Features
SEND_WELCOME=true
READ_MESSAGE=true
AUTO_REACT=false
ANTI_CALL=true
```

### Port Settings
```env
# Custom port (default: 9090)
PORT=3000
```

---

## 🆘 Troubleshooting

### QR Code Not Appearing
**Solution:**
1. Refresh the page (F5 or Cmd+R)
2. Wait 5-10 seconds for bot to initialize
3. Check browser console for errors (F12)
4. Restart the bot: `npm restart`

### Pairing Code Shows Dashes (- - - -)
**Meaning:** Waiting for connection initialization
**Solution:** 
- Keep the page open
- The code will appear after QR is generated
- Wait 10-15 seconds for initialization

### "Cannot Connect to Bot"
**Solutions:**
1. Make sure bot is running: `npm start`
2. Check if port is accessible: `curl http://localhost:9090/pairing`
3. Try refreshing the browser
4. Check firewall isn't blocking the port

### Pairing Code Not Working
**Try QR Code instead:**
1. Open the pairing page
2. Make sure QR code is visible
3. Use QR scanning in WhatsApp
4. If still failing, delete session and restart

---

## 🔄 Repairing / Reconnecing

### If Bot Disconnects
```bash
# Option 1: Auto-reconnect (happens automatically)
npm start

# Option 2: Force new pair
rm -rf auth_info_baileys/
npm start
# Then visit pairing page and scan again
```

### Session Management
```bash
# View authentication folder
ls -la auth_info_baileys/

# Delete session (requires new pairing)
rm -rf auth_info_baileys/

# Delete credentials
rm auth_info_baileys/creds.json
```

---

## 📊 Status Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| 🔄 Generating | QR code is being created | Wait a few seconds |
| ⏳ Waiting... | Awaiting WhatsApp connection | Keep page open, follow instructions |
| ✅ Connected | Bot is linked to WhatsApp | You can use .menu in chats |
| ❌ Disconnected | Connection was lost | Page will auto-refresh connection info |

---

## 🎮 Using the Bot After Pairing

### Testing the Connection
Send any message with `.ping` to test:
```
User: .ping
Bot: Pong! ✅ Bot is working
```

### Getting Commands
```
User: .menu
Bot: Shows all available commands
```

### Quick Commands
- `.menu` - Show all commands
- `.help` - Get help information
- `.ping` - Test bot status
- `.ai <text>` - Use AI features
- And many more!

---

## 🚀 Advanced Usage

### Behind Reverse Proxy/VPN
If behind Nginx or similar:
```env
# Use your proxy URL
NODE_ENV=production
```

### Docker Deployment
```bash
docker build -t dew-md .
docker run -p 9090:9090 -v $(pwd)/auth_info_baileys:/app/auth_info_baileys dew-md
```

### PM2 with Web Interface
```bash
# Start with PM2 and view web dashboard
npm start

# Monitor logs
pm2 logs DEW-MD

# Restart if needed
npm restart
```

---

## 📞 Support

- **Check console logs**: Open browser F12 → Console tab
- **Bot logs**: Run `npm start` and watch terminal output
- **Session issues**: Delete `auth_info_baileys/` and repair
- **Port conflicts**: Change PORT in config.env

---

## ✅ Summary

1. **Start Bot**: `npm start`
2. **Open Page**: `http://localhost:9090/pairing`
3. **Choose Method**: Scan QR or enter Pair Code
4. **Confirm**: On your WhatsApp phone
5. **Done**: Bot now connected! 🎉

**Keep the web page open until pairing is complete.**
