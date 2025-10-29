# 05. Limpar atributos i18n do HTML

meta:
id: remover-idioma-ingles-05
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-04]
tags: [update, html]

objective:

- Remover todos os atributos de internacionalização (i18n) do HTML e substituir por conteúdo estático em português

deliverables:

- index.html e outros arquivos HTML sem atributos data-i18n
- Conteúdo traduzido diretamente no HTML em português

steps:

- Abrir index.html
- Identificar todos os elementos com atributos data-i18n ou similares
- Substituir o conteúdo dinâmico por texto estático em português
- Remover os atributos de internacionalização
- Verificar outros arquivos HTML se houver
- Garantir que o layout e estrutura permanecem intactos

tests:

- Visual: Verificar que o conteúdo aparece corretamente em português

acceptance_criteria:

- Não há atributos i18n no HTML
- Todo o conteúdo visível está em português
- Estrutura do HTML permanece válida

validation:

- Abrir o site no navegador e confirmar conteúdo em português
- Executar validação HTML se disponível

notes:

- Usar o arquivo pt.json como referência para as traduções corretas
