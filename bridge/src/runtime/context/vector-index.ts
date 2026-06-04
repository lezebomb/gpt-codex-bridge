export class VectorIndex {
  readonly enabled = false;

  status() {
    return { enabled: false, provider: "none", note: "Vector retrieval is intentionally stubbed for now." };
  }
}
