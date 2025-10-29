# 03. Remover módulo LanguageManager

meta:
id: remover-idioma-ingles-03
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-02]
tags: [removal, modules]

objective:

- Remover o módulo LanguageManager.ts que gerencia a internacionalização

deliverables:

- Arquivo LanguageManager.ts removido
- Todas as importações e referências ao LanguageManager removidas do código

steps:

- Localizar o arquivo src/scripts/modules/LanguageManager.ts
- Identificar todas as importações do LanguageManager em outros arquivos (principalmente index.ts)
- Remover as importações do LanguageManager
- Remover qualquer instanciação ou uso do LanguageManager
- Deletar o arquivo LanguageManager.ts

tests:

- Unit: Verificar que não há referências ao LanguageManager no código

acceptance_criteria:

- Arquivo LanguageManager.ts não existe mais
- Não há importações ou usos do LanguageManager no código
- Build funciona sem erros relacionados ao módulo removido

validation:

- Executar npm run lint para confirmar ausência de erros de importação
- Executar npm run build para verificar funcionalidade

notes:

- Cuidado para não quebrar outras funcionalidades ao remover as referências
