import {
  confirmAssessment as serverConfirmAssessment,
  deleteAssessment as serverDeleteAssessment,
  getAssessment as serverGetAssessment,
  getAssessmentBatch as serverGetAssessmentBatch,
  uploadAssessments as serverUploadAssessments,
  type AssessmentRow,
  type AssessmentType,
  type ProcessingStatus,
  type UploadItem,
  type ValidationStatus,
} from '@/shared/api/server/assessmentUploadApi';

import type {
  AssessmentItem,
  AssessmentKind,
  AssessmentProgress,
  AssessmentUploadGateway,
  AssessmentUploadInput,
  AssessmentValidation,
  UploadAssessmentsResult,
} from './assessmentUploadGateway';

/**
 * mindthos-server용 AssessmentUploadGateway 구현 (Adapter).
 *
 * 프론트 도메인(AssessmentKind/Input/Progress) ↔ 서버 계약(AssessmentType/UploadItem/
 * ProcessingStatus) 사이의 모든 변환을 여기서 전담한다. adaptee는 `assessmentUploadApi`
 * (REST 트랜스포트). 서버 계약이 바뀌면 이 파일만 수정하면 된다.
 */

const KIND_TO_SERVER: Record<AssessmentKind, AssessmentType> = {
  mmpi: 'MMPI_2',
  tci: 'TCI',
};

const SERVER_TO_KIND: Partial<Record<AssessmentType, AssessmentKind>> = {
  MMPI_2: 'mmpi',
  TCI: 'tci',
};

const STATUS_TO_PROGRESS: Record<ProcessingStatus, AssessmentProgress> = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const VALIDATION_TO_DOMAIN: Record<ValidationStatus, AssessmentValidation> = {
  VALID: 'valid',
  MISSING_FIELD: 'missing_field',
  INVALID: 'invalid',
  UNMATCHED: 'unmatched',
  INCOMPLETE: 'incomplete',
};

/** 서버 검사 행 → 프론트 도메인 AssessmentItem. */
function toItem(row: AssessmentRow): AssessmentItem {
  return {
    assessmentId: row.id,
    kind: SERVER_TO_KIND[row.type] ?? 'mmpi',
    title: row.title,
    assessmentVersion: row.assessmentVersion,
    progress: STATUS_TO_PROGRESS[row.processingStatus],
    validation: row.validationStatus
      ? VALIDATION_TO_DOMAIN[row.validationStatus]
      : null,
    score: row.ocrScore,
    tempScore: row.tempOcrScore,
  };
}

export class ServerAssessmentUploadAdapter implements AssessmentUploadGateway {
  async uploadAssessments(
    clientId: string,
    inputs: AssessmentUploadInput[],
  ): Promise<UploadAssessmentsResult> {
    // 프론트 도메인 → 서버 계약
    const items: UploadItem[] = inputs.map((input) => ({
      type: KIND_TO_SERVER[input.kind],
      title: input.title,
      file: input.file,
    }));

    const { assessmentVersion, outcomes } = await serverUploadAssessments(
      clientId,
      items,
    );

    // 서버 응답 → 프론트 도메인
    return {
      assessmentVersion,
      results: outcomes.map((o) => ({
        assessmentId: o.assessmentId,
        kind: SERVER_TO_KIND[o.type] ?? 'mmpi',
        title: o.title,
        progress: STATUS_TO_PROGRESS[o.processingStatus],
      })),
    };
  }

  async listAssessments(clientId: string): Promise<AssessmentItem[]> {
    const { assessmentList } = await serverGetAssessmentBatch(clientId);
    return assessmentList.map(toItem);
  }

  async getAssessment(assessmentId: string): Promise<AssessmentItem> {
    return toItem(await serverGetAssessment(assessmentId));
  }

  async confirmAssessment(
    assessmentId: string,
    score: Record<string, unknown>,
  ): Promise<AssessmentItem> {
    return toItem(await serverConfirmAssessment(assessmentId, score));
  }

  async deleteAssessment(assessmentId: string): Promise<void> {
    await serverDeleteAssessment(assessmentId);
  }
}

/** 기본 인스턴스 (모달이 주입 없이 바로 쓸 수 있게). */
export const serverAssessmentUploadAdapter = new ServerAssessmentUploadAdapter();
