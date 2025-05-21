// Fila genérica (Queue) para gerenciar elementos em ordem FIFO
export class Queue<T> {
  private data: T[] = [];
  // Adiciona um item ao final da fila
  enqueue(item: T) { this.data.push(item); }
  // Remove e retorna o primeiro item da fila
  dequeue(): T | undefined { return this.data.shift(); }
  // Retorna o primeiro item sem remover
  peek(): T | undefined { return this.data[0]; }
  // Retorna o tamanho da fila
  size(): number { return this.data.length; }
}

// Pilha genérica (Stack) para gerenciar elementos em ordem LIFO
export class Stack<T> {
  private data: T[] = [];
  // Adiciona um item ao topo da pilha
  push(item: T) { this.data.push(item); }
  // Remove e retorna o item do topo da pilha
  pop(): T | undefined { return this.data.pop(); }
  // Retorna o tamanho da pilha
  size(): number { return this.data.length; }
}

// Representa um pedido de pizza
export interface Order { id: string; ingredients: string[]; }
// Representa uma carta de evento
export interface EventCard { id: string; description: string; }