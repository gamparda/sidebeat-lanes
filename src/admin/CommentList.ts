import type { ChartComment } from '../core/types';

interface CommentListOptions {
  list: HTMLOListElement;
  getComments: () => ChartComment[];
  removeComment: (index: number) => void;
  onJump: (time: number) => void;
  onChange: () => void;
}

export class CommentList {
  constructor(private readonly options: CommentListOptions) {}

  bind(): void {
    this.options.list.addEventListener('click', (event) => {
      const remove = (event.target as Element).closest<HTMLButtonElement>('[data-remove-comment]');
      if (remove) { this.options.removeComment(Number(remove.dataset.removeComment)); this.options.onChange(); return; }
      const jump = (event.target as Element).closest<HTMLButtonElement>('[data-jump-comment]');
      if (jump) this.options.onJump(Number(jump.dataset.jumpComment));
    });
  }

  render(): void {
    this.options.list.replaceChildren();
    this.options.getComments().forEach((comment, index) => {
      const row = document.createElement('li');
      const remove = document.createElement('button');
      remove.dataset.removeComment = String(index);
      remove.textContent = '×';
      const jump = document.createElement('button');
      jump.dataset.jumpComment = String(comment.time);
      jump.textContent = `${(comment.time / 1000).toFixed(2)}s`;
      const text = document.createElement('span');
      text.textContent = comment.text;
      row.append(remove, jump, text);
      this.options.list.append(row);
    });
  }
}
