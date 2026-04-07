const { cmd } = require('../lib/command')
const bot = require('../lib/bot') 
const axios = require('axios');
const config = require('../setting');

cmd({
    pattern: "pp",
    alias: ["pastpapersearch","ppsearch"],
    desc: "Search for past papers.",
    react: "🔎",
    category: "education",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, pushname }) => {
    if (!q) {
        return reply("Please provide a search term.\nExample: `.ppsearch a/l maths 2022`");
    }

    try {
        await conn.sendMessage(from, { react: { text: '🕐', key: mek.key } });

        // API for searching past papers
        const searchApiUrl = `${config.API_BASE}/education/pastpaper?apikey=${config.API_KEY}&q=${encodeURIComponent(q)}`;
        const { data: apiResult } = await axios.get(searchApiUrl);

        if (!apiResult.success || !apiResult.result || apiResult.result.length === 0) {
            return reply(`❌ No past papers found for "${q}".`);
        }

        const papers = apiResult.result.slice(0, 10); // Show top 10 results

        let list = `*🔎 DEW-MD Past Paper Search Results for "${q}"*\n\n`;
        papers.forEach((paper, index) => {
            list += `*${index + 1}.* ${paper.title}\n\n`;
        });
        list += `Reply with a number (1-${papers.length}) to download.\n\n${bot.COPYRIGHT}`;

        const listMsg = await conn.sendMessage(from, {
            image: { url: papers[0].image || bot.ALIVE_IMG },
            caption: list
        }, { quoted: mek });

        const selectionHandler = async (update) => {
            const initialMsg = update.messages?.[0];
            if (!initialMsg?.message?.extendedTextMessage?.contextInfo || initialMsg.message.extendedTextMessage.contextInfo.stanzaId !== listMsg.key.id) return;

            const index = parseInt(initialMsg.message.extendedTextMessage.text) - 1;
            if (isNaN(index) || !papers[index]) return reply("❌ Invalid selection. Please reply with a valid number.");

            conn.ev.off('messages.upsert', selectionHandler); // Unregister handler

            const selectedPaper = papers[index];
            await reply(`*Fetching download options for:* ${selectedPaper.title}...`);

            // API for getting download links for the selected paper
            const downloadApiUrl = `${config.API_BASE}/education/pastpaperdl?url=${encodeURIComponent(selectedPaper.url)}&apikey=${config.API_KEY}`;
            const { data: downloadResult } = await axios.get(downloadApiUrl);

            if (!downloadResult.success || !downloadResult.result || downloadResult.result.length === 0) {
                return reply("❌ Could not find any downloadable parts for this paper.");
            }

            const parts = downloadResult.result;

            if (parts.length === 1) {
                // If there's only one part, download it directly
                const part = parts[0];
                await reply(`*Downloading:* ${part.title}...`);
                await conn.sendMessage(from, { document: { url: part.url }, mimetype: 'application/pdf', fileName: `${selectedPaper.title.replace(/[^a-zA-Z0-9]/g, '_')}_${part.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` }, { quoted: initialMsg });
                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
            } else {
                // If there are multiple parts, ask the user to choose
                let partList = `*📄 Select a part to download for "${selectedPaper.title}"*\n\n`;
                parts.forEach((part, i) => {
                    partList += `*${i + 1}.* ${part.title}\n`;
                });
                partList += `\nReply with a number (1-${parts.length}) to download.\n\n${bot.COPYRIGHT}`;

                const partListMsg = await conn.sendMessage(from, {
                    text: partList
                }, { quoted: initialMsg });

                const partSelectionHandler = async (partUpdate) => {
                    const partMsg = partUpdate.messages?.[0];
                    if (!partMsg?.message?.extendedTextMessage?.contextInfo || partMsg.message.extendedTextMessage.contextInfo.stanzaId !== partListMsg.key.id) return;

                    const partIndex = parseInt(partMsg.message.extendedTextMessage.text) - 1;
                    if (isNaN(partIndex) || !parts[partIndex]) return reply("❌ Invalid part selection.");

                    conn.ev.off('messages.upsert', partSelectionHandler);

                    const selectedPart = parts[partIndex];
                    await reply(`*Downloading:* ${selectedPart.title}...`);
                    await conn.sendMessage(from, { document: { url: selectedPart.url }, mimetype: 'application/pdf', fileName: `${selectedPaper.title.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedPart.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` }, { quoted: partMsg });
                    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
                };

                conn.ev.on('messages.upsert', partSelectionHandler);
            }
        };

        conn.ev.on('messages.upsert', selectionHandler);

    } catch (error) {
        console.error('[PPSEARCH CMD ERROR]', error);
        reply("❌ An error occurred while searching for past papers.");
    }
});
