/**
 * 세션 생성 Hook
 * - 오디오: S3 업로드 → 백그라운드 세션 생성
 * - PDF: 텍스트 추출 → 백그라운드 세션 생성
 * - 직접 입력: 텍스트 전달 → 백그라운드 세션 생성
 *
 * 백그라운드 처리:
 * - 세션 생성 요청 후 즉시 session_id 반환
 * - 별도의 useSessionStatus hook으로 처리 상태 폴링
 */

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';

import { createSessionBackground } from '../services/sessionService';
import type {
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  UploadType,
  FileInfo,
  AudioFileInfo,
  PdfFileInfo,
} from '../types';
import type { S3UploadError } from '../types/s3Upload.types';
import { calculateTotalCredit } from '../utils/creditCalculator';

import { useS3Upload } from './useS3Upload';

export interface CreateSessionParams {
  userId: number;
  clientId?: string;
  uploadType: UploadType;
  transcribeType?: 'basic' | 'advanced'; // 오디오인 경우 필수
  templateId: number;
  file?: FileInfo;
  directInput?: string;
}

export interface UseCreateSessionReturn {
  createSession: (
    params: CreateSessionParams
  ) => Promise<CreateSessionBackgroundResponse>;
  isCreating: boolean;
  uploadProgress: number;
  error: Error | S3UploadError | null;
  reset: () => void;
  createdSessionId: string | null; // 생성된 세션 ID (백그라운드 처리 중)
}

/**
 * PDF에서 텍스트 추출 (간단한 구현)
 * TODO: pdf.js 등을 사용한 실제 PDF 파싱 구현 필요
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // 현재는 임시 구현
  // 실제로는 pdf.js나 다른 라이브러리를 사용해야 함

  return `[PDF 파일: ${file.name}]\n\n여기에 추출된 텍스트가 들어갑니다.`;
}

export function useCreateSession(): UseCreateSessionReturn {
  const queryClient = useQueryClient();
  const {
    uploadAudio,
    isUploading,
    progress,
    error: uploadError,
  } = useS3Upload();
  const { creditInfo } = useCreditInfo();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | S3UploadError | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  const createSession = async (
    params: CreateSessionParams
  ): Promise<CreateSessionBackgroundResponse> => {
    setIsCreating(true);
    setError(null);

    try {
      let request: CreateSessionBackgroundRequest;

      // 1. 업로드 타입별 처리
      if (params.uploadType === 'audio') {
        // 오디오 업로드
        if (!params.file) {
          throw new Error('오디오 파일이 선택되지 않았습니다.');
        }
        if (!params.transcribeType) {
          throw new Error('축어록 타입을 선택해주세요.');
        }

        const audioFile = params.file as AudioFileInfo;

        // S3 업로드 전 크레딧 확인
        const { totalCredit } = calculateTotalCredit({
          uploadType: 'audio',
          transcribeType: params.transcribeType,
          durationSeconds: audioFile.duration,
        });

        const remainingCredit = creditInfo?.plan.remaining ?? 0;

        if (remainingCredit < totalCredit) {
          throw new Error(
            `크레딧이 부족합니다. 필요: ${totalCredit}, 잔여: ${remainingCredit}`
          );
        }

        // S3 업로드
        const uploadResult = await uploadAudio(audioFile.file, params.userId);

        // transcribeType을 stt_model로 변환: 'basic' → 'whisper', 'advanced' → 'gemini-3'
        const sttModel =
          params.transcribeType === 'basic' ? 'whisper' : 'gemini-3';

        request = {
          user_id: params.userId,
          title: audioFile.file.name, // 파일명을 세션 제목으로 사용
          s3_key: uploadResult.file_path, // S3 key (영구 저장용)
          file_size_mb: uploadResult.file_size_mb,
          duration_seconds: uploadResult.duration_seconds || audioFile.duration,
          client_id: params.clientId || null,
          stt_model: sttModel,
          template_id: params.templateId,
        };
      } else if (params.uploadType === 'pdf') {
        // PDF 업로드
        if (!params.file) {
          throw new Error('PDF 파일이 선택되지 않았습니다.');
        }

        const pdfFile = params.file as PdfFileInfo;

        // 크레딧 확인
        const { totalCredit } = calculateTotalCredit({
          uploadType: 'pdf',
        });

        const remainingCredit = creditInfo?.plan.remaining ?? 0;

        if (remainingCredit < totalCredit) {
          throw new Error(
            `크레딧이 부족합니다. 필요: ${totalCredit}, 잔여: ${remainingCredit}`
          );
        }

        // PDF 텍스트 추출
        const extractedText = await extractTextFromPDF(pdfFile.file);

        request = {
          user_id: params.userId,
          client_id: params.clientId,
          // upload_type: 'pdf',
          transcribed_text: extractedText,
          template_id: params.templateId,
        };
      } else {
        // 직접 입력
        if (!params.directInput?.trim()) {
          throw new Error('상담 내용을 입력해주세요.');
        }

        // 크레딧 확인
        const { totalCredit } = calculateTotalCredit({
          uploadType: 'direct',
        });

        const remainingCredit = creditInfo?.plan.remaining ?? 0;

        if (remainingCredit < totalCredit) {
          throw new Error(
            `크레딧이 부족합니다. 필요: ${totalCredit}, 잔여: ${remainingCredit}`
          );
        }

        request = {
          user_id: params.userId,
          client_id: params.clientId,
          upload_type: 'direct',
          transcribed_text: params.directInput,
          template_id: params.templateId,
        };
      }

      // 2. 백그라운드 세션 생성 API 호출
      const response = await createSessionBackground(request);

      // 3. 백그라운드 처리를 위해 세션 ID 저장
      setCreatedSessionId(response.session_id);

      // 4. 세션 목록 쿼리 즉시 invalidate (새로 생성된 세션이 목록에 바로 표시되도록)
      queryClient.invalidateQueries({ queryKey: ['sessions', params.userId] });

      return response;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('상담기록 작성 중 오류가 발생했습니다.');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setError(null);
    setCreatedSessionId(null);
  };

  return {
    createSession,
    isCreating: isCreating || isUploading,
    uploadProgress: progress,
    error: error || uploadError,
    reset,
    createdSessionId,
  };
}
