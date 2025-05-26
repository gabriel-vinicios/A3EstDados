// Representa um pedido de pizza, com id e lista de ingredientes
export interface Order { id: string; ingredients: string[]; }
// Representa uma carta de evento, com descrição e impacto na pontuação
export interface EventCard { id: string; description: string; impact: number; }
// Representa o estado de um jogador (id, nome e pontuação)
export interface PlayerState { id: string; name: string; score: number; }