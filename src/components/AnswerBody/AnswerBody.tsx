import { type ReactNode, Fragment } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Reference } from '@/types/topic.types'
import { findReferenceMatches } from '@/utils/reference-match'
import { ReferenceBadge } from '@/components/ReferenceBadge/ReferenceBadge'
import './AnswerBody.css'

export interface AnswerBodyProps {
  text: string
  references: Reference[]
  onReferenceSelect: (reference: Reference) => void
}

// react-markdown hands each block element (p, li) its rendered children as a
// mix of plain strings and nested React nodes (for **bold**, inline `code`,
// etc). We only run reference-term matching over the plain-string children —
// a term inside an already-nested element (e.g. inline code) is left alone.
// This is a deliberate, documented limitation, not an oversight.
function highlightNode(
  node: ReactNode,
  references: Reference[],
  onReferenceSelect: (reference: Reference) => void,
  keyPrefix: string,
): ReactNode {
  if (typeof node !== 'string' || references.length === 0) {
    return node
  }

  const matches = findReferenceMatches(node, references)
  if (matches.length === 0) {
    return node
  }

  const pieces: ReactNode[] = []
  let cursor = 0
  matches.forEach((match, index) => {
    if (match.start > cursor) {
      pieces.push(node.slice(cursor, match.start))
    }
    pieces.push(
      <ReferenceBadge
        key={`${keyPrefix}-${index}`}
        label={node.slice(match.start, match.end)}
        onSelect={() => onReferenceSelect(match.reference)}
      />,
    )
    cursor = match.end
  })
  if (cursor < node.length) {
    pieces.push(node.slice(cursor))
  }

  return <Fragment>{pieces}</Fragment>
}

function highlightChildren(
  children: ReactNode,
  references: Reference[],
  onReferenceSelect: (reference: Reference) => void,
  keyPrefix: string,
): ReactNode {
  const childArray = Array.isArray(children) ? children : [children]
  return childArray.map((child, index) => (
    <Fragment key={index}>{highlightNode(child, references, onReferenceSelect, `${keyPrefix}-${index}`)}</Fragment>
  ))
}

export function AnswerBody({ text, references, onReferenceSelect }: AnswerBodyProps) {
  const components: Components = {
    p: ({ children }) => (
      <p className="answer-body__paragraph">{highlightChildren(children, references, onReferenceSelect, 'p')}</p>
    ),
    li: ({ children }) => <li>{highlightChildren(children, references, onReferenceSelect, 'li')}</li>,
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className)
      if (!isBlock) {
        return (
          <code className="answer-body__inline-code" {...props}>
            {children}
          </code>
        )
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children }) => <pre className="answer-body__code-block">{children}</pre>,
  }

  return (
    <div className="answer-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
