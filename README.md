# FUTBOL VERSUS

Aplicación Next.js (App Router, React 19, TypeScript, Tailwind v4) que reproduce
el diseño del prototipo original (HTML/CSS/JS) con código modular y buenas
prácticas. El diseño se mantiene al 100%: los estilos originales se conservan
intactos y solo cambió la forma de escribir el código.

## Cómo correr

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm run start   # servir el build
```

## Estructura

```
src/
  app/
    layout.tsx            Fuentes (next/font), estilos globales, SvgSymbols, GameShell
    (menu)/               Pantalla "Menú" (topbar + nav lateral) y sus vistas:
      page.tsx            · Liga (ruta /)
      amistoso/           · Amistoso
      desafio/            · Desafío Individual
      torneos/            · Torneos
      mercado/            · Mercado
      transfer/           · Transfermarket
      club/               · Mi Club
      ligas/              · Ruta de Ligas
    vs/ alineacion/ partido/ tabla/   Las otras 4 pantallas del switcher inferior
  components/
    GameShell.tsx         Canvas 1920×1080 escalado + barra inferior + teclado
    SvgSymbols.tsx        Escudos, banderas e iconos reutilizables (<use href>)
    svg.tsx               Primitivos: Crest, FlagSvg, MiniCrest, Icon, Sym, CrestArt
    overlay-context.tsx   Estado de los overlays modales (lobby / juego)
    overlays/             LobbyOverlay (emparejamiento) y GameOverlay (Once Mundialista)
    Topbar / HomeNav / ViewFrame / ImageSlot
  data/                   TODOS los datos viven aquí (mock por ahora)
  styles/                 CSS del diseño original, copiado sin cambios de aspecto
```

## Datos

Por ahora los datos son estáticos y están centralizados en `src/data/`
(`profile`, `leagues`, `store`, `minigames`, `transfermarket`, `history`,
`standings`, `match`, `lobby`, `gameboard`, `tournament`, `navigation`).

Cada módulo expone tipos e interfaces. Cuando se creen las tablas en Supabase,
basta con reemplazar la importación estática por una consulta que devuelva el
mismo tipo: los componentes no necesitan cambios.

## Notas

- La ruta `/` muestra el Menú con la vista Liga (el prototipo abría en VS; en
  web tiene más sentido entrar por el menú). La barra inferior y las flechas
  ← → / teclas 1–5 navegan entre las 5 pantallas, igual que el original.
- Las fuentes Barlow Condensed / Barlow Semi Condensed se cargan con `next/font`
  y se exponen como `--font-d` / `--font-u`, las mismas variables del diseño.
- `<image-slot>` (web component del prototipo) se reemplazó por
  `components/ImageSlot.tsx`; cuando haya subida de imágenes se conecta ahí.
