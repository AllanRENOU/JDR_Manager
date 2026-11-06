import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ComponentsDemoPage } from './components-demo-page';

describe('ComponentsDemoPage', () => {
  it('affiche le catalogue des composants', async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentsDemoPage, getTranslocoTestingModule()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ComponentsDemoPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Composants partagés');
  });
});
