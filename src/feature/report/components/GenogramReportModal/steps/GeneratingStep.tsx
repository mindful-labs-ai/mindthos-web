import type { GeneratingStatus } from '../../ReportGeneratingView';
import { ReportGeneratingView } from '../../ReportGeneratingView';

interface GeneratingStepProps {
  status: GeneratingStatus;
}

export function GeneratingStep({ status }: GeneratingStepProps) {
  return <ReportGeneratingView status={status} />;
}
