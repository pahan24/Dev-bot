const axios = require("axios");
const { cmd } = require("../lib/command");
const PDFDocument = require("pdfkit");
const { Buffer } = require("buffer");
const api = require("../lib/DEW-MD/api");
const bot = require('../lib/bot')
const googleTTS = require('google-tts-api')
//=========================Pair==================================
cmd(
  {
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Pairing code",
    category: "tools",
    use: ".pair +943477868XXX",
    filename: __filename,
  },
  async (conn, mek, m, { from, prefix, quoted, q, reply }) => {
    try {
    if (!q) {
      return reply("*Example -* .pair +943477868XXX");
     }
      // Helper function for delay
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      // Fetch pairing code
      //const fetch = require("node-fetch");
      const response = await fetch(`${api.PAIR_SITE}${q}`);
      const pair = await response.json();

      // Check for errors in response
      if (!pair || !pair.code) {
        return await reply(
          "Failed to retrieve pairing code. Please check the phone number and try again."
        );
      }

      // Success response
      const pairingCode = pair.code;
      const doneMessage = "> *DEW-MD PAIR COMPLETED*";

      // Send first message
      await reply(`${doneMessage}\n\n*Your pairing code is:* ${pairingCode}`);

      // Add a delay of 2 seconds before sending the second message
      await sleep(2000);

      // Send second message with just the pairing code
      await reply(`Code: ${pairingCode}`);
    } catch (error) {
      console.error(error);
      await reply("An error occurred. Please try again later.");
    }
  }
);
//====================================================SS==================================================
cmd(
  {
    pattern: "ss",
    alias: ["ssweb"],
    react: "🚀",
    desc: "Download screenshot of a given link.",
    category: "tools",
    use: ".ss <link>",
    filename: __filename,
  },
  async ( conn, mek, { from, q, reply, } ) => {
    if (!q) {
      return reply("Please provide a URL to capture a screenshot.");
    }

    try {
      const apiUrl = `${api.SS_API}${q}&device=mobile`;
      const response = await axios.get(apiUrl);
      const screenshotUrl = response.data.url;

      await conn.sendMessage(
        from,
        {
          image: { url: screenshotUrl },
          caption: `*DEW-MD-WEB-SS*\n\n*${bot.COPYRIGHT}*`,
        },
        { quoted: mek }
      );
    } catch (error) {
      console.error(error);
      reply("Failed to capture the screenshot. Please try again.");
    }
  }
);
//==================================================Trancelator================================================
cmd(
  {
    pattern: "trt",
    alias: ["translate"],
    desc: "🌍 Translate text between languages",
    react: "⚡",
    category: "tools",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      const args = q.split(" ");
      if (args.length < 2)
        return reply(
          "❗ Please provide a language code and text. Usage: .translate [language code] [text]"
        );

      const targetLang = args[0];
      const textToTranslate = args.slice(1).join(" ");

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        textToTranslate
      )}&langpair=en|${targetLang}`;

      const response = await axios.get(url);
      const translation = response.data.responseData.translatedText;

      const translationMessage = `◈ 𝐓𝐑𝐀𝐍𝐒𝐋𝐀𝐓𝐎𝐑

◈=======================◈

🔤 *Original*: ${textToTranslate}

🔠 *Translated*: ${translation}

🌐 *Language*: ${targetLang.toUpperCase()}

◈=======================◈

*${bot.COPYRIGHT}*`;
      console.log(`♻ Translate Command Used : ${from}`);
      return reply(translationMessage);
    } catch (e) {
      console.log(e);
      return reply(
        "⚠️ An error occurred data while translating the your text. Please try again later🤕"
      );
    }
  }
);
//===============================Tts=======================================
cmd({
  pattern: "tts",
  desc: "Convert text to speech with different voices.",
  category: "tools",
  react: "🔊",
  filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
  try {
    // Ensure there is text
    if (!q) {
      return reply("Please provide text for conversion! Usage: `.tts <text>`");
    }

    // Set default language
    let voiceLanguage = 'en-US'; // Default language is American English

    // Check if user specifies Urdu language
    if (args[0] === "ur" || args[0] === "urdu") {
      voiceLanguage = 'ur'; // Set language to Urdu
    }

    // Generate the URL for the TTS audio
    const url = googleTTS.getAudioUrl(q, {
      lang: voiceLanguage,  // Choose language based on input
      slow: false,  // Normal speed for the speech
      host: 'https://translate.google.com'
    });

    // Send the audio message to the user
    await conn.sendMessage(from, { 
      audio: { url: url }, 
      mimetype: 'audio/mpeg', 
      ptt: true 
    }, { quoted: mek });

  } catch (error) {
    console.error(error);
    reply(`Error: ${error.message}`);
  }
});
//====================================================QR CODE============================================
cmd(
  {
    pattern: "qrcode",
    alias: ["qr"],
    react: "🔄",
    desc: "Generate a QR code.",
    category: "tools",
    filename: __filename,
  },
  async ( conn, m, { from, q, reply, } ) => {
    try {
      if (!q) return reply("Please provide text to generate QR code.");
      await reply("> *DEW-MD Generating QR code...🔄*");
      const apiUrl = `${api.QR_API}${encodeURIComponent(q)}&size=200x200`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");

      await conn.sendMessage(
        m.chat,
        { image: buffer },
        { quoted: m, caption: `*${bot.COPYRIGHT}*` }
      );
      console.log(`♻ QR Code Command Used : ${from}`);
    } catch (error) {
      console.error(error);
      reply(`An error occurred: ${error.message}`);
    }
  }
);
//=============================PDF================================
cmd(
  {
    pattern: "topdf",
    alias: ["pdf"],
    desc: "Convert provided text to a PDF file.",
    react: "📄",
    category: "tools",
    filename: __filename,
  },
  async ( conn, mek, { from, q, reply, } ) => {
    try {
      if (!q)
        return reply(
          "Please provide the text you want to convert to PDF. *Eg* `.topdf`"
        );

      // Create a new PDF document
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        // Send the PDF file
        await conn.sendMessage(
          from,
          {
            document: pdfData,
            mimetype: "application/pdf",
            fileName: `${bot.BOT_NAME}.pdf`,
            caption: `
*📄 PDF created successully!*

*${bot.COPYRIGHT}*`,
          },
          { quoted: mek }
        );
      });

      // Add text to the PDF
      doc.text(q);

      // Finalize the PDF and end the stream
      doc.end();
    } catch (e) {
      console.error(e);
      reply(`Error: ${e.message}`);
    }
  }
);
