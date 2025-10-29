# 08. Remover hreflang tags do HTML

meta:
id: remover-idioma-ingles-08
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-07]
tags: [removal, seo]

objective:

- Remover todas as tags hreflang que indicam versões do site em diferentes idiomas

deliverables:

- HTML limpo de tags link rel="alternate" hreflang
- SEO focado apenas em português

steps:

- Abrir index.html
- Identificar todas as tags <link rel="alternate" hreflang="...">
- Remover essas tags do head do HTML
- Verificar se há outras referências a hreflang

tests:

- SEO: Verificar ausência de hreflang com ferramentas

acceptance_criteria:

- Não há tags hreflang no HTML
- SEO não indica versões alternativas do site

validation:

- Inspecionar código fonte da página para confirmar remoção
- Usar validadores HTML para verificar limpeza

notes:

- Hreflang é usado para indicar versões em diferentes idiomas, então remoção é apropriada
