# 📚 DEW-MD Documentation Index

Choose based on your needs:

## 🚀 **Just Want to Start?**
→ Read: **[QUICKSTART.md](QUICKSTART.md)** (2 minutes)
- 3-step quick start
- Essential commands only
- Get running in minutes

---

## 🌐 **Want to Use Web Pairing?** (RECOMMENDED)
→ Read: **[PAIRING_QUICK.md](PAIRING_QUICK.md)** (5 minutes)
- Visual guide with screenshots
- Two pairing methods
- Troubleshooting tips

---

## 📖 **Need Detailed Web Guide?**
→ Read: **[PAIRING_GUIDE.md](PAIRING_GUIDE.md)** (15 minutes)
- Complete web interface documentation
- All features explained
- Advanced configuration

---

## ⚙️ **Setting Up Everything?**
→ Read: **[COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)** (20 minutes)
- Full setup walkthrough
- Configuration options
- Session management
- Troubleshooting

---

## ⚡ **Terminal Setup (Old Way)?**
→ Read: **[SETUP_GUIDE.md](SETUP_GUIDE.md)**
- QR code in terminal
- PM2 production setup
- Advanced features

---

## 🔧 **What Was Fixed?**
→ Read: **[CHANGES.md](CHANGES.md)**
- List of all fixes
- Technical details
- Testing results

---

## 🎯 Start Here

**Choose one:**

### For Beginners
```
1. QUICKSTART.md (2 min read)
2. Run: npm start
3. Open: http://localhost:9090/pairing
4. Scan QR code
5. Done!
```

### For Detailed Setup
```
1. PAIRING_QUICK.md (Visual guide)
2. Follow step-by-step
3. Or use PAIRING_GUIDE.md for more details
```

### For Complete Control
```
1. COMPLETE_GUIDE.md (Full reference)
2. Configure everything
3. Deep dive into options
```

---

## 📂 Quick Command Reference

```bash
# Start the bot
npm start

# Stop the bot
npm stop (with PM2)
Ctrl+C (in terminal)

# Restart the bot
npm restart

# Check status
pm2 logs DEW-MD

# View dependencies
npm list

# Install specific package
npm install package-name

# Delete old session
rm -rf auth_info_baileys/

# Check current IP
ifconfig | grep inet     # Mac/Linux
ipconfig                  # Windows
```

---

## 🔗 Web Access

| Purpose | URL |
|---------|-----|
| **Pairing Page** | `http://localhost:9090/pairing` |
| **Bot Status** | `http://localhost:9090/` |
| **From Phone (Same WiFi)** | `http://192.168.x.x:9090/pairing` |
| **API: Get Pairing Info** | `http://localhost:9090/api/pairing-info` |
| **API: Connection Status** | `http://localhost:9090/api/connection-status` |

---

## ✨ Key Features

- ✅ Beautiful web interface for pairing
- ✅ QR code scanning support
- ✅ 8-digit pair code option
- ✅ Real-time connection status
- ✅ Mobile responsive design
- ✅ Auto-reconnection
- ✅ Plugin system
- ✅ Command framework
- ✅ Error recovery
- ✅ Easy configuration

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| QR not showing | Refresh page, wait 10s |
| Can't connect | Check bot running: `npm start` |
| Pair code wrong | Try QR code instead |
| Bot disconnects | Auto-reconnects, check internet |
| Wrong port | Edit `config.env` PORT setting |

---

## 📞 Support Files

Each guide file has:
- Step-by-step instructions
- Troubleshooting section
- Example commands
- Configuration options

---

## 🎓 Learning Path

```
Beginner →  QUICKSTART.md
    ↓
Using →  PAIRING_QUICK.md
    ↓
Advanced →  COMPLETE_GUIDE.md
    ↓
Reference →  PAIRING_GUIDE.md
    ↓
Troubleshoot →  Check last section of each guide
```

---

## 📊 File Summary

| File | Size | Time | For |
|------|------|------|-----|
| QUICKSTART.md | 2 pages | 2 min | Fast setup |
| PAIRING_QUICK.md | 4 pages | 5 min | Visual learner |
| PAIRING_GUIDE.md | 8 pages | 15 min | Web details |
| COMPLETE_GUIDE.md | 10 pages | 20 min | Everything |
| SETUP_GUIDE.md | 6 pages | 10 min | Terminal way |
| CHANGES.md | 2 pages | 5 min | Technical |

---

## 🎁 What You Get

After pairing, you have:
- ✅ WhatsApp bot running 24/7
- ✅ Full command system
- ✅ Auto message handling
- ✅ Media download support
- ✅ AI integration
- ✅ Group features
- ✅ Plugin support
- ✅ Customizable settings

---

## 🚀 Get Started Now

**Recommended path:**
1. Read: PAIRING_QUICK.md
2. Run: `npm start`
3. Visit: http://localhost:9090/pairing
4. Scan: QR code with WhatsApp
5. Use: `.menu` command

**That's it! You're ready!** 🎉

---

*Last Updated: April 2026*  
*DEW-MD v2.0.0 by Dew Coders*
