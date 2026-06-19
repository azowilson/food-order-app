export const DEMO_USERNAMES = ['maya', 'jordan', 'sam', 'priya']

export function getUserDisplayName(username: string): string {
  const names: Record<string, string> = {
    maya: 'Maya',
    jordan: 'Jordan',
    sam: 'Sam',
    priya: 'Priya',
  }
  return names[username.toLowerCase()] ?? username
}

export function getUserInitials(username: string): string {
  const initials: Record<string, string> = {
    maya: 'MY',
    jordan: 'JO',
    sam: 'SA',
    priya: 'PR',
  }
  return initials[username.toLowerCase()] ?? username.slice(0, 2).toUpperCase()
}

export function getMemberDisplayNames(usernames: string[]): string[] {
  return usernames.map(getUserDisplayName)
}
