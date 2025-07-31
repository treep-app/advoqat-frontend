import { useEffect } from 'react'

export function useDocumentSecurity(isPaid: boolean) {
  useEffect(() => {
    if (isPaid) return // No security measures needed for paid documents

    const preventScreenshot = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.ctrlKey && e.key === 'p') || // Print
        (e.ctrlKey && e.key === 's') || // Save
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Developer tools
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Developer tools
        (e.ctrlKey && e.shiftKey && e.key === 'C') || // Developer tools
        (e.key === 'F12') || // Developer tools
        (e.ctrlKey && e.shiftKey && e.key === 'P') // Print dialog
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const preventSelection = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const preventDrag = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Add event listeners
    document.addEventListener('keydown', preventScreenshot)
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('selectstart', preventSelection)
    document.addEventListener('dragstart', preventDrag)

    // Disable text selection
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.mozUserSelect = 'none'
    document.body.style.msUserSelect = 'none'

    // Cleanup
    return () => {
      document.removeEventListener('keydown', preventScreenshot)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('selectstart', preventSelection)
      document.removeEventListener('dragstart', preventDrag)

      // Re-enable text selection
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
      document.body.style.mozUserSelect = ''
      document.body.style.msUserSelect = ''
    }
  }, [isPaid])
} 