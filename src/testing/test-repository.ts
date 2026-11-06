import 'fake-indexeddb/auto';

import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { deleteDB } from 'idb';

import { DATA_REPOSITORY } from '../app/core/data/data-repository';
import { INDEXED_DB_NAME, IndexedDbRepository } from '../app/core/data/indexed-db-repository';

/**
 * Dépôt IndexedDB réel sur fake-indexeddb, avec une base neuve pour chaque test.
 * À utiliser dans les tests d'écrans : `providers: [...useTestRepository()]`, puis
 * `TestBed.inject(DATA_REPOSITORY)` pour préparer ou vérifier les données.
 */
export function useTestRepository(): Provider[] {
  const name = `jdr-test-${crypto.randomUUID()}`;
  afterEach(async () => {
    await TestBed.inject(IndexedDbRepository).close();
    await deleteDB(name);
  });
  return [
    { provide: INDEXED_DB_NAME, useValue: name },
    { provide: DATA_REPOSITORY, useExisting: IndexedDbRepository },
  ];
}
