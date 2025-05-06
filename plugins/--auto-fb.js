import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { facebook } from 'notmebotz-tools';

// تحديد مسار ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

const handler = async (m, { conn }) => {
    const facebookUrlPattern = /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/;
    const messageText = m.text.trim();

    if (!facebookUrlPattern.test(messageText)) {
        return; // إذا لم يكن الرابط من Facebook، لا تفعل شيئًا
    }

    m.reply(wait);

    try {
        let fb = await facebook(messageText);

        const videoUrl = fb?.data?.video?.hd || fb?.data?.video?.sd;
        if (!videoUrl) return m.reply('لم يتم العثور على رابط الفيديو.');

        const videoPath = `./src/tmp/facebook_${Date.now()}.mp4`;
        const audioPath = videoPath.replace('.mp4', '.mp3');

        // تنزيل الفيديو
        let buffer = await (await fetch(videoUrl)).buffer();
        fs.writeFileSync(videoPath, buffer);

        // إرسال الفيديو للمستخدم
        await conn.sendFile(m.chat, videoPath, 'facebook.mp4', '*_✅ تم التنزيل!_*', m);

        // استخراج الصوت من الفيديو باستخدام ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .output(audioPath)
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // إرسال الصوت المستخرج
        await conn.sendMessage(
            m.chat,
            { audio: fs.readFileSync(audioPath), mimetype: 'audio/mpeg', ptt: false}, // إرسال الصوت كـ PTT
            { quoted: m }
        );

        // حذف الملفات المؤقتة
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

    } catch (error) {
        console.error("❌ خطأ أثناء تنزيل فيديو Facebook:", error);
        m.reply('⚠️ حدث خطأ أثناء التنزيل. حاول مرة أخرى لاحقًا.');
    }
};

// تشغيل البوت تلقائيًا عند إرسال رابط Facebook
handler.customPrefix = /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/;
handler.command = new RegExp(); // بدون أمر محدد

export default handler;