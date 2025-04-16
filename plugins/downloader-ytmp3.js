import yt from 'nishi-yt'; // مكتبة التنزيل
import yts from 'yt-search'; // مكتبة البحث

const handler = async (m, { conn, text }) => {
  const query = text.trim();
  if (!query) {
    return conn.reply(m.chat, 'يرجى كتابة كلمة البحث عن فيديو من YouTube.', m);

  }

  try {
    const searchResult = await yts(query);
    const video = searchResult.videos[0];

    if (!video) {
      return conn.reply(m.chat, 'لم يتم العثور على أي نتائج.', m);
    }

    const ytLink = video.url;

    // إرسال معلومات الفيديو
    const videoInfo = `
*العنوان:* ${video.title}
*الرابط:* ${video.url}
*القناة:* ${video.author.name}
*المدة:* ${video.timestamp}
*المشاهدات:* ${video.views.toLocaleString()}
*تم النشر:* ${video.ago}
`.trim();

    await conn.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: videoInfo
    }, { quoted: m });

    // تحميل الصوت بصيغة mp3
    const results = await yt.download({
      yt_link: ytLink,
      yt_format: 'mp3',
      logs: true,
      saveId: true
    });

    if (results) {
      const mediaUrl = results.media;

      await conn.sendMessage(m.chat, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mp4',
        ptt: true,
        caption: `🎵 *تم تنزيل الصوت:* ${results.info.title}`
      }, { quoted: m });
    } else {
      conn.reply(m.chat, 'فشل في تحميل الملف من الرابط المحدد.', m);
    }
  } catch (error) {
    console.error(error);
    conn.reply(m.chat, 'حدث خطأ أثناء البحث أو التنزيل.', m);
  }
};
handler.command = /^ytmp3$/i;

export default handler;