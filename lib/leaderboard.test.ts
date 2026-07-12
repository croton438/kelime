import { describe, expect, it } from "vitest";
import { consolidateScores, type ScoreEntry } from "./leaderboard";

const score = (name: string, points: number, correct = 0): ScoreEntry => ({ name, score: points, correct, playedAt: points, mode: "single" });
describe("lider tablosu", () => {
  it("aynı ismi Türkçe harf dönüşümüyle tekilleştirir", () => expect(consolidateScores([score("DOĞAÇ", 400), score("doğaç", 0)])).toHaveLength(1));
  it("kişinin yalnızca en iyi rekorunu saklar", () => expect(consolidateScores([score("Ece", 300), score("ECE", 700)])[0].score).toBe(700));
  it("eşit puanda daha çok doğru yapılan kaydı seçer", () => expect(consolidateScores([score("Can", 500, 2), score("can", 500, 4)])[0].correct).toBe(4));
});
