import { serverRequest } from '@/shared/api/server/serverClient';

import { TUTORIAL_ENDPOINTS } from './constants';
import type {
  TutorialDirectVirtualSessionUploadResponse,
  TutorialProgressRequest,
  TutorialProgressResponse,
  TutorialState,
  TutorialVirtualClientsResponse,
} from './types';

export const tutorialService = {
  async current(): Promise<TutorialState> {
    return serverRequest<TutorialState>(TUTORIAL_ENDPOINTS.CURRENT);
  },

  async enroll(): Promise<TutorialState> {
    return serverRequest<TutorialState>(TUTORIAL_ENDPOINTS.ENROLL, {
      method: 'POST',
    });
  },

  async progress(
    payload: TutorialProgressRequest
  ): Promise<TutorialProgressResponse> {
    return serverRequest<TutorialProgressResponse>(
      TUTORIAL_ENDPOINTS.PROGRESS,
      { method: 'PATCH', body: payload }
    );
  },

  async complete(): Promise<TutorialState> {
    return serverRequest<TutorialState>(TUTORIAL_ENDPOINTS.COMPLETE, {
      method: 'POST',
    });
  },

  async claimReward(): Promise<TutorialState> {
    return serverRequest<TutorialState>(TUTORIAL_ENDPOINTS.REWARD, {
      method: 'POST',
    });
  },

  async ensureVirtualClients(): Promise<TutorialVirtualClientsResponse> {
    return serverRequest<TutorialVirtualClientsResponse>(
      TUTORIAL_ENDPOINTS.ENSURE_VIRTUAL_CLIENTS,
      { method: 'POST' }
    );
  },

  async virtualClients(): Promise<TutorialVirtualClientsResponse> {
    return serverRequest<TutorialVirtualClientsResponse>(
      TUTORIAL_ENDPOINTS.VIRTUAL_CLIENTS
    );
  },

  /** Q3 무기록 유저의 공용 S3 4회기 연결 API. 크레딧·AI 작업은 발생하지 않는다. */
  async directVirtualSessionUpload(): Promise<TutorialDirectVirtualSessionUploadResponse> {
    return serverRequest<TutorialDirectVirtualSessionUploadResponse>(
      TUTORIAL_ENDPOINTS.DIRECT_VIRTUAL_SESSION_UPLOAD,
      { method: 'POST' }
    );
  },
};
