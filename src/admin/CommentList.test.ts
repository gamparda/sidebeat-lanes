import { afterEach, expect, test, vi } from 'vitest';
import { CommentList } from './CommentList';

afterEach(() => vi.unstubAllGlobals());

test('comment markup stays inert plain text and does not alter persisted text', () => {
  class Element {
    children: Element[] = [];
    dataset: Record<string, string> = {};
    textContent = '';
    constructor(public tagName: string) {}
    append(...elements: Element[]) { this.children.push(...elements); }
    replaceChildren() { this.children = []; }
    set innerHTML(_value: string) { throw new Error('Comment rendering must never parse HTML.'); }
  }
  vi.stubGlobal('document', { createElement: (tag: string) => new Element(tag) });
  const maliciousText = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
  const storedComment = { time: 1200, text: maliciousText, createdAt: 1 };
  const list = new Element('ol');
  new CommentList({ list: list as unknown as HTMLOListElement, getComments: () => [storedComment], removeComment() {}, onJump() {}, onChange() {} }).render();
  expect(list.children).toHaveLength(1);
  expect(list.children[0].children.map(child => child.tagName)).toEqual(['button', 'button', 'span']);
  expect(list.children[0].children[2].textContent).toBe(maliciousText);
  expect(storedComment.text).toBe(maliciousText);
});
