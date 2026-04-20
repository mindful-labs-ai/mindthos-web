import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';

export interface NoteSection {
  title: string;
  content: string;
  rawHeading: string;
}

/** rawHeading에서 prefix(## , **1. 등)를 추출하여 편집된 제목과 재조합 */
export const rebuildHeading = (
  rawHeading: string,
  editedTitle: string
): string => {
  const hashMatch = rawHeading.match(/^(#{1,3}\s*)/);
  if (hashMatch) return `${hashMatch[1]}${editedTitle}`;

  const numMatch = rawHeading.match(/^(\*{0,2}\d+\.\s*)/);
  if (numMatch) return `${numMatch[1]}${editedTitle}`;

  const letterMatch = rawHeading.match(/^([A-Z]\s*\([^)]+\)\s*:\s*)/);
  if (letterMatch) return `${letterMatch[1]}${editedTitle}`;

  return editedTitle;
};

/** summary를 섹션별로 파싱 */
export const parseSummary = (summary: string): NoteSection[] => {
  const sections: NoteSection[] = [];
  const cleanedSummary = removeNonverbalTags(summary);
  const lines = cleanedSummary.split('\n');
  let currentSection: NoteSection | null = null;

  const removeBoldMarkers = (text: string): string =>
    text.replace(/\*\*/g, '').trim();

  lines.forEach((line) => {
    if (/^#{1,3}\s/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = line.replace(/^#{1,3}\s*/, '').trim();
      currentSection = {
        title: removeBoldMarkers(rawTitle),
        content: '',
        rawHeading: line,
      };
    } else if (/^\*{0,2}\d+\.\s+/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = line.replace(/^\*{0,2}\d+\.\s*/, '').trim();
      currentSection = {
        title: removeBoldMarkers(rawTitle),
        content: '',
        rawHeading: line,
      };
    } else if (/^[A-Z]\s*\([^)]+\)\s*:\s/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const colonIndex = line.indexOf('):');
      currentSection = {
        title: line.substring(0, colonIndex + 1).trim(),
        content: line.substring(colonIndex + 2).trim(),
        rawHeading: line.substring(0, colonIndex + 2),
      };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  });

  if (currentSection) sections.push(currentSection);

  return sections;
};
