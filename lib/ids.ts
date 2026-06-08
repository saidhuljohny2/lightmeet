export function createMeetingId() {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${random[0].toString(36)}-${random[1].toString(36)}`.slice(0, 15);
}

export function createPeerId() {
  return crypto.randomUUID();
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";
}
