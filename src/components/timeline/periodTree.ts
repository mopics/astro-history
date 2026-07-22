import { TIMELINE_CATEGORIES, TIMELINE_GROUPS, type TimelineCategoryKey } from './categories'

export const GROUP_NODE_PREFIX = 'group:'

export type PeriodTreeNode = {
  key: string
  title: string
  children: { key: TimelineCategoryKey; title: string }[]
}

export function buildPeriodTreeData(): PeriodTreeNode[] {
  return TIMELINE_GROUPS.map(group => ({
    key: `${GROUP_NODE_PREFIX}${group.key}`,
    title: group.label,
    children: TIMELINE_CATEGORIES
      .filter(category => category.group === group.key)
      .map(category => ({ key: category.key, title: category.label })),
  }))
}

const CATEGORY_KEYS = new Set<string>(TIMELINE_CATEGORIES.map(category => category.key))

export function toCategoryKeys(checkedKeys: (string | number | bigint)[]): TimelineCategoryKey[] {
  return checkedKeys.filter(
    (key): key is TimelineCategoryKey => CATEGORY_KEYS.has(String(key)),
  )
}
