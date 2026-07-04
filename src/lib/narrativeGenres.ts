export interface NarrativeGenre {
  name: string
  detail: string | null
}

// narrative_types.example_genres looks like:
//   • 소설 (단편소설, 장편소설, ...)
//   • 드라마 및 영화 시나리오, 연극 희곡, 웹툰 콘티 및 시나리오
// Each bullet line holds one or more comma-separated genres, and a genre may
// have a parenthetical list of sub-examples. Commas inside parentheses must
// not be treated as separators.
export function parseExampleGenres(exampleGenres: string): NarrativeGenre[] {
  const genres: NarrativeGenre[] = []

  const lines = exampleGenres
    .split('\n')
    .map((line) => line.replace(/^[•·-]\s*/, '').trim())
    .filter(Boolean)

  for (const line of lines) {
    const parts: string[] = []
    let depth = 0
    let current = ''

    for (const char of line) {
      if (char === '(') depth++
      if (char === ')') depth--

      if (char === ',' && depth === 0) {
        parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    if (current.trim()) parts.push(current.trim())

    for (const part of parts) {
      const match = part.match(/^(.+?)\s*\(([^)]+)\)$/)
      if (match) {
        genres.push({ name: match[1].trim(), detail: match[2].trim() })
      } else if (part) {
        genres.push({ name: part, detail: null })
      }
    }
  }

  return genres
}
