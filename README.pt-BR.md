# Redmine Searchable Custom Fields

Este plugin adiciona uma caixa de busca às listas longas de campos personalizados, para encontrar uma opção digitando parte do nome.

[English](README.md)

## Novidades

* 0.1.0: primeira versão. Veja o [CHANGELOG](CHANGELOG.md).

## Funcionalidades

* Adiciona uma caixa de busca aos **campos personalizados do tipo lista** com muitas opções:
  * listas de valor único (ao digitar, o primeiro resultado já é selecionado),
  * listas de múltiplos valores,
  * grupos de caixas de seleção ("Exibição: caixas de seleção").
* **Ignora acentos, maiúsculas e pontuação**, palavra por palavra, em qualquer ordem:
  `sao jose` encontra *São José dos Campos*, `campos jose` também, `tele d` encontra *Tele-diagnosis*.
* **Mantém o campo nativo**: nada é substituído, então formulários, edição em massa e o JavaScript do Redmine continuam funcionando.
* **Funciona com campos em cascata** do [Redmine Depending Custom Fields](https://github.com/jcatrysse/redmine_depending_custom_fields):
  as opções escondidas pelo campo pai continuam escondidas, e a caixa avisa o que está acontecendo
  ("Selecione primeiro o campo anterior" / "Nenhuma opção para a seleção atual").
* **Mantém as seleções ainda válidas** de campos em cascata: com o Depending Custom Fields 0.0.14/0.0.15, remover um valor
  do campo pai (ou voltar a uma combinação já vista) limpa valores do campo filho que continuam permitidos. Este plugin os mantém.
  Pode ser desligado.
* Os valores marcados em campos de múltiplos valores aparecem como **etiquetas** com botão de remover, mesmo quando a busca os esconde.
* **Clique para marcar** em listas de múltiplos valores (sem Ctrl). Pode ser desligado.
* Funciona também nos **filtros da lista de tarefas** (inclusive filtros adicionados depois e a alternância para múltipla seleção) e na **edição em massa**.
* Traduzido para 10 idiomas: inglês, português (Brasil), português (Portugal), espanhol, francês, italiano, alemão, russo, japonês e chinês (simplificado).

## Capturas de tela

### Formulário da tarefa
Valor único, múltiplos valores com etiquetas e um campo em cascata (State → City) pesquisado sem acento.
<img src="./docs/images/issue-form.jpg" width="800px">

### Filtro da lista de tarefas
<img src="./docs/images/issue-filter.jpg" width="800px">

### Telas pequenas
<img src="./docs/images/mobile.jpg" width="480px">

## Versão do Redmine necessária

* 4.2.x ~ 6.1.x

Testado em instalações limpas (imagens Docker oficiais, SQLite), no formulário da tarefa, nos filtros da lista de tarefas
e, a partir da 5.0, junto com o Redmine Depending Custom Fields 0.0.14:

| Redmine | Rails | Ruby | Depending Custom Fields |
|---|---|---|---|
| 6.1.4 | 7.2.3.2 | 3.4.11 | ✔ |
| 6.0.11 | 7.2.3.2 | 3.3.12 | ✔ |
| 6.0.5 | 7.2.2.1 | 3.3.8 | ✔ (MySQL) |
| 5.1.12 | 6.1.7.10 | 3.2.11 | ✔ |
| 5.0.12 | 6.1.7.10 | 3.1.7 | ✔ |
| 4.2.10 | 5.2.8.1 | 2.7.8 | – (aquele plugin exige Redmine 5.0+) |

Sem migrações de banco, sem gems e sem bibliotecas JavaScript externas.

## Instalação

1. Entre na pasta `plugins` do seu Redmine.
<pre>
git clone --branch v0.1.0 https://github.com/cerqueirav/redmine_searchable_custom_fields.git
</pre>
2. Reinicie o Redmine.

## Configuração

*Administração → Plugins → Redmine Searchable Custom Fields → Configurar*

| Opção | Padrão | Descrição |
|---|---|---|
| Número mínimo de opções | 10 | A caixa de busca só aparece em listas com pelo menos essa quantidade de opções (de 2 a 1000). |
| Clique para marcar | ligado | Em listas de múltiplos valores, um clique simples marca/desmarca a opção. |
| Manter seleções válidas | ligado | Depending Custom Fields: quando o campo pai muda, mantém os valores do campo filho que continuam permitidos. |

Para ativar a busca em qualquer outro `<select>` das suas views, adicione `data-searchable="true"` a ele.

## Desinstalação

1. Apague a pasta `plugins/redmine_searchable_custom_fields`.
2. Reinicie o Redmine.

## Autor

Victor Cerqueira — dev.cerqueirav@gmail.com

## Licença

GNU General Public License v3.0 ou posterior. Veja [LICENSE](LICENSE).

Se você modificar e distribuir este plugin, mantenha os avisos de copyright, indique suas alterações e
distribua a sua versão sob a mesma licença.
