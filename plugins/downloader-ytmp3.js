import { ytmp3 } from '@vreden/youtube_scraper';

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply('أدخل رابط يوتيوب');

  try {
    const result = await ytmp3(text);
    if (result?.status) {
      await conn.sendMessage(m.chat, {
        audio: { url: result.download.url },
        mimetype: 'audio/mp4'
      }, { quoted: m });
    } else {
      m.reply('فشل في تحميل الصوت');
    }
  } catch (err) {
    console.error(err);
    m.reply('حدث خطأ أثناء التحميل');
  }
};

handler.command = ['ytmp3'];
export default handler;