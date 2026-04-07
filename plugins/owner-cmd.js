const { cmd } = require('../lib/command');
const {sleep} = require('../lib/functions')
const bot = require('../lib/bot')
let baileysDownloader = null;
try {
  // try to require baileys directly (works if installed)
  const baileys = require("@whiskeysockets/baileys");
  baileysDownloader = baileys.downloadContentFromMessage || baileys.downloadMediaMessage || null;
} catch (e) {
  // not installed or inaccessible — that's OK, we'll try client helpers below
  baileysDownloader = null;
}

cmd({
  pattern: "vv",
  alias: ["viewonce", "rview"],
  react: "🫟",
  desc: "Owner/Bot - retrieve quoted view-once",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    const botNumber = (client?.user?.id || "").split(":")[0] + "@s.whatsapp.net";
    const sender = message.sender || message.key?.participant || message.participant;
    const isBot = sender === botNumber;

    if (!isOwner && !isBot) {
      return await client.sendMessage(from, { text: "*🚫 Owner Only Command!*" }, { quoted: message });
    }

    if (!message.quoted) {
      return await client.sendMessage(from, { text: "*🍁 Please reply to a view-once message!*" }, { quoted: message });
    }

    // Normalize quoted -> real media message (handle viewOnce v1/v2/v2Extension)
    let quoted = message.quoted;
    let real = quoted.message || quoted;
    if (real.viewOnceMessage) real = real.viewOnceMessage.message;
    if (real.viewOnceMessageV2) real = real.viewOnceMessageV2.message;
    if (real.viewOnceMessageV2Extension) real = real.viewOnceMessageV2Extension.message;
    if (real.ephemeralMessage && real.ephemeralMessage.message) real = real.ephemeralMessage.message;

    const mediaType = Object.keys(real)[0] || ""; // e.g. imageMessage
    if (!mediaType) {
      return await client.sendMessage(from, { text: "❌ Could not find media in quoted message." }, { quoted: message });
    }

    // ---------------------------
    // Download using multiple fallbacks
    // ---------------------------
    let buffer = null;

    // 1) quoted.download() — some wrappers attach this directly
    if (typeof quoted.download === "function") {
      try {
        buffer = await quoted.download();
      } catch (e) {
        // continue to other fallbacks
      }
    }

    // 2) client.downloadMediaMessage (common in many wrappers)
    if (!buffer && typeof client.downloadMediaMessage === "function") {
      try {
        // some implementations expect quoted, others expect quoted.message
        try {
          buffer = await client.downloadMediaMessage(quoted, "buffer", {});
        } catch (err) {
          buffer = await client.downloadMediaMessage(quoted.message || quoted, "buffer", {});
        }
      } catch (e) {
        // ignore and try next
      }
    }

    // 3) baileys direct helper if available (downloadContentFromMessage)
    if (!buffer && baileysDownloader) {
      try {
        // baileysDownloader expects (messageProto, type) and returns a stream (async iterator)
        const type = mediaType.replace(/Message$/, ""); // image, video, audio, document
        const stream = await baileysDownloader(real[mediaType], type);
        const chunks = [];
        for await (const ch of stream) chunks.push(ch);
        buffer = Buffer.concat(chunks);
      } catch (e) {
        // ignore and try next
      }
    }

    // 4) client.mediaDownload or other custom helpers (best-effort)
    // Try common alternative names
    const altHelpers = ["downloadContentFromMessage", "downloadMedia", "downloadMediaMessage", "downloadAndSaveMediaMessage"];
    if (!buffer) {
      for (const h of altHelpers) {
        if (typeof client[h] === "function") {
          try {
            buffer = await client[h](real[mediaType], mediaType.replace(/Message$/, ""));
            // client functions might return Buffer directly or a stream
            if (!Buffer.isBuffer(buffer) && buffer && typeof buffer.on === "function") {
              // it's a stream -> collect
              const chunks = [];
              for await (const ch of buffer) chunks.push(ch);
              buffer = Buffer.concat(chunks);
            }
            if (Buffer.isBuffer(buffer)) break;
          } catch (e) {
            buffer = null;
          }
        }
      }
    }

    if (!buffer) {
      // nothing worked — tell user what to check
      return await client.sendMessage(from, {
        text: "❌ Could not download media: no supported download helper available in this runtime.\n\nPossible fixes:\n1) Install `@adiwajshing/baileys` (v4/v5) in your project.\n2) Use a wrapper that exposes `client.downloadMediaMessage` or `quoted.download()`.\n3) Send me the bot logs / environment so I can adapt the helper names."
      }, { quoted: message });
    }

    // ---------------------------
    // Send back depending on mediaType
    // ---------------------------
    let out = {};
    if (mediaType.includes("image")) {
      out = { image: buffer, caption: real[mediaType].caption || "" };
    } else if (mediaType.includes("video")) {
      out = { video: buffer, caption: real[mediaType].caption || "" };
    } else if (mediaType.includes("audio")) {
      out = { audio: buffer, mimetype: "audio/mp4", ptt: real[mediaType].ptt || false };
    } else if (mediaType.includes("document")) {
      out = { document: buffer, fileName: real[mediaType].fileName || "file" };
    } else {
      return await client.sendMessage(from, { text: "❌ Unsupported media type." }, { quoted: message });
    }

    await client.sendMessage(from, out, { quoted: message });

  } catch (err) {
    console.error("VV Handler Error:", err);
    await client.sendMessage(message.from || from, { text: "❌ *VV Error:* " + (err && err.message ? err.message : String(err)) }, { quoted: message });
  }
});
//===========================Get PP========================================
cmd({
    pattern: "getpp",
    desc: "Fetch the profile picture of a tagged or replied user.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { quoted, isGroup, sender, participants, reply }) => {
    try {
        // Determine the target user
        const targetJid = quoted ? quoted.sender : sender;

        if (!targetJid) return reply("⚠️ Please reply to a message to fetch the profile picture.");

        // Fetch the user's profile picture URL
        const userPicUrl = await conn.profilePictureUrl(targetJid, "image").catch(() => null);

        if (!userPicUrl) return reply("⚠️ No profile picture found for the specified user.");

        // Send the user's profile picture
        await conn.sendMessage(m.chat, {
            image: { url: userPicUrl },
            caption: `*User* - ${targetJid}\n\n*${bot.COPYRIGHT}*`
        });
    } catch (e) {
        console.error("Error fetching user profile picture:", e);
        reply("❌ An error occurred while fetching the profile picture. Please try again later.");
    }
});          
//============================Shutdown command===========================================
cmd({
    pattern: "shutdown",
    desc: "Shutdown the bot",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { isOwner, isCreator, reply }) => {
    try {
        if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
        const { exec } = require("child_process");
        reply("Shutting down...");
        await sleep(1500);
        exec("pm2 stop all"); // Command to stop the bot (shut down)
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
//===============================================ReStart================================================
cmd(
  {
    pattern: "restart",
    alias: ["rebot", "reboot"],
    react: "🔁",
    desc: "Restart only this bot",
    category: "owner",
    filename: __filename
  },
  async (
    conn,
    mek,
    m,
    {
      isOwner,
      reply,
      isCreator,
      botNumber // like '94724935040@s.whatsapp.net'
    }
  ) => {
    try {
      if (!isOwner && !isCreator) return reply("❌ Only the owner can restart this bot.");

      const { exec } = require("child_process");

      const pm2ProcessName = `DEW-MD`;

      reply(`🔁 Restarting bot: ${pm2ProcessName}...`);

      if (typeof sleep === "undefined")
        global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      await sleep(1500);

      exec(`pm2 restart ${pm2ProcessName}`, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Restart Error:", err);
          return reply(`❌ Failed to restart:\n${err.message}`);
        }
        console.log(`✅ Restarted: ${pm2ProcessName}`);
      });
    } catch (e) {
      console.error("❌ Error in restart command:", e);
      reply(`❌ Unexpected error:\n${e}`);
    }
  }
);
// 2. Broadcast Message to All Groups
cmd({
    pattern: "broadcast",
    desc: "Broadcast a message to all groups.",
    category: "owner",
    react: "📢",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, args, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    if (args.length === 0) return reply("📢 Please provide a message to broadcast.");
    const message = args.join(' ');
    const groups = Object.keys(await conn.groupFetchAllParticipating());
    for (const groupId of groups) {
        await conn.sendMessage(groupId, { text: message }, { quoted: mek });
    }
    reply("📢 Message broadcasted to all groups.");
});
// 3. Set Profile Picture
cmd({
    pattern: "setpp",
    desc: "Set bot profile picture.",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, isCreator, quoted, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    if (!quoted || !quoted.message) 
    return reply("❌ Please reply to an image.");
    try {
        const media = await conn.downloadMediaMessage(quoted);
        await conn.updateProfilePicture(conn.user.jid, { url: media });
        reply("🖼️ Profile picture updated successfully!");
    } catch (error) {
        reply(`❌ Error updating profile picture: ${error.message}`);
    }
});
// 4. Block User
cmd({
    pattern: "block",
    desc: "Block a user.",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, isCreator, quoted, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    if (!quoted) return reply("❌ Please reply to the user you want to block.");
    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'block');
        reply(`🚫 User ${user} blocked successfully.`);
    } catch (error) {
        reply(`❌ Error blocking user: ${error.message}`);
    }
});
// 5. Unblock User
cmd({
    pattern: "unblock",
    desc: "Unblock a user.",
    category: "owner",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    if (!quoted) return reply("❌ Please reply to the user you want to unblock.");
    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'unblock');
        reply(`✅ User ${user} unblocked successfully.`);
    } catch (error) {
        reply(`❌ Error unblocking user: ${error.message}`);
    }
});
// 6. Clear All Chats
cmd({
    pattern: "clearchats",
    desc: "Clear all chats from the bot.",
    category: "owner",
    react: "🧹",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    try {
        const chats = conn.chats.all();
        for (const chat of chats) {
            await conn.modifyChat(chat.jid, 'delete');
        }
        reply("🧹 All chats cleared successfully!");
    } catch (error) {
        reply(`❌ Error clearing chats: ${error.message}`);
    }
});
//======================JID================================
cmd({
    pattern: "jid",
    desc: "get jids",
    category: "owner",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {

let jid = from
        
 await conn.sendMessage(from,{text: jid },{quoted:mek})
      
}catch(e){
console.log(e)
reply(`${e}`)

}
})
// 8. Group JIDs List
cmd({
    pattern: "gjid",
    desc: "Get the list of JIDs for all groups the bot is part of.",
    category: "owner",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ You are not the owner!");
    const groups = await conn.groupFetchAllParticipating();
    const groupJids = Object.keys(groups).join('\n');
    reply(`📝 *Group JIDs:*\n\n${groupJids}`);
});
//===========================================Join===========================================
cmd({ 
           pattern: "join",
            desc: "joins group by link",
            category: "owner",
            use: '<group link.>',
        },
    async(conn, mek, m,{q, isMe, isOwner, isCreator, reply}) => {
    if(!isOwner && !isCreator && !isMe)return reply("❌ You are not the owner!");
    try{  if (!q) return reply(`Please give me Query`);
            if (!q.split(" ")[0] && !q.split(" ")[0].includes("whatsapp.com"))
               reply("Link Invalid, Please Send a valid whatsapp Group Link!");
            let result = q.split(" ")[0].split("https://chat.whatsapp.com/")[1];
            await conn.groupAcceptInvite(result)
                .then((res) => reply("You Are Joined Group"))
                .catch((err) => reply("Error in Joining Group"));
} catch (e) {
reply('*Error !!*')
l(e)
}
})
//-----------------------------------------------Leave Group-----------------------------------------------

cmd({
    pattern: "leavegc",
    desc: "Make the bot leave the group.",
    category: "owner",
    react: "👤",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner, isCreator }) => {
    try {
        if(!isOwner && !isCreator) return reply("❌ You are not the owner!");//check owner
        await conn.groupLeave(from);
        return await conn.sendMessage(from, { text: "Bot has left the group." }, { quoted: mek });
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        return reply(`Error: ${e.message}`);
    }
});
//-----------------------------------------------Set Bio Of Bot-----------------------------------------------

cmd({
    pattern: "setbio",
    desc: "Set bot's profile bio.",
    react: "👤",
    use: '.setbio <New Bio>',
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, reply , isOwner, isCreator }) => {
    try {
        if (!isOwner && !isCreator) return reply('You are not authorized to use this command.');
        if (args.length === 0) return reply('Please provide a bio text.');
        const bio = args.join(' ');
        await conn.updateProfileStatus(bio);
        return await reply('Profile bio updated successfully.');
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        return reply(`Error: ${e.message}`);
    }
});

