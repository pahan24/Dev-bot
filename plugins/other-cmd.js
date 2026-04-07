const axios = require('axios');
const { cmd, commands } = require('../lib/command');
const crypto = require('crypto');
const fs = require("fs");
const path = require("path");
const bot = require('../lib/bot')
//=======================================Git Stalk=============================================
cmd({
    pattern: "githubstalk",
    desc: "Fetch detailed GitHub user profile including profile picture.",
    category: "other",
    react: "📚",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const username = args[0];
        if (!username) {
            return reply("Please provide a GitHub username.");
        }

        const apiUrl = `https://api.github.com/users/${username}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        let userInfo = `🪀 *DEW-MD GITSTALK* 🪀
        
👤 *ᴜꜱᴇʀ ɴᴀᴍᴇ*: ${data.name || data.login}

🔗 *ɢɪᴛʜᴜʙ ᴜʀʟ*:(${data.html_url})

📝 *ʙɪᴏ*: ${data.bio || 'Not available'}

🏙️ *ʟᴏᴄᴀᴛɪᴏɴ*: ${data.location || 'Unknown'}

📊 *ᴘᴜʙʟɪᴄ ʀᴇᴘᴏ*: ${data.public_repos}

👥 *ꜰᴏʟʟᴏᴡᴇʀꜱ*: ${data.followers} | Following: ${data.following}

📅 *ᴄʀᴇᴀᴛʀᴅ ᴅᴀᴛᴇ*: ${new Date(data.created_at).toDateString()}

🔭 *ᴘᴜʙʟɪᴄ ɢɪꜱᴛꜱ*: ${data.public_gists}

*${bot.COPYRIGHT}*
`;

        await conn.sendMessage(from, { image: { url: data.avatar_url }, caption: userInfo }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`Error fetching data🤕: ${e.response ? e.response.data.message : e.message}`);
    }
});
//======================================G PAss==============================================
cmd({
    pattern: "gpass",
    desc: "Generate a strong password.",
    category: "other",
    react: "🔐",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const config = await readEnv();
        const length = args[0] ? parseInt(args[0]) : 12; // Default length is 12 if not provided
        if (isNaN(length) || length < 8) {
            return reply('Please provide a valid length for the password (Minimum 08 Characters💦).');
        }

        const generatePassword = (len) => {
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
            let password = '';
            for (let i = 0; i < len; i++) {
                const randomIndex = crypto.randomInt(0, charset.length);
                password += charset[randomIndex];
            }
            return password;
        };

        const password = generatePassword(length);
        const message = `🔐 *Your Strong Password* 🔐\n\nPlease find your generated password below:\n\n*${config.COPYRIGHT}*`;

        // Send initial notification message
        await conn.sendMessage(from, { text: message }, { quoted: mek });

        // Send the password in a separate message
        await conn.sendMessage(from, { text: password }, { quoted: mek });
        console.log(`♻ G Pass Command Used : ${from}`);
    } catch (e) {
        console.log(e);
        reply(`❌ Error generating password🤕: ${e.message}`);
    }
});
//===============================================Weather=============================================
cmd({
    pattern: "weather",
    desc: "🌤 Get weather information for a location",
    react: "🌤",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a city name. Usage: .weather [city name]");
        const apiKey = '2d61a72574c11c4f36173b627f8cb177'; 
        const city = q;
        const config = await readEnv();
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        const weather = `
🌍 *Weather Information for ${data.name}, ${data.sys.country}* 🌍
🌡️ *Temperature*: ${data.main.temp}°C
🌡️ *Feels Like*: ${data.main.feels_like}°C
🌡️ *Min Temp*: ${data.main.temp_min}°C
🌡️ *Max Temp*: ${data.main.temp_max}°C
💧 *Humidity*: ${data.main.humidity}%
☁️ *Weather*: ${data.weather[0].main}
🌫️ *Description*: ${data.weather[0].description}
💨 *Wind Speed*: ${data.wind.speed} m/s
🔽 *Pressure*: ${data.main.pressure} hPa

*${config.COPYRIGHT}*`;

console.log(`♻ Weather Command Used : ${from}`);
        return reply(weather);
        
    } catch (e) {
        console.log(e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 City not found. Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the weather information. Please try again later.");
    }
});
//===========================================Define============================================
cmd({
pattern: "define",
desc: "📚 Get the definition of a word",
react: "🔍",
category: "other",
filename: __filename
 },
                         async (conn, mek, m, { from, q, reply }) => {
                             try {
                                 if (!q) return reply("❗ Please provide a word to define. Usage: .define [word]");

                                 const word = q;
                                 const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

                                 const response = await axios.get(url);
                                 const definitionData = response.data[0];
                                 const definition = definitionData.meanings[0].definitions[0].definition;
                                 const example = definitionData.meanings[0].definitions[0].example || 'No example available';
                                 const synonyms = definitionData.meanings[0].definitions[0].synonyms.join(', ') || 'No synonyms available';

const wordInfo = `
📚 *Word*: ${definitionData.word}
🔍 *Definition*: ${definition}
📝 *Example*: ${example}
🔗 *Synonyms*: ${synonyms}

*${bot.COPYRIGHT}*`;

                                 return reply(wordInfo);
                             } catch (e) {
                                 console.log(e);
                                 if (e.response && e.response.status === 404) {
                                     return reply("🚫 Word not found. Please check the spelling and try again.");
                                 }
                                 return reply("⚠️ An error occurred while fetching the definition. Please try again later.");
                             }
                         });

//========================================DIARY================================================================
const diaryFile = path.join(__dirname, "../lib/DEW-MD/diary.json");
let diaries = fs.existsSync(diaryFile) ? JSON.parse(fs.readFileSync(diaryFile, 'utf8')) : {};

// Function to save diaries to file
const saveDiaries = () => {
    fs.writeFileSync(diaryFile, JSON.stringify(diaries, null, 2));
};

// ---------------------
// .diary command (open or create diary)
// ---------------------
cmd({
    pattern: "diary",
    desc: "Open or create a secret diary (Owner only).",
    category: "private",
    filename: __filename
}, async (conn, mek, m, { reply, q, from, isOwner, sender }) => {
    // Check if the user is the owner
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");

    const userId = m.sender;

    if (!diaries[userId]) {
        if (!q) {
            return reply("📖 You don't have a diary yet. To create one, use:\n\n`.diary yourpassword`");
        }
        diaries[userId] = { password: q.trim(), entries: [] };
        saveDiaries();
        return reply(`✅ Your secret diary has been created!\nTo add an entry, use \`.setdiary your message\`\nTo open your diary, use \`.diary yourpassword\``);
    }

    if (!q) {
        return reply("🔒 You already have a diary. To open it, enter your password like this:\n\n`.diary yourpassword`");
    }

    if (q.trim() !== diaries[userId].password) {
        return reply("❌ Incorrect password! Please try again.");
    }

    if (diaries[userId].entries.length === 0) {
        return reply("📖 Your diary is empty. Add entries using `.setdiary your message`.");
    }

    let formattedInfo = `📖 *Your Diary Entries:*\n\n`;
    diaries[userId].entries.forEach((entry) => {
        formattedInfo += `📅 *${entry.date}* 🕒 *${entry.time}*\n📝 ${entry.text}\n\n`;
    });
    // Send the image with the diary entries
    await conn.sendMessage(from, {
        image: { url: bot.ALIVE_IMG },
        caption: formattedInfo,
        contextInfo: { 
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '@newsletter',
                newsletterName: 'DEW-MD',
                serverMessageId: 143
            }
        }
    }, { quoted: mek });
});

