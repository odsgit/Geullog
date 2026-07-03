import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { JSONContent } from '@tiptap/react'

export function exportAsTxt(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `${filename}.txt`)
}

export async function exportAsDocx(filename: string, json: JSONContent) {
  const paragraphs = (json.content ?? []).map((node) => nodeToParagraph(node))
  const doc = new Document({
    sections: [{ children: paragraphs.length > 0 ? paragraphs : [new Paragraph({})] }],
  })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${filename}.docx`)
}

function nodeToParagraph(node: JSONContent): Paragraph {
  if (node.type === 'heading') {
    const level = node.attrs?.level ?? 1
    const heading =
      level === 1
        ? HeadingLevel.HEADING_1
        : level === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3
    return new Paragraph({ heading, children: textRuns(node.content) })
  }
  return new Paragraph({ children: textRuns(node.content) })
}

function textRuns(content?: JSONContent[]): TextRun[] {
  if (!content) return [new TextRun('')]
  return content
    .filter((node) => node.type === 'text')
    .map((node) => {
      const marks = node.marks ?? []
      return new TextRun({
        text: node.text ?? '',
        bold: marks.some((mark) => mark.type === 'bold'),
        italics: marks.some((mark) => mark.type === 'italic'),
      })
    })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
