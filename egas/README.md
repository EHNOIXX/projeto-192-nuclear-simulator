# EGAS 3D — Laboratório conceitual

Este diretório contém uma visualização 3D educacional do conceito EGAS, integrado ao projeto S.P.E.C.T.R.A.

## Abrir

Com GitHub Pages habilitado para a branch `main` e a pasta `/(root)`, o endereço será:

https://ehnoixx.github.io/projeto-192-nuclear-simulator/egas/

## Recursos da versão 0.2

- Modelo 3D com materiais físicos de renderização, iluminação, sombras, ambiente e pós-processamento.
- Câmera orbital com zoom, presets frontal, lateral, superior e isométrico.
- Seleção de componentes por clique e pela lista.
- Visibilidade independente das camadas.
- Vista explodida para observar a organização visual dos módulos.
- Corte transversal ajustável para inspecionar o interior do conjunto.
- Órbita automática, centralização e modo de tela cheia.
- Ajustes visuais de comprimento, diâmetro e transparência em tempo real.
- Comparação conceitual de materiais e ficha de componentes.
- Salvamento local da configuração e exportação de ficha em JSON.
- Captura de imagem PNG do viewport.

## Controles

- Arraste: orbitar a câmera.
- Roda do mouse: aproximar ou afastar.
- Clique em um componente: selecionar.
- Vista explodida: separar visualmente as camadas.
- Corte transversal: habilitar o plano de corte e ajustar sua posição.
- Salvar configuração: guardar preferências neste navegador.
- Exportar ficha: baixar a configuração e os dados descritivos em JSON.

## Limites científicos

O elemento de número atômico 192 não foi descoberto ou sintetizado. A arquitetura EGAS é especulativa. As geometrias, dimensões, materiais atribuídos e efeitos visuais são recursos didáticos; não representam parâmetros de fabricação, desempenho, segurança, compatibilidade ou viabilidade. O índice qualitativo de compatibilidade é uma heurística ilustrativa, não validada e não substitui análise de engenharia.

A aparência metálica, os brilhos, os volumes luminosos e o corte gráfico são efeitos de renderização. Não indicam plasma real, confinamento de partículas, geração de energia ou empuxo.

## Dependências

Three.js 0.160.0, OrbitControls e módulos de pós-processamento carregados via CDN. É necessária conexão com a internet para carregar bibliotecas e fontes.
