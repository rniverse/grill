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
  // match.start (its offset in this text node) is a stable, content-derived
  // key — matches are non-overlapping, so it's unique within this node.
  for (const match of matches) {
    if (match.start > cursor) {
      pieces.push(node.slice(cursor, match.start))
    }
    pieces.push(
      <ReferenceBadge
        key={`${keyPrefix}-${match.start}`}
        label={node.slice(match.start, match.end)}
        onSelect={() => onReferenceSelect(match.reference)}
      />,
    )
    cursor = match.end
  }
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
  // index as key: childArray comes from react-markdown's parse of a fixed
  // text prop, so its order and length are deterministic across renders —
  // there's no reordering for the index to get out of sync with. A
  // content-derived key isn't safer here, since identical adjacent
  // substrings (a real, common case) would collide.
  return childArray.map((child, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: stable list, see comment above
    <Fragment key={index}>{highlightNode(child, references, onReferenceSelect, `${keyPrefix}-${index}`)}</Fragment>
  ))
}

export function AnswerBody({ text, references, onReferenceSelect }: AnswerBodyProps) {
  const components: Components = {
    p: ({ children }) => (
      <p className="answer-body__paragraph">{highlightChildren(children, references, onReferenceSelect, 'p')}</p>
    ),
    li: ({ children }) => <li>{highlightChildren(children, references, onReferenceSelect, 'li')}</li>,
    // Always render plain — a language-less fenced block has no className
    // either, so that was never a reliable block/inline signal (and was
    // misclassifying those as inline code). `pre code` in the CSS below
    // undoes the inline chip styling for code that's actually inside a
    // real fenced block; `node` is destructured out so it doesn't leak
    // into the DOM as a stray attribute via the {...props} spread.
    code: ({ className, children, node, ...props }) => (
      <code className={className ? `answer-body__inline-code ${className}` : 'answer-body__inline-code'} {...props}>
        {children}
      </code>
    ),
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
