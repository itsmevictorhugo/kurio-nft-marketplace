# Kurio Design Reference

## Source of Truth

The exported Figma frames under `public/design/` are the visual
reference for the implementation.

Functional and technical requirements remain defined by:

- README.md
- seed-spec.md
- docs/ENGINEERING-GUIDELINES.md
- docs/DEFINITION-OF-DONE.md

## Reference File Convention

The filenames intentionally preserve the exported Figma screen names.

Do not rename, replace, or remove these reference images without updating
this document.

These images are design references only and are not application runtime assets.

## Desktop Reference

- Home: `public/design/desktop/Início.png`
- NFT Detail: `public/design/desktop/Detalhes do NFT.png`
- Cart: `public/design/desktop/Carrinho de NFTs.png`
- Payment: `public/design/desktop/Pagamento.png`
- Confirmation: `public/design/desktop/Confirmação de Pedido.png`
- Login: `public/design/desktop/Login.png`
- Registration: `public/design/desktop/Cadastro.png`
- Profile: `public/design/desktop/Perfil do Colecionador.png`
- Wallets: `public/design/desktop/Carteiras.png`

## Mobile Reference

- Home: `public/design/mobile/Início.png`
- NFT Detail: `public/design/mobile/Detalhes do NFT.png`
- Cart: `public/design/mobile/Carrinho de NFTs.png`
- Payment: `public/design/mobile/Pagamento.png`
- Login: `public/design/mobile/Login.png`
- Registration: `public/design/mobile/Cadastro.png`

## Implementation Rule

Do not invent a different visual language when the reference provides
the intended composition.

Preserve, as closely as practical:

- typography
- colors
- spacing
- hierarchy
- proportions
- imagery
- card composition
- navigation structure
- responsive behavior

Mobile is an intentional composition, not merely a scaled desktop layout.

Profile, Wallets and Order Confirmation must also remain functional
on mobile even where no dedicated mobile frame exists.
