import type {
  KVItem,
  S2Session,
} from '@/features/client/types/supervisionReport.types';

import { EditableText } from './EditableText';
import { KeyValueList } from './KeyValueList';
import { SectionTitle } from './SectionTitle';

interface SessionEvalSectionProps {
  title: string;
  sessions: S2Session[];
  trajectory: string;
  /** 편집 모드 — 회기 라벨/항목/전체 변화 궤적을 필드 단위로 수정 */
  editable?: boolean;
  onSessionsChange?: (sessions: S2Session[]) => void;
  onTrajectoryChange?: (trajectory: string) => void;
}

/**
 * section2: 회기별 상세 평가 카드(session_label 회기 헤더 + 라벨-본문 목록) +
 * 전체 변화 궤적.
 */
export function SessionEvalSection({
  title,
  sessions,
  trajectory,
  editable = false,
  onSessionsChange,
  onTrajectoryChange,
}: SessionEvalSectionProps) {
  const handleSessionChange = (index: number, patch: Partial<S2Session>) => {
    onSessionsChange?.(
      sessions.map((session, i) =>
        i === index ? { ...session, ...patch } : session
      )
    );
  };

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-4">
        {sessions.map((session, i) => (
          <div
            key={i}
            className="rounded-lg border border-grey-30 bg-grey-10 p-4"
          >
            {editable ? (
              <EditableText
                value={session.session_label}
                onChange={(session_label) =>
                  handleSessionChange(i, { session_label })
                }
                ariaLabel="회기 라벨 편집"
                className="mb-3 font-emphasize"
              />
            ) : (
              <p className="mb-3 font-emphasize text-fg">
                {session.session_label}
              </p>
            )}
            <KeyValueList
              items={session.items}
              editable={editable}
              onItemsChange={(items: KVItem[]) =>
                handleSessionChange(i, { items })
              }
            />
          </div>
        ))}
      </div>
      {(trajectory || editable) && (
        <div className="mt-4">
          <p className="mb-1 font-emphasize text-fg">전체 변화 궤적</p>
          {editable ? (
            <EditableText
              value={trajectory}
              onChange={(value) => onTrajectoryChange?.(value)}
              ariaLabel="전체 변화 궤적 편집"
            />
          ) : (
            <p className="whitespace-pre-line break-keep text-m leading-relaxed text-fg">
              {trajectory}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
