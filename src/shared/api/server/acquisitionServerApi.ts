import type { CohortBranch } from '@/features/onboarding/constants/cohort';
import {
  adaptCohortSurveyChoices,
  type CohortSurveyChoices,
  type CohortSurveyPayload,
} from '@/features/onboarding/constants/cohortSurvey';
import {
  parseUtmPayload,
  parseUtmPayloadFromObject,
  removeUtmParamsFromCurrentUrl,
  type UtmPayload,
} from '@/shared/utils/utm';
import { useUtmStore } from '@/stores/utmStore';

import { serverRequest } from './serverClient';

export type AcquisitionCaptureStage =
  | 'signup_authenticated'
  | 'signup_complete'
  | 'cohort_complete';

export interface AcquisitionCaptureResponse {
  received: true;
  stage: AcquisitionCaptureStage;
  cohort: CohortBranch | null;
}

export interface CohortSurveyStatusResponse {
  completed: boolean;
  cohort: CohortBranch | null;
  default_template_id: number | null;
  has_record: 'TRUE' | 'FALSE' | null;
}

function getStoredUtmPayload(): UtmPayload {
  return parseUtmPayload(useUtmStore.getState().utmParams);
}

export function getUserMetadataUtm(metadata: unknown): UtmPayload {
  return parseUtmPayloadFromObject(metadata);
}

/** 가입/코호트 완료 시 획득 파라미터를 전송하고 서버의 cohort를 받는다. */
export async function captureAcquisition(
  stage: AcquisitionCaptureStage,
  metadata: UtmPayload & Partial<CohortSurveyPayload> = {}
): Promise<AcquisitionCaptureResponse | null> {
  try {
    const response = await serverRequest<AcquisitionCaptureResponse>(
      '/auth/acquisition',
      {
        method: 'POST',
        body: { stage, ...getStoredUtmPayload(), ...metadata },
      }
    );
    useUtmStore.getState().stopUrlPropagation();
    removeUtmParamsFromCurrentUrl();
    return response;
  } catch (error) {
    console.warn('[acquisition] capture failed', error);
    return null;
  }
}

export async function captureCohortSurvey(
  choices: CohortSurveyChoices
): Promise<AcquisitionCaptureResponse> {
  const response = await captureAcquisition(
    'cohort_complete',
    adaptCohortSurveyChoices(choices)
  );
  if (!response) {
    throw new Error(
      '질문 응답을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
    );
  }
  return response;
}

export async function getCohortSurveyStatus(): Promise<CohortSurveyStatusResponse> {
  return serverRequest<CohortSurveyStatusResponse>(
    '/auth/cohort-survey/status'
  );
}
