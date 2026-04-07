const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser, getContentType, fetchLatestBaileysVersion, Browsers, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const l = console.log;
const fs = require('fs');
const P = require('pino');
const config = require('./setting');
const util = require('util');
const axios = require('axios');
const { File } = require('megajs');
const ownerNumber = ["13135550002@s.whatsapp.net"];
const path = require('path');
const AdmZip = require('adm-zip');
const PLUGINS_DIR = './plugins';
const LIB_DIR = './lib';
const ZIP_DIR = './';

async function downloadAndExtractZip() {
  try {
    let response = await axios.get('https://dew-md-data.pages.dev/DATA-BASE/Data-File.json');
    const zipUrl = response.data.url;

    if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    if (!fs.existsSync(LIB_DIR)) fs.mkdirSync(LIB_DIR, { recursive: true });

    console.log('DEW-MD ♻ Installing...');

    const fileFromMega = File.fromURL(zipUrl);
    const downloadedBuffer = await fileFromMega.downloadBuffer();
    const tempZipPath = path.join(__dirname, 'temp.zip');

    fs.writeFileSync(tempZipPath, downloadedBuffer);
    console.log('DEW-MD ♻ ZIP file downloaded successfully ✅');

    const zip = new AdmZip(tempZipPath);
    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory) {
        if (entry.entryName.includes('/plugins/') || entry.entryName.startsWith('plugins/')) {
          const relativePath = entry.entryName.substring(entry.entryName.indexOf('plugins/') + 'plugins/'.length);
          const destPath = path.join(PLUGINS_DIR, path.dirname(relativePath));
          fs.mkdirSync(destPath, { recursive: true });
          zip.extractEntryTo(entry, destPath, false, true);
        } else {
          if (entry.entryName.includes('/lib/') || entry.entryName.startsWith('lib/')) {
            const relativePath = entry.entryName.substring(entry.entryName.indexOf('lib/') + 'lib/'.length);
            const destPath = path.join(LIB_DIR, path.dirname(relativePath));
            fs.mkdirSync(destPath, { recursive: true });
            zip.extractEntryTo(entry, destPath, false, true);
          }
        }
      }
    });

    console.log('DEW-MD ♻ Plugins extracted successfully ✅');
    fs.unlinkSync(tempZipPath);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const messageStore = new Map();
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');
const CREDS = path.join(AUTH_DIR, 'creds.json');

if (!fs.existsSync(CREDS)) {
  if (!config.SESSION_ID) {
    console.log('❌ SESSION_ID missing');
    process.exit(1);
  }

  let session = config.SESSION_ID.trim();
  if (!session.startsWith('DEW-MD~')) {
    console.log('❌ Invalid DEW-MD session format');
    process.exit(1);
  }

  const decoded = Buffer.from(session.substring(7), 'base64').toString('utf8');
  JSON.parse(decoded);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(CREDS, decoded, { encoding: 'utf8' });
  console.log('♻️ DEW-MD session restored successfully');
}

const express = require('express');
const app = express();
const port = process.env.PORT || 9090;

