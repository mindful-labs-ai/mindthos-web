import type { NoteV2Output } from '../types';
import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface TheorySectionBlockProps {
  section: NoteV2Output['phase2']['theory_section'];
  editable?: boolean;
}

export function TheorySectionBlock({
  section,
  editable,
}: TheorySectionBlockProps) {
  return (
    <div className="rounded-lg border border-green-40 bg-green-10 p-4">
      <div className="mb-4 border-b border-green-40 pb-3">
        <span className="text-m font-emphasize text-primary">
          {section.title}
        </span>
      </div>
      <div className="space-y-4">
        {section.subsections?.map((sub, i) => (
          <div key={i} className="space-y-1">
            <span className="block text-sm font-emphasize text-green-80">
              {sub.subtitle}
            </span>
            <ParagraphArray
              value={sub.content}
              path={`phase2.theory_section.subsections.${i}.content`}
              editable={editable}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function serializeTheorySection(
  section: NoteV2Output['phase2']['theory_section']
): string {
  return (
    section.subsections
      ?.map((sub) => {
        const lines = toLines(sub.content);
        return [sub.subtitle, ...lines.map((l) => `  ${l}`)].join('\n');
      })
      .join('\n\n') ?? ''
  );
}
