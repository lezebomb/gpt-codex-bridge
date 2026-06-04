import { MAX_CONTEXT_PACK_INLINE_CHARS } from "../../config.js";
import { summarizeText, truncateText } from "../../lib/common.js";

export function formatContextPackFile(input: { filePath: string; content: string; explicitFullRead?: boolean }) {
  if (input.explicitFullRead || input.content.length <= MAX_CONTEXT_PACK_INLINE_CHARS) {
    return {
      filePath: input.filePath,
      mode: "inline" as const,
      content: input.content
    };
  }
  return {
    filePath: input.filePath,
    mode: "summary" as const,
    summary: summarizeText(input.content, 500),
    snippet: truncateText(input.content, MAX_CONTEXT_PACK_INLINE_CHARS),
    suggestedReadRange: "Use read_file when you need the full file."
  };
}
