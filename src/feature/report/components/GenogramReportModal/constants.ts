export const GENOGRAM_REPORT_TEMPLATE_KEY = 'GENOGRAM_ANALYSIS';

export const CHECKLIST = [
  {
    question: '각 인물(도형)의 위치가 올바른가요?',
    options: ['네', '아니요'],
    correctIndex: 0,
  },
  {
    question:
      '인물의 이름과 성별, 나이, 인적사항 등의 정보가 사실과 다르게 입력된 부분이 있나요?',
    options: ['없습니다', '있습니다'],
    correctIndex: 0,
  },
  {
    question:
      '부모선, 자녀선, 파트너선 등 인물 간의 관계가 올바르게 이어져 있나요?',
    options: ['네', '아니요'],
    correctIndex: 0,
  },
  {
    question:
      '인물 간의 관계에서 핵심이 되는 내용이 모두 관계선으로 반영되어 있나요?',
    options: ['네', '아니요'],
    correctIndex: 0,
  },
];

/** "2026-02-27T12:00:00Z" → "2026.02.27" */
export function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
