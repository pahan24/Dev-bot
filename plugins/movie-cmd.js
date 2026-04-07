const axios = require('axios');
const { cmd } = require('../lib/command');
const bot = require('../lib/bot')
const config = require("../setting")
const NodeCache = require("node-cache");
const movieCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

cmd({
  pattern: "pupilvideo",
  alias: ["pupil"],
  desc: "🎥 Search Sinhala subbed movies from Sub.lk",
  category: "movie",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, contextInfo }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .pupilvideo <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `pupilvideo_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://darkyasiya-new-movie-api.vercel.app//api/movie/pupil/search?q=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.success || !data.data?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.data.map((m, i) => ({
      number: i + 1,
      title: m.title,
      published: m.published,
      author: m.author,
      tag: m.tag,
      link: m.link
    }));

    let textList = "> ʀᴇᴘʟʏ ᴛʜᴇ ɴᴜᴍʙᴇʀ ʙᴇʟᴏᴡ🗿\n\n";
    movieList.forEach((m) => {
      textList += `*${m.number} │❯❯◦ ${m.title}*\n`;
    });

    const sentMsg = await conn.sendMessage(from, {
      image: { url: bot.ALIVE_IMG },
      caption: `*🔍 PUPIL VIDEO CINEMA 🎥*\n\n${textList}\n${bot.COPYRIGHT}`,
      contextInfo,
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://darkyasiya-new-movie-api.vercel.app//api/movie/pupil/movie?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.data;

        const defaultImage = "https://files.catbox.moe/ajfxoo.jpg";
        
        if (!movie.downloadLink?.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.title}*\n\n` +
          `⭐ *Tag:* ${selected.tag}\n` +
          `📅 *Published:* ${selected.published}\n` +
          `✍️ *Author:* ${selected.author}\n\n` +
          `🎥 *Download Hear* 📥\n\n`;+
          `> ʀᴇᴘʟʏ ᴛʜᴇ ɴᴜᴍʙᴇʀ ʙᴇʟᴏᴡ🗿\n\n`

        movie.downloadLink.forEach((d, i) => {
          info += `*${i + 1}* │❯❯◦ *${d.type}* — *${d.size}*\n\n${bot.COPYRIGHT}`;
        });

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: defaultImage || movie.image },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: movie.downloadLink });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.size}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.size}*\n\n${bot.COPYRIGHT}`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
    pattern: "dinka",
    desc: "Search and download movies (multi-step)",
    category: "movie",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, {
    from,
    args,
    reply
}) => {
    try {
        const query = args.join(' ').trim();
        if (!query) {
            return reply("🎥 Please provide a movie name.\nExample: `.dinka Ne Zha`");
        }

        await conn.sendMessage(from, { react: { text: '🕐', key: mek.key } });

        // SEARCH MOVIE
        const searchUrl = `${config.API_BASE}/movie/dinka?apikey=${config.API_KEY}&q=${encodeURIComponent(query)}`;
        const { data: searchDataraw } = await axios.get(searchUrl)
        const searchData = searchDataraw.result;

        if (!searchDataraw.success || !Array.isArray(searchData) || !searchData.length) {
            return reply(`❌ No movies found for "${query}"`);
        }

        const movies = searchData.slice(0, 5); // Take the first 5 results
        if (!movies.length) {
            return reply("❌ No available movies found.");
        }

        let list = `🎬 *DEW-MD Movie Results*\n\n`;
        movies.forEach((m, i) => {
            list += `*${i + 1}.* ${m.title}\n\n`;
        });
        list += `Reply with a number (1-${movies.length})\n\n${bot.COPYRIGHT}`;

        const poster = movies[0].image || bot.ALIVE_IMG;
        const listMsg = await conn.sendMessage(from, {
            image: { url: poster },
            caption: list
        }, { quoted: mek });

        // MOVIE SELECTION
        const movieHandler = async (update) => {
            const msg2 = update.messages?.[0];
            if (!msg2?.message?.extendedTextMessage?.contextInfo) return;
            if (msg2.message.extendedTextMessage.contextInfo.stanzaId !== listMsg.key.id) return;

            const index = parseInt(msg2.message.extendedTextMessage.text) - 1;
            if (isNaN(index) || !movies[index]) return reply("❌ Invalid selection");

            conn.ev.off('messages.upsert', movieHandler);
            const selected = movies[index];

            // FETCH DETAILS
            const detailsUrl = `${config.API_BASE}/movie/dinkadl?apikey=${config.API_KEY}&url=${encodeURIComponent(selected.url)}`;
            const { data: detailsRaw } = await axios.get(detailsUrl, { timeout: 8000 });
            const details = detailsRaw.result;

            if (!detailsRaw.success || !details?.downloads?.length) {
                return reply("❌ No download links found.");
            }

            let qList = `🎞️ *${selected.title}*\n\n`;
            details.downloads.forEach((q, i) => {
                qList += `*${i + 1}* *│*❯❯◦ ${q.quality} 📂\n`;
            });
            qList += `\nReply with quality number\n\n${bot.COPYRIGHT}`;

            const qImg = details.poster || poster;
            const qMsg = await conn.sendMessage(from, {
                image: { url: qImg },
                caption: qList
            }, { quoted: msg2 });

            // QUALITY SELECTION
            const qualityHandler = async (update2) => {
                const msg3 = update2.messages?.[0];
                if (!msg3?.message?.extendedTextMessage?.contextInfo) return;
                if (msg3.message.extendedTextMessage.contextInfo.stanzaId !== qMsg.key.id) return;

                const qIndex = parseInt(msg3.message.extendedTextMessage.text) - 1;
                if (!details.downloads[qIndex]) return reply("❌ Invalid quality");

                conn.ev.off('messages.upsert', qualityHandler);
                const file = details.downloads[qIndex];

                await conn.sendMessage(from, {
                    document: { url: file.url },
                    mimetype: 'video/mp4',
                    fileName: `${selected.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
                }, { quoted: msg3 });

                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
            };

            conn.ev.on('messages.upsert', qualityHandler);
            setTimeout(() => conn.ev.off('messages.upsert', qualityHandler), 300000);
        };

        conn.ev.on('messages.upsert', movieHandler);
        setTimeout(() => conn.ev.off('messages.upsert', movieHandler), 300000);

    } catch (err) {
        console.error('[DINKA CMD ERROR]', err);
        reply("❌ Error while processing your request.");
    }
});
//=================Movie Dl Link=======================
cmd({
    pattern: "film",
    alias: ["moviedl"],
    react: "🎬",
    desc: "🎥 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗠𝗼𝘃𝗶𝗲𝘀",
    category: "📁 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱",
    filename: __filename
},
async (conn, mek, m, { from, quoted, q, reply, sender }) => {
    try {
        if (!q) return reply("❌ *𝙋𝙡𝙚𝙖𝙨𝙚 𝙥𝙧𝙤𝙫𝙞𝙙𝙚 𝙖 𝙈𝙊𝙑𝙄𝙀 𝙉𝘼𝙈𝙀!* ❌");

        const res = await fetch(`https://suhas-bro-apii.vercel.app/movie?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if (!data.status === 'success' || !data.data || !data.data.length) {
            return reply("❌ *𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙛𝙚𝙩𝙘𝙝 𝙢𝙤𝙫𝙞𝙚 𝙞𝙣𝙛𝙤.* ❌");
        }

        const movie = data.data[0];
        
        const movieDetails = {
            mentionedJid: [sender],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '',
                newsletterName: "DEW-MD",
                serverMessageId: 143,
            },
        };

        let desc = `
╭═══〘 *🎬 𝗠𝗢𝗩𝗜𝗘 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗* 〙═══⊷❍
┃ 🎬 *𝙈𝙤𝙫𝙞𝙚 𝙏𝙞𝙩𝙡𝙚:*  *『 ${movie.movieName} 』*
┃ 🎥 *𝙔𝙚𝙖𝙧:* *『 ${movie.year} 』*
┃ ⭐ *𝙄𝙈𝘿𝙗 𝙍𝙖𝙩𝙞𝙣𝙜:* *『 ${movie.imdbRating} 』*
┃ 📥 *𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙 𝙎𝙩𝙖𝙧𝙩𝙚𝙙...*
╰──━──━──━──━──━──━──━──━──━─╯

*${bot.COPYRIGHT}*`;

        // Send the movie thumbnail and info
        await conn.sendMessage(
            from, 
            { 
                image: { url: movie.thumbnail }, 
                caption: desc,
                contextInfo: movieDetails
            }, 
            { quoted: mek }
        );

        // Send the download link
        await conn.sendMessage(
            from, 
            { 
                text: `🎬 *𝗠𝗢𝗩𝗜𝗘 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗*\n\n🎥 *Movie Name:* *『 ${movie.movieName} 』*\n🎬 *Download Link:* ${movie.link}\n\n*${bot.COPYRIGHT}*`, 
                contextInfo: movieDetails
            }, 
            { quoted: mek }
        );
        
    } catch (e) {
        console.error(e);
        reply("❌ *𝘼𝙣 𝙚𝙧𝙧𝙤𝙧 𝙤𝙘𝙘𝙪𝙧𝙧𝙚𝙙 𝙬𝙝𝙞𝙡𝙚 𝙛𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙩𝙝𝙚 𝙢𝙤𝙫𝙞𝙚.* ❌");
    }
});

cmd({
    pattern: "movie",
    desc: "Fetch detailed information about a movie.",
    category: "movie",
    react: "🎞️",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const movieName = args.join(' ');
        if (!movieName) {
            return reply("📽️ Please provide the name of the movie.");
        }

        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=76cb7f39`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.Response === "False") {
            return reply("! Movie not found.");
        }

        const movieInfo = `
*🎬 DEW-MD 🎬*

*ᴛɪᴛʟᴇ:* ${data.Title}
*ʏᴇᴀʀ:* ${data.Year}
*ʀᴀᴛᴇᴅ:* ${data.Rated}
*ʀᴇʟᴇᴀꜱᴇᴅ:* ${data.Released}
*ʀᴜɴᴛɪᴍᴇ:* ${data.Runtime}
*ɢᴇɴʀᴇ:* ${data.Genre}
*ᴅɪʀᴇᴄᴛᴏʀ:* ${data.Director}
*ᴡʀɪᴛᴇʀ:* ${data.Writer}
*ᴀᴄᴛᴏʀꜱ:* ${data.Actors}
*ʟᴀɴɢᴜᴀɢᴇ:* ${data.Language}
*ᴄᴏᴜɴᴛʀʏ:* ${data.Country}
*ᴀᴡᴀʀᴅꜱ:* ${data.Awards}
*ɪᴍᴅʙ ʀᴀᴛɪɴɢ:* ${data.imdbRating}
`;

        const imageUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : bot.ALIVE_IMG;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `${movieInfo}\n*${bot.COPYRIGHT}*`
        }, { quoted: mek });
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
