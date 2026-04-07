const axios = require('axios');
const { cmd } = require('../lib/command');
const yts = require('yt-search');
const bot = require('../lib/bot')
// Command to fetch IP details
cmd({
    pattern: "ip",
    desc: "Get details of a given IP address",
    category: "search",
    filename: __filename
}, 
async (conn, mek, m, { args, reply, from }) => {
    if (args.length === 0) {
        return reply("❌ Please provide an IP address. Example: `.ip 8.8.8.8`");
    }

    const ip = args[0];

    try {
        const response = await axios.get(`https://ipinfo.io/${ip}/json`);
        const data = response.data;

        const ipDetails = `
╭───❰ 🌐 *IP Information* 🌐 ❱───✧
├─ 🆔 *IP Address*: ${data.ip || "N/A"}
├─ 🏙️ *City*: ${data.city || "N/A"}
├─ 📍 *Region*: ${data.region || "N/A"}
├─ 🌎 *Country*: ${data.country || "N/A"}
├─ 📌 *Location*: ${data.loc || "N/A"}
├─ 🏢 *Organization*: ${data.org || "N/A"}
├─ 📬 *Postal*: ${data.postal || "N/A"}
├─ ⏰ *Timezone*: ${data.timezone || "N/A"}
╰───────────────────────────✧

*${bot.COPYRIGHT}*`;

        await conn.sendMessage(from, { text: ipDetails }, { quoted: mek });

    } catch (e) {
        console.error("Error fetching IP details:", e);
        reply("❌ An error occurred while fetching IP details. Please try again later.");
    }
});
// 🔍--------YOUTUBE-SEARCH--------//
cmd({
    pattern: "ytsearch",
    alias: ["yts", "ytquery"],
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, quoted, q, reply }) => {
    try {
        if (!q) return reply("> Provide A Search Query...⭐");

        // React with 🔍 and show searching text
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        reply("> ꜱᴇᴀʀᴄʜɪɴɢ ꜰᴏʀ ʏᴏᴜʀ ʀᴇϙᴜᴇꜱᴛ... 🔎");

        // Perform YouTube search
        const searchResults = await yts(q);
        if (!searchResults || !searchResults.videos || !searchResults.videos.length) {
            return reply("> ɴᴏ ʀᴇꜱᴜʟᴛꜱ ꜰᴏᴜɴᴅ ᴏɴ ʏᴏᴜᴛᴜʙᴇ!❌");
        }

        const results = searchResults.videos.slice(0, 5); // Display top 5 results

        // Prepare the results message
        let searchMessage = `*⭐ DEW-MD YOUTUBE SEARCH RESULTS ⭐*\n\n`;
        results.forEach((video, index) => {
            searchMessage += `╭─────────────✑\n`;
            searchMessage += `◉ *${index + 1}. ${video.title}*\n\n`;

            searchMessage += `1 │❯❯◦ *ᴅᴜʀᴀᴛɪᴏɴ⏰*: ${video.timestamp} \n`;
            searchMessage += `2 │❯❯◦ *ᴠɪᴇᴡꜱ🧿*: ${video.views} \n`;
            searchMessage += `3 │❯❯◦ *ᴀɢᴏ📆*: ${video.ago} \n`;
            searchMessage += `4 │❯❯◦ *ᴄʜᴀɴɴᴇʟ ɴᴀᴍᴇ*: ${video.author.name} \n`;  // Channel name

            // Check if likes are available, otherwise use a fallback value
            const likes = video.likes || "Not available";
            searchMessage += `5 │❯❯◦ *ᴛᴏᴛᴀʟ ʟɪᴋᴇꜱ👍*: ${likes} \n`; // Total likes (fallback)

            searchMessage += `6 │❯❯◦ *ᴠɪᴅᴇᴏ ʟɪɴᴋ🔗*: ${video.url} \n\n`;  // Video link
            searchMessage += `╰─────────────✑\n`;
        });

        // Get the current date and time
        const currentDateTime = new Date();
        const date = currentDateTime.toLocaleDateString();  // Format as per the local date
        const time = currentDateTime.toLocaleTimeString();  // Format as per the local time

        // Append date and time to the message
        searchMessage += `\n> *TODAY IS 📅: ${date}*\n\n`;
        searchMessage += `*${bot.COPYRIGHT}*\n`;

        // Send the search results with an image thumbnail and video details
        await conn.sendMessage(from, {
            image: { url: results[0].thumbnail },  // Using the thumbnail of the first search result
            caption: searchMessage
        }, { quoted: mek });

        // React with ✅ when the results are sent
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        reply("> ʀᴇꜱᴜʟᴛꜱ ꜱᴇɴᴛ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ... ✅");

    } catch (e) {
        console.error("Error:", e);
        reply("> ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ꜱᴇᴀʀᴄʜɪɴɢ. ᴘʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.❌");
    }
});
//=========================Google========================================
cmd({
    pattern: "google",
    alias: ["gsearch", "googlesearch"],
    desc: "Search Google for a query.",
    category: "search",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m,{ args, reply , from }) => {
    try {
        // Vérifiez si un mot-clé est fourni
        if (args.length === 0) {
            return reply(`❗ *Please provide a search query.*\n\n*Example:*\n.google DEW-MD Whtsapp Bot`);
        }

        const query = args.join(" ");
        const apiKey = "AIzaSyDMbI3nvmQUrfjoCJYLS69Lej1hSXQjnWI"; // Votre clé API Google
        const cx = "baf9bdb0c631236e5"; // Votre ID de moteur de recherche personnalisé
        const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

        // Appel API
        const response = await axios.get(apiUrl);

        // Vérifiez si l'API a renvoyé des résultats
        if (response.status !== 200 || !response.data.items || response.data.items.length === 0) {
            return reply(`❌ *No results found for:* ${query}`);
        }

        // Format et envoi des résultats
        let results = `🔎 *Google Search Results for:* "${query}"\n\n`;
        response.data.items.slice(0, 5).forEach((item, index) => {
            results += `*${index + 1}. ${item.title}*\n${item.link}\n${item.snippet}\n\n`;
        });
        console.log(`♻ Google Command Used : ${from}`);
        reply(results.trim());
    } catch (error) {
        console.error(error);
        reply(`⚠️ *An error occurred while fetching search results.*\n\n${error.message}`);
    }
});
//=========================================S Repo==============================================
cmd({
    pattern: "srepo",
    desc: "Fetch information about a GitHub repository.",
    category: "other",
    react: "🍃",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const repo = args.join(' ');
        if (!repo) {
            return reply("Please provide a GitHub repository name in the format 📌`owner/repo`.");
        }

        const apiUrl = `https://api.github.com/repos/${repo}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        let repoInfo = `📁_*GITHUB REPOSITORY INFO BY DEW-MD*_📁\n\n`;
        repoInfo += `📌 *ɴᴀᴍᴇ*: ${data.name}\n`;
        repoInfo += `🔗 *ᴜʀʟ*: ${data.html_url}\n`;
        repoInfo += `📝 *ᴅᴇꜱᴄʀɪᴘᴛɪᴏɴ*: ${data.description}\n`;
        repoInfo += `⭐ *ꜱᴛᴀʀꜱ*: ${data.stargazers_count}\n`;
        repoInfo += `🍴 *ꜰᴏʀᴋꜱ*: ${data.forks_count}\n`;
        repoInfo += `\n`;
        repoInfo += `*${bot.COPYRIGHT}*\n`;
        console.log(`♻ S Repo Command Used : ${from}`);
        await conn.sendMessage(from, { text: repoInfo }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`Error fetching repository data🤕: ${e.message}`);
    }
});
