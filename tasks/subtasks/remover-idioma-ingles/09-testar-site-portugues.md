# 09. Testar site apenas em português

meta:
id: remover-idioma-ingles-09
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-08]
tags: [testing, validation]

objective:

- Testar completamente o site para garantir que funciona apenas em português sem funcionalidades de idioma

deliverables:

- Relatório de testes confirmando funcionalidade
- Site validado como monolíngue em português

steps:

- Executar npm run build para confirmar build sem erros
- Abrir o site em um navegador
- Verificar que todo o conteúdo está em português
- Confirmar ausência de botão de troca de idioma
- Testar todas as funcionalidades (navegação, formulários, etc.)
- Verificar meta tags e SEO
- Testar em diferentes dispositivos/resoluções

tests:

- Functional: Todas as funcionalidades do site operam corretamente
- UI: Interface limpa e em português
- Performance: Build e carregamento sem problemas

acceptance_criteria:

- Site carrega e funciona perfeitamente em português
- Não há erros no console relacionados a idiomas
- Todas as funcionalidades preservadas exceto troca de idioma

validation:

- Teste manual completo do site
- Verificação de logs de erro
- Comparação com versão anterior para confirmar remoções

notes:

- Este é o teste final para validar toda a remoção de idiomas
