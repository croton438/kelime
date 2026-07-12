import type { PublicQuestion } from "./game";
import { extraQuestions } from "./questions-extra";
import { moreQuestions } from "./questions-more";

type Seed = [answer: string, clue: string];
const pool: Record<number, Seed[]> = {
  4: [
    ["ROTA", "Yolculuğun harita üzerinde önceden belirlenen izi."], ["İLKE", "Kararların arkasında değişmeden duran temel düşünce."],
    ["UMUT", "Gelecekte iyi bir şey olacağına duyulan içten beklenti."], ["ANIT", "Bir kişiyi ya da olayı gelecek kuşaklara hatırlatan yapı."],
    ["ÖDÜL", "Başarıya karşılık verilen maddi veya manevi karşılık."], ["AKIL", "Düşünme, anlama ve doğru karar verme yetisi."],
    ["KURA", "Seçimi rastlantıya bırakmak için başvurulan yöntem."], ["ÖZNE", "Bir cümlede işi yapan ya da durumda bulunan öge."],
    ["İMGE", "Zihinde beliren, duyularla ilişkilendirilmiş tasarım."], ["OLGU", "Varlığı deney ve gözlemle doğrulanabilen durum."],
  ],
  5: [
    ["İPUCU", "Çözümü söylemeden doğru yöne yaklaştıran küçük ayrıntı."], ["SEZGİ", "Açık bir kanıt olmadan ulaşılan içsel kanaat."],
    ["KANIT", "Bir iddianın doğruluğunu göstermeye yarayan veri."], ["EYLEM", "Bir sonuç doğurmak amacıyla yapılan bilinçli davranış."],
    ["TAVIR", "Bir durum karşısında benimsenen davranış biçimi."], ["DÜRTÜ", "Kişiyi bir davranışa yönelten güçlü iç istek."],
    ["KISIT", "Hareket veya seçim alanını daraltan sınır."], ["YORUM", "Bir olayı kişisel bakışla açıklama ve anlamlandırma."],
    ["SONUÇ", "Bir sürecin veya nedenler zincirinin ortaya çıkardığı durum."], ["YANKI", "Bir sesin yüzeye çarpıp gecikmeli olarak geri dönmesi."],
  ],
  6: [
    ["ÖNGÖRÜ", "Henüz yaşanmamış bir gelişmeyi işaretlerden kestirme."], ["KAVRAM", "Ortak özellikleri tek bir düşünsel çatı altında toplayan tasarım."],
    ["YÖNTEM", "Bir amaca ulaşmak için izlenen düzenli yol."], ["ÖZVERİ", "Kendi çıkarından vazgeçerek başkası için emek gösterme."],
    ["BELLEK", "Yaşananları ve öğrenilenleri saklayıp yeniden çağırma yetisi."], ["BECERİ", "Bir işi öğrenilmiş ustalıkla yapabilme gücü."],
    ["TASARI", "Gerçekleştirilmesi düşünülen bir işin zihindeki biçimi."], ["ETKİLE", "Birinin düşünce veya davranışında değişiklik oluştur."],
    ["DÜŞLEM", "Gerçekliğin sınırlarını aşarak zihinde kurulan dünya."], ["ÖZENLİ", "Ayrıntılara dikkat edilerek titizlikle hazırlanmış olan."],
  ],
  7: [
    ["VARSAYI", "Kanıtlanmadan düşüncenin başlangıç noktası yapılan kabul."], ["ÇELİŞKİ", "İki yargının aynı anda doğru olmasını engelleyen karşıtlık."],
    ["CESARET", "Korkuya rağmen gereken davranışı gösterebilme gücü."], ["DAYANAK", "Bir görüşü destekleyen gerekçe veya güvenilecek temel."],
    ["İHTİŞAM", "Gören üzerinde hayranlık bırakan görkemli görünüş."], ["TECRÜBE", "Yaşayarak ve uygulayarak edinilen bilgi birikimi."],
    ["İZLENİM", "Bir karşılaşmanın zihinde bıraktığı genel etki."], ["ÖZGÜRCE", "Herhangi bir baskı veya zorlamaya bağlı kalmadan."],
    ["DEĞİŞİM", "Bir durumdan farklı bir duruma geçme süreci."], ["GÖSTERİ", "İzleyici önünde sergilenen eğlence veya beceri etkinliği."],
  ],
  8: [
    ["SERZENİŞ", "Kırgınlığın ölçülü ve sitemli sözlerle dışa vurulması."], ["KAVRAYIŞ", "Bir konunun özünü ilişkileriyle birlikte anlayabilme yetisi."],
    ["SAPTAMAK", "Bir durumu araştırarak açık ve kesin biçimde belirlemek."], ["YADSIMAK", "Bilinen veya yaşanan bir gerçeği kabul etmemek."],
    ["UZLAŞMAK", "Karşılıklı ödünlerle ortak bir noktada buluşmak."], ["YAKLAŞIM", "Bir konuyu ele alırken benimsenen bakış ve yöntem."],
    ["TUTARLIK", "Düşünce ve davranışların kendi içinde çelişmeme niteliği."], ["ELEŞTİRİ", "Bir eseri veya düşünceyi güçlü ve zayıf yanlarıyla değerlendirme."],
    ["ÖZGÜRLÜK", "Seçimlerini baskı altında kalmadan yapabilme durumu."], ["OLASILIK", "Bir olayın gerçekleşebilme derecesini anlatan kavram."],
  ],
  9: [
    ["ÇIKARSAMA", "Bilinen önermelerden mantık yoluyla yeni bir sonuca ulaşma."], ["KANIKSAMA", "Yadırganan bir durumu tekrarlandıkça olağan karşılamaya başlama."],
    ["YADIRGAMA", "Alışılmışın dışında görülen bir durumu garip karşılama."], ["SORGULAMA", "Bir yargıyı doğru kabul etmeden önce nedenlerini araştırma."],
    ["ÇELİŞKİLİ", "Birbiriyle uyuşmayan düşünce veya davranışlar içeren."], ["DAYANIŞMA", "Ortak amaç için karşılıklı destek ve güç birliği kurma."],
    ["YAKINSAMA", "Farklı doğrultulardan aynı noktaya veya sonuca yaklaşma."], ["UZLAŞMACI", "Anlaşmazlıkta ortak çözüm bulmaya öncelik veren kişi."],
    ["BETİMLEME", "Bir varlığı ayırt edici özellikleriyle göz önünde canlandırma."], ["ELEŞTİREL", "Bir düşünceyi olduğu gibi benimsemek yerine gerekçeleriyle inceleyen."],
  ],
  10: [
    ["YARGILAMAK", "Bir kişi veya durum hakkında kanıtları değerlendirip sonuca varmak."], ["SORUMLULUK", "Bir davranışın sonucunu üstlenme ve gereğini yerine getirme yükümlülüğü."],
    ["KARŞILAŞMA", "İki tarafın yarışmak veya görüşmek üzere bir araya gelmesi."], ["KARARLILIK", "Engellere rağmen seçilen doğrultuyu sürdürme niteliği."],
    ["DUYARLILIK", "Çevredeki durumları fark edip uygun tepki gösterebilme."], ["BAĞIMLILIK", "Bir maddeye, kişiye veya duruma onsuz yapamayacak ölçüde bağlanma."],
    ["ÜRETKENLİK", "Belirli zamanda nitelikli ve çok sayıda sonuç ortaya koyma gücü."], ["GEÇERLİLİK", "Bir ölçümün gerçekten ölçmek istediği şeyi ölçme derecesi."],
    ["GÜVENİRLİK", "Aynı koşullarda benzer ve istikrarlı sonuç verme niteliği."], ["ÖZGÜRLÜKÇÜ", "Bireysel hak ve seçim alanının genişlemesini savunan."],
  ],
};

