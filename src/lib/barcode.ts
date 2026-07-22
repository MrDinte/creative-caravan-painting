// Code 128 (subset B) encoder, written out rather than pulled from a package:
// it's a small, stable spec and this avoids a dependency for one screen.
//
// Every printed CCP label is a real Code 128 barcode, so any off-the-shelf
// scanner — or the phone scanner in this app — reads it back.

/** Bar/space widths for each Code 128 symbol, values 0–106. */
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

export interface BarcodeBar {
  x: number;
  width: number;
}

/**
 * Encodes ASCII 32–126 as Code 128B and returns the black bars to draw.
 * Returns null for anything outside that range rather than emitting a barcode
 * that scanners would read back as different text.
 */
export function encodeCode128(value: string): {
  bars: BarcodeBar[];
  totalWidth: number;
} | null {
  if (!value) return null;

  const codes: number[] = [START_B];
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126) return null;
    codes.push(code - 32);
  }

  // Checksum: start value plus each symbol weighted by position.
  let checksum = START_B;
  for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
  codes.push(checksum % 103);
  codes.push(STOP);

  const bars: BarcodeBar[] = [];
  let x = 0;
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    for (let i = 0; i < pattern.length; i++) {
      const width = Number(pattern[i]);
      // Even indices are bars, odd are spaces.
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { bars, totalWidth: x };
}

/**
 * Our own item codes. Sequential and readable, so a handwritten label still
 * makes sense if the printed barcode is damaged.
 */
export function nextCcpStockCode(existing: string[]): string {
  const nums = existing
    .map((c) => /^CCP-S-(\d+)$/.exec(c))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => Number(m[1]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CCP-S-${String(next).padStart(4, "0")}`;
}

/** Rejects obvious rubbish from a scanner without being fussy about format. */
export function isPlausibleBarcode(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 4 && trimmed.length <= 48 && !/\s/.test(trimmed);
}
