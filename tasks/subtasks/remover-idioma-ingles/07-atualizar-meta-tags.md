# 07. Atualizar meta tags para português

meta:
id: remover-idioma-ingles-07
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-06]
tags: [update, seo]

objective:

- Atualizar as meta tags do HTML para refletir que o site está apenas em português

deliverables:

- Meta tags configuradas especificamente para português
- Remoção de meta tags relacionadas a múltiplos idiomas

steps:

- Abrir index.html
- Localizar as meta tags (title, description, etc.)
- Atualizar ou adicionar lang="pt" ao elemento html
- Garantir que title e description estão em português
- Remover qualquer meta tag relacionada a idiomas alternativos
- Verificar site.webmanifest se necessário

tests:

- SEO: Verificar meta tags com ferramentas de inspeção

acceptance_criteria:

- Meta tags estão em português
- Atributo lang do HTML é "pt"
- Não há meta tags para outros idiomas

validation:

- Usar ferramentas de desenvolvedor do navegador para inspecionar meta tags
- Confirmar que o idioma do documento é português

notes:

- Focar em SEO para português brasileiro se aplicável
