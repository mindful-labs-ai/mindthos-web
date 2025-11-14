import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Title } from '@/components/ui/atoms/Title';
import { FormField } from '@/components/ui/composites/FormField';
import { Modal } from '@/components/ui/composites/Modal';
import {
  addClientSchema,
  type AddClientFormData,
} from '@/feature/client/schemas/addClientSchema';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AddClientModal - 새 클라이언트 등록 모달
 * 폼 검증, 전화번호 자동 포맷팅 지원
 *
 * @example
 * <AddClientModal open={isOpen} onOpenChange={setIsOpen} />
 */
export const AddClientModal: React.FC<AddClientModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = React.useState<AddClientFormData>({
    name: '',
    phone_number: '',
    email: '',
    memo: '',
    counsel_number: 0,
    group_members: '',
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof AddClientFormData, string>>
  >({});

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      memo: '',
      counsel_number: 0,
      group_members: '',
    });
    setErrors({});
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // 입력 변경 핸들러
  const handleChange = (
    field: keyof AddClientFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러 초기화
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 전화번호 자동 포맷팅 (온보딩과 동일)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // 숫자만 추출

    // 자동 하이픈 추가
    if (value.length > 3 && value.length <= 7) {
      // 010-1234
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 7 && value.length <= 11) {
      // 010-1234-5678
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else if (value.length > 11) {
      // 최대 11자리까지만
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }

    handleChange('phone_number', value);
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Zod 검증
    const result = addClientSchema.safeParse(formData);

    if (!result.success) {
      // 검증 실패 시 에러 표시
      const zodErrors: Partial<Record<keyof AddClientFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AddClientFormData;
        zodErrors[field] = err.message;
      });
      setErrors(zodErrors);
      return;
    }

    // 검증 성공 시 콘솔에 출력 (임시 로직)
    console.log('===== 새 클라이언트 등록 =====');
    console.log('이름:', result.data.name);
    console.log('휴대폰 번호:', result.data.phone_number || '미입력');
    console.log('이메일:', result.data.email || '미입력');
    console.log('상담 주제:', result.data.memo || '미입력');
    console.log('회기 수:', result.data.counsel_number);
    console.log('내담자 구성:', result.data.group_members || '미입력');
    console.log('============================');

    // 모달 닫기 및 폼 초기화
    handleClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl"
      closeOnOverlay={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <Title as="h2" className="text-2xl font-bold">
            새로운 클라이언트 등록하기
          </Title>
        </div>

        {/* 이름 (필수) */}
        <FormField label="이름" required error={errors.name}>
          <Input
            type="text"
            placeholder="홍길동"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
          />
        </FormField>

        {/* 휴대폰 번호 */}
        <FormField label="휴대폰 번호" error={errors.phone_number}>
          <Input
            type="tel"
            placeholder="010-1234-5678"
            value={formData.phone_number}
            onChange={handlePhoneChange}
            maxLength={13}
            error={!!errors.phone_number}
          />
        </FormField>

        {/* 이메일 주소 */}
        <FormField label="이메일 주소" error={errors.email}>
          <Input
            type="email"
            placeholder="hong@gmail.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={!!errors.email}
          />
        </FormField>

        {/* 상담 주제 */}
        <FormField label="상담 주제" error={errors.memo}>
          <Input
            type="text"
            placeholder="가족 갈등, 부부 관계"
            value={formData.memo}
            onChange={(e) => handleChange('memo', e.target.value)}
            error={!!errors.memo}
          />
        </FormField>

        {/* 회기 수 */}
        <FormField label="회기 수" error={errors.counsel_number}>
          <Input
            type="number"
            placeholder="12회기"
            value={formData.counsel_number}
            onChange={(e) =>
              handleChange('counsel_number', parseInt(e.target.value, 10) || 0)
            }
            error={!!errors.counsel_number}
          />
        </FormField>

        {/* 내담자 구성 */}
        <FormField label="내담자 구성" error={errors.group_members}>
          <Input
            type="text"
            placeholder="아내(김영희), 딸(홍장미)"
            value={formData.group_members}
            onChange={(e) => handleChange('group_members', e.target.value)}
            error={!!errors.group_members}
          />
        </FormField>

        {/* 제출 버튼 */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            variant="solid"
            tone="neutral"
            size="lg"
            className="w-full max-w-md"
          >
            상담 기록 만들기
          </Button>
        </div>
      </form>
    </Modal>
  );
};
