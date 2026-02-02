import type { Visibility } from '../models/genogram';
import type { PersonAttribute, Subject } from '../models/person';
import { SubjectType } from '../types/enums';

/**
 * 생몰연도 라벨을 visibility 설정에 따라 생성합니다.
 */
export function buildLifeSpanLabel(
  personAttr: PersonAttribute | null,
  visibility: Visibility
): string | null {
  if (!personAttr?.lifeSpan.birth) return null;

  const birthPart = visibility.birthDate
    ? personAttr.lifeSpan.birth.slice(0, 4)
    : null;
  const deathPart =
    visibility.deathDate && personAttr.lifeSpan.death
      ? personAttr.lifeSpan.death.slice(0, 4)
      : null;

  if (birthPart && deathPart) return `${birthPart} ~ ${deathPart}`;
  if (birthPart) return `${birthPart}-`;
  if (deathPart) return `~ ${deathPart}`;
  return null;
}

/**
 * 상세정보 텍스트 배열을 생성합니다.
 */
export function buildDetailTexts(personAttr: PersonAttribute | null): string[] {
  const texts: string[] = [];
  if (!personAttr?.detail.enable) return texts;
  if (personAttr.detail.job) texts.push(personAttr.detail.job);
  if (personAttr.detail.education) texts.push(personAttr.detail.education);
  if (personAttr.detail.region) texts.push(personAttr.detail.region);
  return texts;
}

/**
 * Subject의 표시 이름을 visibility에 따라 결정합니다.
 */
export function resolveVisibleName(
  subject: Subject,
  visibility: Visibility
): string | null {
  if (!visibility.name) return null;

  const isPerson = subject.entity.type === SubjectType.Person;
  if (isPerson) {
    return (subject.entity.attribute as PersonAttribute).name ?? null;
  }
  return (subject.entity.attribute as { name: string | null }).name;
}
