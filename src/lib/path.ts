export function getHouseholdIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/households\/([^/]+)/);
  return match ? match[1] : null;
}
