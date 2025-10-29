# 02. Remover arquivo de tradução em inglês

meta:
id: remover-idioma-ingles-02
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-01]
tags: [removal, files]

objective:

- Remover o arquivo de tradução em inglês (en.json) da pasta locales

deliverables:

- Arquivo en.json removido do projeto
- Pasta locales contém apenas pt.json

steps:

- Localizar o arquivo src/locales/en.json
- Remover o arquivo en.json do sistema de arquivos
- Verificar que apenas pt.json permanece na pasta locales

tests:

- N/A (remoção de arquivo)

acceptance_criteria:

- Arquivo en.json não existe mais no projeto
- Build do projeto continua funcionando sem erros

validation:

- Executar npm run build para confirmar que não há erros relacionados ao arquivo removido
- Verificar que a pasta src/locales/ contém apenas pt.json

notes:

- Esta é a primeira remoção física de conteúdo em inglês
