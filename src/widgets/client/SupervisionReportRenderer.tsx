import type {
  KVSection,
  S2Section,
  S3Section,
  S6Section,
  SupervisionReportV2,
} from '@/features/client/types/supervisionReport.types';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';

import {
  KeyValueSection,
  QuestionList,
  SessionEvalSection,
  TranscriptTable,
} from './supervision';
import { getTemplateConfig } from './supervision/structure';

interface SupervisionReportRendererProps {
  /** client_analyses.content (고정 구조 JSON 문자열). */
  content: string;
  /** 보고서 템플릿 id (섹션 제목·S3 헤더·S0 유무 config 선택). */
  templateId?: number;
  /** 편집 모드 — draftReport를 렌더하고 변경을 onDraftChange로 전달 */
  editable?: boolean;
  /** 편집 중 draft (editable일 때 content 대신 사용) */
  draftReport?: SupervisionReportV2 | null;
  onDraftChange?: (next: SupervisionReportV2) => void;
}

function isKVSection(value: unknown): value is KVSection {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as KVSection).items)
  );
}

/**
 * content가 고정 구조(V2) 보고서 JSON인지 파싱 시도.
 * section1.items / section2.sessions / section3.rows / section6.questions 형태를
 * 갖춘 신형 스키마만 유효로 간주. 그 외(구 section/block JSON, legacy 마크다운
 * 문자열)는 null → 호출부가 MarkdownRenderer로 폴백.
 */
export function parseSupervisionReport(
  content: string | null | undefined
): SupervisionReportV2 | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const r = parsed as Partial<SupervisionReportV2>;
    if (
      isKVSection(r.section1) &&
      r.section2 &&
      Array.isArray((r.section2 as S2Section).sessions) &&
      r.section3 &&
      Array.isArray((r.section3 as S3Section).rows) &&
      isKVSection(r.section4) &&
      isKVSection(r.section5) &&
      r.section6 &&
      Array.isArray((r.section6 as S6Section).questions)
    ) {
      return parsed as SupervisionReportV2;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 다회기 분석(AI 슈퍼비전) 고정 구조 보고서 렌더러.
 *
 * content를 JSON.parse → 신형(V2) 스키마면 template_id별 config로 섹션 제목·순서·
 * S3 헤더를 골라 섹션별 전용 컴포넌트로 렌더(매번 동일 레이아웃 보장).
 * 신형이 아니면(구 형식 / legacy 마크다운) MarkdownRenderer로 폴백(하위호환).
 */
export function SupervisionReportRenderer({
  content,
  templateId,
  editable = false,
  draftReport,
  onDraftChange,
}: SupervisionReportRendererProps) {
  // 편집 모드에서는 draft를 직접 렌더 (편집 아닐 땐 content 파싱)
  const report =
    editable && draftReport ? draftReport : parseSupervisionReport(content);

  // 하위호환: 신형 스키마가 아니면 기존 MarkdownRenderer로 폴백.
  if (!report) {
    return <MarkdownRenderer content={content} className="text-start" />;
  }

  const config = getTemplateConfig(templateId);

  const isEditing = editable && !!onDraftChange;
  const update = (patch: Partial<SupervisionReportV2>) =>
    onDraftChange?.({ ...report, ...patch });

  const renderSection = (
    key: (typeof config.sectionOrder)[number]
  ): React.ReactNode => {
    switch (key) {
      case 'section0':
        // S0는 config에 있고(자동감지) JSON에도 존재할 때만 렌더.
        return report.section0 ? (
          <KeyValueSection
            title={config.titles.section0}
            items={report.section0.items}
            editable={isEditing}
            onItemsChange={(items) => update({ section0: { items } })}
          />
        ) : null;
      case 'section1':
        return (
          <KeyValueSection
            title={config.titles.section1}
            items={report.section1.items}
            editable={isEditing}
            onItemsChange={(items) => update({ section1: { items } })}
          />
        );
      case 'section2':
        return (
          <SessionEvalSection
            title={config.titles.section2}
            sessions={report.section2.sessions}
            trajectory={report.section2.trajectory}
            editable={isEditing}
            onSessionsChange={(sessions) =>
              update({ section2: { ...report.section2, sessions } })
            }
            onTrajectoryChange={(trajectory) =>
              update({ section2: { ...report.section2, trajectory } })
            }
          />
        );
      case 'section3':
        return (
          <TranscriptTable
            title={config.titles.section3}
            headers={config.s3Headers}
            rows={report.section3.rows}
            editable={isEditing}
            onRowsChange={(rows) => update({ section3: { rows } })}
          />
        );
      case 'section4':
        return (
          <KeyValueSection
            title={config.titles.section4}
            items={report.section4.items}
            editable={isEditing}
            onItemsChange={(items) => update({ section4: { items } })}
          />
        );
      case 'section5':
        return (
          <KeyValueSection
            title={config.titles.section5}
            items={report.section5.items}
            editable={isEditing}
            onItemsChange={(items) => update({ section5: { items } })}
          />
        );
      case 'section6':
        return (
          <QuestionList
            title={config.titles.section6}
            questions={report.section6.questions}
            editable={isEditing}
            onQuestionsChange={(questions) =>
              update({ section6: { questions } })
            }
          />
        );
      default:
        return null;
    }
  };

  // null 섹션(예: S0 부재)을 먼저 걸러 실제 렌더 순서를 확정한다.
  const rendered = config.sectionOrder
    .map((key) => ({ key, node: renderSection(key) }))
    .filter((s): s is { key: typeof s.key; node: React.ReactNode } =>
      Boolean(s.node)
    );

  return (
    <div className="text-start">
      {rendered.map(({ key, node }, index) => (
        <div
          key={key}
          className={index === 0 ? '' : 'mt-8 border-t border-grey-30 pt-8'}
        >
          {node}
        </div>
      ))}
    </div>
  );
}

export default SupervisionReportRenderer;
