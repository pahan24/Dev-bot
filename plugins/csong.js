const { cmd } = require('../lib/command');
const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
// Set the path for fluent-ffmpeg to find the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// If you don't have FFmpeg in your system's PATH, uncomment the following line
// and replace the path with the correct path to your ffmpeg.exe.
// ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');

const config = require('../setting');
const bot = require('../lib/bot');

cmd({
    pattern: "csong",
    alias: ["pl"],
    desc: "To download songs as voice notes and send to a specific WhatsApp JID or newsletter.",
    react: "🎵",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
         logo =  bot.ALIVE_IMG;

        if (args.length < 2) {
            const menuMsg = `🎵 *DEW-MD AUDIO EDITOR* 🎵

Usage: .csong <JID> <Song> [Action]

*Available Actions:*
🔊 *base* - Bass Boost
🌫️ *sr* - Slowed + Reverb
🎧 *8d* - 8D Audio
🐿️ *nc* - Nightcore (Fast)
🐢 *dc* - Daycore (Slow)
🔊 *v5* - Volume 500%
🔄 *rv* - Reverse

*Example:*
.csong 123...@newsletter Shape of You sr`;
            return await conn.sendMessage(from, { image: { url: logo }, caption: menuMsg }, { quoted: mek });
        }

        const targetJid = args[0];
        if (!targetJid || !targetJid.endsWith("@newsletter")) {
            return reply("❌ Invalid channel JID! It should end with @newsletter");
        }
        
        // Parse action
        const validActions = ['base', 'bass', 'v5', 'v1', 'sr', 'nc', 'nightcore', 'dc', 'daycore', '8d', 'rv', 'reverse'];
        let action = 'normal';
        let songQueryParts = args.slice(1);
        
        if (songQueryParts.length > 1 && validActions.includes(songQueryParts[songQueryParts.length - 1].toLowerCase())) {
            action = songQueryParts.pop().toLowerCase();
        }
        
        const songName = songQueryParts.join(" ");
        if (!songName) return reply("⚠️ Please provide a song name.");

        await reply(`Searching for "${songName}"... (Action: ${action})`);

        // Search
        const search = await yts(songName);
        const videoInfo = search.videos[0];
        if (!videoInfo) return reply("❌ Song not found.");
        
        const ytUrl = videoInfo.url;

        // Download
        const apiUrl = `${config.API_BASE}/download/ytmp3?url=${ytUrl}&apikey=${config.API_KEY}`;
        const { data: apiRes } = await axios.get(apiUrl);

        if (!apiRes?.success || !apiRes.result?.download_url) {
            return reply("❌ Song not found or API error.");
        }
        const dlUrl = apiRes.result.download_url;

        let channelname = targetJid;
        try {
            const metadata = await conn.newsletterMetadata("jid", targetJid);
            if (metadata?.name) {
                channelname = metadata.name;
            }
        } catch (err) {
            console.log("Newsletter metadata error:", err);
        }

        let caption = '';
        const commonDetails = `
❒ *🎭 Vɪᴇᴡꜱ :* ${videoInfo.views}
❒ *🫟 Channel*: ${videoInfo.author?.name || 'Unknown'}
❒ *⏱️ Dᴜʀᴀᴛɪᴏɴ :* ${videoInfo.timestamp}
❒ *📅 Rᴇʟᴇᴀꜱᴇ Dᴀᴛᴇ :* ${videoInfo.ago}`;
        const footerText = `\n> *${channelname}*`;

        switch(action) {
            case 'bass':
            case 'base':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *BASS BOOSTED EDITION* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
            case 'sr':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *SLOWED + REVERB EDITION* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
            case '8d':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *8D AUDIO EXPERIENCE* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
            case 'nc':
            case 'nightcore':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *NIGHTCORE VERSION* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
             case 'dc':
            case 'daycore':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *DAYCORE EDITION* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
            case 'rv':
            case 'reverse':
                caption = `ִ𝄞𝄢 *${videoInfo.title}* ♪\n\n❒ *REVERSE AUDIO EDITION* ❒\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n${footerText}`;
                break;
            default: // Normal
                caption = `☘️ ᴛɪᴛʟᴇ : ${videoInfo.title} 🙇‍♂️🫀🎧\n${commonDetails}\n\n*00:00 ───●────────── ${videoInfo.timestamp}*\n\n* *ලස්සන රියැක්ට් ඕනී ...💗😽🍃*\n${footerText}`;
                break;
        }

        // Send details + image to channel
        await conn.sendMessage(targetJid, {
            image: { url: videoInfo.thumbnail || logo },
            caption: caption
        }, { quoted: mek });

        // Convert to voice (.opus)
        const tempDir = path.join(__dirname, 'temp');
        fs.ensureDirSync(tempDir);
        const tempPath = path.join(tempDir, `${Date.now()}_${sender.split('@')[0]}.mp3`);
        const voicePath = path.join(tempDir, `${Date.now()}_${sender.split('@')[0]}.opus`);

        const audioRes = await axios({ url: dlUrl, responseType: 'arraybuffer' });
        fs.writeFileSync(tempPath, audioRes.data);

        await new Promise((resolve, reject) => {
            let ffmpegCommand = ffmpeg(tempPath);
            
            if (action === 'bass' || action === 'base') {
                ffmpegCommand = ffmpegCommand.audioFilters('equalizer=f=40:width_type=h:width=50:g=10');
            } else if (action === 'v5') {
                ffmpegCommand = ffmpegCommand.audioFilters('volume=5.0');
            } else if (action === 'v1') {
                ffmpegCommand = ffmpegCommand.audioFilters('volume=1.0');
            } else if (action === 'sr') {
                ffmpegCommand = ffmpegCommand.audioFilters(['asetrate=44100*0.9', 'aecho=0.8:0.9:1000:0.3']);
            } else if (action === 'nc' || action === 'nightcore') {
                ffmpegCommand = ffmpegCommand.audioFilters('asetrate=44100*1.25');
            } else if (action === 'dc' || action === 'daycore') {
                ffmpegCommand = ffmpegCommand.audioFilters('asetrate=44100*0.8');
            } else if (action === '8d') {
                ffmpegCommand = ffmpegCommand.audioFilters('apulsator=hz=0.125');
            } else if (action === 'rv' || action === 'reverse') {
                ffmpegCommand = ffmpegCommand.audioFilters('areverse');
            }

            ffmpegCommand
                .audioCodec("libopus")
                .format("opus")
                .audioBitrate("64k")
                .save(voicePath)
                .on("end", resolve)
                .on("error", reject);
        });

        const voiceBuffer = fs.readFileSync(voicePath);
        let durationSeconds = videoInfo.seconds || 0;
        if (action === 'sr') durationSeconds = Math.ceil(durationSeconds / 0.9);
        else if (action === 'nc' || action === 'nightcore') durationSeconds = Math.ceil(durationSeconds / 1.25);
        else if (action === 'dc' || action === 'daycore') durationSeconds = Math.ceil(durationSeconds / 0.8);

        // SEND VOICE WITH DURATION
        await conn.sendMessage(targetJid, {
            audio: voiceBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            seconds: durationSeconds
        }, { quoted: mek });

        // Clean temp files
        fs.unlinkSync(tempPath);
        fs.unlinkSync(voicePath);

        reply(`✅ *SUCCESSFULLY UPLOADED*

🎵 *Song:* ${videoInfo.title}
📡 *Channel:* ${channelname}
🎛️ *Effect:* ${action.toUpperCase()}

> *DEW-MD AUDIO EDITOR*`);

    } catch (e) {
        console.error(e);
        reply("*ඇතැම් දෝෂයකි! පසුව නැවත උත්සහ කරන්න.*");
    }
});
