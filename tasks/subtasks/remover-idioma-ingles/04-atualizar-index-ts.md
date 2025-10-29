# 04. Atualizar index.ts para remover idiomas

meta:
id: remover-idioma-ingles-04
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-03]
tags: [update, scripts]

objective:

- Atualizar o arquivo index.ts para remover toda a lógica relacionada a idiomas e internacionalização

deliverables:

- index.ts limpo de referências a idiomas
- Lógica de inicialização simplificada sem LanguageManager

steps:

- Abrir src/scripts/index.ts
- Remover qualquer código relacionado à inicialização de idiomas
- Remover variáveis ou constantes relacionadas a traduções
- Remover event listeners para troca de idioma
- Simplificar a lógica de inicialização do site
- Garantir que o conteúdo seja exibido diretamente em português

tests:

- Integration: Verificar que o site carrega corretamente sem funcionalidades de idioma

acceptance_criteria:

- index.ts não contém código relacionado a internacionalização
- Site inicializa corretamente sem erros

validation:

- Executar npm run build e verificar que não há erros
- Testar carregamento do site em modo desenvolvimento

notes:

- Preservar outras funcionalidades não relacionadas a idiomas
