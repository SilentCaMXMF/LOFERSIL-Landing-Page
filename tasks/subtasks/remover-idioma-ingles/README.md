# Remover Idioma Inglês

Objective: Remover funcionalidade de troca de idiomas e todo o conteúdo em inglês do site

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [ ] 01 — Analisar estrutura atual de idiomas → `01-analisar-estrutura-idiomas.md`
- [ ] 02 — Remover arquivo de tradução em inglês → `02-remover-arquivo-ingles.md`
- [ ] 03 — Remover módulo LanguageManager → `03-remover-linguagem-manager.md`
- [ ] 04 — Atualizar index.ts para remover idiomas → `04-atualizar-index-ts.md`
- [ ] 05 — Limpar atributos i18n do HTML → `05-limpar-html-atributos.md`
- [ ] 06 — Remover botão de troca de idioma → `06-remover-botao-idioma.md`
- [ ] 07 — Atualizar meta tags para português → `07-atualizar-meta-tags.md`
- [ ] 08 — Remover hreflang tags do HTML → `08-remover-hreflang-tags.md`
- [ ] 09 — Testar site apenas em português → `09-testar-site-portugues.md`

Dependencies

- 01 depends on none
- 02 depends on 01
- 03 depends on 02
- 04 depends on 03
- 05 depends on 04
- 06 depends on 05
- 07 depends on 06
- 08 depends on 07
- 09 depends on 08

Exit criteria

- Site funciona apenas em português sem funcionalidade de troca de idiomas
- Todo o conteúdo em inglês foi removido do código
- Botão de troca de idioma foi removido da interface
- Meta tags estão configuradas para português
- Build funciona sem erros
