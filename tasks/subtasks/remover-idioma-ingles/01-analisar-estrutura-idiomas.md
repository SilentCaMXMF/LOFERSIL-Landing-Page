# 01. Analisar estrutura atual de idiomas

meta:
id: remover-idioma-ingles-01
feature: remover-idioma-ingles
priority: P2
depends_on: []
tags: [analysis, languages]

objective:

- Analisar a estrutura atual de idiomas no projeto, identificando arquivos, módulos e elementos relacionados à internacionalização.

deliverables:

- Lista completa de arquivos relacionados a idiomas
- Identificação de módulos como LanguageManager
- Mapeamento de atributos i18n no HTML e código
- Identificação de botões ou elementos de troca de idioma na UI

steps:

- Examinar a pasta src/locales/ para arquivos de tradução (en.json, pt.json)
- Verificar scripts/modules/ para LanguageManager.ts e outros módulos relacionados
- Analisar index.html e outros arquivos HTML para atributos data-i18n ou similares
- Verificar index.ts e outros scripts para uso de internacionalização
- Identificar elementos de UI relacionados à troca de idiomas (botões, menus)
- Documentar todas as referências a idiomas no código

tests:

- N/A (análise manual)

acceptance_criteria:

- Estrutura completa de idiomas mapeada e documentada
- Lista de todos os arquivos e elementos relacionados preparada para remoção

validation:

- Revisar documentação criada
- Confirmar que todos os componentes de idioma foram identificados

notes:

- Esta análise servirá de base para as remoções subsequentes
- Focar em identificar dependências entre módulos
