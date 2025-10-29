# 06. Remover botão de troca de idioma

meta:
id: remover-idioma-ingles-06
feature: remover-idioma-ingles
priority: P2
depends_on: [remover-idioma-ingles-05]
tags: [removal, ui]

objective:

- Remover o botão ou elemento de interface que permite trocar entre idiomas

deliverables:

- Botão de troca de idioma removido da UI
- Código relacionado ao botão removido

steps:

- Identificar o elemento HTML do botão de idioma (possivelmente em index.html ou gerado dinamicamente)
- Remover o elemento do HTML
- Remover qualquer CSS relacionado ao botão se específico
- Remover event listeners ou lógica JavaScript associada ao botão
- Verificar que não há referências ao botão no código

tests:

- UI: Confirmar que o botão não aparece na interface

acceptance_criteria:

- Botão de troca de idioma não está presente na página
- Interface permanece funcional e esteticamente correta

validation:

- Visual inspection do site para confirmar ausência do botão
- Testar responsividade e layout após remoção

notes:

- Se o botão for gerado dinamicamente, remover a lógica de criação
