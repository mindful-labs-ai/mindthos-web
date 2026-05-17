import { cn } from '@/lib/cn';
import { SecurityShieldIcon } from '@/shared/icons';

interface SecurityNoticeProps {
  className?: string;
}

export const SecurityNotice = ({ className }: SecurityNoticeProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl bg-grey-100 py-5 text-center text-white',
        className
      )}
    >
      <SecurityShieldIcon size={32} className="text-white" />
      <p className="text-m font-emphasize">
        마음토스에 올리는 모든 내담자 정보는
        <br />
        철저하게 암호화되며 AI 학습에 이용되지 않아요.
      </p>
    </div>
  );
};
