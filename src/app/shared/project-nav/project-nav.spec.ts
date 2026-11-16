import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { ProjectNav } from './project-nav';

@Component({ template: '<app-project-nav projectId="p1" />', imports: [ProjectNav] })
class Host {}

describe('ProjectNav', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideRouter([
          { path: 'projects/:projectId/edit', component: Host },
          { path: 'projects/:projectId/sheets', component: Host },
          { path: 'projects/:projectId/library', component: Host },
        ]),
      ],
    });
  });

  it('mène aux scènes, aux fiches et à la bibliothèque du projet et signale la page active', async () => {
    const harness = await RouterTestingHarness.create('/projects/p1/library');
    const links = [...harness.routeNativeElement!.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Scènes', '/projects/p1/edit'],
      ['Fiches', '/projects/p1/sheets'],
      ['Bibliothèque', '/projects/p1/library'],
    ]);
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([null, null, 'page']);
  });
});
