import { DatePicker, Input } from '@/shared/ui';

import type { ReportFormData } from '../types';

interface InputStepProps {
  formData: ReportFormData;
  onFormChange: (field: keyof ReportFormData, value: string) => void;
}

export function InputStep({ formData, onFormChange }: InputStepProps) {
  return (
    <div className="mb-24 flex flex-col gap-6">
      {/* 상단 배너 */}
      <div className="rounded-xl bg-primary-subtle px-6 py-5 text-center">
        <p className="typo-m font-headline text-fg">
          아래 정보가 보고서 표지에 반영됩니다.
        </p>
        <p className="typo-sm mt-2 text-fg-muted">
          보고서에 기입될 정보를 확인해주세요.
        </p>
      </div>
      {/* 1. 상담사님의 성함 */}
      <div>
        <label
          htmlFor="counselor"
          className="typo-m mb-2 block font-headline text-fg"
        >
          1. 상담사님의 성함
        </label>
        <Input
          id="counselor"
          type="text"
          value={formData.counselorName}
          onChange={(e) => onFormChange('counselorName', e.target.value)}
          className="focus:border-primary focus:outline-none"
        />
      </div>
      {/* 2. 내담자님의 성함 */}
      <div>
        <label
          htmlFor="client"
          className="typo-m mb-2 block font-headline text-fg"
        >
          2. 내담자님의 성함
        </label>
        <Input
          id="client"
          type="text"
          value={formData.clientName}
          onChange={(e) => onFormChange('clientName', e.target.value)}
          className="focus:border-primary focus:outline-none"
        />
      </div>

      {/* 3. 상담 진행 기간 */}
      <div>
        <label
          htmlFor="date"
          className="typo-m mb-2 block font-headline text-fg"
        >
          3. 상담 진행 기간
        </label>
        <div className="flex flex-col gap-2">
          <div>
            <p className="typo-sm mb-1 text-fg-muted">상담 시작 날짜</p>
            <DatePicker
              value={formData.startDate}
              onChange={(v) => onFormChange('startDate', v)}
              max={formData.endDate || undefined}
              rangeEnd={formData.endDate || undefined}
              placeholder="상담 시작 날짜"
            />
          </div>
          <div>
            <p className="typo-sm mb-1 text-fg-muted">상담 종료 날짜</p>
            <DatePicker
              value={formData.endDate}
              onChange={(v) => onFormChange('endDate', v)}
              min={formData.startDate || undefined}
              rangeStart={formData.startDate || undefined}
              placeholder="상담 종료 날짜"
            />
          </div>
        </div>
      </div>
      {/* 4. 상담 기관(센터) 이름 */}
      <div>
        <label
          htmlFor="organization"
          className="typo-m mb-2 block font-headline text-fg"
        >
          4. 상담 기관(센터) 이름
        </label>
        <Input
          id="organization"
          type="text"
          value={formData.organization}
          onChange={(e) => onFormChange('organization', e.target.value)}
          className="focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}
