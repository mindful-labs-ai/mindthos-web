/**
 * 세션 생성 Hook
 * - 오디오: S3 업로드 → 백그라운드 세션 생성
 * - PDF: 텍스트 추출 → 백그라운드 세션 생성
 * - 직접 입력: 텍스트 전달 → 백그라운드 세션 생성
 */

import { useState } from 'react';
import { useS3Upload } from './useS3Upload';
import { createSessionBackground } from '../services/sessionService';
import type {
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  UploadType,
  FileInfo,
  AudioFileInfo,
  PdfFileInfo,
} from '../types';

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
  createSession: (params: CreateSessionParams) => Promise<CreateSessionBackgroundResponse>;
  isCreating: boolean;
  uploadProgress: number;
  error: Error | null;
  reset: () => void;
}

/**
 * PDF에서 텍스트 추출 (간단한 구현)
 * TODO: pdf.js 등을 사용한 실제 PDF 파싱 구현 필요
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // 현재는 임시 구현
  // 실제로는 pdf.js나 다른 라이브러리를 사용해야 함
  console.warn('PDF 텍스트 추출은 아직 구현되지 않았습니다.');
  return `[PDF 파일: ${file.name}]\n\n여기에 추출된 텍스트가 들어갑니다.`;
}

export function useCreateSession(): UseCreateSessionReturn {
  const { uploadAudio, isUploading, progress, error: uploadError } = useS3Upload();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

        // S3 업로드
        const uploadResult = await uploadAudio(audioFile.file, params.userId);

        request = {
          user_id: params.userId,
          client_id: params.clientId,
          upload_type: 'audio',
          audio_url: uploadResult.audio_url,
          file_size_mb: uploadResult.file_size_mb,
          duration_seconds: uploadResult.duration_seconds || audioFile.duration,
          transcribe_type: params.transcribeType,
          template_id: params.templateId,
        };
      } else if (params.uploadType === 'pdf') {
        // PDF 업로드
        if (!params.file) {
          throw new Error('PDF 파일이 선택되지 않았습니다.');
        }

        const pdfFile = params.file as PdfFileInfo;

        // PDF 텍스트 추출
        const extractedText = await extractTextFromPDF(pdfFile.file);

        request = {
          user_id: params.userId,
          client_id: params.clientId,
          upload_type: 'pdf',
          transcribed_text: extractedText,
          template_id: params.templateId,
        };
      } else {
        // 직접 입력
        if (!params.directInput?.trim()) {
          throw new Error('상담 내용을 입력해주세요.');
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

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('세션 생성 중 오류가 발생했습니다.');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return {
    createSession,
    isCreating: isCreating || isUploading,
    uploadProgress: progress,
    error: error || uploadError,
    reset,
  };
}
