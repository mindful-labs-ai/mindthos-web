import type {
  KVItem,
  SupervisionReportV2,
} from '@/features/client/types/supervisionReport.types';

import type { TemplateConfig } from './structure';

/**
 * 고정 구조(V2) 보고서를 "복사하기"용 읽기 좋은 평문으로 변환한다.
 * content가 JSON으로 바뀌면서 stripMarkdown(content)이 날것 JSON을 복사하던 문제를 해결.
 * 라벨/제목/표 헤더는 화면 렌더와 동일하게 config + JSON 라벨을 사용한다.
 */
function kvLines(items: KVItem[]): string[] {
  return items.map((it) => `${it.label}: ${it.value}`);
}

export function supervisionReportToPlainText(
  report: SupervisionReportV2,
  config: TemplateConfig
): string {
  const out: string[] = [];

  for (const key of config.sectionOrder) {
    switch (key) {
      case 'section0':
        if (!report.section0) continue;
        out.push(config.titles.section0, ...kvLines(report.section0.items));
        break;
      case 'section1':
        out.push(config.titles.section1, ...kvLines(report.section1.items));
        break;
      case 'section2':
        out.push(config.titles.section2);
        report.section2.sessions.forEach((s) => {
          out.push(`[${s.session_label}]`, ...kvLines(s.items));
        });
        out.push(`전체 변화 궤적: ${report.section2.trajectory}`);
        break;
      case 'section3':
        out.push(config.titles.section3);
        report.section3.rows.forEach((r) => {
          out.push(
            `[${r.session}]`,
            `${config.s3Headers[1]}: ${r.speech}`,
            `${config.s3Headers[2]}: ${r.analysis}`,
            `${config.s3Headers[3]}: ${r.alternative}`
          );
        });
        break;
      case 'section4':
        out.push(config.titles.section4, ...kvLines(report.section4.items));
        break;
      case 'section5':
        out.push(config.titles.section5, ...kvLines(report.section5.items));
        break;
      case 'section6':
        out.push(config.titles.section6);
        report.section6.questions.forEach((q, i) => out.push(`${i + 1}. ${q}`));
        break;
    }
    out.push(''); // 섹션 사이 빈 줄
  }

  return out.join('\n').trim();
}
