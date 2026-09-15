import { createBrowserRouter, type RouteObject } from 'react-router'
import { LandingPage } from '@/pages/LandingPage/LandingPage'
import { TopicPage } from '@/pages/TopicPage/TopicPage'
import { ReferencesPage } from '@/pages/ReferencesPage/ReferencesPage'
import { BookmarksPage } from '@/pages/BookmarksPage/BookmarksPage'
import { QuestionsPage } from '@/pages/QuestionsPage/QuestionsPage'
import { NotesPage } from '@/pages/NotesPage/NotesPage'

export const routes: RouteObject[] = [
  { path: '/', Component: LandingPage },
  { path: '/topics/:topicId', Component: TopicPage },
  { path: '/references', Component: ReferencesPage },
  { path: '/references/:topicId', Component: ReferencesPage },
  { path: '/bookmarks', Component: BookmarksPage },
  { path: '/questions', Component: QuestionsPage },
  { path: '/notes', Component: NotesPage },
]

export const router = createBrowserRouter(routes)
