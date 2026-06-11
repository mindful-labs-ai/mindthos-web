import type { S3Row } from '@/features/client/types/supervisionReport.types';

import { EditableText } from './EditableText';
import { SectionTitle } from './SectionTitle';

interface TranscriptTableProps {
  title: string;
  /** [회기, 발언, 이론 분석, 대안] — config 제공. */
  headers: [string, string, string, string];
  rows: S3Row[];
  /** 편집 모드 — 각 셀을 필드 단위로 수정 */
  editable?: boolean;
  onRowsChange?: (rows: S3Row[]) => void;
}

/** section3: 4컬럼 축어록 정밀 분석 표. 색·테두리는 상담노트 표와 동일 토큰. */
export function TranscriptTable({
  title,
  headers,
  rows,
  editable = false,
  onRowsChange,
}: TranscriptTableProps) {
  const handleRowChange = (index: number, patch: Partial<S3Row>) => {
    onRowsChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const cellKeys = ['session', 'speech', 'analysis', 'alternative'] as const;

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-contrast">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap px-4 py-3 text-left text-m font-emphasize text-fg"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i}>
                {editable ? (
                  cellKeys.map((key) => (
                    <td
                      key={key}
                      className={`px-2 py-2 align-top ${
                        key === 'session' ? 'min-w-[80px]' : 'min-w-[200px]'
                      }`}
                    >
                      <EditableText
                        value={row[key]}
                        onChange={(value) =>
                          handleRowChange(i, { [key]: value })
                        }
                        ariaLabel={`${headers[cellKeys.indexOf(key)]} 편집`}
                      />
                    </td>
                  ))
                ) : (
                  <>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-m text-fg">
                      {row.session}
                    </td>
                    <td className="min-w-[200px] whitespace-pre-line break-keep px-4 py-3 align-top text-m text-fg">
                      {row.speech}
                    </td>
                    <td className="min-w-[240px] whitespace-pre-line break-keep px-4 py-3 align-top text-m text-fg">
                      {row.analysis}
                    </td>
                    <td className="min-w-[240px] whitespace-pre-line break-keep px-4 py-3 align-top text-m text-fg">
                      {row.alternative}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
