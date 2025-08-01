/**
 * Cleans and formats document content for professional export
 * Removes markdown formatting and prepares content for different formats
 */
export function formatDocumentContent(content: string): string {
  if (!content) return ''

  let formattedContent = content

  // Remove markdown formatting
  formattedContent = formattedContent
    // Remove bold formatting (**text** -> text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic formatting (*text* -> text)
    .replace(/\*(.*?)\*/g, '$1')
    // Remove header formatting (# Header -> Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove code formatting (`code` -> code)
    .replace(/`([^`]+)`/g, '$1')
    // Remove strikethrough formatting (~~text~~ -> text)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove link formatting ([text](url) -> text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image formatting (![alt](url) -> alt)
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules (--- or ***)
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove blockquote formatting (> text -> text)
    .replace(/^>\s+/gm, '')
    // Remove list formatting (- item -> item)
    .replace(/^[-*+]\s+/gm, '')
    // Remove numbered list formatting (1. item -> item)
    .replace(/^\d+\.\s+/gm, '')
    // Remove emphasis formatting (_text_ -> text)
    .replace(/_(.*?)_/g, '$1')
    // Remove strong emphasis formatting (__text__ -> text)
    .replace(/__(.*?)__/g, '$1')

  // Clean up extra whitespace
  formattedContent = formattedContent
    // Remove multiple consecutive newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace from lines
    .split('\n').map(line => line.trim()).join('\n')
    // Remove leading/trailing whitespace from entire content
    .trim()

  return formattedContent
}

/**
 * Splits content into paragraphs for better document structure
 */
export function splitIntoParagraphs(content: string): string[] {
  return content
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
}

/**
 * Extracts title from document content (first non-empty line)
 */
export function extractTitle(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return 'Document'
}

/**
 * Formats content for PDF with proper spacing and structure
 */
export function formatForPDF(content: string): string {
  const paragraphs = splitIntoParagraphs(content)
  return paragraphs.join('\n\n')
}

/**
 * Formats content for DOCX with proper structure
 */
export function formatForDOCX(content: string): string[] {
  return splitIntoParagraphs(content)
}

/**
 * Formats content for TXT with clean formatting
 */
export function formatForTXT(content: string): string {
  return formatDocumentContent(content)
} 