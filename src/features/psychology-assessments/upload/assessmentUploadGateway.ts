/**
 * 검사 업로드 Gateway (port).
 *
 * Adapter 패턴의 "target 인터페이스" — 프론트(모달 등)가 기대하는 형태만 정의한다.
 * 백엔드(mindthos-server)의 REST 계약·용어는 여기 드러나지 않는다. 서버 어휘
 * (MMPI_2, uploadBatch, presignedUrl 등)와의 변환은 구현체(adapter)가 전담한다.
 *
 * 이로써:
 * - 모달은 프론트 도메인 모델로만 대화 → 서버 계약 변경에 영향 없음
 * - 서버가 바뀌면 adapter만 교체, 테스트는 mock gateway 주입으로 처리
 */

/** 프론트 도메인의 검사 종류 (서버 enum과 무관한 프론트 어휘). */
export type AssessmentKind = 'mmpi' | 'tci';

/** 업로드 처리 상태 (프론트 도메인 표현). */
export type AssessmentProgress =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/** 업로드 1건의 입력 (프론트가 가진 그대로). */
export interface AssessmentUploadInput {
  kind: AssessmentKind;
  title: string;
  file: File;
}

/** 업로드 1건의 결과 (프론트가 쓰기 좋은 형태). */
export interface AssessmentUploadResult {
  assessmentId: string;
  kind: AssessmentKind;
  title: string;
  progress: AssessmentProgress;
}

export interface UploadAssessmentsResult {
  assessmentVersion: number;
  results: AssessmentUploadResult[];
}

/**
 * 검사 업로드 port. 프론트는 이 인터페이스에만 의존한다.
 */
export interface AssessmentUploadGateway {
  /**
   * 내담자의 검사 결과지 여러 건을 업로드한다.
   * (내부적으로 presigned 발급 → S3 업로드 → 확정까지 처리)
   */
  uploadAssessments(
    clientId: string,
    inputs: AssessmentUploadInput[],
  ): Promise<UploadAssessmentsResult>;
}
