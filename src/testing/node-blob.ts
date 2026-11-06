import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

/**
 * Remplace `Blob` et `File` de jsdom par ceux de Node pendant chaque test du bloc courant.
 *
 * fake-indexeddb copie les valeurs avec le `structuredClone` de Node, qui ne sait pas copier
 * les `Blob` de jsdom (ils deviennent `{}`). Dans un vrai navigateur, ce problème n'existe pas.
 */
export function useNodeBlob(): void {
  const original = { Blob: globalThis.Blob, File: globalThis.File };

  beforeEach(() => {
    globalThis.Blob = NodeBlob as unknown as typeof Blob;
    globalThis.File = NodeFile as unknown as typeof File;
  });

  afterEach(() => {
    globalThis.Blob = original.Blob;
    globalThis.File = original.File;
  });
}
