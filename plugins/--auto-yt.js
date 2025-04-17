import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

const handler = async (m, { conn }) => {
    const text = m.text?.trim();
    const ytRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+$/i;

    if (!ytRegex.test(text)) return;

    try {
        const url = text;
        const resolution = '360';

        const infoRes = await fetch(`https://download.cloudkuimages.com/api/yti?url=${encodeURIComponent(url)}`);
        const info = await infoRes.json();

        if (info.status !== 'success') throw 'فشل في الحصول على معلومات الفيديو!';

        const videoRes = await fetch(`https://download.cloudkuimages.com/api/ytv?url=${encodeURIComponent(url)}&resolution=${resolution}`);
        const video = await videoRes.json();

        if (video.status !== 'success') throw 'فشل في جلب الفيديو!';

        const { title, url: videoUrl, thumbnail, uploader, uploadDate, views, likes, resolution: usedRes, fileSize } = video.result;

        const caption = `╭━━━━『 *YOUTUBE VIDEO* 』
┊ 
┊ 📌 *Title:* ${title}
┊ 🎭 *Channel:* ${uploader}
┊ 📅 *Upload:* ${uploadDate}
┊ 👁️ *Views:* ${views}
┊ 👍 *Likes:* ${likes}
┊ 
┊ 📽️ *Quality:* ${usedRes}
┊ 📦 *Size:* ${fileSize}
┊ 
╰━━━━━━━━━━━━━━━⬣`;

        // إرسال الفيديو أولاً
        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption,
            contextInfo: {
                externalAdReply: {
                    title: '🎬 ' + title,
                    body: `▶️ ${usedRes} Quality`,
                    thumbnailUrl: thumbnail,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                },
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: m });

        // تنزيل الفيديو مؤقتًا
        const tmpDir = tmpdir();
        const videoPath = join(tmpDir, `${Date.now()}_video.mp4`);
        const audioPath = join(tmpDir, `${Date.now()}_audio.ogg`);

        const videoStream = await fetch(videoUrl);
        const fileStream = fs.createWriteStream(videoPath);
        await new Promise((resolve, reject) => {
            videoStream.body.pipe(fileStream);
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
        });

        // استخراج الصوت بواسطة ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .audioCodec('libopus')
                .format('opus')
                .save(audioPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // إرسال الصوت كـ ptt (رسالة صوتية)
        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(audioPath),
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus'
        }, { quoted: m });

        // حذف الملفات المؤقتة
        await unlinkAsync(videoPath);
        await unlinkAsync(audioPath);

    } catch (e) {
        console.error(e);
        m.reply(`❌ فشل في المعالجة!\n${e.message || e}`);
    }
};

handler.customPrefix = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+$/i;
handler.command = new RegExp();

export default handler;