# SPECTRA-AXIS — Fase 1: integração paramétrica do casco

Branch experimental: `fase-1-integracao-casco`  
Baseline preservada: `b2a73c4b0d52a23cee1dda083eb1897d3bd0e65c`

## Convenção espacial

- X: longitudinal; proa em X negativo e popa em X positivo.
- Y: vertical; dorsal positivo e ventral negativo.
- Z: transversal; lados em Z negativo e positivo.
- Envelope físico de referência do conjunto: 250 m (X) × 120 m (Z) × 80 m (Y).

## Alteração geométrica da Fase 1

O objeto `primary_pressure_hull` passa a utilizar `spectraAxisHullGeometry`, uma superfície paramétrica por estações longitudinais e seções transversais.

- A proa utiliza expansão longitudinal mais gradual e afilamento contínuo.
- A seção central mantém a maior largura e recebe ombros laterais suaves integrados à própria superfície.
- A seção transversal utiliza expoentes diferentes nos eixos vertical e transversal, achatando dorsal e ventre.
- A popa mantém seção não nula e termina em fechamento transversal, formando uma região de integração para os três conjuntos propulsivos.
- As naceles laterais foram aproximadas e ampliadas para sobrepor parcialmente os ombros do casco, sem removê-las.

A função `axisHullGeometry` permanece disponível para os componentes secundários, evitando deformar ponte, núcleo e outras peças que reutilizam a geometria genérica.

## Referência de escala

A cena contém grade de 10 m, eixos X/Y/Z e régua visual de 50 m. A régua e os eixos são elementos de referência da cena, fora do grupo raiz da nave.

## Preservação

Não foram removidos grupos, componentes internos, propulsores, radiadores, núcleos E-192, controles de inspeção ou otimizações `InstancedMesh` existentes.

## Validação

O teste Playwright mede o bounding box mundial do grupo raiz e verifica a geometria ativa por nome, revisão, quantidade de vértices/índices e metadados. As sete vistas são capturadas pelo navegador. A branch é experimental; compatibilidade visual com a prancha depende de avaliação das capturas e não é declarada aprovada automaticamente.
