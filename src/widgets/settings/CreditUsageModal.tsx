import React from 'react';

import { useInView } from 'react-intersection-observer';

import { useCreditLogs } from '@/features/settings/hooks/useCreditLogs';
import { trackEvent } from '@/lib/mixpanel';
import type { CreditLog } from '@/shared/api/supabase/creditQueries';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { MobileModalHeader } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';

interface CreditUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditUsageModal: React.FC<CreditUsageModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useCreditLogs();

  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.CreditUsageModalOpen);
    }
  }, [open]);

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 날짜 포맷 (YYYY.MM.DD / HH:mm)
  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} / ${hh}:${min}`;
  };

  // 사용처 라벨 매핑
  const getUsageLabel = (log: CreditLog) => {
    const metadata = (log.feature_metadata as Record<string, unknown>) || {};

    switch (log.use_type) {
      case 'session_creation':
        if (
          metadata.stt_model === 'gemini-3' ||
          metadata.stt_model === 'advanced'
        ) {
          return '고급축어록';
        }
        if (
          metadata.stt_model === 'whisper' ||
          metadata.stt_model === 'basic'
        ) {
          return '일반축어록';
        }
        return '축어록 생성';
      case 'progress_note_generation':
        return '상담노트 생성';
      case 'handwritten_session':
        return '직접 입력';
      case 'client_analysis_generation':
        return '다회기 분석';
      case 'family_summary_generation':
        return '가계도 생성';
      case 'report_generation':
        return '리포트 생성';
      case 'deid_processing':
        return '비식별화 처리';
      case 'admin_charge':
        return '크레딧 지급';
      case 'admin_adjustment':
        return '크레딧 조정';
      case 'bug_reward':
        return '오류 보상';
      case 'credit_reward':
        return '크레딧 보상';
    }

    return log.log_memo || log.use_type;
  };

  const logs = data?.pages.flatMap((page) => page) || [];

  // 공통: 테이블 본문
  const tableBody = isLoading ? (
    <div className="flex items-center justify-center py-20">
      <p className="text-grey-60">불러오는 중...</p>
    </div>
  ) : isError ? (
    <div className="flex items-center justify-center py-20">
      <p className="text-red-80">오류가 생겼어요.</p>
    </div>
  ) : logs.length === 0 ? (
    <div className="flex items-center justify-center py-20">
      <p className="text-grey-60">크레딧 사용 내역이 없어요.</p>
    </div>
  ) : (
    <div className="space-y-1">
      {logs.map((log) => (
        <div
          key={log.id}
          className="grid grid-cols-[1.5fr_1.5fr_1fr] rounded-lg px-4 py-3 text-center text-sm transition-colors lg:hover:bg-grey-10"
        >
          <p className="text-grey-100">{formatLogDate(log.created_at)}</p>
          <p className="font-medium text-grey-100">{getUsageLabel(log)}</p>
          <p className="text-grey-100">
            {log.use_amount.toLocaleString()} 크레딧
          </p>
        </div>
      ))}
      <div ref={ref} className="h-4 w-full">
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <p className="text-xs text-grey-60">더 불러오는 중...</p>
          </div>
        )}
      </div>
    </div>
  );

  // 공통: 테이블 헤더
  const tableHeader = (
    <div className="mb-4 grid grid-cols-[1.5fr_1.5fr_1fr] px-4 text-center">
      <p className="text-sm font-medium text-grey-60">날짜 / 시간</p>
      <p className="text-sm font-medium text-grey-60">사용처</p>
      <p className="text-sm font-medium text-grey-60">사용량</p>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={isMobileView ? 'flex flex-col' : 'max-w-2xl px-0 py-10'}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {isMobileView ? (
        <>
          <MobileModalHeader title="크레딧 사용 내역" onBack={() => onOpenChange(false)} />
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-10 md:py-6">
            <div className="overflow-x-auto rounded-xl bg-grey-10 p-4 md:p-6">
              <div className="min-w-[480px]">
                {tableHeader}
                {tableBody}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-grey-60">
              *크레딧 사용 기록은 최대 3개월까지만 조회가능해요.
            </p>
          </div>
          <div className="flex-shrink-0 px-4 pb-4 md:px-10">
            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              확인
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <Title as="h2" className="mb-10 text-2xl font-headline text-grey-100">
            크레딧 사용 내역
          </Title>
          <div className="mb-6 w-[560px] rounded-xl bg-grey-10 p-6 lg:w-[600px]">
            {tableHeader}
            <div className="custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
              {tableBody}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-grey-60">
            *크레딧 사용 기록은 최대 3개월까지만 조회가능해요.
          </p>
        </div>
      )}
    </Modal>
  );
};
