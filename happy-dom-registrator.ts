import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach } from 'bun:test'

GlobalRegistrator.register()

// Static import of @testing-library/react here would hoist above
// GlobalRegistrator.register() (import statements always evaluate before
// other top-level code, regardless of source order), so its `screen` binds
// to a `document` that doesn't exist yet. Dynamic import runs after
// register() instead.
const { cleanup } = await import('@testing-library/react')

afterEach(() => {
  cleanup()
})
