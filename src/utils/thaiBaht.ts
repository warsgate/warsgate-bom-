/**
 * Thai Baht Text Converter
 * Converts numeric amount to Thai currency reading (e.g. 101850 -> หนึ่งแสนหนึ่งพันแปดร้อยห้าสิบบาทถ้วน)
 */

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numStr: string): string {
  let result = '';
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i), 10);
    const unitPos = len - i - 1;
    if (digit !== 0) {
      if (unitPos === 1 && digit === 1) {
        result += 'สิบ';
      } else if (unitPos === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (unitPos === 0 && digit === 1 && len > 1 && numStr.charAt(len - 2) !== '0') {
        result += 'เอ็ด';
      } else {
        result += THAI_NUMBERS[digit] + THAI_UNITS[unitPos];
      }
    }
  }
  return result;
}

export function thaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'ศูนย์บาทถ้วน';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(2);
  const [bahtPart, satangPart] = fixed.split('.');

  let bahtStr = '';
  // Support up to millions and trillions
  let remainingBaht = bahtPart;
  const groups: string[] = [];

  while (remainingBaht.length > 0) {
    const start = Math.max(0, remainingBaht.length - 6);
    groups.unshift(remainingBaht.substring(start));
    remainingBaht = remainingBaht.substring(0, start);
  }

  for (let g = 0; g < groups.length; g++) {
    const groupText = convertGroup(groups[g]);
    if (groupText) {
      bahtStr += groupText;
      if (g < groups.length - 1) {
        bahtStr += 'ล้าน';
      }
    }
  }

  if (!bahtStr) bahtStr = 'ศูนย์';
  bahtStr += 'บาท';

  const satangInt = parseInt(satangPart, 10);
  if (satangInt === 0) {
    bahtStr += 'ถ้วน';
  } else {
    bahtStr += convertGroup(satangPart) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + bahtStr;
}
