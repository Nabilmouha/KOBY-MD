import { ytmp4 } from '@vreden/youtube_scraper';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`مثال:\n${usedPrefix + command} https://www.youtube.com/watch?v=dQw4w9WgXcQ`);

  try {
    const result = await ytmp4(args[0]);

    if (!result.status || !result.download?.url) {
      return m.reply('فشل في استخراج رابط التحميل.');
    }

    const { metadata, download } = result;
    const safeName = download.filename.replace(/[\\/:*?"<>|]/g, '');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join('./tmp', fileName);
    const fixedPath = filePath.replace('.mp4', '_fixed.mp4');

    // تأكد من وجود مجلد التخزين المؤقت
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    // تحميل الفيديو إلى التخزين المحلي
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

    // إصلاح الفيديو باستخدام ffmpeg
    execSync(`ffmpeg -i "${filePath}" -movflags +faststart -c copy "${fixedPath}"`);

    // إرسال الصورة والمعلومات أولًا
    await conn.sendMessage(m.chat, {
      image: { url: metadata.thumbnail },
      caption: `*${metadata.title}*\n\n*المدة:* ${metadata.timestamp}\n*المشاهدات:* ${metadata.views.toLocaleString()}\n*القناة:* ${metadata.author.name}\n\n*الجودة:* ${download.quality}\n*الرابط:* ${metadata.url}`
    }, { quoted: m });

    // إرسال الفيديو المعالج
    await conn.sendMessage(m.chat, {
      video: { url: fixedPath },
      mimetype: 'video/mp4',
      fileName: download.filename,
      caption: metadata.title
    }, { quoted: m });

    // حذف الملفات بعد الإرسال
    fs.unlinkSync(filePath);
    fs.unlinkSync(fixedPath);

  } catch (e) {
    console.error(e);
    m.reply('حدث خطأ أثناء المعالجة.');
  }
};

handler.command = ['ytmp4'];
handler.help = ['ytmp4 <رابط>'];
handler.tags = ['downloader'];

export default handler;