// ---------------------
// .setdiary command (add a new diary entry)
// ---------------------
cmd({
    pattern: "setdiary",
    desc: "Write a new diary entry (Owner only).",
    category: "private",
    filename: __filename
}, async (conn, mek, m, { reply, q, isOwner, sender }) => {
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");
    const userId = m.sender;
    if (!diaries[userId]) {
        return reply("❌ You don't have a diary. Create one using `.diary yourpassword`.");
    }
    if (!q) {
        return reply("✍️ Please provide the text you want to add to your diary.");
    }

    const now = new Date();
    const date = now.toLocaleDateString('fr-FR'); // Date format (France)
    const time = now.toLocaleTimeString('fr-FR', { hour12: false }); // 24h format

    diaries[userId].entries.push({ date, time, text: q.trim() });
    saveDiaries();

    reply("✅ Your diary entry has been saved!");
});

// ---------------------
// .resetdiary command (delete all diary entries)
// ---------------------
cmd({
    pattern: "resetdiary",
    desc: "Reset your diary (delete all entries) (Owner only).",
    category: "private",
    filename: __filename
}, async (conn, mek, m, { reply, q, isOwner, sender }) => {
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");
    const userId = m.sender;

    if (!diaries[userId]) {
        return reply("❌ You don't have a diary to reset.");
    }

    if (!q) {
        return reply("⚠️ To reset your diary, use `.resetdiary yourpassword` to confirm your identity.");
    }

    if (q.trim() !== diaries[userId].password) {
        return reply("❌ Incorrect password! Diary reset aborted.");
    }

    delete diaries[userId];
    saveDiaries();

    reply("✅ Your diary has been successfully reset!");
});

// ---------------------
// .resetpassword command (reset diary password; Owner only)
// ---------------------
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
let resetRequests = {};

cmd({
    pattern: "resetpassword",
    desc: "Reset your diary password (Owner only).",
    category: "private",
    filename: __filename
}, async (conn, mek, m, { reply, q, isOwner, sender }) => {
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");
    const userId = m.sender;

    if (!diaries[userId]) {
        return reply("❌ You don't have a diary. Create one using `.diary yourpassword`.");
    }

    // If no argument is provided, send a reset code
    if (!q) {
        const resetCode = generateCode();
        // Store the reset code with an expiration time of 5 minutes
        resetRequests[userId] = { code: resetCode, expires: Date.now() + 5 * 60 * 1000 };
        
        await conn.sendMessage(userId, { 
            text: `🔐 Your password reset code: *${resetCode}*\n\nThis code expires after 5 minutes.\nEnter this code with \'.resetpassword *code* newpassword\' to confirm.` 
        });
        return reply("📩 A reset code has been sent to your private chat. Use it to reset your password.");
    }

    const args = q.split(" ");
    if (args.length !== 2) {
        return reply("⚠️ Incorrect format! Use:\n\n`.resetpassword code newpassword`");
    }

    const [code, newPassword] = args;
    if (!resetRequests[userId] || resetRequests[userId].code !== code || Date.now() > resetRequests[userId].expires) {
        return reply("❌ Invalid or expired code! Request a new one with `.resetpassword`.");
    }

    diaries[userId].password = newPassword.trim();
    saveDiaries();
    delete resetRequests[userId];

    reply("✅ Your diary password has been successfully reset!");
});