async function connectToWA() {
  await downloadAndExtractZip();

  const prefix = '' + config.PREFIX;
  console.log('DEW-MD ♻ Connecting');

  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
  const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
  const { sms } = require('./lib/msg');
  const botFunctions = require('./lib/bot');
  const { sendTranslations } = require('./lib/status');

  var { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    syncFullHistory: true,
    auth: state,
    version: version
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('Device Logged Out, please delete `auth_info_baileys` and rescan.');
        process.exit();
      } else {
        if (statusCode === DisconnectReason.connectionReplaced) {
          console.log('Connection replaced. Another session is active. Please stop other sessions and restart.');
          process.exit();
        } else {
          if (lastDisconnect.error?.message?.includes('Bad MAC')) {
            console.log('Bad MAC error detected. Deleting session and restarting...');
            fs.rmSync(__dirname + '/auth_info_baileys', { recursive: true, force: true });
            connectToWA();
          } else {
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting...');
            connectToWA();
          }
        }
      }
    } else {
      if (connection === 'open') {
        console.log('DEW-MD ♻ Bot connected to whatsapp ✅');

        const pluginsDir = require('path');
        fs.readdirSync('./plugins/').forEach(file => {
          pluginsDir.join('./plugins/', file).endsWith('.js') && require('./plugins/' + file);
        });

        console.log('DEW-MD ♻ Plugins installed successful ✅');
        console.log('DEW-MD ♻ Bot connected successfully');

        const welcomeMsg = '*╭──────────────●●►*\n> *DEW-MD CONNECTED SUCCESSFULLY*\n\n> *Type .menu to view commands*  \n\n*╭⊱✫ DEW MD ✫⊮╮*\n*│✫📂 Bot Name: ' + botFunctions.REPO_NAME + '*\n*│✫♻️ Prefix: ' + prefix + '*\n*╰──────────────●●►\n\n> Enjoy Using Dew MD';

        if (config.SEND_WELCOME === 'true') {
          sock.sendMessage(ownerNumber + '@s.whatsapp.net', { image: { url: botFunctions.ALIVE_IMG }, caption: welcomeMsg });
          sock.sendMessage(sock.user.id, { image: { url: botFunctions.ALIVE_IMG }, caption: welcomeMsg });
        }
      }
    }
  });

  const statusReplyMsg = '⚠️ *ANTI-CALL IS ACTIVE* ⚠️\n\nDear User,\n\nYou have attempted to call the Number. To ensure uninterrupted service, please refrain from calling.\n\nThank you for your understanding.\n\n' + botFunctions.COPYRIGHT;

  sock.ev.on('call', async (calls) => {
    if (config.ANTI_CALL === 'true') {
      for (const call of calls) {
        if (call.status == 'offer') {
          if (call.isGroup == false) {
            await sock.sendMessage(call.from, { image: { url: botFunctions.ALIVE_IMG }, caption: statusReplyMsg, mentions: [call.from] });
            await sock.rejectCall(call.id, call.from);
          } else {
            await sock.sendMessage(call.id, call.from);
          }
        }
      }
    }
  });

  const emojiList = [
    '😊', '👍', '😂', '💯', '🔥', '🙏', '🎉', '👏', '😎', '🤖', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '🤾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '🕳️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '🙂', '😑', '🤣', '😍', '😘', '😗', '😙', '😚', '😛', '😝', '😞', '😟', '😠', '😡', '😢', '😭', '😓', '😳', '😴', '😌', '😆', '😂', '🤔', '😒', '😓', '😶', '🙄', '🐶', '🐱', '🐔', '🐷', '🐴', '🐲', '🐸', '🐳', '🐋', '🐒', '🐑', '🐕', '🐩', '🍔', '🍕', '🥤', '🍣', '🍲', '🍴', '🍽', '🍹', '🍸', '🎂', '📱', '📺', '📻', '🎤', '📚', '💻', '📸', '📷', '❤️', '💔', '❣️', '☀️', '🌙', '🌃', '🏠', '🚪', '🗯️', '🇬🇧', '🇨🇦', '🇦🇺', '🇯🇵', '🇫🇷', '🇪🇸', '👍', '👎', '👏', '👫', '👭', '👬', '👮', '🤝', '🙏', '👑', '🌻', '🌺', '🌸', '🌹', '🌴', '🏞️', '🌊', '🚗', '🚌', '🛫️', '🛬️', '🚣', '🛥', '🚂', '🚁', '🚀', '🏃‍♂️', '🏋️‍♀️', '🏊‍♂️', '🏊‍♀️', '🎾', '🏀', '🏈', '🎯', '🏆', '⬆️', '⬇️', '⇒', '⇐', '↩️', '↪️', 'ℹ️', '‼️', '⁉️', '‽️', '©️', '®️', '™️', '🔴', '🔵', '🟢', '🔹', '🔺', '💯', '👑', '🤣', '❤️‍🩹', '🤷‍♀️', '🙅‍♂️', '🙅‍♀️', '🙆‍♂️', '🙆‍♀️', '🤦‍♂️', '🤦‍♀️', '🏻', '💆‍♂️', '💆‍♀️', '💇‍♂️', '💇‍♀️', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', ' ', '🏯', '🏰', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🌳', '🌲', '🌾', '🌿', '🍃', '🍂', '🍃', '🌻', '💐', '🌹', '🌺', '🌸', '🌴', '🏵', '🎀', '🏆', '🏈', '🏉', '🎯', '🏀', '🏊', '🏋', '🏌', '🎲', '📚', '📖', '📜', '📝', '💭', '💬', '🗣', '💫', '🌟', '🌠', '🎉', '🎊', '👏', '💥', '🔥', '💥', '🌪', '💨', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌱', '🌿', '🍃', '🍂', '🌻', '💐', '🌹', '🌺', '🌸', '🌴', '🏵', '🎀', '🏆', '🏈', '🏉', '🎯', '🏀', '🏊', '🏋', '🏌', '🎲', '📚', '📖', '📜', '📝', '💭', '💬', '🗣', '💫', '🌟', '🌠', '🎉', '🎊', '👏', '💥', '🔥', '💥', '🌪', '💨', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '🧑‍🦱', '🧑‍🦳', '🧑‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '🥷', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱', '👩‍🍼', '👨‍🍼', '🧑‍🍼', '👼', '🎅', '🤶', '🧑‍🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '𤾾', '𤾾‍♂️', '𤾾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣', '🦰', '🦱', '🦳', '🦲', '🐵'
  ];

  const uniqueEmojis = [...new Set(emojiList)];

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (messageUpsert) => {
    messageUpsert = messageUpsert.messages[0];

    if (!messageUpsert.message) return;

    messageUpsert.type = getContentType(messageUpsert.message) === 'ephemeralMessage' ? messageUpsert.message.ephemeralMessage.message : messageUpsert.message;

    if (messageUpsert.key && messageUpsert.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === 'true') {
      try {
        await sock.readMessages([messageUpsert.key]);

        const botJid = await jidNormalizedUser(sock.user.id);
        const reactEmoji = '💚';

        await sock.sendMessage(messageUpsert.key.participant, {
          react: {
            key: messageUpsert.key,
            text: reactEmoji
          }
        }, { statusJidList: [messageUpsert.key.participant, botJid] });

        console.log('📖 Status message marked as read and reacted to');
      } catch (error) {
        console.error('❌ Failed to mark status as read:', error);
      }
    }

    messageUpsert.typeMessage = messageUpsert.message.imageMessage ? 'imageMessage' : messageUpsert.message.videoMessage ? 'videoMessage' : messageUpsert.message.audioMessage ? 'audioMessage' : Object.keys(messageUpsert.message)[0];
    messageUpsert.text = messageUpsert.typeMessage == 'conversation' ? messageUpsert.message.conversation : '';

    if (messageUpsert.message.extendedTextMessage && messageUpsert.message.extendedTextMessage.contextInfo) {
      const quotedMsg = messageUpsert.message.extendedTextMessage.contextInfo.quotedMessage;
      const quotedText = messageUpsert.message.extendedTextMessage.contextInfo.text?.trim().toLowerCase();

      if (sendTranslations.includes(quotedText) && quotedMsg.participant && quotedMsg.participant.includes('@s.whatsapp.net')) {
        const remoteJid = messageUpsert.key.remoteJid;
        const quotedSender = quotedMsg.participant;
        const stanzaId = quotedMsg.stanzaId;

        try {
          await sock.sendMessage(remoteJid, { text: '❤️‍🩹*DEW MD STATUS SARVER*❤️‍🩹/n/n' + botFunctions.ALIVE_IMG }, { quoted: messageUpsert });
          await sock.sendMessage(remoteJid, { forward: { key: { remoteJid: 'status@broadcast', fromMe: false, id: stanzaId }, message: quotedMsg.quotedMessage } }, { quoted: messageUpsert });
          console.log('♻ status Save from ' + quotedSender + ' to ' + remoteJid);
        } catch (error) {
          console.error('Error forwarding quoted message:', error);
        }
      }
    }

    if (messageUpsert.key && messageUpsert.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_MSG === 'true') {
      const participantJid = messageUpsert.key.participant;
      const statusMsg = '' + botFunctions.COPYRIGHT;

      await sock.sendMessage(participantJid, { text: statusMsg, react: { text: '💜', key: messageUpsert.key } }, { quoted: messageUpsert });
    }

    const m = sms(sock, messageUpsert);
    const contentType = getContentType(messageUpsert.message);
    const messageString = JSON.stringify(messageUpsert.message);
    const from = messageUpsert.key.remoteJid;
    const mentions = contentType == 'extendedTextMessage' && messageUpsert.message.extendedTextMessage.contextInfo != null ? messageUpsert.message.extendedTextMessage.contextInfo.mentionedJid || [] : [];
    const body = contentType === 'conversation' ? messageUpsert.message.conversation : contentType === 'extendedTextMessage' ? messageUpsert.message.extendedTextMessage.text : contentType == 'imageMessage' && messageUpsert.message.imageMessage.caption ? messageUpsert.message.imageMessage.caption : contentType == 'videoMessage' && messageUpsert.message.videoMessage.caption ? messageUpsert.message.videoMessage.caption : '';

    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().toLowerCase().replace(/ +/g, ' ').slice(1);
    const q = args.join(' ');
    const isGroup = from.includes('@g.us');
    const sender = messageUpsert.key.fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net' || sock.user.id : messageUpsert.key.participant || messageUpsert.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const botNumber = sock.user.id.split(':')[0];
    const pushname = messageUpsert.pushName || 'Unknown';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botJid = await jidNormalizedUser(sock.user.id);
    const groupMetadata = isGroup ? await sock.groupMetadata(from).catch(() => { }) : undefined;
    const groupName = groupMetadata?.subject || '';
    const participants = groupMetadata?.participants || [];
    const groupAdmins = getGroupAdmins(participants);
    const isBotAdmins = groupAdmins.includes(botJid);
    const isAdmins = groupAdmins.includes(sender);
    const isQuoted = m.message.quoted ? true : false;

    const prefixRegex = config.PREFIX === 'false' || config.PREFIX === 'null' ? '^' : new RegExp('^[' + config.PREFIX + ']');

    const isJidInList = (jid) => {
      let list = jid;
      for (let i = 0; i < list.length; i++) {
        if (list[i] === from) return true;
      }
      return false;
    };

    let devData = (await axios.get('https://dew-md-data.pages.dev/DATA-BASE/devolopers.json')).data;
    const devList = devData.split(',');
    const isDev = [...devList].map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender);

    const qMessage = {
      key: { fromMe: false, remoteJid: 'status@broadcast', participant: '13135550002@s.whatsapp.net' },
      message: { contactMessage: { displayName: 'DEW-AI', vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:DEW-AI\nTEL;type=CELL;type=VOICE;waid=13135550002:13135550002\nEND:VCARD' } }
    };

    const contextInfo = { mentionedJid: [m.sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363400706010828@newsletter', newsletterName: 'Meta AI', serverMessageId: 683 } };

    const reply = (text) => {
      sock.sendMessage(from, { text: text }, { quoted: messageUpsert });
    };

    const isCreator = (id) => {
      const owner = '13135550002@s.whatsapp.net';
      return id === owner || isMe(id);
    };

    sock.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mimeType = '', response = await axios.head(url);
      mimeType = response.headers['content-type'];

      if (mimeType.split('/')[1] === 'gif') return sock.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });

      let type = mimeType.split('/')[0] + 'Message';

      if (mimeType === 'application/pdf') return sock.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });

      if (mimeType.split('/')[0] === 'image') return sock.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options });

      if (mimeType.split('/')[0] === 'video') return sock.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });

      if (mimeType.split('/')[0] === 'audio') return sock.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
    };

    if (!isQuoted && senderNumber !== botNumber) {
      if (config.AUTO_REACT === 'true') {
        const randomEmoji = uniqueEmojis[Math.floor(Math.random() * uniqueEmojis.length)];
        m.react(randomEmoji);
      }
    }

    isCmd && config.AUTO_TYPING === 'true' && await sock.sendPresenceUpdate('composing', from);

    if (!isOwner && isCreator && config.MODE === 'private') return;
    if (!isOwner && isCreator && isGroup && config.MODE === 'inbox') return;
    if (!isOwner && isCreator && !isGroup && config.MODE === 'groups') return;

    if (senderNumber.includes('13135550002')) {
      if (isQuoted) return;
      m.react('👨‍💻');
    }

    const commandsList = require('./lib/command');
    const cmdFound = isCmd ? commandsList.commands.find(cmd => cmd.pattern === command) || commandsList.commands.find(cmdCmd => cmdCmd.alias && cmdCmd.alias.includes(command)) : false;

    if (cmdFound) {
      if (cmdFound.react) sock.sendMessage(from, { react: { text: cmdFound.react, key: messageUpsert.key } });

      try {
        cmdFound.function(sock, messageUpsert, m, {
          from: from,
          quoted: mentions,
          body: body,
          isCmd: isCmd,
          command: command,
          args: args,
          q: q,
          isGroup: isGroup,
          sender: sender,
          senderNumber: senderNumber,
          botNumber2: botJid,
          botNumber: botNumber,
          pushname: pushname,
          isMe: isMe,
          isOwner: isOwner,
          groupMetadata: groupMetadata,
          groupName: groupName,
          participants: participants,
          groupAdmins: groupAdmins,
          isBotAdmins: isBotAdmins,
          isAdmins: isAdmins,
          qMessage: qMessage,
          contextInfo: contextInfo,
          isCreator: isCreator,
          reply: reply
        });
      } catch (error) {
        console.log('[PLUGIN ERROR] ' + error);
      }
    }

    commandsList.commands.map(async (plugin) => {
      if (body && plugin.on === 'body') plugin.function(sock, messageUpsert, m, {
        from: from,
        quoted: mentions,
        body: body,
        isCmd: isCmd,
        command: plugin,
        args: args,
        q: q,
        isGroup: isGroup,
        sender: sender,
        senderNumber: senderNumber,
        botNumber2: botJid,
        botNumber: botNumber,
        pushname: pushname,
        isMe: isMe,
        isOwner: isOwner,
        groupMetadata: groupMetadata,
        groupName: groupName,
        participants: participants,
        groupAdmins: groupAdmins,
        isBotAdmins: isBotAdmins,
        isAdmins: isAdmins,
        qMessage: qMessage,
        contextInfo: contextInfo,
        isCreator: isCreator,
        reply: reply
      }); else {
        if (messageUpsert.q && plugin.on === 'text') plugin.function(sock, messageUpsert, m, {
          from: from,
          quoted: mentions,
          body: body,
          isCmd: isCmd,
          command: plugin,
          args: args,
          q: q,
          isGroup: isGroup,
          sender: sender,
          senderNumber: senderNumber,
          botNumber2: botJid,
          botNumber: botNumber,
          pushname: pushname,
          isMe: isMe,
          isOwner: isOwner,
          groupMetadata: groupMetadata,
          groupName: groupName,
          participants: participants,
          groupAdmins: groupAdmins,
          isBotAdmins: isBotAdmins,
          isAdmins: isAdmins,
          qMessage: qMessage,
          contextInfo: contextInfo,
          isCreator: isCreator,
          reply: reply
        }); else {
          if ((plugin.on === 'image' || plugin.on === 'photo') && messageUpsert.typeMessage === 'imageMessage') plugin.function(sock, messageUpsert, m, {
            from: from,
            quoted: mentions,
            body: body,
            isCmd: isCmd,
            command: plugin,
            args: args,
            q: q,
            isGroup: isGroup,
            sender: sender,
            senderNumber: senderNumber,
            botNumber2: botJid,
            botNumber: botNumber,
            pushname: pushname,
            isMe: isMe,
            isOwner: isOwner,
            groupMetadata: groupMetadata,
            groupName: groupName,
            participants: participants,
            groupAdmins: groupAdmins,
            isBotAdmins: isBotAdmins,
            isAdmins: isAdmins,
            qMessage: qMessage,
            contextInfo: contextInfo,
            isCreator: isCreator,
            reply: reply
          }); else plugin.on === 'sticker' && messageUpsert.typeMessage === 'stickerMessage' && plugin.function(sock, messageUpsert, m, {
            from: from,
            quoted: mentions,
            body: body,
            isCmd: isCmd,
            command: plugin,
            args: args,
            q: q,
            isGroup: isGroup,
            sender: sender,
            senderNumber: senderNumber,
            botNumber2: botJid,
            botNumber: botNumber,
            pushname: pushname,
            isMe: isMe,
            isOwner: isOwner,
            groupMetadata: groupMetadata,
            groupName: groupName,
            participants: participants,
            groupAdmins: groupAdmins,
            isBotAdmins: isBotAdmins,
            isAdmins: isAdmins,
            qMessage: qMessage,
            contextInfo: contextInfo,
            isCreator: isCreator,
            reply: reply
          });
        }
      }
    });

    if (config.AUTO_VOICE === 'true') {
      if (!isCmd && messageUpsert.type !== 'audioMessage' && !isMe) {
        const autoVoiceUrl = 'https://dew-md-data.pages.dev/DATA-BASE/Auto-Mation/Auto-Voice.json';
        let { data: autoVoiceData } = await axios.get(autoVoiceUrl);

        for (vr in autoVoiceData) {
          if (new RegExp('\\b' + vr + '\\b', 'gi').test(body)) sock.sendMessage(from, { audio: { url: autoVoiceData[vr] }, mimetype: 'audio/mpeg', ptt: true }, { quoted: messageUpsert });
        }
      }
    }

    if (config.AUTO_REPLY === 'true') {
      if (!isCmd && !isMe) {
        const autoReplyUrl = 'https://dew-md-data.pages.dev/DATA-BASE/Auto-Mation/auto-reply.json';
        let { data: autoReplyData } = await axios.get(autoReplyUrl);

        for (vr in autoReplyData) {
          if (new RegExp('\\b' + vr + '\\b', 'gi').test(body)) m.reply(autoReplyData[vr]);
        }
      }
    }

    let checkCmd = body ? prefixRegex.test(body[0]) : 'false';
    if (config.READ_CMD === 'true' && checkCmd) await sock.readMessages([messageUpsert.key]);
    if (config.READ_MESSAGE === 'true') sock.readMessages([messageUpsert.key]);
    if (config.AUTO_RECORDING === 'true') sock.sendPresenceUpdate('recording', from);
    if (config.AUTO_TYPING === 'true') sock.sendPresenceUpdate('composing', from);
    if (config.ALWAYS_ONLINE === 'true') sock.sendPresenceUpdate('available')['catch'](() => { });
    if (config.ALWAYS_ONLINE === 'false') await sock.sendPresenceUpdate('unavailable');

    if (config.ANTI_LINK == 'true' && m.key.remoteJid.includes('@g.us') && !isOwner) return sock.sendMessage(m.key.remoteJid, '🚫 *This message was deleted !!*\n\n');

    if (config.ANTI_DELETE == 'true') {
      if (isJidInList && isBotAdmins && (!isAdmins && (!isMe && (body.includes('delete'))))) {
        await sock.sendMessage(from, { delete: messageUpsert.key });
        reply('*「 ⚠️ 𝑳𝑰𝑵𝑲 𝑫𝑬𝑳𝑬𝑻𝑬𝑫 ⚠️ 」*');
      }

      const badWords = await fetchJson('https://raw.githubusercontent.com/chamiofficial/server-/main/badby_alpha.json');

      if (config.ANTI_BAD == 'true') {
        if (!isAdmins && !isDev) {
          for (any in badWords) {
            if (body.toLowerCase().includes(badWords[any])) {
              if (!body.includes('https')) {
                if (!body.includes('tent')) {
                  if (!body.includes('delete')) {
                    if (groupAdmins.includes(sender)) return;
                    if (messageUpsert.key.fromMe) return;
                    await sock.sendMessage(from, { delete: messageUpsert.key });

                    if (config.AUTO_BLOCK === 'true') {
                      const blockUrl = 'https://dew-md-data.pages.dev/DATA-BASE/Auto-Mation/Auto-Voice.json';
                      let { data: blockData } = await axios.get(blockUrl);
                      if (blockData['hi']) await sock.sendMessage(from, { audio: { url: blockData['hi'] }, mimetype: 'audio/mpeg', ptt: true }, { quoted: messageUpsert });
                    } else {
                      await sock.sendMessage(from, { text: '*Bad word detected..!*' });
                    }
                    await sock.updateBlockStatus(from, [sender], 'block');
                  }
                }
              }
            }
          }
        }
      }

      if (config.ANTI_DELETE === 'true') {
        try {
          if (messageUpsert.message.protocolMessage && messageUpsert.message.protocolMessage.type === 0) {
            if (messageUpsert.key.fromMe) return;

            const deletedMsgKey = messageUpsert.message.protocolMessage.key;
            const msgId = deletedMsgKey.id;

            if (messageStore.has(msgId)) {
              const originalMsg = messageStore.get(msgId);
              const originalSender = originalMsg.key.participant || originalMsg.key.remoteJid;
              const deleterSender = messageUpsert.key.participant || messageUpsert.key.remoteJid;
              let sendTo = from;

              if (config.DELETEMSGSENDTO === 'me') sendTo = botNumber + '@s.whatsapp.net'; else {
                if (config.DELETEMSGSENDTO === 'owner') sendTo = ownerNumber[0] + '@s.whatsapp.net'; else config.DELETEMSGSENDTO && config.DELETEMSGSENDTO !== 'null' && (sendTo = config.DELETEMSGSENDTO.includes('@') ? config.DELETEMSGSENDTO : config.DELETEMSGSENDTO + '@g.us');
              }

              const headerMsg = '🚫 *This message was deleted !!*\n\n' + ('  🚮 *Deleted by:* @' + deleterSender.split('@')[0] + '\n') + ('  📩 *Sent by:* @' + originalSender.split('@')[0] + '\n\n');

              const downloadMedia = async (mediaMsg, mediaType) => {
                const stream = await downloadContentFromMessage(mediaMsg, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                  buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
              };

              let msgType = getContentType(originalMsg.message);
              let msgContent = originalMsg.message[msgType];

              if (msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2') {
                const realMsg = originalMsg.message[msgType].message;
                msgType = getContentType(realMsg);
                msgContent = realMsg[msgType];
              }

              if (msgType === 'conversation') await sock.sendMessage(sendTo, { text: headerMsg + '> 🔓 Message Text: ```' + originalMsg.message.conversation + '```', mentions: [originalSender, deleterSender] }, { quoted: originalMsg }); else {
                if (msgType === 'extendedTextMessage') await sock.sendMessage(sendTo, { text: headerMsg + '> 🔓 Message Text: ```' + msgContent.text + '```', mentions: [originalSender, deleterSender] }, { quoted: originalMsg }); else {
                  if (msgType === 'imageMessage') {
                    const mediaBuffer = await downloadMedia(msgContent, 'image');
                    await sock.sendMessage(sendTo, { image: mediaBuffer, caption: headerMsg + '> 🔓 Caption: ```' + (msgContent.caption || '') + '```', mentions: [originalSender, deleterSender] }, { quoted: originalMsg });
                  } else {
                    if (msgType === 'videoMessage') {
                      const mediaBuffer = await downloadMedia(msgContent, 'video');
                      await sock.sendMessage(sendTo, { video: mediaBuffer, caption: headerMsg + '> 🔓 Caption: ```' + (msgContent.caption || '') + '```', mentions: [originalSender, deleterSender] }, { quoted: originalMsg });
                    } else {
                      if (msgType === 'audioMessage') {
                        const mediaBuffer = await downloadMedia(msgContent, 'audio');
                        await sock.sendMessage(sendTo, { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: msgContent.ptt, caption: headerMsg, mentions: [originalSender, deleterSender] }, { quoted: originalMsg });
                      } else {
                        if (msgType === 'stickerMessage') {
                          const mediaBuffer = await downloadMedia(msgContent, 'sticker');
                          await sock.sendMessage(sendTo, { sticker: mediaBuffer, mentions: [originalSender, deleterSender] }, { quoted: originalMsg });
                        } else {
                          if (msgType === 'documentMessage') {
                            const mediaBuffer = await downloadMedia(msgContent, 'document');
                            await sock.sendMessage(sendTo, { document: mediaBuffer, mimetype: msgContent.mimetype, fileName: msgContent.fileName, caption: headerMsg + '> 🔓 Caption: ```' + (msgContent.caption || '') + '```', mentions: [originalSender, deleterSender] }, { quoted: originalMsg });
                          }
                        }
                      }
                    }
                  }
                }
              }
            } else {
              if (messageUpsert.key.remoteJid !== 'status@broadcast' && !messageUpsert.key.remoteJid.includes('@newsletter')) {
                messageStore.set(messageUpsert.key.id, messageUpsert);
                if (messageStore.size > 1000) {
                  const firstKey = messageStore.keys().next().value;
                  messageStore.delete(firstKey);
                }
              }
            }
          }
        } catch (error) {
          console.log('Anti-Delete Error:', error);
        }
      }
    });
}

