// EMVCo QR Code generator for PromptPay (Standard Thai QR Payment)

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let c = data.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function f(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean phone number or national ID
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let formattedTarget = '';
  let subTag = '01'; // 01 for mobile, 02 for national ID

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile phone: 0812345678 -> 0066812345678
    formattedTarget = `0066${cleanTarget.substring(1)}`;
    subTag = '01';
  } else if (cleanTarget.length === 13) {
    // Citizen ID or Tax ID
    formattedTarget = cleanTarget;
    subTag = '02';
  } else {
    formattedTarget = cleanTarget;
  }

  // Tag 29: AID + Target
  const aid = f('00', 'A000000677010111');
  const recipient = f(subTag, formattedTarget);
  const tag29 = f('29', `${aid}${recipient}`);

  let payload = 
    f('00', '01') + // Format indicator
    f('01', amount ? '12' : '11') + // 11 = static, 12 = dynamic
    tag29 +
    f('53', '764') + // Country Currency THB (764)
    f('58', 'TH'); // Country code

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += f('54', formattedAmount);
  }

  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}
