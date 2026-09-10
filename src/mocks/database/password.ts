export function hashPassword(password: string) {
  let hash = 5381;

  for (const character of password) {
    hash = Math.imul(hash, 33) ^ character.charCodeAt(0);
  }

  return (hash >>> 0).toString(36);
}
