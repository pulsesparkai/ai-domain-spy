import * as React from "react"
import { cn } from "@/lib/utils"
import { LazyCodeBlock } from "@/components/lazy/LazyCodeBlock"

export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode
  code?: string
  language?: string
}

const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ className, children, code, language, ...props }, ref) => {
    // If code prop is provided, use the syntax-highlighted version
    if (code) {
      return <LazyCodeBlock code={code} language={language} className={className} />
    }
    
    // Otherwise, render as plain code block
    return (
      <pre
        ref={ref}
        className={cn(
          "code-block overflow-x-auto bg-muted p-4 rounded-lg text-sm",
          className
        )}
        {...props}
      >
        <code>{children}</code>
      </pre>
    )
  }
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }