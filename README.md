# MapeiaProcesso

**Mapeie seu processo, gere o POP (Procedimento Operacional Padrão) e o fluxograma — tudo no navegador.**

Ferramenta livre e gratuita para documentar processos de trabalho. Você preenche
um formulário com as etapas (incluindo decisões/condicionais) e o MapeiaProcesso
gera, na hora:

- 📄 o **documento do POP** formatado (7 seções padrão) pronto para **exportar em PDF**;
- 🔀 o **fluxograma** do processo (com losangos de decisão e reconvergência), também **exportável em PDF/SVG**.

> Sem servidor, sem cadastro, sem nuvem. O **conteúdo do seu POP** fica **só no seu
> navegador** (salvo localmente) e nunca é enviado. As únicas informações coletadas
> são métricas de acesso anônimas e sem cookies (GoatCounter), para entender o
> alcance da ferramenta.

## Por que existe

É um recorte livre e autônomo do mecanismo de mapeamento de processos: a parte
determinística (formulário → POP → fluxograma), **sem nenhuma dependência de IA**.
Qualquer pessoa ou órgão pode usar, hospedar e adaptar.

## Como usar

Acesse a versão publicada (GitHub Pages) ou rode localmente:

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera o site estático em dist/
```

O `dist/` é um site estático — publique em GitHub Pages, Netlify, Vercel ou
qualquer hospedagem de arquivos.

## Como funciona

100% client-side (Vite + React + TypeScript). O coração é um **conversor
determinístico** que transforma as etapas estruturadas em:

- um documento POP (HTML → PDF via impressão do navegador);
- uma topologia de fluxograma renderizada com [Mermaid](https://mermaid.js.org/).

O conteúdo do POP não sai do navegador; nenhuma chave de API é necessária. As
métricas de acesso (GoatCounter) são anônimas, sem cookies e sem dados pessoais.

## Estrutura

```
src/
  core/
    types.ts                 # modelo do POP e da etapa
    popParaFluxograma.ts     # conversor etapas → fluxograma (função pura)
    gerarMermaid.ts          # topologia → código Mermaid
    popDocumentoHtml.ts      # POP → documento HTML (preview + PDF)
  components/
    PopForm.tsx              # formulário do POP
    PopDocumento.tsx         # documento + exportar PDF
    FluxogramaPreview.tsx    # fluxograma + exportar PDF/SVG
  App.tsx
```

## Licença

[MIT](./LICENSE) — use, copie, modifique e distribua livremente.
