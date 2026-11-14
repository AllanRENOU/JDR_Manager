import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter } from '@angular/router';

import { routes } from './app.routes';

@Component({ template: '' })
class Screen {}

/** Routes de l'application, chaque écran remplacé par un composant vide (pas de chargement). */
function withoutScreens(list: Route[]): Route[] {
  return list.map(({ loadComponent, ...route }) =>
    loadComponent ? { ...route, component: Screen } : route,
  );
}

describe('routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideRouter(withoutScreens(routes))] }),
  );

  it.each([
    ['/sounds', '/library'],
    ['/projects/p1/sounds', '/projects/p1/library'],
    ['/library', '/library'],
    ['/projects/p1/library', '/projects/p1/library'],
  ])('%s mène à %s (bibliothèque, lot 12 ter)', async (url, expected) => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    expect(router.url).toBe(expected);
  });
});
