export class Queue<T> {
  private data: T[] = [];
  enqueue(item: T) { this.data.push(item); }
  dequeue(): T | undefined { return this.data.shift(); }
  peek(): T | undefined { return this.data[0]; }
  size(): number { return this.data.length; }
}

export class Stack<T> {
  private data: T[] = [];
  push(item: T) { this.data.push(item); }
  pop(): T | undefined { return this.data.pop(); }
  size(): number { return this.data.length; }
}

export interface Order { id: string; ingredients: string[]; }
export interface EventCard { id: string; description: string; }