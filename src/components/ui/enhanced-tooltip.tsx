import * as React from "react"
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
  Side,
  useClick
} from "@floating-ui/react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: Side
  sideOffset?: number
  className?: string
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  mobile?: 'hover' | 'click' | 'disabled'
  arrowColor?: string
}

export function EnhancedTooltip({
  children,
  content,
  side = "top",
  sideOffset = 8,
  className,
  delayDuration = 400,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  mobile = 'click',
  arrowColor
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const arrowRef = React.useRef(null)
  const isMobile = React.useMemo(() => 
    typeof window !== 'undefined' && window.innerWidth < 768
  , [])

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: side,
    middleware: [
      offset(sideOffset),
      flip({
        crossAxis: true,
        fallbackAxisSideDirection: "start",
        padding: 8
      }),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
        padding: 8
      })
    ],
    whileElementsMounted: autoUpdate,
  })

  // Use different interactions based on mobile preference
  const hover = useHover(context, {
    move: false,
    enabled: !isMobile || mobile === 'hover',
    delay: { open: delayDuration, close: 100 },
  })

  const focus = useFocus(context, {
    enabled: !isMobile || mobile !== 'disabled'
  })

  const dismiss = useDismiss(context)

  const role = useRole(context, { role: "tooltip" })

  const click = useClick(context, {
    enabled: isMobile && mobile === 'click'
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
    ...(isMobile && mobile === 'click' ? [click] : [])
  ])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              "z-20 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-lg border border-border",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "max-w-xs break-words",
              className
            )}
            {...getFloatingProps()}
          >
            {content}
            <FloatingArrow
              ref={arrowRef}
              context={context}
              className={cn(
                "fill-popover [&>path:first-of-type]:stroke-border [&>path:last-of-type]:stroke-popover",
                arrowColor && `[&>path:last-of-type]:fill-${arrowColor}`
              )}
              strokeWidth={1}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

// Legacy tooltip wrapper for backward compatibility
interface TooltipWrapperProps {
  children: React.ReactNode
  content: string
  id?: string
  side?: Side
  mobile?: 'hover' | 'click' | 'disabled'
}

export const TooltipWrapper = ({ 
  children, 
  content, 
  id,
  side = "top",
  mobile = 'click'
}: TooltipWrapperProps) => {
  return (
    <EnhancedTooltip 
      content={content} 
      side={side}
      mobile={mobile}
    >
      {children}
    </EnhancedTooltip>
  )
}