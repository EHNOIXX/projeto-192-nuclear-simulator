# SPECTRA-AXIS — Fase 1: casco principal experimental

## Baseline protegida
- Baseline visual restaurada: `1e68a74e34e63c7a7c5f2cf7aa608e245e69bdbb`.
- Branch experimental: `reconstrucao-geometrica-controlada`.
- A baseline não é alterada; toda a intervenção desta fase está nesta branch.

## Referência geométrica
A prancha oficial anexada à conversa mostra seis projeções ortográficas (direita, esquerda, frontal, traseira, superior e inferior). A sétima imagem de comparação é uma perspectiva isométrica do simulador, pois a prancha fornecida não contém uma sétima projeção isométrica independente.

## Convenção de coordenadas
- **X**: longitudinal; proa em X negativo, popa em X positivo.
- **Y**: vertical; dorsal positivo, ventral negativo.
- **Z**: transversal; estibordo positivo, bombordo negativo.
- O eixo longitudinal central é X; a seção transversal é o plano YZ.

## Envelope de referência
A prancha do projeto informa 2.500 m de comprimento, 1.200 m de largura e 800 m de altura como envelope conceitual. O modelo mantém coordenadas locais normalizadas e aplica o envelope físico por escala anisotrópica do grupo `root`. Os controles agora iniciam em 2.500 × 1.200 × 800 m. A escala é calculada a partir da bounding box medida dos grupos de subsistemas montados (excluindo as etiquetas ocultas), e não mais por denominadores fixos presumidos. `setDims()` publica `window.__spectraRuntimeMetrics`, contendo configuração, envelope renderizado e bounding box mundial do casco principal.

## Método do casco experimental
A malha principal passa a usar uma superfície paramétrica por estações longitudinais:
- tabela normalizada de semi-largura e semi-altura;
- interpolação cúbica entre estações;
- seção transversal superelíptica, achatada no eixo vertical e mais cheia nos ombros;
- proa com redução progressiva até o eixo;
- corpo central largo;
- fechamento da popa numa seção final de largura e altura finitas.

A cadeia efetiva é: `hullSurface()` chama `primaryHullGeometry()`, recebe o `THREE.Mesh` por `add()`, que o insere em `groups.hull`; `groups.hull` é filho de `root`, adicionado diretamente à cena. O objeto fica identificado como `primary_pressure_hull` e expõe `window.__spectraHullBuilder`, `window.__spectraHullMeshName` e `window.__spectraHullMesh`. Não há substituição posterior desse objeto por `axisHullGeometry()`. Somente a malha `primary_pressure_hull` e os pontos de ancoragem dos acabamentos apoiados diretamente na sua superfície usam o novo perfil. Pods laterais, ponte, radiadores, propulsores, interiores, E-192, hierarquia e controles permanecem na baseline. A geometria antiga `axisHullGeometry` continua sendo utilizada pelos elementos que já a compartilhavam.

## Limites da leitura da prancha
A imagem fornecida é uma prancha conceitual renderizada, não um desenho vetorial cotado. As estações são uma parametrização experimental inferida visualmente, não coordenadas de engenharia extraídas de CAD. A aprovação depende da inspeção das capturas e das sobreposições.


## Verificação de execução
A validação em navegador compara baseline e branch experimental com as mesmas sete câmeras. Na versão de diagnóstico, um marcador ciano temporário identifica visualmente o casco experimental; o script verifica a identidade do construtor, o marcador, os valores da interface e a correspondência entre o envelope configurado e a bounding box mundial medida. O marcador deve ser removido após a captura de validação.
