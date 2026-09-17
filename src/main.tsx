import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './routes'

// #root always exists — it's in index.html, part of this app's own shell.
// Optional chaining here would silently skip .render() instead of throwing.
// biome-ignore lint/style/noNonNullAssertion: see comment
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <RouterProvider router={router} />
  // </StrictMode>,
)
