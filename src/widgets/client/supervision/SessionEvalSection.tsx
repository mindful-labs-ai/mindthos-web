import type { S2Session } from '@/features/client/types/supervisionReport.types';

import { KeyValueList } from './KeyValueList';
import { SectionTitle } from './SectionTitle';

interface SessionEvalSectionProps {
  title: string;
  sessions: S2Session[];
  trajectory: string;
}

/**
 * section2: 회기별 상세 평가 카드(session_label 회기 헤더 + 라벨-본문 목록) +
 * 전체 변화 궤적.
 */
export function SessionEvalSection({
  title,
  sessions,
  trajectory,
}: SessionEvalSectionProps) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-4">
        {sessions.map((session, i) => (
          <div
            key={i}
            className="rounded-lg border border-grey-30 bg-grey-10 p-4"
          >
            <p className="mb-3 font-emphasize text-fg">
              {session.session_label}
            </p>
            <KeyValueList items={session.items} />
          </div>
        ))}
      </div>
      {trajectory && (
        <div className="mt-4">
          <p className="mb-1 font-emphasize text-fg">전체 변화 궤적</p>
          <p className="whitespace-pre-line break-keep text-m leading-relaxed text-fg">
            {trajectory}
          </p>
        </div>
      )}
    </section>
  );
}
