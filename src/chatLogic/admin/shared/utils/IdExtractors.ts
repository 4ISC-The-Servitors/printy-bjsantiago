// ID extraction utilities for all chat flows

export function extractOrderIds(text: string): string[] {
  const out: string[] = [];
  const re = /\bORD-\d+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

export function extractServiceCodes(text: string): string[] {
  const out: string[] = [];
  const re = /\bSRV-[A-Z0-9]+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

export function extractTicketIds(text: string): string[] {
  const out: string[] = [];
  const re = /\bTCK-\d+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

export function extractIds(
  text: string,
  type: 'order' | 'service' | 'ticket'
): string[] {
  switch (type) {
    case 'order':
      return extractOrderIds(text);
    case 'service':
      return extractServiceCodes(text);
    case 'ticket':
      return extractTicketIds(text);
    default:
      return [];
  }
}
