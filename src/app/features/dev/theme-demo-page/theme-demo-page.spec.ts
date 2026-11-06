import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Theme } from '../../../core/theme/theme';
import { ThemeDemoPage } from './theme-demo-page';

describe('ThemeDemoPage', () => {
  let fixture: ComponentFixture<ThemeDemoPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeDemoPage, getTranslocoTestingModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeDemoPage);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('affiche les textes traduits', () => {
    const title = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(title.textContent).toContain('Démonstration des thèmes');
  });

  it('change de thème à la volée', async () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'mat-button-toggle button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(2);

    buttons[1].click();
    await fixture.whenStable();

    expect(TestBed.inject(Theme).theme()).toBe('automne');
    expect(document.documentElement.getAttribute('data-theme')).toBe('automne');
  });
});
