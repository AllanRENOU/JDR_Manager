import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MarkdownPipe } from './markdown-pipe';

@Component({
  imports: [MarkdownPipe],
  template: `<div class="app-markdown" [innerHTML]="text | markdown"></div>`,
})
class Host {
  text = '**Attention** <script>alert(1)</script><img src="x" onerror="alert(1)">';
}

describe('MarkdownPipe', () => {
  it('affiche le Markdown interprété et assaini par Angular', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const div = fixture.nativeElement.querySelector('.app-markdown') as HTMLElement;
    expect(div.querySelector('strong')?.textContent).toBe('Attention');
    expect(div.querySelector('script')).toBeNull();
    expect(div.querySelector('img')?.getAttribute('onerror')).toBeNull();
  });
});
