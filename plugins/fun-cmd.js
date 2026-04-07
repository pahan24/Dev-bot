const axios = require('axios');
const { cmd, commands } = require('../lib/command');
const api = require('../lib/DEW-MD/api');
const bot = require('../lib/bot')
//==================================Anime Girl============================================
cmd({
    pattern: "animegirl",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "👧",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `${api.WAIFU_API}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: `👧 *Random Anime Girl Image* 👧\n\n*${bot.COPYRIGHT}*` }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});
//====================================boom===================================================
cmd({
    pattern: "boom",
    desc: "Send a message multiple times",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, args }) => {
    if (args.length < 2) {
        return await conn.sendMessage(from, { text: "Usage: *.boom <count> <message>*\nExample: *.boom 500 Hello!*" });
    }

    const count = parseInt(args[0]);
    if (isNaN(count) || count <= 0 || count > 500) {
        return await conn.sendMessage(from, { text: "Please provide a valid count (1-500)." });
    }

    const message = args.slice(1).join(" ");

    for (let i = 0; i < count; i++) {
        await conn.sendMessage(from, { text: message });
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5-second delay to avoid spam detection
    }
});
//=====================================Dog================================================
cmd({
    pattern: "dog",
    desc: "Fetch a random dog image.",
    category: "fun",
    react: "🐶",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `${api.DOG_API}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.message }, caption: `*DEW-MD DOG PICS*\n\n*${bot.COPYRIGHT}*` }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`Error Fetching Dog Image🤕: ${e.message}`);
    }
});
//=================================Fact====================================================
cmd({
    pattern: "fact",
    desc: "🧠 Get a random fun fact",
    react: "😝",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = `${api.FACT_API}`;  // API for random facts
        const response = await axios.get(url);
        const fact = response.data.text;

        const funFact = `
> DEW-MD RANDOM FACT 

${fact}

Isn't that interesting? 😄

*${bot.COPYRIGHT}*
`;

        return reply(funFact);
    } catch (e) {
        console.log(e);
        return reply("⚠️ An error occurred while fetching a fun fact. Please try again later🤕.");
    }
});

cmd({
    pattern: "joke",
    desc: "😂 Get a random joke",
    react: "🤣",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = `${api.JOKE_API}`;  // API for random jokes
        const response = await axios.get(url);
        const joke = response.data;
        const jokeMessage = `
😂 *Here's a random joke for you!* 😂
*${joke.setup}*
${joke.punchline} 😄

*${bot.COPYRIGHT}*
`;
        return reply(jokeMessage);
    } catch (e) {
        console.log(e);
        return reply("⚠️ Couldn't fetch a joke right now. Please try again later.");
    }
});
//==================================Hack===================================================
cmd({
    pattern: "hack",
    desc: "Displays a dynamic and playful 'Hacking' message for fun.",
    category: "fun",
    react: "👨‍💻",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const steps = [
            '💻 *DEW-MD HACK STARTING...* 💻',
            '',
            '*Initializing hacking tools...* 🛠️',
            '*Connecting to remote servers...* 🌐',
            '',
            '```[██████████] 10%``` ⏳'                                            ,
            '```[████████████████████] 20%``` ⏳'                                   ,
            '```[██████████████████████████████] 30%``` ⏳'                               ,
            '```[████████████████████████████████████████] 40%``` ⏳'                            ,
            '```[██████████████████████████████████████████████████] 50%``` ⏳'                       ,
            '```[████████████████████████████████████████████████████████████] 60%``` ⏳'                 ,
            '```[██████████████████████████████████████████████████████████████████████] 70%``` ⏳'            ,
            '```[████████████████████████████████████████████████████████████████████████████████] 80%``` ⏳'        ,
            '```[██████████████████████████████████████████████████████████████████████████████████████████] 90%``` ⏳'    ,
            '```[████████████████████████████████████████████████████████████████████████████████████████████████████] 100%``` ✅',
            '',
            '🔒 *System Breach: Successful!* 🔓',
            '🚀 *Command Execution: Complete!* 🎯',
            '',
            '*📡 Transmitting data...* 📤',
            '*🕵️‍♂️ Ensuring stealth...* 🤫',
            '*🔧 Finalizing operations...* 🏁',
            '*🔧 DEW-MD Get Your All Data...* 🎁',
            '',
            '⚠️ *Note:* All actions are for demonstration purposes only.',
            '⚠️ *Reminder:* Ethical hacking is the only way to ensure security.',
            '⚠️ *Reminder:* Strong hacking is the only way to ensure security.',
            '',
            ' *👨‍💻 YOUR DATA HACK SUCCESSFULLY 👩‍💻☣*'
        ];

        for (const line of steps) {
            await conn.sendMessage(from, { text: line }, { quoted: mek });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed
        }
    } catch (e) {
        console.log(e);
        reply(`❌ *Error!* ${e.message}`);
    }
});
//========================================Loli===================================================
cmd({
    pattern: "loli",
    alias: ["lolii"],
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🐱",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `${api.LOLI_API}`;
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        await conn.sendMessage(from, { image: { url: data.url }, caption: `👧 *Random Anime Girl Image* 👧\n\n*${bot.COPYRIGHT}*` }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});
//=====================================================Ship======================================================
// Function to format mentions
const toM = (a) => '@' + a.split('@')[0];

cmd({
    pattern: "ship",
    alias: ["cup", "love"],
    desc: "Randomly pairs the command user with another group member.",
    react: "❤️",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, isGroup, groupMetadata, reply }) => {
    try {
        // Ensure command is used in a group
        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        // Get group participants
        const participants = groupMetadata.participants.map(p => p.id);

        if (participants.length < 2) {
            return reply("Not enough members to pair.");
        }

        // Sender of the command
        const sender = m.sender;

        // Randomly select another participant
        let randomParticipant;
        do {
            randomParticipant = participants[Math.floor(Math.random() * participants.length)];
        } while (randomParticipant === sender);

        // Reply with the pairing
        const message = `${toM(sender)} ❤️ ${toM(randomParticipant)}\nCongratulations 💖🍻`;
        await conn.sendMessage(from, { text: message, mentions: [sender, randomParticipant] });
        console.log(`♻ Love Command Used : ${from}`);
    } catch (e) {
        console.error("Error in ship command:", e);
        reply("An error occurred while processing the command. Please try again.");
    }
});
//================================Truth=========================================
cmd({
    pattern: "truth",
    alias: ["truthquestion"],
    react: '❔',
    desc: "Get a random truth question.",
    category: "fun",
    use: '.truth',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        // Inform the user
        reply("*🔍 Fetching a truth question...*");

        // API URL for truth
        const truthApiUrl = `${api.TRUTH_API}`;

        // Fetch truth question from the API
        const truthResponse = await axios.get(truthApiUrl);
        if (!truthResponse.data || !truthResponse.data.success) {
            return reply("❌ Failed to fetch a truth question. Please try again later.");
        }

        // Extract truth question
        const truthQuestion = truthResponse.data.question;
        if (truthQuestion) {
            reply(`*Truth Question:* ${truthQuestion}`);
        }
        console.log(`♻ Truth Command Used : ${from}`);
    } catch (e) {
        console.error(e);
        reply("❌ An error occurred while fetching the truth question.");
    }
});