app.get('/', (req, res) => {
  res.send('⏤ ͟͞ ❮❮ 𝔻𝔼𝕎-ℂ𝕆𝔻𝔼ℝ𝕊 ❯❯ ⏤ᴅᴇᴡ-ᴍᴅᵀᴹ ヤ');
});

app.listen(port, '0.0.0.0', () => console.log('Server listening on port http://localhost:' + port));

setTimeout(() => {
  connectToWA();
}, 4000);

function getEmojiArray() {
  const emojis = [
    '😊', '👍', '😂', '💯', '🔥', '🙏', '🎉', '👏', '😎', '🤖', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '🤾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '🕳️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🌳', '🌲', '🌾', '🌿', '🍃', '🍂', '🍃', '🌻', '💐', '🌹', '🌺', '🌸', '🌴', '🏵', '🎀', '🏆', '🏈', '🏉', '🎯', '🏀', '🏊', '🏋', '🏌', '🎲', '📚', '📖', '📜', '📝', '💭', '💬', '🗣', '💫', '🌟', '🌠', '🎉', '🎊', '👏', '💥', '🔥', '💥', '🌪', '💨', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌱', '🌿', '🍃', '🍂', '🌻', '💐', '🌹', '🌺', '🌸', '🌴', '🏵', '🎀', '🏆', '🏈', '🏉', '🎯', '🏀', '🏊', '🏋', '🏌', '🎲', '📚', '📖', '📜', '📝', '💭', '💬', '🗣', '💫', '🌟', '🌠', '🎉', '🎊', '👏', '💥', '🔥', '💥', '🌪', '💨', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🌪', '🌫', '🌬', '🌩', '🌨', '🌧', '🌦', '🌥', '🌡', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🏠', '🏡', '🏢', '', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🚣', '🛥', '🚂', '🚁', '🚀', '🛸', '🛹', '🚴', '🚲', '🛺', '🚮', '🚯', '🚱', '🚫', '🚽', '️', '💣', '🔫', '🕷️', '🕸️', '💀', '👻', '🕺', '💃', '🕴️', '👶', '👵', '👴', '👱', '👨', '👩', '👧', '👦', '👪', '👫', '👭', '👬', '👮', '🕴️', '💼', '📊', '📈', '📉', '📊', '📝', '📚', '📰', '📱', '💻', '📻', '📺', '🎬', '📽️', '📸', '📷', '🕯️', '💡', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '👑', '👸', '🤴', '👹', '🤺', '🤻', '👺', '🤼', '🤽', '𤾾', '🤿', '🦁', '🐴', '🦊', '🐺', '🐼', '🐾', '🐿', '🦄', '🦅', '🦆', '🦇', '🦈', '🐳', '🐋', '🐟', '🐠', '🐡', '🐙', '🐚', '🐜', '🐝', '🐞', '🕷️', '🦋', '🐛', '🐌', '🐚', '🌿', '🌸', '💐', '🌹', '🌺', '🌻', '🌴', '🏵', '🏰', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '🧑‍🦱', '🧑‍🦳', '🧑‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '🥷', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱', '👩‍🍼', '👨‍🍼', '🧑‍🍼', '👼', '🎅', '🤶', '🧑‍🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '𤾾', '𤾾‍♂️', '𤾾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣', '🦰', '🦱', '🦳', '🦲', '🐵'
  ];
  return emojis;
}