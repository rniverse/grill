export interface SourceValidation {
  status: 'success' | 'failed'
  at: string // ISO timestamp
  error?: { message: string; meta?: unknown }
}

export interface ContentSourceConfig {
  id: string
  name: string
  source: {
    topic?: string
    references?: string
  }
  validation?: {
    topic?: SourceValidation
    references?: SourceValidation
  }
}

export const CONTENT_SOURCES: ContentSourceConfig[] = [
  {
    id: 'angular',
    name: 'Angular',
    source: {
      topic: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/topics/angular.json',
      references: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/references/angular.json',
    },
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    source: {
      topic: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/topics/nodejs.json',
      references: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/references/nodejs.json',
    },
  },
]
