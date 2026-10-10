import { describe, expect, it } from "vitest";

import { imageSize, sniffImage } from "./image";

const png = (w: number, h: number) => {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const v = new DataView(b.buffer);
  v.setUint32(16, w);
  v.setUint32(20, h);
  return b;
};

describe("sniffImage", () => {
  it("recognises PNG, JPEG and WebP by their bytes", () => {
    expect(sniffImage(png(1, 1))).toBe("image/png");
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(sniffImage(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });

  it("rejects anything else, whatever it claims to be", () => {
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("GIF89a......"))).toBeNull();
    expect(sniffImage(new Uint8Array([0xff]))).toBeNull();
  });
});

describe("imageSize", () => {
  it("reads PNG dimensions from the header", () => {
    expect(imageSize(png(1600, 900), "image/png")).toEqual({ width: 1600, height: 900 });
  });

  it("returns null instead of throwing on truncated files", () => {
    expect(imageSize(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg")).toBeNull();
  });
});
