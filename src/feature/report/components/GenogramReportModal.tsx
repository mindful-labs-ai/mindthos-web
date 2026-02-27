/**
 * 가계도 분석 보고서 모달
 *
 * 1. 모달 열림 → has_access RPC로 세미나 수료 여부 확인
 * 2. 권한 있음 → 보고서 목록 (빈 상태 / 리스트)
 * 3. 권한 없음 → 세미나 유도 화면
 */
import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

import { Download, Loader2, Plus, X } from 'lucide-react';

import type { GenogramPageHandle } from '@/genogram';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

import { ReportPreviewModal } from './ReportPreviewModal';

// 추후 DB 테이블 연동 시 사용할 타입
interface ReportItem {
  id: string;
  name: string;
  createdAt: string;
}

interface GenogramReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genogramRef: RefObject<GenogramPageHandle | null>;
}

export function GenogramReportModal({
  open,
  onOpenChange,
  genogramRef,
}: GenogramReportModalProps) {
  const userId = useAuthStore((s) => s.userId);

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 추후 DB 연동 시 교체
  const [reports] = useState<ReportItem[]>([]);

  // 권한 확인
  const checkAccess = useCallback(async () => {
    if (!userId) {
      setHasAccess(false);
      return;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('has_access', {
        p_user_id: Number(userId),
        p_access_type: 'GENOGRAM_SEMINAR',
      });

      if (error) {
        console.error('has_access RPC error:', error);
        setHasAccess(false);
        return;
      }

      setHasAccess(!!data);
    } catch (e) {
      console.error('has_access check failed:', e);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  // 모달 열릴 때 권한 확인
  useEffect(() => {
    if (open) {
      setHasAccess(null);
      checkAccess();
    }
  }, [open, checkAccess]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open || isPreviewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isPreviewOpen, onOpenChange]);

  // 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleCreateReport = () => {
    setIsPreviewOpen(true);
  };

  const handleDownloadReport = (_reportId: string) => {
    // TODO: 보고서 PDF 다운로드
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          role="presentation"
          className="fixed inset-0 animate-[fadeIn_0.2s_ease-out] bg-black/50"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal */}
        <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
          {/* 헤더 */}
          <div className="relative px-6 pt-6 pb-2">
            <h2 className="text-center text-xl font-bold text-fg">
              가계도 분석 보고서
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 px-6 py-4">
            {isChecking || hasAccess === null ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
              </div>
            ) : hasAccess ? (
              <ReportListContent
                reports={reports}
                onCreateReport={handleCreateReport}
                onDownloadReport={handleDownloadReport}
              />
            ) : (
              <SeminarPromptContent />
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-6 pb-6">
            {hasAccess === false ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border border-border py-3.5 text-center text-base font-semibold text-fg transition-colors hover:bg-surface-contrast"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: 세미나 신청하기 로직 (기획 미정)
                  }}
                  className="flex-1 rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400"
                >
                  세미나 신청하기
                </button>
              </div>
            ) : hasAccess ? (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400"
              >
                확인
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* PDF 미리보기 모달 */}
      <ReportPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        genogramRef={genogramRef}
      />
    </>
  );
}

// ============================================
// 보고서 목록 (hasAccess = true)
// ============================================

function ReportListContent({
  reports,
  onCreateReport,
  onDownloadReport,
}: {
  reports: ReportItem[];
  onCreateReport: () => void;
  onDownloadReport: (id: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center">
        {/* 빈 상태 안내 */}
        <div className="flex h-52 flex-col items-center justify-center">
          <p className="text-base text-fg-muted">
            아직 생성한 가계도 보고서가 없습니다.
          </p>
          <p className="mt-1 text-base text-fg-muted">
            첫 보고서를 만들어보세요.
          </p>
        </div>

        {/* 새로운 보고서 만들기 */}
        <button
          type="button"
          onClick={onCreateReport}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3.5 text-base font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-5 w-5" />
          새로운 보고서 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 보고서 목록 */}
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex items-center justify-between rounded-xl border border-border px-5 py-4"
        >
          <div>
            <p className="text-base font-medium text-fg">{report.name}</p>
            <p className="mt-1 text-sm text-fg-muted">
              {report.createdAt} 생성함
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDownloadReport(report.id)}
            className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      ))}

      {/* 새로운 보고서 만들기 */}
      <button
        type="button"
        onClick={onCreateReport}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3.5 text-base font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus className="h-5 w-5" />
        새로운 보고서 만들기
      </button>
    </div>
  );
}

// ============================================
// 세미나 유도 (hasAccess = false)
// ============================================

function SeminarPromptContent() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* 안내 문구 */}
      <p className="text-lg font-bold text-fg">
        가계도 보고서는 세미나 수료 후
        <br />
        이용할 수 있습니다.
      </p>
      <p className="mt-2 text-sm text-fg-muted">
        마음토스 홈페이지에서 가계도 세미나를
        <br />
        신청할 수 있습니다.
      </p>

      {/* 이미지 placeholder */}
      <div className="my-6 h-48 w-full rounded-2xl bg-surface-contrast" />

      {/* 하단 안내 */}
      <p className="text-sm text-fg">
        마음토스 가계도 세미나는 가족 치료 학회의
        <br />
        가계도 권위자 이인수 교수님과 함께합니다.
      </p>
    </div>
  );
}
