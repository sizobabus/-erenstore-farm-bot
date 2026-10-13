const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

let configs;
try {
  const data = fs.readFileSync('./config.json', 'utf8');
  configs = JSON.parse(data);
  if (!Array.isArray(configs)) configs = [configs];
} catch (err) {
  console.log('❌ config.json dosyası okunamadı veya hatalı!');
  process.exit(1);
}

if (configs.length === 0) {
  console.log('❌ config.json içinde hesap bulunamadı!');
  process.exit(1);
}

const atasozleri = [
  "Aç koyun kurt bildirmez.",
  "Ağa güçlü olunca kul suçlu olur.",
  "Akıl akıldan üstündür.",
  "Ağaç yaşken eğilir.",
  "Birlikten kuvvet doğar.",
  "Dereyi görmeden paçaları sıvama.",
  "Erken kalkan yol alır.",
  "Görünen köy kılavuz istemez.",
  "Ne ekersen onu biçersin.",
  "Sakla samanı, gelir zamanı.",
  "Damlaya damlaya göl olur.",
  "Güvenme sırtına, el kapısı başkadır."
];

// AKILLI VE KESİN CAPTCHA / 5/1 KORUMASI
function checkSafety(message, clientUserId) {
  if (message.author.id !== '408785106942164992') return false;

  const content = message.content.toLowerCase();
  
  // Boss mesajlarını kesinlikle es geç
  if (content.includes('guild boss') || content.includes('boss appeared') || content.includes('runs away')) {
    return false;
  }

  // Kullanıcı etiketlenmiş mi? (OwO uyarı atarken kesinlikle etiketler)
  const isMentioned = message.mentions.users.has(clientUserId);

  // Kesin Captcha / Ban kelimeleri (Etiket olmasa bile kapatır)
  const strictDangerWords = [
    "captcha", "verify", "macro", "banned", "block", 
    "are you human", "dogrulama", "güvenlik", "please check", "banned for"
  ];
  const hasStrictDanger = strictDangerWords.some(word => content.includes(word));

  // Verify butonu kontrolü
  const hasVerifyComponent = message.components && message.components.some(row => 
    row.components && row.components.some(comp => comp.label && comp.label.toLowerCase().includes('verify'))
  );

  // Sayaç Kontrolü (5/1, 5/2 vb.) -> SADECE KULLANICI ETİKETLENDİYSE VEYA CAPTCHA VARSA TETİKLENİR!
  const counterWords = ["5/1", "5/2", "5/3", "5/4", "5/5"];
  const hasCounter = counterWords.some(word => content.includes(word));

  // 1. Kesin tehlike kelimesi veya buton varsa KAPAT
  if (hasStrictDanger || hasVerifyComponent) return true;

  // 2. Eğer 5/1 sayacı varsa VE kullanıcı etiketlenmişse (gerçek uyarı demektir) KAPAT
  if (hasCounter && (isMentioned || content.includes('warning') || content.includes('check'))) return true;

  return false;
}

configs.forEach((cfg, index) => {
  if (!cfg.token || !cfg.channelId) {
    console.log(`❌ config.json [Hesap ${index + 1}] içinde token veya channelId eksik!`);
    return;
  }

  const client = new Client({ checkUpdate: false });
  let isRunning = true;
  let actionTimeout = null;

  function sleep(ms) {
    return new Promise(resolve => {
      actionTimeout = setTimeout(resolve, ms);
    });
  }

  function getRandomHumanDelay(minSec, maxSec) {
    const minMs = minSec * 1000;
    const maxMs = maxSec * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  client.on('ready', async () => {
    console.log(`\n=================================`);
    console.log(`[+] Bot Aktif (${client.user.tag})`);
    console.log(`[+] 5/1 Sayaç Koruması & Güvenlik: AKTİF`);
    console.log(`=================================\n`);

    const channel = await client.channels.fetch(cfg.channelId).catch(() => null);
    if (!channel) {
      console.log(`[-] (${client.user.tag}) Kanal bulunamadı! ID'yi kontrol et.`);
      return;
    }

    // AÇILIŞTA GEÇMİŞ KONTROLÜ
    try {
      const recentMessages = await channel.messages.fetch({ limit: 5 });
      const now = Date.now();

      const dangerMessage = recentMessages.find(msg => {
        const isDangerous = checkSafety(msg, client.user.id);
        const isRecent = (now - msg.createdTimestamp) < 180000;
        return isDangerous && isRecent;
      });

      if (dangerMessage) {
        console.log(`\n==================================================`);
        console.log(`🚨 [AÇILIŞ KORUMASI] KANALDA CAPTCHA YAKALANDI! 🚨`);
        console.log(`Mesaj: ${dangerMessage.content}`);
        console.log(`⚙️ HESABI KORUMAK İÇİN BOT BAŞLATILMADI!`);
        console.log(`==================================================\n`);
        
        isRunning = false;
        await client.destroy();
        return;
      }
    } catch (e) {
      console.log(`[-] Geçmiş mesajlar taranırken hata: ${e.message}`);
    }

    startFarming(channel);
  });

  async function startFarming(channel) {
    while (isRunning) {
      try {
        if (!isRunning) break;
        await channel.send('owo h');
        console.log(`[->] (${client.user.tag}) 'owo h' gönderildi.`);
        await sleep(getRandomHumanDelay(4, 8));

        if (!isRunning) break;
        await channel.send('owo b');
        console.log(`[->] (${client.user.tag}) 'owo b' gönderildi.`);
        await sleep(getRandomHumanDelay(4, 8));

        if (!isRunning) break;
        const randomSoz = atasozleri[Math.floor(Math.random() * atasozleri.length)];
        await channel.send(randomSoz);
        console.log(`[->] (${client.user.tag}) Atasözü yazıldı: "${randomSoz}"`);
        await sleep(getRandomHumanDelay(6, 11));

      } catch (err) {
        console.log(`[-] (${client.user ? client.user.tag : 'Hesap'}) Hata yakalandı: ${err.message}`);
        await sleep(3000);
      }
    }
  }

  // ANLIK KONTROL
  client.on('messageCreate', async (message) => {
    if (message.channel.id !== cfg.channelId) return;

    if (checkSafety(message, client.user.id)) {
      isRunning = false; 
      if (actionTimeout) clearTimeout(actionTimeout);

      console.log(`\n==================================================`);
      console.log(`🚨 [ANLIK KORUMA] GERÇEK CAPTCHA / 5/1 UYARISI YAKALANDI! 🚨`);
      console.log(`Hesap: ${client.user.tag}`);
      console.log(`OwO Mesajı: ${message.content}`);
      console.log(`⚙️ HESABI KORUMAK İÇİN ANINDA KAPATILIYOR!`);
      console.log(`==================================================\n`);

      try {
        await client.destroy();
      } catch (e) {}
    }
  });

  client.login(cfg.token).catch(err => {
    console.log(`❌ [Hesap ${index + 1}] Giriş Başarısız: ${err.message}`);
  });
});
    
