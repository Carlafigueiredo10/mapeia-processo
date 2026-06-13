# Como contribuir

Obrigada pelo interesse! O MapeiaProcesso é software livre (MIT) e contribuições
são bem-vindas.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # roda os testes (Vitest)
npm run build    # build de produção (também roda os tipos)
```

## Diretrizes

- O projeto é **100% client-side**, sem backend e **sem dependência de IA** — mantenha assim.
- A lógica de negócio mora em `src/core/` como **funções puras** e deve ter teste em `*.test.ts`.
- Antes de abrir um PR: `npm test` e `npm run build` devem passar.
- Texto de usuário sempre escapado antes de ir para HTML/SVG (evitar XSS).

## Reportando problemas

Abra uma _issue_ descrevendo o passo a passo para reproduzir. Para questões de
segurança, prefira contato direto ao mantenedor antes de divulgar publicamente.
