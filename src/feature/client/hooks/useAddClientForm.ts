import React from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { clientQueryKeys } from '../constants/queryKeys';
import { addClientSchema } from '../schemas/addClientSchema';
import { clientService } from '../services/clientService';
import type { Client } from '../types';
import type {
  ClientApiError,
  CreateClientRequest,
  UpdateClientRequest,
} from '../types/clientApi.types';

/**
 * 클라이언트 추가/수정 폼 훅
 * TanStack Query의 useMutation을 사용하여 서버 상태 관리
 */
export const useAddClientForm = (initialData?: Client | null) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    phone_number: initialData?.phone_number || '',
    email: initialData?.email || '',
    counsel_theme: initialData?.counsel_theme || '',
    memo: initialData?.memo || '',
    counsel_number: initialData?.counsel_number || 0,
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof formData, string>>
  >({});

  // initialData가 변경되면 formData 업데이트
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone_number: initialData.phone_number || '',
        email: initialData.email || '',
        counsel_theme: initialData.counsel_theme || '',
        memo: initialData.memo || '',
        counsel_number: initialData.counsel_number || 0,
      });
    } else {
      setFormData({
        name: '',
        phone_number: '',
        email: '',
        counsel_theme: '',
        memo: '',
        counsel_number: 0,
      });
    }
  }, [initialData]);

  // 수정 모드 여부
  const isEditMode = !!initialData;

  // useMutation으로 클라이언트 생성/수정 처리
  const mutation = useMutation({
    mutationFn: async (
      requestBody: CreateClientRequest | UpdateClientRequest
    ) => {
      if (isEditMode && initialData) {
        console.log('===== 클라이언트 수정 요청 =====');
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('================================');

        return await clientService.updateClient(
          requestBody as UpdateClientRequest
        );
      } else {
        console.log('===== 클라이언트 등록 요청 =====');
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('================================');

        return await clientService.createClient(
          requestBody as CreateClientRequest
        );
      }
    },
    onSuccess: (response) => {
      // TODO: [Mixpanel] 클라이언트 등록/수정 성공 - track(isEditMode ? 'client_update_success' : 'client_create_success', { client_id: response.client?.id })
      console.log(
        `===== 클라이언트 ${isEditMode ? '수정' : '등록'} 성공 =====`
      );
      console.log('메시지:', response.message);
      if ('client' in response) {
        console.log('등록된 클라이언트:', response.client);
      }
      console.log('================================');

      // 클라이언트 목록 쿼리 무효화하여 자동 리페치
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
    },
    onError: (error) => {
      // TODO: [Mixpanel] 클라이언트 등록/수정 실패 - track(isEditMode ? 'client_update_failed' : 'client_create_failed', { error: error.message })
      console.error(
        `===== 클라이언트 ${isEditMode ? '수정' : '등록'} 실패 =====`
      );
      console.error('Full Error Object:', error);
      console.error('Error JSON:', JSON.stringify(error, null, 2));
      console.error('================================');
    },
  });

  const resetForm = () => {
    setFormData({
      name: initialData?.name || '',
      phone_number: initialData?.phone_number || '',
      email: initialData?.email || '',
      counsel_theme: initialData?.counsel_theme || '',
      memo: initialData?.memo || '',
      counsel_number: initialData?.counsel_number || 0,
    });
    setErrors({});
    mutation.reset(); // mutation 상태 초기화
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, '');

    if (value.length > 3 && value.length <= 7) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 7 && value.length <= 11) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else if (value.length > 11) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }

    handleChange('phone_number', value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email && !isEditMode) {
      setErrors({ name: '사용자 정보를 찾을 수 없습니다.' });
      return false;
    }

    // Zod 검증
    const result = addClientSchema.safeParse(formData);

    if (!result.success) {
      const zodErrors: Partial<Record<keyof typeof formData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof formData;
        zodErrors[field] = issue.message;
      });
      setErrors(zodErrors);
      return false;
    }

    // 요청 본문 구성
    let requestBody: CreateClientRequest | UpdateClientRequest;

    if (isEditMode && initialData) {
      // 수정 모드
      requestBody = {
        client_id: initialData.id,
        name: formData.name,
        phone_number: formData.phone_number || undefined,
        email: formData.email || undefined,
        counsel_theme: formData.counsel_theme || undefined,
        memo: formData.memo || undefined,
        counsel_number: formData.counsel_number || undefined,
      };
    } else {
      // 생성 모드
      if (!user?.email) {
        setErrors({ name: '사용자 정보를 찾을 수 없습니다.' });
        return false;
      }

      requestBody = {
        counselor_email: user.email,
        name: formData.name,
        phone_number: formData.phone_number || undefined,
        email: formData.email || undefined,
        counsel_theme: formData.counsel_theme || undefined,
        memo: formData.memo || undefined,
        counsel_number: formData.counsel_number || undefined,
      };
    }

    // mutation 실행
    try {
      await mutation.mutateAsync(requestBody);
      return true;
    } catch {
      // onError에서 이미 로깅되므로 추가 처리 불필요
      return false;
    }
  };

  // mutation.error를 ClientApiError로 안전하게 타입 변환
  const getSubmitError = (): string => {
    if (!mutation.isError || !mutation.error) return '';

    const error = mutation.error as unknown as ClientApiError;
    return error.message || '클라이언트 등록에 실패했습니다.';
  };

  return {
    formData,
    errors,
    isSubmitting: mutation.isPending,
    submitError: getSubmitError(),
    resetForm,
    handleChange,
    handlePhoneChange,
    handleSubmit,
  };
};
