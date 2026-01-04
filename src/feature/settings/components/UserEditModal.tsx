import React from 'react';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Title } from '@/components/ui/atoms/Title';
import { FormField } from '@/components/ui/composites/FormField';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

// Zod 스키마 정의
const userEditSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .max(20, '이름은 20자 이내로 입력해주세요.'),
  organization: z
    .string()
    .min(1, '소속 기관을 입력해주세요.')
    .max(50, '소속 기관은 50자 이내로 입력해주세요.'),
  phoneNumber: z
    .string()
    .regex(
      /^$|^01[016789]-?\d{3,4}-?\d{4}$/,
      '올바른 휴대전화 번호를 입력해주세요. (예: 010-1234-5678)'
    )
    .optional()
    .or(z.literal('')),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

// 휴대전화 번호 포맷팅 (하이픈 자동 추가)
const formatPhoneNumber = (value: string): string => {
  const numbersOnly = value.replace(/[^0-9]/g, '');

  if (numbersOnly.length <= 3) {
    return numbersOnly;
  } else if (numbersOnly.length <= 7) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
  } else {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
  }
};

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { userName, organization, userPhoneNumber, updateUser } =
    useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = React.useState<UserEditFormData>({
    name: '',
    organization: '',
    phoneNumber: '',
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserEditFormData, string>>
  >({});

  // 모달이 열릴 때 초기 데이터 설정
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: userName || '',
        organization: organization || '',
        phoneNumber: userPhoneNumber || '',
      });
      setErrors({});
    }
  }, [open, userName, organization, userPhoneNumber]);

  const handleChange = (field: keyof UserEditFormData, value: string) => {
    let processedValue = value;

    // 휴대전화 번호는 자동 포맷팅 적용
    if (field === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: UserEditFormData) => {
      await updateUser({
        name: data.name,
        organization: data.organization,
        phoneNumber: data.phoneNumber,
      });
    },
    onSuccess: () => {
      toast({
        title: '정보 입력 완료',
        description: '사용자 정보가 성공적으로 수정되었습니다.',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Update user failed:', error);
      toast({
        title: '정보 입력 실패',
        description:
          error instanceof Error
            ? error.message
            : '정보 입력에 실패했습니다. 다시 시도해주세요.',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod 유효성 검사
    const result = userEditSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserEditFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserEditFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    mutation.mutate(result.data);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg text-left"
      closeOnOverlay={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="flex items-start justify-between">
          <Title as="h2" className="px-6 text-2xl font-bold">
            정보 입력하기
          </Title>
        </div>

        <div className="space-y-4 px-6">
          <FormField label="이름" required error={errors.name}>
            <Input
              type="text"
              placeholder="이름을 입력해주세요"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={20}
              error={!!errors.name}
            />
          </FormField>

          <FormField label="소속 기관" required error={errors.organization}>
            <Input
              type="text"
              placeholder="소속 기관을 입력해주세요"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              maxLength={50}
              error={!!errors.organization}
            />
          </FormField>

          <FormField label="휴대전화 번호" error={errors.phoneNumber}>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              maxLength={13}
              error={!!errors.phoneNumber}
            />
          </FormField>
        </div>

        <div className="flex justify-center px-6 pt-4">
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            size="lg"
            className="w-full max-w-md"
            disabled={
              mutation.isPending ||
              !formData.name.trim() ||
              !formData.organization?.trim()
            }
          >
            {mutation.isPending ? '수정 중...' : '정보 입력하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
