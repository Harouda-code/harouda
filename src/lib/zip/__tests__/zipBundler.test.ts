import { describe, it, expect } from "vitest";
import {
  createZipFromFiles,
  readZipToFiles,
} from "../zipBundler";

function bytesOf(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe("zipBundler", () => {
  it("createZipFromFiles erzeugt einen Blob vom Typ application/zip", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("hello.txt", bytesOf("hallo"));
    const blob = await createZipFromFiles(files);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("Round-trip: Inhalt nach ZIP+Unzip identisch", async () => {
    const src = new Map<string, Uint8Array>();
    src.set("INDEX.XML", bytesOf("<DataSet />"));
    src.set("BUCHUNGEN.CSV", bytesOf('"Kol1";"Kol2"\r\n"a";"b"\r\n'));
    src.set("MANIFEST.XML", bytesOf("<Manifest/>"));

    const blob = await createZipFromFiles(src);
    const extracted = await readZipToFiles(blob);

    expect(extracted.size).toBe(src.size);
    for (const [name, bytes] of src) {
      const got = extracted.get(name);
      expect(got).toBeDefined();
      expect(new TextDecoder().decode(got!)).toBe(new TextDecoder().decode(bytes));
    }
  });

  it("Compression DEFLATE reduziert Größe bei komprimierbarem Input", async () => {
    const repetitive = "ABCD".repeat(2000); // hochkomprimierbar
    const src = new Map<string, Uint8Array>();
    src.set("big.txt", bytesOf(repetitive));
    const blob = await createZipFromFiles(src, { compression: "DEFLATE" });
    // ZIP-Overhead ~100 B, Input 8000 B → ZIP < 1000 B
    expect(blob.size).toBeLessThan(1000);
  });

  it("Compression STORE speichert unverändert (größer als DEFLATE bei Redundanz)", async () => {
    const repetitive = "ABCD".repeat(2000);
    const src = new Map<string, Uint8Array>();
    src.set("big.txt", bytesOf(repetitive));
    const stored = await createZipFromFiles(src, { compression: "STORE" });
    const deflated = await createZipFromFiles(src, { compression: "DEFLATE" });
    expect(stored.size).toBeGreaterThan(deflated.size);
  });

  it("Leere Map → gültiges aber leeres ZIP", async () => {
    const blob = await createZipFromFiles(new Map());
    expect(blob.size).toBeGreaterThan(0); // ZIP end-of-central-directory
    const extracted = await readZipToFiles(blob);
    expect(extracted.size).toBe(0);
  });
});
