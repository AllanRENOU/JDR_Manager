import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { SoundName } from './sound-name';

describe('SoundName', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [SoundName, getTranslocoTestingModule()] }),
  );

  async function render(editing: boolean) {
    const fixture = TestBed.createComponent(SoundName);
    fixture.componentRef.setInput('name', 'Pluie');
    fixture.componentRef.setInput('editing', editing);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    await fixture.whenStable();
    return { fixture, el };
  }

  it('clic sur le nom : demande le renommage', async () => {
    const { fixture, el } = await render(false);
    const requested = vi.fn();
    fixture.componentInstance.renameRequested.subscribe(requested);
    const name = el.querySelector<HTMLButtonElement>('.sound__name')!;
    expect(name.textContent?.trim()).toBe('Pluie');
    expect(el.querySelector('.sound__rename')).toBeNull();
    name.click();
    expect(requested).toHaveBeenCalled();
    el.remove();
  });

  it('renommage : le nom reste en place (masqué) sous le champ, qui prend le focus', async () => {
    const { el } = await render(true);
    const name = el.querySelector('.sound__name')!;
    const field = el.querySelector<HTMLInputElement>('.sound__rename')!;
    expect(name.classList).toContain('sound__name--editing');
    expect(field.value).toBe('Pluie');
    expect(document.activeElement).toBe(field);
    el.remove();
  });

  it('Entrée, sortie du champ et Échap sont transmis à l’écran', async () => {
    const { fixture, el } = await render(true);
    const committed = vi.fn();
    const cancelled = vi.fn();
    fixture.componentInstance.committed.subscribe(committed);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    const field = el.querySelector<HTMLInputElement>('.sound__rename')!;
    field.value = 'Pluie fine';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(committed).toHaveBeenLastCalledWith('Pluie fine');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelled).toHaveBeenCalled();
    field.dispatchEvent(new FocusEvent('blur'));
    expect(committed).toHaveBeenCalledTimes(2);
    el.remove();
  });
});
