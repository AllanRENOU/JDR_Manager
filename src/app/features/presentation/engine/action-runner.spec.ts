import { anAction } from '../../../../testing/data-builders';
import { Action, AddTextElement } from '../../../core/models';
import { ActionContext, ActionRunner } from './action-runner';

describe('ActionRunner (4.6)', () => {
  const runner = new ActionRunner();

  function recorder() {
    const texts: string[] = [];
    const context: ActionContext = { addText: (_action, element) => texts.push(element.text) };
    return { texts, context };
  }

  const text = (id: string, value: string): AddTextElement => ({
    id,
    type: 'add-text',
    text: value,
  });

  it('exécute les éléments « Ajouter un texte » dans l’ordre', async () => {
    const action = anAction('s1', { elements: [text('e1', 'Un'), text('e2', 'Deux')] });
    const { texts, context } = recorder();
    await runner.run(action, context, new AbortController().signal);
    expect(texts).toEqual(['Un', 'Deux']);
  });

  it('ignore pour l’instant les autres types d’éléments', async () => {
    const action: Action = anAction('s1', {
      elements: [
        { id: 'w', type: 'wait', seconds: 5 },
        text('e1', 'Après l’attente'),
        { id: 'b', type: 'show-battlemap', battlemapId: 'carte' },
      ],
    });
    const { texts, context } = recorder();
    await runner.run(action, context, new AbortController().signal);
    expect(texts).toEqual(['Après l’attente']);
  });

  it('s’interrompt quand le signal est annulé (scène quittée)', async () => {
    const controller = new AbortController();
    const texts: string[] = [];
    const context: ActionContext = {
      addText: (_action, element) => {
        texts.push(element.text);
        controller.abort();
      },
    };
    const action = anAction('s1', { elements: [text('e1', 'Un'), text('e2', 'Deux')] });
    await expect(runner.run(action, context, controller.signal)).rejects.toThrow();
    expect(texts).toEqual(['Un']);
  });
});
