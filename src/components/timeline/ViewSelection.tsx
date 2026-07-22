import { observer } from 'mobx-react-lite'
import { Tree } from 'antd'
import { useTimelineStore } from '../../stores/StoreContext'
import { TIMELINE_CATEGORIES } from './categories'
import { buildPeriodTreeData, toCategoryKeys } from './periodTree'

const TREE_DATA = buildPeriodTreeData()

export const ViewSelection = observer(function ViewSelection() {
  const store = useTimelineStore()

  const checkedKeys = TIMELINE_CATEGORIES
    .filter(category => store.visibleCategories[category.key])
    .map(category => category.key)

  return (
    <div
      className="absolute top-3 left-3 z-10 bg-slate-900/80 border border-slate-700/60 rounded-md px-3 py-2 backdrop-blur-sm pointer-events-auto"
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">View</p>
      <Tree
        checkable
        defaultExpandAll
        checkedKeys={checkedKeys}
        onCheck={checkedKeysValue => {
          const keys = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked
          store.setVisibleCategories(toCategoryKeys(keys))
        }}
        treeData={TREE_DATA}
        style={{ fontSize: 10, background: 'transparent' }}
      />
    </div>
  )
})
