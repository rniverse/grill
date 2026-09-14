import { createBrowserRouter, type RouteObject } from 'react-router'
import { LandingPage } from '@/pages/LandingPage/LandingPage'
import { TopicPage } from '@/pages/TopicPage/TopicPage'

export const routes: RouteObject[] = [
  { path: '/', Component: LandingPage },
  { path: '/topics/:topicId', Component: TopicPage },
]

export const router = createBrowserRouter(routes)
