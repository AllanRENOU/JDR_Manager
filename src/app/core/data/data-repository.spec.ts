import { TestBed } from '@angular/core/testing';

import { appConfig } from '../../app.config';
import { DATA_REPOSITORY } from './data-repository';
import { IndexedDbRepository } from './indexed-db-repository';

describe('DATA_REPOSITORY', () => {
  it('est fourni par IndexedDbRepository dans la configuration de l’application (TEC-22)', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const repository = TestBed.inject(DATA_REPOSITORY);
    expect(repository).toBeInstanceOf(IndexedDbRepository);
    expect(repository).toBe(TestBed.inject(IndexedDbRepository));
  });
});
