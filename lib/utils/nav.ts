/** Estado ativo por prefixo: /trilhas/42 mantém "Trilhas" ativo. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
