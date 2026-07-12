import { describe, expect, it } from "vitest";
import { answerFeedback, levenshtein, MAX_SCORE, normalizeTurkish, revealLetter } from "./game";
import { makeQuestionSet, questions, seededRandom } from "./questions";

describe("Türkçe oyun motoru", () => {
  it("Türkçe I ve İ harflerini ayırır", () => { expect(normalizeTurkish("SIKI")).toBe("sıkı"); expect(normalizeTurkish("SİKİ")).toBe("siki"); });
  it("Unicode ve boşlukları normalize eder", () => expect(normalizeTurkish("  GU\u0308L  ")).toBe("gül"));
  it("Levenshtein mesafesini hesaplar", () => expect(levenshtein("masa", "mama")).toBe(1));
  it("yakın cevap geri bildirimi verir", () => { expect(answerFeedback("mama", "masa")).toBe("1 harf yanlış"); expect(answerFeedback("mala", "masa")).toBe("1 harf yanlış"); expect(answerFeedback("ma", "masa")).toBe("2 harf yanlış"); });
  it("harfi yalnızca bir kez açar", () => expect(revealLetter("MASA", [], () => 0)).toEqual([0]));
  it("kapalı harflerden rastgele bir konum seçer", () => expect(revealLetter("MASA", [], () => 0.99)).toEqual([3]));
  it("14 soruyu ve azami puanı doğrular", () => { expect(makeQuestionSet()).toHaveLength(14); expect(MAX_SCORE).toBe(9800); });
  it("530 doğal soru içinden farklı cevaplar seçer", () => {
    expect(questions).toHaveLength(530);
    expect(new Set(questions.map((question) => question.clue)).size).toBe(530);
    expect(new Set(questions.map((question) => question.answer)).size).toBe(530);
    for (const question of questions) expect(Array.from(question.answer).length).toBeGreaterThanOrEqual(4);
    for (const question of questions) expect(Array.from(question.answer).length).toBeLessThanOrEqual(10);
    for (const length of [4, 5, 6, 7, 8, 9, 10]) expect(questions.filter((question) => Array.from(question.answer).length === length).length).toBeGreaterThanOrEqual(40);
    const selected = makeQuestionSet(() => 0.5);
    for (const length of [4, 5, 6, 7, 8, 9, 10]) expect(selected.filter((question) => Array.from(question.answer).length === length)).toHaveLength(2);
    expect(new Set(selected.map((question) => question.answer)).size).toBe(14);
  });
  it("sorular yapay yönlendirme kalıpları içermez", () => {
    const forbidden = ["Aşağıdaki dolaylı anlatımı çöz", "Doğru kelimeyi bul", "Tek kelimelik cevabı yaz", "Aranan kelime nedir"];
    for (const question of questions) for (const phrase of forbidden) expect(question.clue).not.toContain(phrase);
  });
  it("cevap kelimesi ipucunun içinde açıkça geçmez", () => {
    for (const question of questions) expect(normalizeTurkish(question.clue)).not.toContain(normalizeTurkish(question.answer));
  });
  it("aynı online oda tohumu tüm oyunculara aynı soruları verir", () => {
    const firstPlayer = makeQuestionSet(seededRandom("online:ABC123"));
    const secondPlayer = makeQuestionSet(seededRandom("online:ABC123"));
    expect(secondPlayer).toEqual(firstPlayer);
  });
});
