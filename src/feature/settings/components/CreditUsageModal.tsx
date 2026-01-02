import React from 'react';

import { useInView } from 'react-intersection-observer';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';

import { useCreditLogs } from '../hooks/useCreditLogs';
import type { CreditLog } from '../services/creditService';

interface CreditUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditUsageModal: React.FC<CreditUsageModalProps> = ({
  open,
  onOpenChange,
}) => {
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
    const memo = log.log_memo || '';
    const metadata = (log.feature_metadata as Record<string, unknown>) || {};

    if (memo.includes('client_analysis_generation')) {
      return '다회기 분석';
    }

    if (memo.includes('session_creation')) {
      if (metadata.stt_model === 'gemini-3') {
        return '고급축어록';
      }
      if (metadata.stt_model === 'whisper') {
        return '일반축어록';
      }
    }

    if (memo.includes('progress_note_generation')) {
      return '상담노트 생성';
    }

    return log.log_memo || log.use_type;
  };

  const logs = data?.pages.flatMap((page) => page) || [];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl px-0 py-10"
    >
      <div className="flex flex-col items-center">
        <Title as="h2" className="mb-10 text-2xl font-bold">
          크레딧 사용 내역
        </Title>

        <div className="mb-6 w-[560px] rounded-xl bg-[#F8F9FD] p-6 lg:w-[600px]">
          {/* Table Header */}
          <div className="mb-4 grid grid-cols-[1.5fr_1.5fr_1fr] px-4 text-center">
            <Text className="text-sm font-medium text-[#9E9E9E]">
              날짜 / 시간
            </Text>
            <Text className="text-sm font-medium text-[#9E9E9E]">사용처</Text>
            <Text className="text-sm font-medium text-[#9E9E9E]">사용량</Text>
          </div>

          {/* Table Body */}
          <div className="custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Text className="text-fg-muted">불러오는 중...</Text>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-20">
                <Text className="text-danger">오류가 발생했습니다.</Text>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Text className="text-fg-muted">
                  크레딧 사용 내역이 없습니다.
                </Text>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-[1.5fr_1.5fr_1fr] rounded-lg px-4 py-3 text-center text-sm transition-colors hover:bg-white"
                  >
                    <Text className="text-[#333333]">
                      {formatLogDate(log.created_at)}
                    </Text>
                    <Text className="font-medium text-[#333333]">
                      {getUsageLabel(log)}
                    </Text>
                    <Text className="text-[#333333]">
                      {log.use_amount.toLocaleString()} 크레딧
                    </Text>
                  </div>
                ))}

                {/* Infinite Scroll Trigger */}
                <div ref={ref} className="h-4 w-full">
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <Text className="text-xs text-fg-muted">
                        더 불러오는 중...
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Text className="mt-4 text-center text-sm text-[#9E9E9E]">
          *크레딧 사용 기록은 최대 3개월까지만 조회가능합니다.
        </Text>
      </div>
    </Modal>
  );
};
