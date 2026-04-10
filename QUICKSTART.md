# 🚀 Quick Start Guide - DEW-MD WhatsApp Bot

## ⚡ 3-Step Setup

### Step 1: Configure
Edit `config.env`:
```env
OWNER_NUMBER=your_whatsapp_number
SESSION_ID=your_session_id_here
```

### Step 2: Run
```bash
npm start
```

### Step 3: Connect WhatsApp
- QR code will appear in terminal
- Open WhatsApp on phone
- Go to: Settings → Linked Devices → Link a Device
- Scan the QR code
- Wait for: "DEW-MD ♻ Bot connected to whatsapp ✅"

## ✅ What Was Fixed

| Issue | Fix |
|-------|-----|
| Session validation error | Now allows empty SESSION_ID for QR scanning |
| Plugin loading crash | Fixed incorrect path.join() usage |
| Network failures | Added error handling for failed downloads |
| QR code not showing | Enabled terminal QR printing |

## 📱 Commands After Connection

```
.menu          - Show all commands
.help          - Help information
.ping          - Check bot status
.ai <text>     - Use AI
.download      - Download content
.play <song>   - Play music
And many more!
```

## 🆘 If Bot Won't Connect

```bash
# Delete old session
rm -rf auth_info_baileys/

# Clear SESSION_ID in config.env
# Then run again to get new QR code
npm start
```

## 📊 Project Status

✅ All errors fixed
✅ Ready to run
✅ Dependencies installed
✅ Syntax verified

**Bot is now ready for WhatsApp connection!**
