# Projeto 192 — Nuclear Physics Simulator

Laboratório web educacional para explorar estimativas teóricas relacionadas a um núcleo hipotético com número atômico Z=192.

## Publicação
1. O projeto usa GitHub Pages: abra **Settings → Pages**.
2. Selecione **Deploy from a branch**, branch `main`, pasta `/(root)`.
3. Salve e aguarde a publicação.
4. O endereço esperado é `https://ehnoixx.github.io/projeto-192-nuclear-simulator/`.

## Funcionalidades da versão 0.2.0
- Visualização 3D aprimorada com prótons e nêutrons diferenciados por cor, rotação por arraste e zoom pela roda do mouse ou botões.
- Legenda de partículas, contador de partículas exibidas e alternância entre núcleo e nuvem ilustrativa.
- Controles de Z e N.
- Parâmetro de fissilidade no modelo simplificado da gota líquida.
- Estimativa de massa por A unidades de massa atômica.
- Escala de raio de Schwarzschild e campo gravitacional newtoniano na superfície de um raio nuclear de referência.

## Limitações científicas
- A visualização é ilustrativa, não uma solução quântica de muitos corpos.
- `x = a_c Z² / (2 a_s A)` é um indicador macroscópico. x<1 não prova estabilidade nuclear; x≥1 não prova inexistência de qualquer estado ligado.
- A massa A×u ignora defeito de massa e energia de ligação.
- O raio `1.2 fm × A^(1/3)` é uma escala de referência, não uma previsão validada para Z=192.
- Radiação, meia-vida e espectros não são calculados por falta de um modelo nuclear validado para Z=192.
- Velocidades eletrônicas não são exibidas: a aproximação hidrogenoide de núcleo pontual falha quando Zα≥1; é necessário tratamento relativístico e de tamanho nuclear finito.
- Não há evidência de antigravidade associada a núcleos superpesados. O módulo gravitacional apresenta apenas gravidade convencional.

## Interface e visualização 3D
- A distribuição espacial dos nucleons é determinística apenas para fins gráficos; não representa posições reais nem uma configuração nuclear de energia mínima.
- A nuvem é uma representação visual conceitual e não corresponde a orbitais eletrônicos calculados.
- O zoom é limitado para manter o núcleo dentro da área de visualização; os botões +, − e RESET também controlam a câmera.

## Próximas etapas
1. Fórmula semiempírica de massas com coeficientes documentados.
2. Energias de separação de prótons e nêutrons.
3. Correções de camada e deformação com parametrizações rastreáveis.
4. Comparação entre modelos HFB e de campo médio relativístico.
5. Incertezas explícitas e validação do domínio de cada modelo.

## Dependências
Three.js 0.160.0 via CDN. O site requer conexão com a internet para carregar a biblioteca e as fontes.

## Licença
MIT.
