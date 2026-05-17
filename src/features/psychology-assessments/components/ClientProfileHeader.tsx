import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';

import { AnalysisStatusChip, type AnalysisStatus } from './AnalysisStatusChip';
import { ClientAvatar } from './ClientAvatar';

interface ClientProfileHeaderProps {
  client: Client;
  gender?: string;
  lastAssessmentLabel?: string;
  analysisStatus: AnalysisStatus;
  fileCount?: number;
  /** chip 클릭 — 제공 시 chip이 button으로 렌더 */
  onChipClick?: () => void;
  /** popover open 상태 표시 (chip hover 강조) */
  chipActive?: boolean;
  /** 외부 ref — chip button DOM 참조 (popover trigger 식별용) */
  chipRef?: React.Ref<HTMLButtonElement>;
  /** chip 우측 popover 슬롯 (chip 옆 absolute 영역) */
  chipPopoverSlot?: React.ReactNode;
  className?: string;
}

export const ClientProfileHeader = ({
  client,
  gender = '-',
  lastAssessmentLabel = '최근 검사일 없음',
  analysisStatus,
  fileCount,
  onChipClick,
  chipActive,
  chipRef,
  chipPopoverSlot,
  className,
}: ClientProfileHeaderProps) => {
  const sessionCount = client.session_count ?? 0;

  const metaItems = [
    gender,
    '-',
    `${sessionCount}회기 상담 기록`,
    lastAssessmentLabel,
  ];

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        <ClientAvatar paletteKey={client.id} name={client.name} size={40} />
        <div className="flex flex-col">
          <span className="text-l font-emphasize text-grey-100">
            {client.name}
          </span>
          <div className="flex items-center gap-2 text-sm font-medium text-grey-70">
            {metaItems.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span>{item}</span>
                {i < metaItems.length - 1 && (
                  <span className="text-grey-70">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* chip + popover slot — popover는 chip 트리거 기준 absolute */}
      <div className="relative">
        <AnalysisStatusChip
          ref={chipRef}
          status={analysisStatus}
          fileCount={fileCount}
          onClick={onChipClick}
          active={chipActive}
        />
        {chipPopoverSlot}
      </div>
    </div>
  );
};
