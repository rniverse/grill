import { Outlet } from 'react-router'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import './AppLayout.css'

export function AppLayout() {
  return (
    <div className="app-layout">
      <IconRail />
      <MobileNav />
      <Outlet />
    </div>
  )
}
