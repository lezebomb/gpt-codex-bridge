export class SymbolIndex {
  readonly enabled = false;

  status() {
    return { enabled: false, provider: "none", note: "Tree-sitter symbol indexing is reserved for a later iteration." };
  }
}