const originOverrides: Record<string, string> = { ROTA: "İtalyanca", İMGE: "Türkçe", İPUCU: "Türkçe", KANIT: "Türkçe", İHTİŞAM: "Arapça", TECRÜBE: "Arapça", SERZENİŞ: "Farsça" };
const baseQuestions: PublicQuestion[] = Object.entries(pool).flatMap(([length, rows]) => rows.map(([answer, clue], index) => ({
  answer, clue, origin: originOverrides[answer] ?? "Türkçe", difficulty: (Number(length) <= 5 && index < 4 ? "Kolay" : Number(length) >= 8 || index >= 7 ? "Zor" : "Orta") as PublicQuestion["difficulty"],
})));

// Yalnızca elle yazılmış, doğal ipuçları oyuna alınır. Otomatik ön/son eklerle
// soru sayısını yapay biçimde artırmak okunabilirliği ve kaliteyi düşürür.
export const questions: PublicQuestion[] = [...baseQuestions, ...extraQuestions, ...moreQuestions];

export function seededRandom(seed: string) {
  let state = 2166136261;
  for (const character of seed.normalize("NFC")) { state ^= character.codePointAt(0) ?? 0; state = Math.imul(state, 16777619); }
  return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}

export function makeQuestionSet(random = Math.random) {
  return [4, 5, 6, 7, 8, 9, 10].flatMap((length) => {
    const answers = [...new Set(questions.filter((question) => Array.from(question.answer).length === length).map((question) => question.answer))]
      .map((answer) => ({ answer, rank: random() })).sort((a, b) => a.rank - b.rank).slice(0, 2);
    return answers.map(({ answer }) => questions.find((question) => question.answer === answer)!);
  });
}
