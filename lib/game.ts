export type PublicQuestion = { answer: string; clue: string; origin: string; difficulty: "Kolay" | "Orta" | "Zor" };

export function normalizeTurkish(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function levenshtein(a: string, b: string) {
  const left = Array.from(normalizeTurkish(a));
  const right = Array.from(normalizeTurkish(b));
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
}

export function answerFeedback(guess: string, answer: string) {
  const normalizedGuess = normalizeTurkish(guess);
  const normalizedAnswer = normalizeTurkish(answer);
  if (normalizedGuess === normalizedAnswer) return "Doğru cevap";
  if (Math.abs(normalizedGuess.length - normalizedAnswer.length) > 2 || normalizedGuess.length > normalizedAnswer.length * 2) return "Yanlış cevap";
  const distance = levenshtein(normalizedGuess, normalizedAnswer);
  return distance === 1 ? "1 harf yanlış" : distance === 2 ? "2 harf yanlış" : "Yanlış cevap";
}

export function revealLetter(answer: string, revealed: number[], random?: () => number) {
  const closed = Array.from({ length: Array.from(answer).length }, (_, index) => index).filter((index) => !revealed.includes(index));
  if (!closed.length) return revealed;
  const roll = random ? random() : crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return [...revealed, closed[Math.floor(roll * closed.length)]].sort((a, b) => a - b);
}

export const MAX_SCORE = 9800;
