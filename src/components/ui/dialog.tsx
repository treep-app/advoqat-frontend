import * as React from "react"
import * as RadixDialog from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

const Dialog = RadixDialog.Root
const DialogTrigger = RadixDialog.Trigger
const DialogPortal = RadixDialog.Portal
const DialogOverlay = React.forwardRef<React.ElementRef<typeof RadixDialog.Overlay>, React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all",
        className
      )}
      {...props}
    />
  )
)
DialogOverlay.displayName = RadixDialog.Overlay.displayName

const DialogContent = React.forwardRef<React.ElementRef<typeof RadixDialog.Content>, React.ComponentPropsWithoutRef<typeof RadixDialog.Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = RadixDialog.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<React.ElementRef<typeof RadixDialog.Title>, React.ComponentPropsWithoutRef<typeof RadixDialog.Title>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = RadixDialog.Title.displayName

const DialogDescription = React.forwardRef<React.ElementRef<typeof RadixDialog.Description>, React.ComponentPropsWithoutRef<typeof RadixDialog.Description>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = RadixDialog.Description.displayName

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} 