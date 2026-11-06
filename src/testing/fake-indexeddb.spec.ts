import 'fake-indexeddb/auto';

/** Vérifie que fake-indexeddb est disponible pour les tests de la couche de données (TEC-81). */
describe('fake-indexeddb', () => {
  it('permet d’ouvrir une base IndexedDB en test', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('test-db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('items', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(db.objectStoreNames.contains('items')).toBe(true);
    db.close();
  });
});
