import type {
  SupervisionBlock,
  SupervisionReport,
} from '@/features/client/types/supervisionReport.types';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';

interface SupervisionReportRendererProps {
  /** client_analyses.content (section/block JSON 문자열) */
  content: string;
}

/**
 * content 문자열이 SupervisionReport JSON인지 파싱 시도.
 * `sections` 배열 + (title 또는 meta)면 유효한 JSON 보고서로 간주.
 * (schema_version은 모델이 자주 생략하므로 감지 조건에서 제외)
 * 파싱 실패/형식 불일치(=구 Markdown row) 시 null → 호출부가 Markdown 폴백.
 */
export function parseSupervisionReport(
  content: string | null | undefined
): SupervisionReport | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as SupervisionReport).sections) &&
      (typeof (parsed as SupervisionReport).title === 'string' ||
        Array.isArray((parsed as SupervisionReport).meta))
    ) {
      return parsed as SupervisionReport;
    }
    return null;
  } catch {
    return null;
  }
}

// ── 텍스트/라벨 정리 (사용자에겐 축어록 기반 회기 슈퍼비전으로만 보이게) ──

/**
 * - `[00:00]` 류 타임스탬프 토큰 제거(회기 내용에 타임스탬프 없음)
 * - "타임스탬프"가 포함된 괄호 주석 제거
 * - 내부 데이터 표현("Session DNA"/"세션 DNA") → "회기 내용"
 */
function cleanText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\[\s*\d{1,2}:\d{2}(?::\d{2})?\s*\]/g, '')
    .replace(/\([^()]*타임스탬프[^()]*\)/g, '')
    .replace(/\bSession\s*DNA\b/gi, '회기 내용')
    .replace(/세션\s*DNA/gi, '회기 내용')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** 키/소제목을 담백하게: 괄호·대괄호 부연과 ★ 표기를 떼고 핵심 명사구만 남긴다. */
function plainLabel(label: unknown): string {
  if (typeof label !== 'string') return '';
  return label
    .replace(/[([{][^()[\]{}]*[)\]}]/g, '')
    .replace(/[★☆]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.:])/g, '$1')
    .trim();
}

/** 섹션 제목을 "SECTION N. [담백한 소제목]" 형식으로 정리(★·괄호 부연 제거). */
function cleanSectionTitle(title: string): string {
  const num = /^\s*(SECTION\s*\d+)\b/i.exec(title);
  if (!num) return title.trim();
  const prefix = num[1].replace(/\s+/g, ' ');
  const bracket = /\[([^\]]+)\]/.exec(title);
  if (!bracket) return `${prefix}.`;
  const sub = plainLabel(bracket[1]);
  return sub ? `${prefix}. [${sub}]` : `${prefix}.`;
}

function isTimestampHeader(header: string): boolean {
  return /타임스탬프|timestamp/i.test(header);
}

/** list children는 문자열 또는 {text} 객체로 올 수 있어 문자열로 정규화. */
function childText(child: unknown): string {
  if (typeof child === 'string') return child;
  if (child && typeof child === 'object' && 'text' in child) {
    const t = (child as { text?: unknown }).text;
    return typeof t === 'string' ? t : '';
  }
  return '';
}

/** 항목 앞에 이미 붙은 마커(숫자./숫자)/-/•)를 떼어 중복 마커 방지. */
function stripLeadingMarker(text: string): string {
  return text.replace(/^\s*(?:\d+[.)]|[-*•])\s+/, '');
}

/** 표 셀: 마크다운 표 깨짐 방지(파이프 이스케이프, 줄바꿈 공백화). */
function cleanCell(text: unknown): string {
  return cleanText(text)
    .replace(/\|/g, '\\|')
    .replace(/\n+/g, ' ');
}

// ── section/block JSON → Markdown 문자열 (일반 노트와 동일한 스타일로 렌더) ──

function blockToMarkdown(block: SupervisionBlock): string {
  switch (block.type) {
    case 'paragraph':
      return cleanText(block.text);

    case 'keyvalue':
      // 2-컬럼 대신 "**라벨**" + 본문 문단 형태(마크다운 스타일).
      return (block.items ?? [])
        .map((it) => `**${plainLabel(it.key)}**\n\n${cleanText(it.value)}`)
        .filter((s) => s.replace(/\*/g, '').trim() !== '')
        .join('\n\n');

    case 'list':
      return (block.items ?? [])
        .map((it, i) => {
          const marker = block.ordered ? `${i + 1}.` : '-';
          const head = `${marker} ${cleanText(stripLeadingMarker(it.text))}`;
          const children = (it.children ?? [])
            .map((ch) => cleanText(stripLeadingMarker(childText(ch))))
            .filter((c) => c !== '')
            .map((c) => `   - ${c}`);
          return [head, ...children].join('\n');
        })
        .join('\n');

    case 'table': {
      const headers = block.headers ?? [];
      // 타임스탬프 컬럼 제거(회기 내용에 타임스탬프 없음 → 회기 컬럼만).
      const keep = headers
        .map((h, i) => (isTimestampHeader(h) ? -1 : i))
        .filter((i) => i >= 0);
      if (!keep.length) return '';
      const head = keep.map((i) => cleanCell(headers[i]));
      const rows = (block.rows ?? []).map((r) =>
        keep.map((i) => cleanCell(r[i] ?? ''))
      );
      return [
        `| ${head.join(' | ')} |`,
        `| ${head.map(() => '---').join(' | ')} |`,
        ...rows.map((r) => `| ${r.join(' | ')} |`),
      ].join('\n');
    }

    case 'quote':
      return cleanText(block.text)
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n');

    default:
      return '';
  }
}

/** sections 내부만 Markdown으로 변환(상단 title·meta 헤더는 제외). */
function reportToMarkdown(report: SupervisionReport): string {
  const out: string[] = [];
  for (const section of report.sections ?? []) {
    if (section.title) out.push(`## ${cleanSectionTitle(section.title)}`);
    for (const block of section.blocks ?? []) {
      const md = blockToMarkdown(block);
      if (md) out.push(md);
    }
  }
  return out.join('\n\n');
}

/**
 * 다회기 분석(AI 슈퍼비전) JSON 보고서 렌더러.
 * section/block JSON을 Markdown 문자열로 변환해 MarkdownRenderer로 렌더한다.
 * → 일반 상담 노트(마크다운)와 동일한 타이포/표/목록 스타일.
 * sections 내부만 렌더(상단 title·meta 헤더 노출 안 함). 파싱 실패 시 원문 그대로 렌더.
 */
export function SupervisionReportRenderer({
  content,
}: SupervisionReportRendererProps) {
  const report = parseSupervisionReport(content);
  const markdown = report ? reportToMarkdown(report) : content;
  return <MarkdownRenderer content={markdown} className="text-start" />;
}

export default SupervisionReportRenderer;
