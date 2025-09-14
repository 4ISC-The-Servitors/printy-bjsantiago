// Input validation utilities for all chat flows

export function isEndChat(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return lower === 'end chat' || lower === 'end';
}

export function isValidTextInput(input: string): boolean {
  return input.trim().length > 0;
}

// isValidPriceInput is imported from ../../../utils/shared

export function isValidServiceName(input: string): boolean {
  return input.trim().length > 0 && input.trim().length <= 100;
}

export function isValidCategory(input: string): boolean {
  return input.trim().length > 0 && input.trim().length <= 50;
}

export function isValidTicketReply(input: string): boolean {
  return input.trim().length > 0 && input.trim().length <= 1000;
}
