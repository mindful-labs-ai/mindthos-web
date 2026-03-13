import { useCallback, useEffect, useRef, useState } from 'react';

import { useToast } from '@/components/ui/composites/Toast';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { trackEvent } from '@/lib/mixpanel';
import { useFeatureAccess } from '@/shared/hooks/useFeatureAccess';
import { useReportTemplates } from '@/shared/hooks/useReportTemplates';
import { useAuthStore } from '@/stores/authStore';

import { useGenogramCapture } from '../../hooks/useGenogramCapture';
import type { ReportListItem } from '../../services/reportService';
import {
  createSignedPdfUrl,
  exportReport,
  fetchReportDetail,
  generateReport,
} from '../../services/reportService';
import { buildReportPdf, uploadPdfToStorage } from '../../utils/buildReportPdf';
import type { GeneratingStatus } from '../ReportGeneratingView';

import {
  CHECKLIST,
  GENOGRAM_REPORT_TEMPLATE_KEY,
  REPORT_CREDIT_COST,
} from './constants';
import { useReportList } from './hooks/useReportList';
import type {
  GenogramReportModalProps,
  ModalStep,
  ReportFormData,
  UseReportModalReturn,
} from './types';
import { useReportDebugPanel } from './useReportDebugPanel';

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
  const { creditInfo } = useCreditInfo();

  // ── 기능 접근 권한 (TanStack Query) ──

  const {
    hasAccess,
    isChecking,
    invalidate: invalidateAccess,
  } = useFeatureAccess('GENOGRAM_SEMINAR');

  const { getTemplate } = useReportTemplates();

  // ── 서브 훅 ──
  const {
    reports,
    isLoadingReports,
    retryingId,
    fetchReports,
    handleRetryReport,
    handleDownloadReport,
    setReports,
  } = useReportList({ clientId, toast });
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
  const cancelledRef = useRef(false);
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
    cancelledRef.current = false;

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

      const result = await generateReport({
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

      if (cancelledRef.current) return;
      trackEvent('genogram_report_generate_success', {
        client_id: clientId,
        report_id: result.report_id,
      });
      setGeneratingStatus('success');

      await new Promise<void>((resolve) => {
        successResolveRef.current = resolve;
        setTimeout(resolve, 2000);
      });
      successResolveRef.current = null;
      if (cancelledRef.current) return;

      const reportData = result.formatted_json;

      if (!reportData) {
        setStep('list');
        fetchReports();
        toast({
          title: '보고서 생성 완료',
          description: '가계도 분석 보고서가 성공적으로 생성되었습니다.',
        });
        return;
      }

      const numberedBlob = await buildReportPdf(
        reportData,
        genogramRef,
        processReport
      );
      if (cancelledRef.current) return;

      // Storage 업로드
      if (userId && clientId) {
        try {
          await uploadPdfToStorage(
            userId,
            clientId,
            result.report_id,
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
      setPreviewReportId(result.report_id);
      setPreviewTitle(reportTitle);
      setStep('preview');
    } catch (error) {
      if (cancelledRef.current) return;
      const errorMsg =
        error instanceof Error ? error.message : '오류가 발생했습니다.';
      trackEvent('genogram_report_generate_fail', {
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
      setPreviewReportId(report.id);
      setPreviewTitle(report.title);
      setStep('preview');
      setIsLoadingPreview(true);
      revokePdfUrl();
      setPdfUrl(null);

      try {
        if (report.pdf_storage_key) {
          const signedUrl = await createSignedPdfUrl(report.pdf_storage_key);
          if (cancelledRef.current) return;
          const res = await fetch(signedUrl);
          if (cancelledRef.current) return;
          const blob = await res.blob();
          if (cancelledRef.current) return;
          setPdfBlobUrl(blob);
          return;
        }

        const reportData = await fetchReportDetail(report.id);
        if (cancelledRef.current) return;
        const numberedBlob = await buildReportPdf(
          reportData,
          genogramRef,
          processReport
        );
        if (cancelledRef.current) return;

        setPdfBlobUrl(numberedBlob);

        if (userId && clientId) {
          try {
            await uploadPdfToStorage(userId, clientId, report.id, numberedBlob);
            if (!cancelledRef.current) fetchReports();
          } catch (uploadError) {
            if (!import.meta.env.PROD)
              console.error(
                'PDF 업로드/URL 저장 실패:',
                uploadError instanceof Error ? uploadError.message : uploadError
              );
          }
        }
      } catch (error) {
        if (cancelledRef.current) return;
        toast({
          title: '미리보기 실패',
          description:
            error instanceof Error ? error.message : '오류가 발생했습니다.',
        });
        setStep('list');
      } finally {
        if (!cancelledRef.current) setIsLoadingPreview(false);
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
    trackEvent('genogram_report_button_click', { client_id: clientId });
    const image = await genogramRef.current?.captureImage();
    setSnapshotImage(image ?? null);
    setStep('verify');
  }, [genogramRef, clientId]);

  const handleVerifyComplete = useCallback(() => {
    trackEvent('genogram_report_verify_complete', { client_id: clientId });
    setStep('input');
  }, [clientId]);

  const handleInputComplete = useCallback(async () => {
    if (!clientId) return;

    // 크레딧 잔여량 검증
    const remaining = creditInfo?.plan.remaining ?? 0;
    if (REPORT_CREDIT_COST > remaining) {
      trackEvent('genogram_report_generate_credit_insufficient', {
        client_id: clientId,
        remaining,
        required: REPORT_CREDIT_COST,
      });
      setCreditError(
        `크레딧이 부족합니다. 필요: ${REPORT_CREDIT_COST}, 보유: ${remaining}`
      );
      return;
    }

    setCreditError(null);
    setGeneratingStatus('processing');
    setGeneratingError(null);
    setStep('generating');
    await runGenerateFlow();
  }, [clientId, creditInfo, runGenerateFlow]);

  const handleRetryGenerate = useCallback(async () => {
    setGeneratingStatus('processing');
    setGeneratingError(null);
    await runGenerateFlow();
  }, [runGenerateFlow]);

  const handleDownloadPreviewPdf = useCallback(async () => {
    if (!pdfUrl) return;
    trackEvent('genogram_report_export_click', {
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
      cancelledRef.current = false;
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
      cancelledRef.current = true;
      revokePdfUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId, userName, clientName, organization]);

  // 권한 확인 후 보고서 목록 로드
  useEffect(() => {
    if (!open || isChecking) return;

    if (!hasAccess) {
      trackEvent('genogram_report_seminar_modal_view', {
        client_id: clientId,
      });
      return;
    }

    (async () => {
      const list = await fetchReports();
      if (list.length === 0 && !cancelledRef.current) {
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

  // ── 디버그 패널 ──

  const debugPanel = useReportDebugPanel({
    step,
    setStep,
    hasAccess,
    setHasAccess: () => {},
    generatingStatus,
    setGeneratingStatus,
    generatingError,
    setGeneratingError,
    isLoadingReports,
    setIsLoadingReports: () => {},
    isLoadingPreview,
    setIsLoadingPreview,
    reports,
    setReports,
  });

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
    debugPanel,
    setAnswer,
    setFormField,
    setPreviewTitle,
  };
}
