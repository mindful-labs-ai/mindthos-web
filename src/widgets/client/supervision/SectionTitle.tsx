interface SectionTitleProps {
  children: string;
}

/** 고정 구조 보고서 섹션 제목. "SECTION N. [소제목]" 형태로 들어온다. */
export function SectionTitle({ children }: SectionTitleProps) {
  return <h3 className="mb-3 text-l font-headline text-fg">{children}</h3>;
}
