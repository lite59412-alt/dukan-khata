// Simple standalone vector QR-Code visual generator for Staff ID Badges and Attendance Scan
export function generateQrMatrix(text: string, size: number = 21): boolean[][] {
  // Initialize matrix
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Helper to draw finder pattern (7x7 with 3x3 solid center)
  const drawFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) // Inner 3x3 solid block
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  // Top-left finder
  drawFinderPattern(0, 0);
  // Top-right finder
  drawFinderPattern(size - 7, 0);
  // Bottom-left finder
  drawFinderPattern(0, size - 7);

  // Timing patterns (horizontal and vertical alternating line at index 6)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Generate deterministic pseudo-random bits based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  // Fill remaining data areas
  let seed = Math.abs(hash) + 1337;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finders
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        matrix[r][c] = pseudoRandom() > 0.45;
      }
    }
  }

  return matrix;
}
