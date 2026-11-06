/** Nom par défaut d'un média importé : nom du fichier sans son extension. */
export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return (dot > 0 ? fileName.slice(0, dot) : fileName).trim() || fileName;
}
