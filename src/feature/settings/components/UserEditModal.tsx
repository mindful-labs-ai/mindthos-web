import React from 'react';

import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Title } from '@/components/ui/atoms/Title';
import { FormField } from '@/components/ui/composites/FormField';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

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
  const { userName, organization, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = React.useState({
    name: '',
    organization: '',
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof formData, string>>
  >({});

  // 모달이 열릴 때 초기 데이터 설정
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: userName || '',
        organization: organization || '',
      });
      setErrors({});
    }
  }, [open, userName, organization]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await updateUser(data);
    },
    onSuccess: () => {
      toast({
        title: '정보 수정 완료',
        description: '사용자 정보가 성공적으로 수정되었습니다.',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Update user failed:', error);
      toast({
        title: '정보 수정 실패',
        description:
          error instanceof Error
            ? error.message
            : '정보 수정에 실패했습니다. 다시 시도해주세요.',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
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
            정보 수정
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

          <FormField label="소속 기관" error={errors.organization}>
            <Input
              type="text"
              placeholder="소속 기관을 입력해주세요"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              maxLength={50}
              error={!!errors.organization}
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '수정 중...' : '정보 수정'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
