import {
  uploadAssessments as serverUploadAssessments,
  type AssessmentType,
  type ProcessingStatus,
  type UploadItem,
} from '@/shared/api/server/assessmentUploadApi';

import type {
  AssessmentKind,
  AssessmentProgress,
  AssessmentUploadGateway,
  AssessmentUploadInput,
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
}

/** 기본 인스턴스 (모달이 주입 없이 바로 쓸 수 있게). */
export const serverAssessmentUploadAdapter = new ServerAssessmentUploadAdapter();
