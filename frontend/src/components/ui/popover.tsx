"use client"

import * as React from "react"
import { cn } from "@/utils/cn"

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerId: string
}

const PopoverContext = React.createContext<PopoverContextType | null>(null)

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Popover: React.FC<PopoverProps> = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const triggerId = React.useId()

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }, [isControlled, onOpenChange])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest(`[data-popover="${triggerId}"]`)) {
        setOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, setOpen, triggerId])

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen, triggerId }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const context = React.useContext(PopoverContext)

  return (
    <button
      ref={ref}
      data-popover={context?.triggerId}
      onClick={(e) => {
        context?.setOpen(!context.open)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(PopoverContext)

    if (!context?.open) return null

    return (
      <div
        ref={ref}
        data-popover={context.triggerId}
        className={cn(
          "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          top: `calc(100% + ${sideOffset}px)`,
          left: align === "start" ? "0" : align === "end" ? "auto" : "50%",
          right: align === "end" ? "0" : "auto",
          transform: align === "center" ? "translateX(-50%)" : undefined
        }}
        {...props}
      />
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }