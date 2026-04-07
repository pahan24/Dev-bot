const axios = require("axios");
const { cmd } = require('../lib/command');
const api = require('../lib/DEW-MD/api');
const bot = require('../lib/bot')
// FluxAI image generation
cmd({
  pattern: "fluxai",
  alias: ["flux"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "ai",
  filename: __filename
}, async (conn, _mek, m, { q, reply }) => {
  if (!q) return reply("Please provide a prompt for the image.");
  try {
    await reply("> *CREATING IMAGE ...🔥*");

    const response = await axios.get(`${api.FLUX_API}${encodeURIComponent(q)}`, {
      responseType: "arraybuffer"
    });

    if (!response?.data) return reply("Error: No image returned. Try again.");

    const imageBuffer = Buffer.from(response.data, "binary");
    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `✨ *Prompt*: *${q}*\n*${bot.COPYRIGHT}*`
    });
  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`❌ ${error?.response?.data?.message || error.message}`);
  }
});
