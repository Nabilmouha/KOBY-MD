import fetch from 'node-fetch';

const handler = async (m, { conn, args, text }) => {
  if (!text) return m.reply('وين الرابط؟ أرسل رابط يوتيوب.');

  let api = `https://api.nekorinn.my.id/downloader/savetube?url=${encodeURIComponent(text)}&format=mp3`;

  try {
    let res = await fetch(api);
    let json = await res.json();

    if (!json.status || !json.result?.download) {
      return m.reply('فشل في جلب الرابط، تأكد من صحة الرابط.');
    }

    let { title, download, duration, quality } = json.result;

    await m.reply(`🎶 *${title}*\n⏱️ مدة: ${duration}\n🎵 جودة: ${quality}kbps\n\nجاري الإرسال...`);

    await conn.sendMessage(m.chat, {
      audio: { url: download },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      ptt: false // إذا تبي يرسله كـ Voice Note خله true
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('حدث خطأ أثناء التحميل.');
  }
};

handler.command = /^ytaudio|ytmp3$/i; // تقدر تخليه أمر مثلا ytaudio أو ytmp3
handler.help = ['ytaudio <url>'];
handler.tags = ['downloader'];

export default handler;