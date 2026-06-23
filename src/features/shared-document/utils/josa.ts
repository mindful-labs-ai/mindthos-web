/** 한글 목적격 조사(을/를) — 마지막 글자 받침 유무로 결정. 한글이 아니면 '를'. */
export function objectParticle(word: string): '을' | '를' {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return '를';
  return (code - 0xac00) % 28 === 0 ? '를' : '을';
}