// Dare command
cmd({
    pattern: "dare",
    alias: ["d", "darequestion"],
    react: '🔥',
    desc: "Get a random dare question.",
    category: "fun",
    use: '.dare',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        // Inform the user
        reply("*🔥 Fetching a dare question...*");

        // API URL for dare
        const dareApiUrl = `${api.DARE_API}`;

        // Fetch dare question from the API
        const dareResponse = await axios.get(dareApiUrl);
        if (!dareResponse.data || !dareResponse.data.success) {
            return reply("❌ Failed to fetch a dare question. Please try again later.");
        }

        // Extract dare question
        const dareQuestion = dareResponse.data.question;
        if (dareQuestion) {
            reply(`*Dare:* ${dareQuestion}`);
        }
        console.log(`♻ Dare Command Used : ${from}`);
    } catch (e) {
        console.error(e);
        reply("❌ An error occurred while fetching the dare question.");
    }
});
//=====================================Coupple Photo===================================
cmd({
    'pattern': "couplepp",
    'alias': ["couple", "cpp"],
    'react': '💑',
    'desc': "Get a male and female couple profile picture.",
    'category': "fun",
    'use': ".couplepp",
    'filename': __filename
  }, async (_0x552520, _0x51cf3f, _0x29f4cb, {
    from: _0x556c44,
    args: _0x2e3a6d,
    reply: _0x30d3fc
  }) => {
    try {
      _0x30d3fc("*DEW-MD IS 💑 Fetching couple profile pictures...*");
      const _0x173643 = await axios.get(api.CUP_AI);
      if (!_0x173643.data || !_0x173643.data.success) {
        return _0x30d3fc("❌ Failed to fetch couple profile pictures. Please try again later.");
      }
      const _0x5d4b91 = _0x173643.data.male;
      const _0x5a1e4a = _0x173643.data.female;
      if (_0x5d4b91) {
        await _0x552520.sendMessage(_0x556c44, {
          'image': {
            'url': _0x5d4b91
          },
          'caption': `*👨 Male Couple Profile Picture*\n\n*${bot.COPYRIGHT}*`
        }, {
          'quoted': _0x51cf3f
        });
      }
      if (_0x5a1e4a) {
        await _0x552520.sendMessage(_0x556c44, {
          'image': {
            'url': _0x5a1e4a
          },
          'caption': `*👩 Female Couple Profile Picture*\n\n*${bot.COPYRIGHT}*`
        }, {
          'quoted': _0x51cf3f
        });
      }
    } catch (_0x1dc6a7) {
      console.error(_0x1dc6a7);
      _0x30d3fc("❌ An error occurred while fetching the couple profile pictures.");
    }
  });
  
