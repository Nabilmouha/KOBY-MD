import { ytmp4 } from '@vreden/youtube_scraper';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`مثال:\n${usedPrefix + command} https://www.youtube.com/watch?v=dQw4w9WgXcQ`);

  try {
    const url = args[0].trim();
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    if (!match) return m.reply('الرابط غير صالح');

    const id = match[1];
    const thumbnail = `https://i.ytimg.com/vi/${id}/hq720.jpg`;

    // إرسال الصورة فقط أولًا
    await conn.sendMessage(m.chat, {
      image: { url: thumbnail },
    }, { quoted: m });

    // تابع تحميل الفيديو
    const result = await ytmp4(url);

    if (!result.status || !result.download?.url) {
      return m.reply('فشل في استخراج رابط التحميل.');
    }

    const { metadata, download } = result;
    const safeName = download.filename.replace(/[\\/:*?"<>|]/g, '');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join('./tmp', fileName);
    const fixedPath = filePath.replace('.mp4', '_fixed.mp4');

    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    const response = await axios({
      method: 'GET',
      url: download.url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    execSync(`ffmpeg -i "${filePath}" -movflags +faststart -c copy "${fixedPath}"`);

    await conn.sendMessage(m.chat, {
      video: { url: fixedPath },
      mimetype: 'video/mp4',
      fileName: download.filename,
      caption: metadata.title
    }, { quoted: m });

    fs.unlinkSync(filePath);
    fs.unlinkSync(fixedPath);

  } catch (e) {
    console.error(e);
    m.reply('حدث خطأ أثناء المعالجة.');
  }
};

handler.command = ['ytmp4'];
export default handler;