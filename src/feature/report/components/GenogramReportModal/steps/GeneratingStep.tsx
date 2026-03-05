import type { GeneratingStatus } from '../../ReportGeneratingView';
import { ReportGeneratingView } from '../../ReportGeneratingView';

interface GeneratingStepProps {
  status: GeneratingStatus;
  onSuccessProceed?: () => void;
}

export function GeneratingStep({
  status,
  onSuccessProceed,
}: GeneratingStepProps) {
  return (
    <ReportGeneratingView status={status} onSuccessProceed={onSuccessProceed} />
  );
}
