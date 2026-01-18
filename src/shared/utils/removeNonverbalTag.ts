// {%...%} 패턴에서 한글 내용만 추출하는 함수
export const removeNonverbalTags = (text: string): string => {
  return (
    text
      // {%A%입바람%} 및 (%A%입바람) → 입바람 (한글 내용이 있는 경우 추출)
      .replace(/\{%[A-Z]%([^%]+)%\}/g, '$1')
      .replace(/\(%[A-Z]%([^%]+)%\)/g, '$1')
      .replace(/\("[A-Z]%([^%]+)%"\)/g, '')
      .replace(/\('[A-Z]%([^%]+)%'\)/g, '')
      // {%S%} 및 (%S%) → 제거 (내용이 없는 경우)
      .replace(/\{%[A-Z]%\}/g, '')
      .replace(/\(%[A-Z]%\)/g, '')
  );
};
