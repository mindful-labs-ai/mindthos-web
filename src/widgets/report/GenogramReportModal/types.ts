import type { ReactNode, RefObject } from 'react';

import type { ReportListItem } from '@/features/report/services/reportService';
import type { GenogramPageHandle } from '@/genogram';

import type { GeneratingStatus } from '../ReportGeneratingView';

export type { GeneratingStatus };

// ── Step ──

export type ModalStep = 'list' | 'verify' | 'input' | 'generating' | 'preview';

// ── Form ──

export interface ReportFormData {
  counselorName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  organization: string;
}

// ── Modal props ──

export interface GenogramReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genogramRef: RefObject<GenogramPageHandle | null>;
  clientId?: string;
  clientName?: string;
}

// ── Hook return ──

export interface UseReportModalReturn {
  // State (UI/검증용)
  step: ModalStep;
  hasAccess: boolean | null;
  isChecking: boolean;
  snapshotImage: string | null;
  reports: ReportListItem[];
  isLoadingReports: boolean;
  generatingStatus: GeneratingStatus;
  generatingError: string | null;
  retryingId: string | null;
  pdfUrl: string | null;
  isLoadingPreview: boolean;
  isCapturing: boolean;
  previewTitle: string;
  answers: (number | null)[];
  formData: ReportFormData;
  creditError: string | null;
  setCreditError: (error: string | null) => void;

  // Actions (인터랙션 기반)
  handleCreateReport: () => Promise<void>;
  handleDownloadReport: (report: ReportListItem) => void;
  handleRetryReport: (reportId: string) => Promise<void>;
  handlePreviewReport: (report: ReportListItem) => Promise<void>;
  handleDownloadPreviewPdf: () => void;
  handleVerifyComplete: () => void;
  handleInputComplete: () => Promise<void>;
  handleRetryGenerate: () => Promise<void>;
  handleSuccessProceed: () => void;
  handleBackToList: () => void;
  handleClose: () => void;
  setAnswer: (index: number, value: number) => void;
  setFormField: (field: keyof ReportFormData, value: string) => void;
  setPreviewTitle: (title: string) => void;

  debugPanel: ReactNode;
}
