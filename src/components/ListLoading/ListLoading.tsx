import { ReloadIcon } from '@/utils/icons'
import './ListLoading.css'

export function ListLoading() {
  return (
    <div className="list-loading">
      <ReloadIcon size={18} className="icon-spin" />
    </div>
  )
}
