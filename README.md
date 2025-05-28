# Pizza Maluca – Jogo de Tabuleiro Online

## Temática

**Pizza Maluca** é um jogo de tabuleiro online com temática de pizzaria, onde os jogadores competem para montar uma pizza completa coletando ingredientes e enfrentando eventos aleatórios enquanto avançam pelo tabuleiro.

---

## Descrição do Funcionamento

- Os jogadores entram em uma sala online e aguardam no lobby até que todos estejam prontos.
- O jogo começa e cada jogador, em sua vez, rola um dado para avançar no tabuleiro de 10 casas.
- Ao cair em casas especiais, o jogador pode:
  - Coletar ingredientes (casa de ingrediente)
  - Enfrentar um evento aleatório (casa de evento)
- Para vencer, o jogador deve:
  - Chegar exatamente na casa 10 **e**
  - Ter coletado 6 ingredientes diferentes
- Se chegar na casa 10 sem os 6 ingredientes, volta para o início do tabuleiro.
- O jogo exibe o vencedor e permite reiniciar a partida.

---

## Estruturas de Dados Utilizadas

### Listas
- **Jogadores**: O estado dos jogadores em cada sala é mantido em uma lista (array), permitindo acesso rápido por índice e iteração para atualização de posições, ingredientes e turnos.
- **Ingredientes**: Cada jogador possui uma lista de ingredientes coletados.
- **Tabuleiro**: O tabuleiro é representado por uma lista de casas, cada uma podendo ser normal, ingrediente ou evento.

#### Justificativa
- **Listas** são ideais para armazenar jogadores e ingredientes, pois permitem acesso direto, inserção e remoção eficientes para o tamanho do jogo.

---

## Análise de Complexidade (Big O)

### Operação Crítica: Adicionar Ingrediente ao Jogador

- **Código:**
  - `player.ingredients.push(novoIngrediente);`
- **Estrutura:** Lista (Array)
- **Complexidade:** O(1) (tempo constante)
- **Justificativa:**
  - A operação de adicionar um elemento ao final de um array em JavaScript/TypeScript é, em média, O(1), pois não depende do tamanho da lista. Isso garante que a coleta de ingredientes seja eficiente mesmo com muitos jogadores ou ingredientes.

---

## Instruções para Executar o Jogo

### Pré-requisitos
- Node.js (v18+ recomendado)
- npm (v9+ recomendado)

### Passos

1. **Clone o repositório e acesse a pasta do projeto:**
   ```sh
   git clone <repo-url>
   cd A3EstDados
   ```
2. **Instale as dependências do backend:**
   ```sh
   cd backend
   npm install
   ```
3. **Inicie o backend:**
   ```sh
   npm start
   ```
   O backend estará disponível em http://localhost:3001

4. **Instale as dependências do frontend:**
   ```sh
   cd ../frontend/pizza-maluca-frontend
   npm install
   ```
5. **Inicie o frontend:**
   ```sh
   npm run dev
   ```
   O frontend estará disponível em http://localhost:5173

6. **Acesse o jogo:**
   - Abra o navegador e acesse http://localhost:5173
   - Crie uma sala, entre com outro jogador e divirta-se!

---

**Observação:**
- O jogo pode ser jogado em dois navegadores diferentes ou em dispositivos distintos para simular múltiplos jogadores.
- Para reiniciar uma partida, basta clicar em "Reiniciar" ao final do jogo.
