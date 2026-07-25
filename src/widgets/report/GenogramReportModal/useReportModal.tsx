import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useGenogramCapture } from '@/features/report/hooks/useGenogramCapture';
import {
  buildReportPdf,
  uploadPdfToStorage,
} from '@/features/report/utils/buildReportPdf';
import { trackEvent } from '@/lib/mixpanel';
import {
  createSignedPdfUrl,
  exportReport,
  fetchReportDetail,
  generateReport,
  pollReportUntilTerminal,
  ReportPollCancelledError,
  ReportPollTimeoutError,
} from '@/shared/api/supabase/reportQueries';
import type { ReportListItem } from '@/shared/api/supabase/reportQueries';
import {
  CHECKLIST,
  GENOGRAM_REPORT_TEMPLATE_KEY,
  REPORT_CREDIT_COST,
} from '@/shared/constants/genogramReport';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useFeatureAccess } from '@/shared/hooks/useFeatureAccess';
import { useReportTemplates } from '@/shared/hooks/useReportTemplates';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import type { GeneratingStatus } from '../ReportGeneratingView';

import { useReportList } from './hooks/useReportList';
import type {
  GenogramReportModalProps,
  ModalStep,
  ReportFormData,
  UseReportModalReturn,
} from './types';

export function useReportModal({
  open,
  onOpenChange,
  genogramRef,
  clientId,
  clientName,
}: GenogramReportModalProps): UseReportModalReturn {
  const userId = useAuthStore((s) => s.userId);
  const userName = useAuthStore((s) => s.userName);
  const organization = useAuthStore((s) => s.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkCredit = useCreditGuard();

  // ── 기능 접근 권한 (TanStack Query) ──

  const {
    hasAccess,
    isChecking,
    invalidate: invalidateAccess,
  } = useFeatureAccess('GENOGRAM_SEMINAR');

  const { getTemplate } = useReportTemplates();

  // 진행 중 비동기(생성/재시도 폴링 등)를 무효화하는 단조 증가 실행 토큰.
  // 모달을 열거나 닫을 때마다 증가한다(하단 Effects). 각 비동기 플로우는 시작 시
  // 토큰을 캡처하고 현재 값과 달라지면 취소로 간주한다 — 닫힘 직후 재오픈이
  // 이전(stale) 플로우를 되살리지 못하게 한다.
  const runIdRef = useRef(0);

  // ── 서브 훅 ──
  const {
    reports,
    isLoadingReports,
    retryingId,
    fetchReports,
    handleRetryReport,
    handleDownloadReport,
    setReports,
  } = useReportList({ clientId, toast, runIdRef });
  const { processReport, isCapturing } = useGenogramCapture(genogramRef);

  // ── 스텝 & 생성 상태 ──

  const [step, setStep] = useState<ModalStep>('list');
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);

  const [generatingStatus, setGeneratingStatus] =
    useState<GeneratingStatus>('processing');
  const [generatingError, setGeneratingError] = useState<string | null>(null);

  // ── 미리보기 상태 ──

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);

  // ── 폼 상태 ──

  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(CHECKLIST.length).fill(null)
  );
  const [formData, setFormData] = useState<ReportFormData>({
    counselorName: '',
    clientName: '',
    startDate: '',
    endDate: '',
    organization: '',
  });

  // ── 크레딧 부족 에러 ──

  const [creditError, setCreditError] = useState<string | null>(null);

  // ── Refs ──

  const prevPdfUrlRef = useRef<string | null>(null);
  const successResolveRef = useRef<(() => void) | null>(null);

  // ── PDF URL 관리 ──

  const revokePdfUrl = useCallback(() => {
    if (prevPdfUrlRef.current) {
      URL.revokeObjectURL(prevPdfUrlRef.current);
      prevPdfUrlRef.current = null;
    }
  }, []);

  const setPdfBlobUrl = useCallback(
    (blob: Blob) => {
      revokePdfUrl();
      const url = URL.createObjectURL(blob);
      prevPdfUrlRef.current = url;
      setPdfUrl(url);
    },
    [revokePdfUrl]
  );

  // ── 보고서 생성 플로우 ──

  const runGenerateFlow = useCallback(async () => {
    // 이 플로우가 속한 실행 토큰. 이후 재오픈으로 토큰이 바뀌면 취소로 간주한다.
    const myRun = runIdRef.current;
    const cancelled = () => runIdRef.current !== myRun;

    try {
      const period =
        formData.startDate && formData.endDate
          ? `${formData.startDate} ~ ${formData.endDate}`
          : '';

      const templateName =
        getTemplate(GENOGRAM_REPORT_TEMPLATE_KEY)?.name ?? '가계도 분석 보고서';
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const clientLabel = formData.clientName ? `_${formData.clientName}` : '';
      const reportTitle = `${templateName}${clientLabel}_${yy}/${mm}/${dd}`;

      const dispatch = await generateReport({
        client_id: clientId!,
        template_key: GENOGRAM_REPORT_TEMPLATE_KEY,
        title: reportTitle,
        input_snapshot: {
          client_name: formData.clientName || undefined,
          counselor_name: formData.counselorName || undefined,
          organization: formData.organization || undefined,
          counseling_period: period || undefined,
        },
      });
      if (cancelled()) return;

      // 비동기 이관: report_id를 받은 뒤 목록을 폴링해 terminal 상태까지 기다린다.
      const finalReport = await pollReportUntilTerminal(
        clientId!,
        dispatch.report_id,
        { shouldCancel: cancelled }
      );
      if (cancelled()) return;

      if (finalReport.status === 'FAILED') {
        throw new Error('보고서를 생성하지 못했어요.');
      }

      trackEvent(MixpanelEvent.GenogramReportGenerateSuccess, {
        client_id: clientId,
        report_id: dispatch.report_id,
      });
      setGeneratingStatus('success');

      await new Promise<void>((resolve) => {
        successResolveRef.current = resolve;
        setTimeout(resolve, 2000);
      });
      successResolveRef.current = null;
      if (cancelled()) return;

      // formatted_json은 목록에 실리지 않으므로 완료 후 상세로 조회한다.
      const reportData = await fetchReportDetail(dispatch.report_id);
      if (cancelled()) return;

      const numberedBlob = await buildReportPdf(
        reportData,
        genogramRef,
        processReport
      );
      if (cancelled()) return;

      // Storage 업로드
      if (userId && clientId) {
        try {
          await uploadPdfToStorage(
            userId,
            clientId,
            dispatch.report_id,
            numberedBlob
          );
        } catch (uploadError) {
          if (!import.meta.env.PROD)
            console.error(
              'PDF 업로드/URL 저장 실패:',
              uploadError instanceof Error ? uploadError.message : uploadError
            );
        }
      }

      fetchReports();
      setPdfBlobUrl(numberedBlob);
      setPreviewReportId(dispatch.report_id);
      setPreviewTitle(reportTitle);
      setStep('preview');
    } catch (error) {
      if (cancelled() || error instanceof ReportPollCancelledError) return;
      if (error instanceof ReportPollTimeoutError) {
        // 아직 생성 중일 수 있다 — 목록으로 돌아가 진행 상태를 노출한다.
        setStep('list');
        fetchReports();
        toast({
          title: '보고서 생성 중',
          description:
            '보고서 생성이 조금 더 걸리고 있어요. 잠시 후 목록에서 확인해주세요.',
        });
        return;
      }
      const errorMsg =
        error instanceof Error ? error.message : '오류가 생겼어요.';
      trackEvent(MixpanelError.GenogramReportGenerateFail, {
        client_id: clientId,
        error: errorMsg,
      });
      setGeneratingError(errorMsg);
      setGeneratingStatus('error');
    }
  }, [
    userId,
    clientId,
    formData,
    genogramRef,
    processReport,
    fetchReports,
    toast,
    setPdfBlobUrl,
    getTemplate,
  ]);

  // ── 미리보기 ──

  const handlePreviewReport = useCallback(
    async (report: ReportListItem) => {
      const myRun = runIdRef.current;
      const cancelled = () => runIdRef.current !== myRun;
      setPreviewReportId(report.id);
      setPreviewTitle(report.title);
      setStep('preview');
      setIsLoadingPreview(true);
      revokePdfUrl();
      setPdfUrl(null);

      try {
        if (report.pdf_storage_key) {
          const signedUrl = await createSignedPdfUrl(report.pdf_storage_key);
          if (cancelled()) return;
          const res = await fetch(signedUrl);
          if (cancelled()) return;
          const blob = await res.blob();
          if (cancelled()) return;
          setPdfBlobUrl(blob);
          return;
        }

        const reportData = await fetchReportDetail(report.id);
        if (cancelled()) return;
        const numberedBlob = await buildReportPdf(
          reportData,
          genogramRef,
          processReport
        );
        if (cancelled()) return;

        setPdfBlobUrl(numberedBlob);

        if (userId && clientId) {
          try {
            await uploadPdfToStorage(userId, clientId, report.id, numberedBlob);
            if (!cancelled()) fetchReports();
          } catch (uploadError) {
            if (!import.meta.env.PROD)
              console.error(
                'PDF 업로드/URL 저장 실패:',
                uploadError instanceof Error ? uploadError.message : uploadError
              );
          }
        }
      } catch (error) {
        if (cancelled()) return;
        toast({
          title: '미리보기 실패',
          description:
            error instanceof Error ? error.message : '오류가 생겼어요.',
        });
        setStep('list');
      } finally {
        if (!cancelled()) setIsLoadingPreview(false);
      }
    },
    [
      userId,
      clientId,
      genogramRef,
      processReport,
      fetchReports,
      toast,
      revokePdfUrl,
      setPdfBlobUrl,
    ]
  );

  // ── 인터랙션 핸들러 ──

  const handleCreateReport = useCallback(async () => {
    trackEvent(MixpanelEvent.GenogramReportButtonClick, {
      client_id: clientId,
    });
    const image = await genogramRef.current?.captureImage();
    setSnapshotImage(image ?? null);
    setStep('verify');
  }, [genogramRef, clientId]);

  const handleVerifyComplete = useCallback(() => {
    trackEvent(MixpanelEvent.GenogramReportVerifyComplete, {
      client_id: clientId,
    });
    setStep('input');
  }, [clientId]);

  const handleInputComplete = useCallback(async () => {
    if (!clientId) return;

    // 크레딧 가드
    const guard = await checkCredit(REPORT_CREDIT_COST);
    if (!guard.ok && !guard.unavailable) {
      trackEvent(MixpanelEvent.GenogramReportGenerateCreditInsufficient, {
        client_id: clientId,
        remaining: guard.remaining,
        required: REPORT_CREDIT_COST,
      });
      setCreditError(
        `가계도 보고서 생성에 ${REPORT_CREDIT_COST} 크레딧이 필요해요. (보유: ${guard.remaining})`
      );
      return;
    }

    setCreditError(null);
    setGeneratingStatus('processing');
    setGeneratingError(null);
    setStep('generating');
    await runGenerateFlow();

    // 크레딧 잔액 갱신 — 콜백에서 비동기 커밋되므로, 관측되지 않는(inactive)
    // summary 캐시도 refetch해야 게이지 재마운트 시 stale 잔액을 안 보인다.
    if (userId) {
      const userIdNum = Number(userId);
      if (!isNaN(userIdNum)) {
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNum),
          refetchType: 'all',
        });
      }
    }
  }, [clientId, checkCredit, userId, queryClient, runGenerateFlow]);

  const handleRetryGenerate = useCallback(async () => {
    setGeneratingStatus('processing');
    setGeneratingError(null);
    await runGenerateFlow();

    // 재시도도 새 reservation을 만들므로 잔액 동기화 — inactive 캐시까지 refetch.
    if (userId) {
      const userIdNum = Number(userId);
      if (!isNaN(userIdNum)) {
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNum),
          refetchType: 'all',
        });
      }
    }
  }, [runGenerateFlow, userId, queryClient]);

  const handleDownloadPreviewPdf = useCallback(async () => {
    if (!pdfUrl) return;
    trackEvent(MixpanelEvent.GenogramReportExportClick, {
      client_id: clientId,
      report_id: previewReportId,
    });
    await exportReport({
      reportId: previewReportId,
      title: previewTitle,
      pdfUrl,
      onRefresh: fetchReports,
    });
  }, [pdfUrl, previewTitle, previewReportId, clientId, fetchReports]);

  const handleSuccessProceed = useCallback(() => {
    successResolveRef.current?.();
  }, []);

  const handleBackToList = useCallback(() => {
    setStep('list');
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const setAnswer = useCallback((index: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const setFormField = useCallback(
    (field: keyof ReportFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ── Effects ──

  // 모달 열림/닫힘 동기화
  useEffect(() => {
    if (open) {
      // 새 세션 진입 — 실행 토큰을 올려 이전 플로우를 무효화한다.
      runIdRef.current++;
      invalidateAccess();
      setStep('list');
      setSnapshotImage(null);
      setReports([]);
      setAnswers(new Array(CHECKLIST.length).fill(null));
      setFormData({
        counselorName: userName ?? '',
        clientName: clientName ?? '',
        startDate: '',
        endDate: '',
        organization: organization ?? '',
      });
      setPdfUrl(null);
      setPreviewTitle('');
      setGeneratingStatus('processing');
      setGeneratingError(null);
    }

    return () => {
      // 닫힘/언마운트 — 토큰을 올려 진행 중 플로우를 취소한다.
      // (라이브 ref의 현재 값을 증가시키는 것이 의도 — 렌더 시점 스냅샷을 쓰면 안 된다.)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runIdRef.current++;
      revokePdfUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId, userName, clientName, organization]);

  // 권한 확인 후 보고서 목록 로드
  useEffect(() => {
    if (!open || isChecking) return;

    if (!hasAccess) {
      trackEvent(MixpanelEvent.GenogramReportSeminarModalView, {
        client_id: clientId,
      });
      return;
    }

    const myRun = runIdRef.current;
    (async () => {
      const list = await fetchReports();
      if (list.length === 0 && runIdRef.current === myRun) {
        await handleCreateReport();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasAccess, isChecking]);

  // ESC 키
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'generating' && generatingStatus === 'processing') return;
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, step, generatingStatus]);

  // 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // ── Return ──

  return {
    step,
    hasAccess,
    isChecking,
    snapshotImage,
    reports,
    isLoadingReports,
    generatingStatus,
    generatingError,
    retryingId,
    pdfUrl,
    isLoadingPreview,
    isCapturing,
    previewTitle,
    answers,
    formData,
    creditError,
    setCreditError,
    handleCreateReport,
    handleDownloadReport,
    handleRetryReport,
    handlePreviewReport,
    handleDownloadPreviewPdf,
    handleVerifyComplete,
    handleInputComplete,
    handleRetryGenerate,
    handleSuccessProceed,
    handleBackToList,
    handleClose,
    setAnswer,
    setFormField,
    setPreviewTitle,
  };
}
