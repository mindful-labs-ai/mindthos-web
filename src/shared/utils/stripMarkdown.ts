/**
 * 마크다운 텍스트에서 서식을 제거하고 plain text만 반환합니다.
 */
export function stripMarkdown(md: string): string {
  return (
    md
      // 헤더 (### Header → Header)
      .replace(/^#{1,6}\s+/gm, '')
      // 볼드/이탤릭 (**bold**, __bold__, *italic*, _italic_)
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
      // 취소선 (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // 인라인 코드 (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // 코드 블록 (```...```)
      .replace(/```[\s\S]*?```/g, '')
      // 링크 [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 이미지 ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // 인용문 (> text → text)
      .replace(/^>\s?/gm, '')
      // 수평선 (---, ***, ___)
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // 순서 없는 목록 (- item, * item, + item → item)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // 순서 있는 목록 (1. item → item)
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // HTML 태그
      .replace(/<[^>]+>/g, '')
      // 연속 빈 줄 정리
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
