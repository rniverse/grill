import { Route, Routes } from 'react-router'
import { LandingPage } from '@/pages/LandingPage/LandingPage'
import { TopicPage } from '@/pages/TopicPage/TopicPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/topics/:topicId" element={<TopicPage />} />
    </Routes>
  )
}
