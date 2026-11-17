# SPECTRA-AXIS — Fase 0: consolidação dimensional

## Baseline preservada

- Commit visual de origem: `1e68a74e34e63c7a7c5f2cf7aa608e245e69bdbb`
- Branch de trabalho: `fase-0-consolidacao-dimensional`
- A baseline `main` não foi alterada.
- Nenhuma malha, material, iluminação, câmera ou posição local de componente foi redesenhada nesta fase.

## Convenção de coordenadas

- X: longitudinal (proa–popa)
- Y: vertical (inferior–superior)
- Z: transversal (boreste–bombordo)

## Medição anterior à padronização

A medição foi executada no Chromium com `THREE.Box3().setFromObject(window.__spectraRoot)`.

| Eixo | Bounding box anterior |
|---|---:|
| X | 160,000000 m |
| Y | 43,750377 m |
| Z | 96,000000 m |

O painel antigo mostrava 160 × 96 × 48 m, mas a altura efetivamente renderizada era 43,750377 m. A escala raiz antiga era [1, 1,28, 1]. O envelope local medido antes de qualquer escala é, portanto, 160 × 34,179982 × 96 unidades de modelo.

## Envelope oficial

- Comprimento (X): 250 m
- Altura (Y): 80 m
- Largura (Z): 120 m

## Transformação aplicada

O grupo raiz `root` contém todos os grupos de subsistemas (`hull`, `bridge`, `egas`, `propulsion`, `radiators`, `habitat`, `field`, `antenna`, `landing`, `power`, `interior`). A padronização é aplicada somente em `root.scale`; as geometrias locais, relações de hierarquia e offsets internos permanecem intactos.

A escala absoluta é calculada a partir da bounding box local efetivamente medida:

- X: 250 / 160 = 1,562500
- Y: 80 / 34,179982 = 2,340551
- Z: 120 / 96 = 1,250000

Em relação à escala raiz anterior [1, 1,28, 1], os multiplicadores relativos são [1,562500; 1,828555; 1,250000]. A escala não uniforme no eixo Y é necessária porque a altura renderizada da baseline não correspondia aos 48 m declarados na interface. Nenhuma peça individual foi escalada.

## Interface, câmera e navegação

Os controles dimensionais e a telemetria iniciam em 250 × 120 × 80 m. O botão de restauração retorna a esses valores. A câmera geral já calcula o enquadramento a partir da bounding box do grupo raiz; a rotina de dimensões invalida o cache antes do enquadramento. Os limites de órbita são recalculados pela rotina de câmera com base no tamanho atual da nave.

As dimensões locais codificadas nas funções geométricas (por exemplo, perfil do casco e posições de módulos) continuam sendo coordenadas internas do modelo, não um segundo envelope físico independente.

## Diagnóstico independente

Após aplicar a escala, `setDims()` publica `window.__spectraRuntimeMetrics`, incluindo convenção dos eixos, envelope local, escala raiz, bounding box mundial, envelope renderizado e `envelopeMatches`. O teste de navegador verifica os três valores da interface e compara a bounding box real com 250 × 120 × 80 m, com tolerância de 0,01 m.

## Evidência de baseline anterior

A execução pré-alteração no Chromium (run `44161643425`) produziu sete capturas e registrou:
- canvas WebGL: 1018 × 740
- inicialização: 744 ms
- controles de câmera, visibilidade EGAS, seleção/ocultação/restauração de componente e modo de corte: aprovados
- bounding box real: 160 × 43,750377 × 96 m (X × Y × Z)

Artefato: [baseline — sete perspectivas](https://github.com/EHNOIXX/projeto-192-nuclear-simulator/actions/runs/44161643425/artifacts/14364030802)

A validação pós-alteração será anexada a esta documentação após a execução do workflow.
