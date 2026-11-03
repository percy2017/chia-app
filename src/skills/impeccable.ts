// Generado desde github.com/pbakaus/impeccable (Apache 2.0). No editar a mano.

export type SkillExtraFile = {
  path: string;
  content: string;
};

export const IMPECCABLE_SKILL = `---
name: impeccable
description: Disena, redisenia, audita, pule o mejora interfaces: webs, landing, dashboards, formularios, ajustes y estados vacios. Usala para UX, jerarquia, layout, tipografia, color, motion, textos de UI, accesibilidad, responsive o sistemas de diseno.
compatibility: shell_exec en el VPS del cliente (Node.js, Chromium via playwright-cli para ver el render, npx para herramientas de diseno). Los playbooks de reference/ viven en el telefono, en la carpeta de esta skill. No corre en el telefono.
---

# Impeccable - diseno de interfaz de nivel experto

Esta skill da criterio y metodo para hacer diseno con oficio real. Trabaja como un director de arte premiado: codigo de produccion, un punto de vista claro, entender el negocio y sus usuarios, y ejecucion impecable.

Principios:
- **Termina el trabajo.** Sin evasivas ni atajos: la entrega esta completa, salvo los assets que tenga que dar el usuario.
- **Escala la ambicion al modo de la superficie** (ver Modos). Persuadir y Experiencia van con todo: piezas audaces y distintas, con punto de vista. En Operar y Leer la ambicion se muestra como precision y contencion, y los patrones que el usuario ya conoce se ganan su lugar.
- **Verifica mirando el resultado renderizado** al tamano en que se entrega, y agrupa las revisiones: arregla lo que se ve en una pasada antes de volver a mirar, en vez de screenshotear despues de cada cambio.

## Como cargar el criterio (este harness)

La skill vive en el telefono y el proyecto se toca en el VPS por \`shell_exec\`.

1. Ubica la carpeta de la skill con \`android_phone files.list\` sobre \`/sdcard/Android/data/com.chianative/files/.chia/skills/impeccable\` y lee el playbook que corresponda con \`read\` (\`target:"phone"\`), ruta \`/sdcard/Android/data/com.chianative/files/.chia/skills/impeccable/reference/<archivo>.md\`. No hay \`impeccable context\` ni binario launcher: el contexto del proyecto (PRODUCT.md, DESIGN.md, tokens, componentes) se lee del VPS con \`read\` (\`target:"vps"\`) y con comandos (\`ls\`, \`grep\`, \`cat\` corto) por \`shell_exec\`.
2. Antes de editar nada, entende la verdad visual vigente: el proyecto real en el VPS, sus tokens, su CSS, sus componentes y sus capturas. Si la app no corre, arranca por goldens de regresion visual o fixtures de capturas versionados. Cruza target y frescura contra tokens, CSS, componentes y assets actuales, y compara tema y variantes.
3. Justo antes de escribir codigo de UI (incluidos los retoques chicos) lee \`reference/craft-floor.md\`: ahi estan el piso de calidad, las prohibiciones absolutas y los reflejos que ningun detector agarra. Para trabajo solo de planificacion no hace falta.

Si un playbook no se puede leer, decilo en un mensaje propio y segui con lo que ya sabes, sin inventar contexto del proyecto.

## Como disenar

- **Manda el brief.** Respeta estetica, epoca, materiales, fuentes y paletas fijadas por el usuario aunque choquen con una advertencia de saturacion. Empujar un brief claro hacia tu gusto es un error.
- **Refinar conserva; rediseniar reemplaza.** Refinar mantiene identidad, comportamiento, textos y todo lo que este fuera de alcance. Pide permiso antes de reemplazar texto factual o agregar afirmaciones. Rediseniar conserva verdad de producto, contenido, funcion y restricciones, pero trata lo viejo como evidencia y anti-referencia: se elige un mundo nuevo en \`new-work\` y se reemplaza DESIGN.md. Nunca mezclar: pulir sobre el look descartado es un desperdicio.
- **Los simbolos cargados quedan fuera de la decoracion.** El mundo de un tema no habilita emblemas ligados a militarismo, supremacismo o movimientos de odio (por ejemplo los rayos de la bandera del sol naciente, la bandera de batalla confederada o insignias nazis y sus variantes estilizadas): usa las formas neutras de ese mundo. Un contenido que documenta ese simbolo como hecho se deja como esta.
- **La autoridad visual es evidencia, no un nombre de archivo.** Que falte DESIGN.md no vuelve verde un proyecto: \`new-work\` decide si se preserva, expande o reemplaza el mundo vigente.

## Modos

El modo nombra que significa el exito del visitante en esa superficie.

- **Persuade:** el visitante decide y actua; el diseno es el producto. Landing, marketing, campañas, precios. Gana atencion y accion. Usa imagenes reales si el brief las pide; segui el mundo elegido, no el habito de la categoria.
- **Operate:** el visitante completa una tarea. UI de producto, dashboards, editores, admin, ajustes, herramientas. Escaneabilidad, consistencia, expectativas nativas y la escena de uso real pesan mas que la expresion. La marca vive en detalles precisos.
- **Read:** el visitante entiende algo. Docs, articulos, guias, ayuda, changelogs. Estructura para comprender y despues una lectura que valga la pena.
- **Experience:** el visitante esta dentro de la obra. Portfolios, galerias, showcases. Deja que el artefacto lidere desde el primer viewport; la interfaz se retira.

Elegi el modo por la superficie pedida, no por el producto, y guardalo solo en el brief de esa superficie. La landing de una herramienta sigue siendo Persuade; la documentacion de una casa de moda sigue siendo Read.

## Comandos

Cada comando tiene su playbook en \`reference/\`. Ruteo:

- **Sin argumento:** lee \`reference/routing.md\` y presenta su menu segun contexto; nunca ejecutes un comando solo.
- **Pedido explicito o claramente implicado:** lee el playbook (variante nativa si es iOS/Android) y seguilo. Si dos comandos encajan, pregunta una vez.
- **Duda de flujo o de que comando usar:** lee la seccion de preguntas de flujo en \`reference/routing.md\`.
- **Cualquier otra cosa:** tratalo como trabajo de diseno general. Sin PRODUCT.md, una superficie nueva o un reemplazo de mundo pasa por \`init\` y despues \`new-work\`; un refinamiento angosto de codigo existente sigue sobre la implementacion vigente y ofrece \`init\` despues, sin bloquearse.

| Comando | Categoria | Que hace | Playbook |
|---|---|---|---|
| \`shape [feature]\` | Construir | Planifica UX/UI antes de escribir codigo | \`reference/shape.md\` |
| \`init\` | Construir | Captura contexto durable de producto en PRODUCT.md | \`reference/init.md\` |
| \`document\` | Construir | Genera DESIGN.md desde el codigo existente | \`reference/document.md\` |
| \`extract [target]\` | Construir | Extrae tokens y componentes reutilizables al sistema | \`reference/extract.md\` |
| \`critique [target]\` | Evaluar | Revision de diseno UX con puntaje heuristico | \`reference/critique.md\` |
| \`audit [target]\` | Evaluar | Calidad tecnica: accesibilidad, performance, responsive | \`reference/audit.md\` |
| \`polish [target]\` | Refinar | Ultima pasada de calidad antes de entregar | \`reference/polish.md\` |
| \`bolder [target]\` | Refinar | Amplifica disenos tibios o seguros | \`reference/bolder.md\` |
| \`quieter [target]\` | Refinar | Baja disenos agresivos o sobreestimulantes | \`reference/quieter.md\` |
| \`distill [target]\` | Refinar | Reduce a la esencia, saca complejidad | \`reference/distill.md\` |
| \`harden [target]\` | Refinar | Listo para produccion: errores, i18n, casos limite | \`reference/harden.md\` |
| \`onboard [target]\` | Refinar | Primer arranque, estados vacios, activacion | \`reference/onboard.md\` |
| \`animate [target]\` | Mejorar | Motion con proposito | \`reference/animate.md\` |
| \`colorize [target]\` | Mejorar | Color estrategico en UIs monocromaticas | \`reference/colorize.md\` |
| \`typeset [target]\` | Mejorar | Jerarquia tipografica y fuentes | \`reference/typeset.md\` |
| \`layout [target]\` | Mejorar | Espaciado, ritmo y jerarquia visual | \`reference/layout.md\` |
| \`delight [target]\` | Mejorar | Personalidad y detalles memorables | \`reference/delight.md\` |
| \`overdrive [target]\` | Mejorar | Pasar los limites de lo convencional | \`reference/overdrive.md\` |
| \`clarify [target]\` | Corregir | Textos de interfaz, etiquetas y errores | \`reference/clarify.md\` |
| \`adapt [target]\` | Corregir | Adaptar a dispositivos y tamanos | \`reference/adapt.md\` (nativo: \`reference/adapt.native.md\`) |
| \`optimize [target]\` | Corregir | Diagnostica y arregla performance de UI | \`reference/optimize.md\` |

Soporte: \`reference/new-work.md\` (superficie nueva o reemplazo de mundo visual), \`reference/craft-floor.md\` (piso de calidad, obligatorio antes de editar UI), \`reference/operate.md\`, \`reference/mode-*.md\` (guia por modo), \`reference/android.md\` e \`reference/ios.md\` (plataforma), \`reference/visualize.md\` (representar la propuesta antes de codear), \`reference/region-map.md\` y \`reference/component-review.md\` (mapa de zonas y revision por componente).

No disponibles en este harness (\`live\`, \`live-setup\`, \`generate\`, \`hooks\`, \`doctor\`, \`degraded/\`): dependen del binario launcher y de un navegador con picker sobre el proyecto. La revision visual se hace con \`playwright-cli\` en el VPS y leyendo los PNG con la tool \`read\`.

\`teach\` es alias de \`init\`. \`craft\` es alias deprecado de un pedido normal de \`new-work\`.

## Reglas de este harness

- Todo el trabajo se hace en el **VPS del cliente** con \`shell_exec\`; los archivos se leen y escriben con \`read\`/\`edit\`/\`write\` (\`target:"vps"\`). No hay shell ni navegador en el telefono.
- La skill y sus playbooks viven en el telefono (\`/sdcard/Android/data/com.chianative/files/.chia/skills/impeccable/\`) y se leen con \`read\` (\`target:"phone"\`). La salida de una tool se corta en \`maxChars\`: pagina con \`offset\`/\`limit\`.
- Para ver el render usa \`playwright-cli\` o \`npx playwright screenshot\` en el VPS y mira el PNG con \`read\` (tenes vision). No describas una imagen que no viste ni afirmes como se ve algo sin haberlo mirado.
- Nada de rutas, dominios ni credenciales fijos: cada cliente tiene su VPS. Credenciales se piden, se usan por variable de entorno y no se repiten en la respuesta ni en una nota.
- Si falta una dependencia (\`npx -y ...\`, \`apt-get install\`), pedile permiso al usuario antes de instalarla.
- Si descubris algo estable del cliente (stack, repo, rutas del proyecto, marca), ofrece guardarlo en una nota de \`.chia/memory/\` en vez de redescubrirlo.
`;

export const IMPECCABLE_FILES: SkillExtraFile[] = [
  {
    path: "reference/adapt.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: target platforms/devices and usage contexts.

Adapt an existing design to a different context: another screen size, device, platform, or use case. The trap is treating adaptation as scaling. The job is rethinking the experience for the new context.

**Web only** (mobile web included). Native platforms (\`ios\` / \`android\` / \`adaptive\`) route to [adapt.native.md](adapt.native.md) instead; if the project is native, switch to it now.

---

## Assess Adaptation Challenge

Understand what needs adaptation and why:

1. **Identify the source context**:
   - What was it designed for originally? (Desktop web? Mobile app?)
   - What assumptions were made? (Large screen? Mouse input? Fast connection?)
   - What works well in current context?

2. **Understand target context**:
   - **Device**: Mobile, tablet, desktop, TV, watch, print?
   - **Input method**: Touch, mouse, keyboard, voice, gamepad?
   - **Screen constraints**: Size, resolution, orientation?
   - **Connection**: Fast wifi, slow 3G, offline?
   - **Usage context**: On-the-go vs desk, quick glance vs focused reading?
   - **User expectations**: What do users expect on this platform?

3. **Identify adaptation challenges**:
   - What won't fit? (Content, navigation, features)
   - What won't work? (Hover states on touch, tiny touch targets)
   - What's inappropriate? (Desktop patterns on mobile, mobile patterns on desktop)

Adaptation is rethinking the experience for the new context, not scaling pixels.

## Plan Adaptation Strategy

Create context-appropriate strategy:

### Mobile Adaptation (Desktop → Mobile)

**Layout Strategy**:
- Single column instead of multi-column
- Vertical stacking instead of side-by-side
- Full-width components instead of fixed widths
- Bottom navigation instead of top/side navigation

**Interaction Strategy**:
- Touch targets 44x44px minimum (not hover-dependent)
- Swipe gestures where appropriate (lists, carousels)
- Bottom sheets instead of dropdowns
- Thumbs-first design (controls within thumb reach)
- Larger tap areas with more spacing

**Content Strategy**:
- Progressive disclosure (don't show everything at once)
- Prioritize primary content (secondary content in tabs/accordions)
- Shorter text (more concise)
- Larger text (16px minimum)

**Navigation Strategy**:
- Hamburger menu or bottom navigation
- Reduce navigation complexity
- Sticky headers for context
- Back button in navigation flow

### Tablet Adaptation (Hybrid Approach)

**Layout Strategy**:
- Two-column layouts (not single or three-column)
- Side panels for secondary content
- Master-detail views (list + detail)
- Adaptive based on orientation (portrait vs landscape)

**Interaction Strategy**:
- Support both touch and pointer
- Touch targets 44x44px but allow denser layouts than phone
- Side navigation drawers
- Multi-column forms where appropriate

### Desktop Adaptation (Mobile → Desktop)

**Layout Strategy**:
- Multi-column layouts (use horizontal space)
- Side navigation always visible
- Multiple information panels simultaneously
- Fixed widths with max-width constraints (don't stretch to 4K)

**Interaction Strategy**:
- Hover states for additional information
- Keyboard shortcuts
- Right-click context menus
- Drag and drop where helpful
- Multi-select with Shift/Cmd

**Content Strategy**:
- Show more information upfront (less progressive disclosure)
- Data tables with many columns
- Richer visualizations
- More detailed descriptions

### Print Adaptation (Screen → Print)

**Layout Strategy**:
- Page breaks at logical points
- Remove navigation, footer, interactive elements
- Black and white (or limited color)
- Proper margins for binding

**Content Strategy**:
- Expand shortened content (show full URLs, hidden sections)
- Add page numbers, headers, footers
- Include metadata (print date, page title)
- Convert charts to print-friendly versions

### Email Adaptation (Web → Email)

**Layout Strategy**:
- Narrow width (600px max)
- Single column only
- Inline CSS (no external stylesheets)
- Table-based layouts (for email client compatibility)

**Interaction Strategy**:
- Large, obvious CTAs (buttons not text links)
- No hover states (not reliable)
- Deep links to web app for complex interactions

## Implement Adaptations

Apply changes systematically:

### Responsive Breakpoints

Choose appropriate breakpoints:
- Mobile: 320px-767px
- Tablet: 768px-1023px
- Desktop: 1024px+
- Or content-driven breakpoints (where design breaks)

### Layout Adaptation Techniques

- **CSS Grid/Flexbox**: Reflow layouts automatically
- **Container Queries**: Adapt based on container, not viewport
- **\`clamp()\`**: Fluid sizing between min and max
- **Media queries**: Different styles for different contexts
- **Display properties**: Show/hide elements per context

### Touch Adaptation

- Increase touch target sizes (44x44px minimum)
- Add more spacing between interactive elements
- Remove hover-dependent interactions
- Add touch feedback (ripples, highlights)
- Consider thumb zones (easier to reach bottom than top)

### Content Adaptation

- Use \`display: none\` sparingly (still downloads)
- Progressive enhancement (core content first, enhancements on larger screens)
- Lazy loading for off-screen content
- Responsive images (\`srcset\`, \`picture\` element)

### Navigation Adaptation

- Transform complex nav to hamburger/drawer on mobile
- Bottom nav bar for mobile apps
- Persistent side navigation on desktop
- Breadcrumbs on smaller screens for context

Test on real devices. DevTools emulation is a useful first pass but misses real touch, performance, and browser chrome.

**Avoid**:
- Hide core functionality on mobile (if it matters, make it work)
- Assume desktop = powerful device (consider accessibility, older machines)
- Use different information architecture across contexts (confusing)
- Break user expectations for platform (mobile users expect mobile patterns)
- Forget landscape orientation on mobile/tablet
- Use generic breakpoints blindly (use content-driven breakpoints)
- Ignore touch on desktop (many desktop devices have touch)

## Verify Adaptations

Test thoroughly across contexts:

- **Real devices**: Test on actual phones, tablets, desktops
- **Different orientations**: Portrait and landscape
- **Different browsers**: Safari, Chrome, Firefox, Edge
- **Different OS**: iOS, Android, Windows, macOS
- **Different input methods**: Touch, mouse, keyboard
- **Edge cases**: Very small screens (320px), very large screens (4K)
- **Slow connections**: Test on throttled network

**Custom controls** (sliders, drag surfaces, scrollable control strips): a before/after slider can pass every width check above and still refuse to drag on iOS, so exercise each one in scope in the same batched round as the checks above:

- **Primary gesture**: Tap it and confirm it responds as designed, then drag it with the target input method; the drag must complete, not just start
- **Scroll across it**: A swipe along the page's scroll axis across the control scrolls the page or container without activating it; a drag that starts on the control along its axis moves the control, not the page. Neither failure throws an error, so try both
- **Evidence**: Say what produced the evidence: an emulated viewport, synthesized touch input through a browser tool, which engine ran it (Chromium is not Safari), or a physical device. Screenshots and resized viewports verify layout, never a gesture. Name what stayed untested and move on; unreachable hardware is a reported gap, not a blocker

When the adaptation feels native to each context, hand off to \`/impeccable polish\` for the final pass.

---

## Reference Material

The sections below were previously \`responsive-design.md\` and live inline now so the adapt flow has its deep responsive reference in one place.

### Responsive Design

#### Mobile-First: Write It Right

Start with base styles for mobile, use \`min-width\` queries to layer complexity. Desktop-first (\`max-width\`) means mobile loads unnecessary styles first.

#### Breakpoints: Content-Driven

Don't chase device sizes; let content tell you where to break. Start narrow, stretch until design breaks, add breakpoint there. Three breakpoints usually suffice (640, 768, 1024px). Use \`clamp()\` for fluid values without breakpoints.

#### Detect Input Method, Not Just Screen Size

**Screen size doesn't tell you input method.** A laptop with touchscreen, a tablet with keyboard. Use pointer and hover queries:

\`\`\`css
/* Fine pointer (mouse, trackpad) */
@media (pointer: fine) {
  .button { padding: 8px 16px; }
}

/* Coarse pointer (touch, stylus) */
@media (pointer: coarse) {
  .button { padding: 12px 20px; }  /* Larger touch target */
}

/* Device supports hover */
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
}

/* Device doesn't support hover (touch) */
@media (hover: none) {
  .card { /* No hover state - use active instead */ }
}
\`\`\`

**Critical**: Don't rely on hover for functionality. Touch users can't hover.

#### Safe Areas: Handle the Notch

Modern phones have notches, rounded corners, and home indicators. Use \`env()\`:

\`\`\`css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* With fallback */
.footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
\`\`\`

**Enable viewport-fit** in your meta tag:
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
\`\`\`

#### Responsive Images: Get It Right

##### srcset with Width Descriptors

\`\`\`html
<img
  src="hero-800.jpg"
  srcset="
    hero-400.jpg 400w,
    hero-800.jpg 800w,
    hero-1200.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero image"
>
\`\`\`

**How it works**:
- \`srcset\` lists available images with their actual widths (\`w\` descriptors)
- \`sizes\` tells the browser how wide the image will display
- Browser picks the best file based on viewport width AND device pixel ratio

##### Picture Element for Art Direction

When you need different crops/compositions (not just resolutions):

\`\`\`html
<picture>
  <source media="(min-width: 768px)" srcset="wide.jpg">
  <source media="(max-width: 767px)" srcset="tall.jpg">
  <img src="fallback.jpg" alt="...">
</picture>
\`\`\`

#### Layout Adaptation Patterns

**Navigation**: Three stages: hamburger + drawer on mobile, horizontal compact on tablet, full with labels on desktop. **Tables**: Transform to cards on mobile using \`display: block\` and \`data-label\` attributes. **Progressive disclosure**: Use \`<details>/<summary>\` for content that can collapse on mobile.

#### Testing: Don't Trust DevTools Alone

DevTools device emulation is useful for layout but misses:

- Actual touch interactions
- Real CPU/memory constraints
- Network latency patterns
- Font rendering differences
- Browser chrome/keyboard appearances

**Test on at least**: One real iPhone, one real Android, a tablet if relevant. Cheap Android phones reveal performance issues you'll never see on simulators.

---

**Avoid**: Desktop-first design. Device detection instead of feature detection. Separate mobile/desktop codebases. Ignoring tablet and landscape. Assuming all mobile devices are powerful.
`,
  },
  {
    path: "reference/adapt.native.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: target platforms/devices and usage contexts.

Adapt an existing **native** design (\`ios\` / \`android\` / \`adaptive\`) to a different context: another device class, orientation, platform, or origin. The trap is treating adaptation as scaling. The job is rethinking the experience for the new context, inside the platform conventions of [ios.md](ios.md) / [android.md](android.md); read the target platform's reference before planning if Setup hasn't already.

## Assess Adaptation Challenge

1. **Source context**: what was it designed for, and what assumptions did it make? (Phone-only? Portrait-only? One platform's idioms? A website?)
2. **Target context**: which device class (phone, tablet, foldable), orientation, platform, and usage posture (one-handed on the go vs two-handed at rest)?
3. **What breaks**: navigation that doesn't fit the target, layouts that stretch instead of restructure, gestures or controls that don't exist there?

## Adaptation Strategies

### Phone → Tablet (iPad / large screens)

- **Restructure, don't stretch.** A scaled-up phone UI on a tablet is the failure mode. Use size classes (iOS) / window size classes (Android) to switch structure.
- **Navigation changes shape**: tab bar stays or becomes a sidebar on iPad; Android navigation bar becomes a rail or drawer on expanded width.
- **Use the width**: split view / master-detail (list + detail side by side), multi-column grids, popovers where phones used sheets.
- **Multitasking is a size, not an edge case**: iPad Split View and Android multi-window can hand you a phone-width window on a tablet; size-class-driven layout handles both for free.

### Orientation & foldables

- Landscape restructures (side-by-side panes, repositioned controls); never clip or letterbox. Lock orientation only when the task truly demands it.
- Foldables (Android): react to posture and hinge via window size classes; test folded, unfolded, and tabletop.

### Platform → platform (iOS ↔ Android)

Translate idioms; never transplant them:

| iOS | Android |
|---|---|
| Tab bar | Navigation bar / rail / drawer |
| Edge-swipe back, back chevron | Predictive Back gesture / button |
| Switch, segmented control, system pickers | Material switch, chips, Material pickers |
| Action sheet | Bottom sheet / Material dialog |
| SF Symbols, SF Pro, Dynamic Type | Material Symbols, Roboto, sp scaling |
| Semantic system colors, materials | Material color roles, tonal elevation |
| System push/sheet transitions | Container transform, shared-axis, fade-through |

Rebuild navigation and controls in the target's vocabulary; carry over the brand's expressive layer (palette intent, type accent, motion personality) through the target's theming system.

### Web → native (porting a website or web app)

Reconform, don't reflow. Replace web navigation with the platform's model, HTML-shaped controls with platform controls, hover affordances with touch-first ones, and px-based type with Dynamic Type / sp. Then treat the result to the full platform reference; the slop test there is the acceptance bar.

## Implement & Verify

- Drive structure from **size classes / window size classes**, never from device-model checks.
- Respect safe areas and window insets in every new configuration (notch, hinge, status bar, keyboard).
- Test on simulators for breadth, then real hardware for truth: at least one phone and one tablet per shipped platform, both orientations, split-screen where supported.

When the adaptation feels native to each context, hand off to \`/impeccable polish\` for the final pass.

**Avoid**:
- Ship a stretched phone layout on a tablet
- Port one platform's controls or navigation onto the other
- Hide core functionality on smaller devices (if it matters, make it work)
- Lock orientation to dodge a layout bug
- Trust simulators alone (posture, gestures, and performance need hardware)
`,
  },
  {
    path: "reference/android.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Android platform

For native Android apps: Jetpack Compose, Android Views, React Native, Expo, Flutter shipping to Android hardware.

On native, the visitor mode narrows what expression may override. Material Design 3 governs structure, navigation, and interaction in every mode; brand expresses through Material's theming (color roles, type scale, shape, motion). A Material-everywhere cross-platform app that also ships to iPhone still owes iOS its OS guarantees on that hardware: safe-area insets, Reduce Motion, edge-swipe back.

## The Android slop test

Would a fluent Android user trust this app, or trip on off-spec components? The most common tell is an iOS app wearing Android's skin: a bottom-only navigation copied from iPhone, a back arrow that ignores the system Back gesture, Cupertino-shaped switches and dialogs. Material 3 is the rulebook; follow its components and theme the brand through it.

## Layout & structure

- **Material navigation, matched to size.** Navigation bar (bottom, 3–5 destinations) on compact width; navigation rail or drawer on expanded width. Never ship a phone bottom-bar untouched on a tablet.
- **System Back always works.** Honor the predictive Back gesture and Back button; never trap the user or hijack the gesture.
- **Edge-to-edge with window insets.** Apply the status bar, navigation bar, display cutout, and IME insets so content never hides behind system bars or the keyboard.
- **Top app bar for screen context**; pair with a FAB when the screen has a single primary action.

## Touch targets

- **48×48 dp minimum** for every touch target, with at least 8 dp between them.

## Typography

- **Material type scale.** Display, Headline, Title, Body, Label roles (large/medium/small each). Map text to roles; never hand-pick sizes per screen.
- **Roboto is the system face**; theme a brand face in through the type scale, keeping body, labels, and controls legible and consistent.
- **sp units, never fixed px**, so type follows the system font-size setting.

## Color & theming

- **Material color roles** (primary, on-primary, surface, surface-variant, secondary-container, outline, error). Role tokens resolve light/dark and contrast variants automatically; raw hex breaks there.
- **Dynamic Color (Material You)** where it fits: derive the scheme from the user's wallpaper on Android 12+, with a static fallback.
- **Dark theme is a first-class scheme.** Design and test it; never a quick invert.
- **Tonal elevation.** Convey elevation through the standard surface tonal levels (plus shadow where appropriate); no arbitrary drop shadows.

## Components & motion

- **Material components.** Buttons (filled / tonal / outlined / text), FAB, switches, chips, snackbars, bottom sheets, Material dialogs, navigation bar/rail/drawer. Never port iOS controls or invent equivalents.
- **One FAB, one primary action.** Never stack FABs or spend one on a secondary task.
- **Snackbars for transient feedback** (actionable when useful, never a toast for that); dialogs only for decisions that must interrupt.
- **Material motion patterns.** Container transform, shared-axis, fade-through, with standard easing and durations; honor the system Remove animations setting with a crossfade or instant cut.

## Verifying the build

- **Screenshots come from the emulator or a connected device, never a browser.** Build and install, then capture with \`adb exec-out screencap -p > <path>\` (pick a device with \`adb -s <serial>\` when several are attached). Capture every device class the app ships to, at least one phone and, when tablets are a target, one tablet, and write the files where the review flow expects them.
- **Dark theme and font scale belong in the pass.** \`adb shell cmd uimode night yes\` flips the theme; \`adb shell settings put system font_scale 1.3\` (read both settings first with \`adb shell cmd uimode night\` and \`adb shell settings get system font_scale\`, and restore them after) catches the clipped labels a fixed layout hides; with several targets attached, the capture's \`-s <serial>\` goes on these commands too.
- **Emulators give breadth; gestures, refresh rates, and performance need hardware.** Say which one produced the evidence.
`,
  },
  {
    path: "reference/animate.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: performance constraints.

Use motion to explain state, relationship, and hierarchy, or to create one authored moment the surface has earned. Decoration without purpose is animation debt.

---

## Visitor mode

- **Persuade + Experience:** motion may carry the voice. Prefer one rehearsed focal sequence to repeated section reveals.
- **Operate + Read:** motion serves feedback, state, and continuity. Keep routine transitions fast and do not make users wait through page-load choreography.
- **Native (\`ios\` / \`android\` / \`adaptive\`):** follow the Motion section of [ios.md](ios.md) or [android.md](android.md), including the platform's Reduce Motion behavior. Do not apply the web tooling below.

## Find the job

Inspect the existing motion language, interaction states, target devices, and performance budget. Find only the places where motion would:

- acknowledge an action;
- make a state change or spatial relationship legible;
- preserve continuity through navigation or layout change;
- direct attention at a meaningful moment;
- embody the selected visual world.

Ask only when a material constraint cannot be inferred. Do not animate a static area merely because it exists.

## Set the motion thesis

Write a short plan before implementation:

- **Focal moment:** the one sequence or interaction that deserves authorship, if any.
- **Continuity:** the state, layout, or navigation changes that need explanation.
- **Feedback:** the controls and outcomes that need acknowledgment.
- **Budget:** which effects may be expensive and how often they run.

The focal moment must come from this product and surface concept. A generic fade-and-rise, hover lift, parallax layer, or scroll reveal is not a thesis.

## Choose material by meaning

Transform and opacity are reliable foundations, not the entire palette. Choose properties for what the transition communicates:

- **Continuity and relationship:** shared-element motion, FLIP-style transforms, view transitions, or deliberate spatial movement.
- **Focus and depth:** bounded blur, filter, backdrop, light, or shadow changes.
- **Reveal and composition:** masks, clip paths, cropping, or controlled occlusion.
- **Material and energy:** color, gradient position, texture, distortion, or shader effects when the world and runtime support them.
- **State and feedback:** the smallest change that makes cause and result unmistakable.

Do not stack techniques for spectacle. One strong material idea, carried through the focal sequence and quiet supporting states, is usually enough.

Sibling stagger is appropriate when a list appears as a list. Cap the total delay, and never reinterpret every scrolled section as a staggered list.

## Timing and easing

Timing should express distance and consequence:

| Duration | Typical use |
|---|---|
| 100–150 ms | immediate feedback |
| 150–300 ms | routine state change |
| 300–500 ms | layout, overlay, or view transition |
| 500–800 ms | a deliberately authored focal entrance |

Exit faster than entrance. Use natural deceleration such as \`cubic-bezier(0.16, 1, 0.3, 1)\` for confident arrivals; do not use bounce or elastic curves by reflex. Long feedback feels like latency.

## Implement to the runtime

- Use CSS transitions and keyframes for declarative state and bounded sequences.
- Use Web Animations API or the project's existing motion library for interruption, sequencing, and dynamic values.
- Use View Transitions or shared-element techniques when continuity across states is the point.
- Use scroll-driven motion only when the scroll relationship itself carries meaning, with a robust fallback.
- Do not add a dependency for an effect the existing stack can express cleanly.

Keep content visible in the default state so failed scripts do not hide the page. Avoid casually animating layout-driving properties such as \`width\`, \`height\`, \`top\`, \`left\`, and margins; use FLIP, transforms, or grid techniques when appropriate. Bound blur, filter, shadow, canvas, and shader work to isolated regions. Apply \`will-change\` only during known animation. Measure on target viewports and devices rather than assuming transform means fast.

## Accessibility and control

Respect autoplay and sound preferences. Any nonessential loop must stop when offscreen or hidden.

Every web animation needs a \`prefers-reduced-motion\` path with an intentional alternative. Remove or reduce spatial movement while preserving opacity, color, and state transitions that carry meaning. Reduced motion means fewer and gentler animations, not disabling all motion; feedback that confirms an action should remain legible.

## Verify

- The focal motion is specific to the selected world and surface.
- Every supporting animation explains feedback, state, or relationship.
- Interruption and repeated use behave correctly.
- Desktop, mobile, and keyboard paths remain usable.
- The \`prefers-reduced-motion\` path reduces movement without erasing meaningful feedback or state changes.
- Expensive effects stay smooth on the target device.
- Removing an animation would lose meaning or authored character, not merely decoration.

When motion earns its place, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/audit.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Run systematic **technical** quality checks and generate a comprehensive report. Don't fix issues; document them for other commands to address.

This is a code-level audit, not a design critique. Check what's measurable and verifiable in the implementation.

**Web only.** Native platforms (\`ios\` / \`android\` / \`adaptive\`) route to [audit.native.md](audit.native.md) instead; if the project is native, switch to it now.

## Diagnostic Scan

Run comprehensive checks across 5 dimensions. Score each dimension 0-4 using the criteria below.

### 1. Accessibility (A11y)

**Check for**:
- **Contrast issues**: Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)
- **Motion sensitivity**: \`prefers-reduced-motion\` needs an intentional alternative that preserves state change and hierarchy; flag a global \`0.01ms\` kill that destroys useful feedback, flashing above threshold, and motion that blocks focus, reading, or task completion
- **Missing ARIA**: Interactive elements without proper roles, labels, or states
- **Keyboard navigation**: Missing focus indicators, illogical tab order, keyboard traps
- **Semantic HTML**: Improper heading hierarchy, missing landmarks, divs instead of buttons
- **Alt text**: Missing or poor image descriptions
- **Form issues**: Inputs without labels, poor error messaging, missing required indicators

**Score 0-4**: 0=Inaccessible (fails WCAG A), 1=Major gaps (few ARIA labels, no keyboard nav), 2=Partial (some a11y effort, significant gaps), 3=Good (WCAG AA mostly met, minor gaps), 4=Excellent (WCAG AA fully met, approaches AAA)

### 2. Performance

**Check for**:
- **Layout thrashing**: Reading/writing layout properties in loops
- **Expensive animations**: Casual layout-property animation, unbounded blur/filter/shadow effects, or effects that visibly drop frames
- **Missing optimization**: Images without lazy loading, unoptimized assets
- **will-change overuse**: \`will-change\` applied broadly or left on at rest (it is a targeted hint for known expensive animations, not a baseline requirement)
- **Bundle size**: Unnecessary imports, unused dependencies
- **Render performance**: Unnecessary re-renders, missing memoization

**Score 0-4**: 0=Severe issues (layout thrash, unoptimized everything), 1=Major problems (no lazy loading, expensive animations), 2=Partial (some optimization, gaps remain), 3=Good (mostly optimized, minor improvements possible), 4=Excellent (fast, lean, well-optimized)

### 3. Theming

**Check for**:
- **Hard-coded colors**: Colors not using design tokens
- **Broken dark mode**: Missing dark mode variants, poor contrast in dark theme
- **Inconsistent tokens**: Using wrong tokens, mixing token types
- **Theme switching issues**: Values that don't update on theme change

**Score 0-4**: 0=No theming (hard-coded everything), 1=Minimal tokens (mostly hard-coded), 2=Partial (tokens exist but inconsistently used), 3=Good (tokens used, minor hard-coded values), 4=Excellent (full token system, dark mode works perfectly)

### 4. Responsive Design

**Check for**:
- **Fixed widths**: Hard-coded widths that break on mobile
- **Touch targets**: Interactive elements < 44x44px. WCAG AA (SC 2.5.8) requires at least 24x24 CSS px unless an exception applies: spacing, an equivalent control, inline text, user-agent styling, or an essential size. Spacing passes when a 24 CSS px circle centered on the target's bounding box overlaps no other target and no other undersized target's circle
- **Broken touch interaction**: Custom sliders, drag surfaces, and scrollable control strips whose primary gesture fails under touch, that swallow page scroll or lose the drag to it, or that stay stuck after an interrupted gesture. Code tells: mouse-only handlers, no \`touch-action\` on a pointer-event drag surface, drag state that nothing clears on cancel, lost capture, or blur. Exercise the gesture when a browser tool can synthesize touch (a rendered viewport proves layout, not the gesture), then say what produced the evidence (emulated viewport, synthesized touch, which engine, physical device) and what stayed untested
- **Horizontal scroll**: Content overflow on narrow viewports
- **Text scaling**: Layouts that break when text size increases
- **Missing breakpoints**: No mobile/tablet variants

**Score 0-4**: 0=Desktop-only (breaks on mobile), 1=Major issues (some breakpoints, many failures), 2=Partial (works on mobile, rough edges), 3=Good (responsive, minor touch target or overflow issues), 4=Excellent (fluid, all viewports, proper touch targets, gestures work under touch)

### 5. Implementation Integrity (CRITICAL)

Run the bundled detector and verify each finding in context. Look for repeated implementation shortcuts, design-system drift, misleading or decorative content, and structure that is interchangeable with an unrelated product. Keep deterministic findings separate from visual judgment and call out false positives.

**Desktop apps** (Electron, NW.js, CEF, WebView2): launch the app with a local DevTools port (\`--remote-debugging-port=9222\`, or \`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222\` for WebView2; keep it on 127.0.0.1, never exposed), seed the state to audit, keep the window on screen (a hidden one skips the pixel contrast reads), then run \`.agent/skills/impeccable/scripts/impeccable detect --cdp 9222 --target <part of the page URL or title> --json\`. It returns the same JSON as a URL scan and leaves the window as found. Take screenshots through the harness's CDP tooling, and leave the window as you found it too. Tauri on macOS (WKWebView) and on Linux (WebKitGTK) expose no CDP: scan the source and say the rendered check did not run.

**Score 0-4**: 0=systemic drift, 1=major repeated failures, 2=several verified issues, 3=minor isolated issues, 4=coherent and intentional

## Generate Report

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | ? | [most critical a11y issue or "--"] |
| 2 | Performance | ? | |
| 3 | Theming | ? | |
| 4 | Responsive Design | ? | |
| 5 | Implementation Integrity | ? | |
| **Total** | | **??/20** | **[Rating band]** |

**Rating bands**: 18-20 Excellent (minor polish), 14-17 Good (address weak dimensions), 10-13 Acceptable (significant work needed), 6-9 Poor (major overhaul), 0-5 Critical (fundamental issues)

### Implementation Integrity Verdict
**Start here.** Pass/fail: does the implementation express a coherent product-specific system? Cite verified evidence and detector findings.

### Executive Summary
- Audit Health Score: **??/20** ([rating band])
- Total issues found (count by severity: P0/P1/P2/P3)
- Top 3-5 critical issues
- Recommended next steps

### Detailed Findings by Severity

Tag every issue with **P0-P3 severity**:
- **P0 Blocking**: Prevents task completion. Fix immediately
- **P1 Major**: Significant difficulty or WCAG AA violation. Fix before release
- **P2 Minor**: Annoyance, workaround exists. Fix in next pass
- **P3 Polish**: Nice-to-fix, no real user impact. Fix if time permits

For each issue, document:
- **[P?] Issue name**
- **Location**: Component, file, line
- **Category**: Accessibility / Performance / Theming / Responsive / Implementation Integrity
- **Impact**: How it affects users
- **WCAG/Standard**: Which standard it violates (if applicable)
- **Recommendation**: How to fix it
- **Suggested command**: Which command to use (prefer: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset)

### Patterns & Systemic Issues

Identify recurring problems that indicate systemic gaps rather than one-off mistakes:
- "Hard-coded colors appear in 15+ components, should use design tokens"
- "Touch targets consistently too small (<44px) throughout mobile experience"

### Positive Findings

Note what's working well: good practices to maintain and replicate.

## Recommended Actions

List recommended commands in priority order (P0 first, then P1, then P2):

1. **[P?] \`/command-name\`**: Brief description (specific context from audit findings)
2. **[P?] \`/command-name\`**: Brief description (specific context)

**Rules**: Only recommend commands from: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset. Map findings to the most appropriate command. End with \`/impeccable polish\` as the final step if any fixes were recommended.

After presenting the summary, tell the user:

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run \`/impeccable audit\` after fixes to see your score improve.

Keep P3s few: a long tail of minor issues buries the ones that matter.

**Avoid**:
- Report issues without explaining impact (why does this matter?)
- Provide generic recommendations (be specific and actionable)
- Skip positive findings (celebrate what works)
- Forget to prioritize (everything can't be P0)
- Report false positives without verification
`,
  },
  {
    path: "reference/audit.native.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Run systematic **technical** quality checks on a native app (\`ios\` / \`android\` / \`adaptive\`) and generate a comprehensive report. Don't fix issues; document them for other commands to address.

This is a code-level audit, not a design critique. Audit from source (SwiftUI / UIKit / Compose / React Native / Flutter); no browser tooling or \`impeccable detect\` applies. Score against the platform reference(s): [ios.md](ios.md) / [android.md](android.md), both for \`adaptive\`. Read them before scoring if Setup hasn't already. The report skeleton mirrors [audit.md](audit.md); keep the two in sync when changing it.

## Diagnostic Scan

Run comprehensive checks across 5 dimensions. Score each dimension 0-4 using the criteria below.

### 1. Accessibility (VoiceOver / TalkBack)

**Check for**:
- **Missing labels**: interactive elements without accessibility labels, traits/roles, or state announcements
- **Reading and focus order**: illogical traversal, unreachable controls, focus lost on navigation
- **Text scaling**: fixed point sizes defeating Dynamic Type (iOS) or px instead of sp (Android); layouts that clip or overlap at large sizes
- **Touch targets**: below 44 pt (iOS) / 48 dp (Android), or crammed without spacing
- **Reduce Motion ignored**: parallax and large slides with no crossfade alternative
- **Contrast**: text failing contrast in either appearance, light or dark

**Score 0-4**: 0=Screen reader unusable, 1=Major gaps (unlabeled controls, no scaling), 2=Partial (labels exist, order or scaling breaks), 3=Good (minor gaps), 4=Excellent (labeled, ordered, scales cleanly, Reduce Motion honored)

### 2. Performance

**Check for**:
- **Slow startup**: heavy work on launch before first frame
- **Unvirtualized lists**: long content without FlatList / LazyColumn / List recycling
- **Main-thread jank**: synchronous work in scroll or gesture paths, dropped frames on 60/120 Hz
- **Wasted rendering**: unnecessary re-renders (React Native) or recompositions (Compose); missing memoization/keys
- **Image handling**: full-size images decoded for thumbnails, no caching
- **App weight**: bloated JS bundle or binary, unused dependencies

**Score 0-4**: 0=Janky everywhere, 1=Major problems (unvirtualized lists, slow launch), 2=Partial, 3=Good (minor improvements possible), 4=Excellent (fast launch, smooth scroll, lean)

### 3. Appearance & Theming

**Check for**:
- **Hard-coded colors**: raw hex instead of semantic system colors (iOS) / Material color roles (Android) / design tokens
- **Broken dark appearance**: missing dark variants, poor contrast in dark, quick inverts
- **Dynamic Color** (Android 12+): no static fallback scheme, or ignored where it fits
- **Off-platform materials**: hand-rolled visual materials where system materials or tonal elevation are expected

**Score 0-4**: 0=Hard-coded everything, 1=Minimal tokens, 2=Partial (tokens exist, inconsistently used), 3=Good (minor hard-coded values), 4=Excellent (semantic throughout, both appearances first-class)

### 4. Platform Conformance (CRITICAL)

Score against the loaded platform reference(s), including their slop tests. **Check for**:
- **Broken system gestures**: edge-swipe back disabled (iOS), predictive Back hijacked (Android)
- **Inset violations**: content under the notch, Dynamic Island, home indicator, status bar, or keyboard
- **Off-platform navigation**: custom global nav, overloaded tab bars, iOS patterns on Android or vice versa
- **Web-shaped controls**: HTML-style buttons, custom toggles, hover-dependent affordances
- **Icon drift**: mixed icon sets instead of SF Symbols / Material Symbols
- **System drift**: repeated shortcuts or decorative patterns that conflict with the product, platform, or established design system

**Score 0-4**: 0=Web port (nothing native), 1=Heavy violations (3-4 kinds), 2=Some (1-2 noticeable), 3=Mostly conformant (subtle issues), 4=Fully native (a fluent user trusts every screen)

### 5. Adaptivity

**Check for**:
- **Stretched phone layouts**: tablet/iPad rendering a scaled-up phone UI instead of using size classes / window size classes
- **Orientation breakage**: landscape clipping, ignored, or locked without reason
- **Keyboard/IME handling**: inputs hidden behind the keyboard, no inset adjustment
- **Multitasking**: iPad Split View / Android multi-window breaking layout
- **Foldables**: hinge-unaware layouts on posture change (Android)

**Score 0-4**: 0=One screen size only, 1=Major breakage (landscape or tablet broken), 2=Partial, 3=Good (minor edge cases), 4=Excellent (adapts across sizes, orientations, and windowing)

## Generate Report

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | ? | [most critical issue or "--"] |
| 2 | Performance | ? | |
| 3 | Appearance & Theming | ? | |
| 4 | Platform Conformance | ? | |
| 5 | Adaptivity | ? | |
| **Total** | | **??/20** | **[Rating band]** |

**Rating bands**: 18-20 Excellent (minor polish), 14-17 Good (address weak dimensions), 10-13 Acceptable (significant work needed), 6-9 Poor (major overhaul), 0-5 Critical (fundamental issues)

### Platform Conformance Verdict
**Start here.** Pass/fail: does this read as a native app or a ported website? List specific violations. Be brutally honest.

### Executive Summary
- Audit Health Score: **??/20** ([rating band])
- Total issues found (count by severity: P0/P1/P2/P3)
- Top 3-5 critical issues
- Recommended next steps

### Detailed Findings by Severity

Tag every issue with **P0-P3 severity**:
- **P0 Blocking**: Prevents task completion. Fix immediately
- **P1 Major**: Significant difficulty or platform-guideline violation. Fix before release
- **P2 Minor**: Annoyance, workaround exists. Fix in next pass
- **P3 Polish**: Nice-to-fix, no real user impact. Fix if time permits

For each issue, document:
- **[P?] Issue name**
- **Location**: Screen, file, line
- **Category**: Accessibility / Performance / Theming / Conformance / Adaptivity
- **Impact**: How it affects users
- **Guideline**: The HIG / Material rule it violates (if applicable)
- **Recommendation**: How to fix it
- **Suggested command**: Which command to use (prefer: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset)

### Patterns & Systemic Issues

Identify recurring problems that indicate systemic gaps rather than one-off mistakes:
- "Hard-coded colors appear in 15+ screens, should use semantic colors"
- "Touch targets consistently below 44 pt throughout the tab bar and list rows"

### Positive Findings

Note what's working well: good practices to maintain and replicate.

## Recommended Actions

List recommended commands in priority order (P0 first, then P1, then P2):

1. **[P?] \`/command-name\`**: Brief description (specific context from audit findings)
2. **[P?] \`/command-name\`**: Brief description (specific context)

**Rules**: Only recommend commands from: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset. Map findings to the most appropriate command. End with \`/impeccable polish\` as the final step if any fixes were recommended.

After presenting the summary, tell the user:

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run \`/impeccable audit\` after fixes to see your score improve.

Keep P3s few: a long tail of minor issues buries the ones that matter.

**Avoid**:
- Report issues without explaining impact (why does this matter?)
- Provide generic recommendations (be specific and actionable)
- Skip positive findings (celebrate what works)
- Forget to prioritize (everything can't be P0)
- Report false positives without verification
`,
  },
  {
    path: "reference/bolder.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: which section is the target, and what must stay untouched.

An open direction round owns the word first: "bolder" said while a direction decision is on the table is the Bolder hand register steer, a fresh deal of foreign forms (see new-work.md), not this command. This command refines a surface whose world already shipped.

"Bolder" is an amplification request, and almost always it is scoped to something that already exists. The surrounding page, its system, and its conventions are the given. Your job is to raise one part to the conviction the rest already implies, without rebuilding anything the brief did not name. The reflex answer, reaching for more effects, is the opposite of bold; reject it first.

## Scope is sovereign

"Everything else stays" is a literal instruction. Touch only the named target. Do not restyle its neighbors, do not migrate the page to a new idea, do not add colors, fonts, radii, shadows, or system primitives the surface does not already own. If the existing system genuinely cannot express the direction, do not expand it on your own. Ask the user directly to clarify what you cannot infer. Name the exact addition and the job it would do.

## Why it reads flat

A section usually reads flat for reasons its neighbors have already solved. Look at what the rest of the page does that this section does not: the display type at full strength, the structural devices that carry meaning, the signature motif, the density and pacing. A flat section is typically one that quietly opts out of the system's own strongest moves. The most reliable bolder pass brings the target up to the expressive level its neighbors already reach, in the system's own vocabulary rather than a new one.

## The amplification

- **Amplify what the system already owns.** Reuse its motif and its type scale at full strength, turned up for this section rather than invented for it. The bolder version should look more like the same brand, not less.
- **Keep content true.** Existing claims are part of the scope: preserve them unless the user supplies replacements. If real evidence is essential to the direction but absent, ask for it.
- **Commit, then clarify.** Half-measures read as noise. Make the one decisive move completely, then quiet everything around it so the move is legible. If every element got louder, the section got flatter.
- **Give it its own rhythm.** The target should read as a peak in the scroll, a shift in density or pace from what surrounds it, not simply more of the same.

## The skeleton test

Strip the copy out of your planned section and study the bare structure. Does the skeleton still say what this section is and why it matters, through hierarchy and the system's devices alone? If it only works once the words return, the boldness is in the text size, not the design. A placeholder for an image or artifact names a job, an anchor and a piece of evidence, not a cue to drop in a decorative photo; fill that job with whatever the subject actually has.

## Before you finish

- Everything outside the named target is unchanged.
- No new color, font, or system primitive appeared without being asked for.
- The conventions the section carried, including anything that drives an action, still work the same way.
- The section is unmistakably the same brand, only more sure of itself.

When the target holds its own without pulling the page apart, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/clarify.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: audience knowledge and emotional state.

Rewrite unclear interface text so users understand what happened, what matters, and what to do next. Preserve factual meaning, product terminology, and brand voice.

## Audit the language

Read the entire interaction path, not isolated strings. Identify:

- ambiguous nouns, verbs, and actions;
- internal jargon or assumed knowledge;
- vague labels, outcomes, and system states;
- missing consequences, recovery, or timing;
- inconsistent terminology and capitalization;
- redundant headings, intros, helper text, and confirmations;
- text that breaks at realistic widths or in translation;
- tone that ignores stress, risk, success, or urgency.

Infer audience and task from product context and surrounding UI. Ask before changing factual claims, legal meaning, or a term that may be domain-specific.

## Set the message hierarchy

For each state, decide:

1. the one fact the user needs now;
2. the action available next;
3. supporting context that changes the decision;
4. the appropriate tone for this moment.

Say each idea once. If the heading already explains the state, the introduction should add new information or disappear.

## Rewrite by function

### Actions and navigation

Use a specific verb and object when the outcome is not already obvious. Labels should describe what will happen, not the gesture used to trigger it. Keep the same noun and verb for the same concept throughout the product.

For destructive actions, name the object and consequence. Prefer undo over confirmation when recovery is safe. When confirmation is necessary, name the action on both the message and button instead of using \`Yes\`, \`No\`, \`OK\`, or \`Submit\`.

### Forms

Use persistent labels; placeholders are examples, not labels. Put format and eligibility requirements before submission. Explain why information is requested only when it is not obvious. Required and optional treatment should be consistent.

Validation says what needs attention and how to correct it without blaming the user. Keep related instructions near the field and announce errors accessibly.

### Errors and permissions

An actionable error answers:

1. what failed;
2. why, when known and useful;
3. how to recover or what alternative remains.

Do not expose internal codes as the primary message. Do not promise a cause or resolution the system cannot know. Treat privacy, payment, deletion, access loss, and blocked work seriously; warmth is welcome, jokes are not.

### Loading, empty, and success states

Loading text names the real operation and sets an honest expectation when the wait is meaningful. Show determinate progress when available; never invent progress.

An empty state distinguishes first use, no results, filters, permissions, and failure. Explain the state and provide the next useful action.

Success confirms the completed outcome and mentions the next consequence only when it changes what the user should do. Routine success should be brief.

### Help and instructional text

Helper text answers an implicit question instead of restating the control. Use progressive disclosure for uncommon detail. Link text must make sense out of context; icon-only controls need accessible names.

## Voice, accessibility, and localization

Voice stays consistent; tone adapts to the moment. Use plain language without flattening terminology the audience genuinely knows.

- Write complete translatable messages rather than concatenated fragments.
- Keep variables and numbers structured so translators can reorder them.
- Allow expansion instead of abbreviating prematurely.
- Make alt text convey the image's information; use empty alt for decoration.
- Keep screen-reader names aligned with visible labels and outcomes.
- Do not rely on punctuation, color, or iconography to carry the message alone.

Maintain a short terminology glossary when inconsistency spans the product. Do not vary words for literary effect in an interface.

## Verify

Read the flow in context and test:

- comprehension without hidden product knowledge;
- actionability at errors, empty states, and decision points;
- factual accuracy and consistent terminology;
- scanability at target widths and 200% zoom;
- long names, localization expansion, pluralization, and dynamic values;
- accessible names and announced state changes;
- tone appropriate to consequence and emotional context.

The final copy is as short as it can be without removing meaning or recovery.

When the language reads cleanly, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/colorize.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: existing brand colors.

Introduce color as hierarchy, meaning, and atmosphere. Preserve confirmed brand and semantic conventions; do not replace a visual world under the guise of colorizing it.

---

## Visitor mode

- **Persuade + Experience:** color may carry the voice and own large regions when the selected world calls for it.
- **Operate + Read:** color primarily encodes action, selection, status, wayfinding, and reading hierarchy. Rarity gives an accent force.

## Audit before choosing

Read DESIGN.md, tokens, assets, current themes, and representative states. Identify:

- which colors are confirmed brand commitments;
- current surface, text, action, and semantic roles;
- places where grayscale obscures hierarchy or state;
- contrast failures and color-only communication;
- light/dark or data-visualization requirements;
- whether the task asks for more color or a new identity.

If a new identity is required, use [new-work.md](new-work.md). Ask only when a binding brand decision cannot be inferred.

## Choose a strategy

Name the intended emotional temperature, dominant relationship, contrast range, and color dosage before editing. The strategy may be restrained or immersive; it must follow the brief and selected world rather than a fixed percentage rule.

Build roles, not a bag of swatches:

- canvas and elevated surfaces;
- primary and secondary text;
- action, focus, and selection;
- borders and separators;
- success, warning, error, and information;
- data categories or scales when needed.

Use the project's existing color space. For a new web palette, prefer OKLCH because lightness and chroma can be adjusted predictably. Choose hue from product meaning and visual direction, never from a default category association.

## Apply at system scale

- Let the strongest color own a deliberate region or role instead of scattering tiny accents.
- Keep the primary action easy to find; do not spend its color on decoration.
- Tint neutrals only when the brand hue genuinely creates cohesion. Neutral gray is valid when it serves the world.
- On colored surfaces, derive secondary text from the foreground or surface hue rather than using washed-out generic gray.
- Keep semantic meanings consistent, but respect platform and domain conventions instead of assuming fixed hues.
- For data, use distinct lightness, chroma, shape, label, or pattern so color is not the only code.
- In dark mode, design surface elevation and contrast explicitly; do not invert the light theme mechanically.
- Define primitive values and semantic tokens when the project has a token system. Theme changes should normally remap semantic roles.

Decoration without a relationship to hierarchy, state, content, or the visual world is not a color strategy.

## Contrast and perception

Verify computed foreground/background pairs:

| Content | WCAG AA minimum |
|---|---|
| body text | 4.5:1 |
| large text | 3:1 |
| controls, icons, focus indicators | 3:1 |

Do not rely on eyesight alone. Check interactive states, overlays, text on images, disabled content, and both themes. Simulate common vision deficiencies. Information conveyed by color also needs text, shape, iconography, or position.

When deriving OKLCH ramps, vary lightness and reduce chroma near white and black. Do not keep high chroma at extreme lightness merely to make the math uniform. Prefer explicit colors over chains of translucent overlays when alpha would make contrast context-dependent.

## Verify

- Every color has a stable role or a world-specific atmospheric purpose.
- Attention lands on the intended action, content, or state.
- The palette works across quiet, dense, interactive, error, and empty states.
- Light and dark themes are each composed, not mechanically inverted.
- Contrast and non-color cues pass in all relevant states.
- The result is recognizably this product, not a generic “colorful” treatment.

When the palette earns its place, hand off to \`/impeccable polish\` for the final pass.

## Live-mode signature params

When invoked from live mode, every variant declares a \`color-amount\` parameter. Author CSS against \`var(--p-color-amount, 0.5)\` so the user can move from neutral to the variant's full color strategy without regeneration.

\`\`\`json
{"id":"color-amount","kind":"range","min":0,"max":1,"step":0.05,"default":0.5,"label":"Color amount"}
\`\`\`

Add at most two variant-specific parameters, such as palette, temperature, or tint behavior. Follow [live.md](live.md)'s parameter contract.
`,
  },
  {
    path: "reference/component-review.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Plan and asset review

Use this checkpoint on comp-led builds once every raster region has its plate and the plates gate has scored them, before any page code exists. The approved comp is the reference. The user reviews two things: the plates that will ship, and the production plan for everything else, meaning which regions code draws. A painted region planned as code is the most expensive mistake a comp-led build makes, and this is where the user catches it. Text, controls and chrome are judged later, in the assembled first viewport.

## Plan, capture, serve

Run \`.agent/skills/impeccable/scripts/impeccable component-review plan\`. It writes \`.impeccable/review/components.json\` from the measured spec, the comp and the plate files, and refuses, naming each one, while any raster region lacks its plate. Never write or edit that file for this stage: the packet is derived from the spec, so every change belongs in the regions file.

If the harness exposes \`component_review\`, call it with \`manifest_path\` set to \`.impeccable/review/components.json\`. The host captures, presents the review and returns the user's decisions. A suspended request is waiting for the user; it is not a failed build or an approval.

Otherwise run \`.agent/skills/impeccable/scripts/impeccable component-review capture --manifest .impeccable/review/components.json\`, then start \`.agent/skills/impeccable/scripts/impeccable component-review serve --session <returned session>\` in the background. Open the URL it prints in the available browser and wait for the user; \`serve\` exits 0 once they submit. Read the decisions with \`.agent/skills/impeccable/scripts/impeccable component-review status --session <id>\`; \`.agent/skills/impeccable/scripts/impeccable component-review verify --manifest .impeccable/review/components.json\` confirms approval and refuses pending, needs-work and stale input. Never submit the page or write a receipt on the user's behalf.

\`serve\` exits 2 when this session has no browser (the same signal as the decision page) and 4 when it closes after 30 idle minutes without a decision. Either way no one is reviewing: stop waiting, do not approve anything yourself, and do not build past this checkpoint. End the run and report the plan and asset review as pending with its session ID, so the user can resume it. A waiting review is pending work, not a completed build.

## Act on the receipt

Apply the user's decisions as given, never your own favorable verdict in their place.

- **approve**: once every item is approved and the inventory is confirmed, advance to the hero.
- **revise** (a plate): regenerate that plate at the same path with the user's feedback.
- **revise with split** (an asset): replace that region in the regions file with its layers: a frame plate with a transparent opening (kind \`plate\`, same box), the content as its own \`image\` region at the opening's box, and each moving part (a shutter, a door) as its own plate. Name each layer after the original region, as \`<id>-frame\`, \`<id>-view\` or \`<id>-shutter-left\`, so the next round shows it as part of the user's request. Rerun \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --regions <regions.json>\` and produce the plates.
- **revise** (a plan item): change the regions file as the feedback says (resize or extend a raster region, split material into its own plate region, or adjust the code region), rerun \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --regions <regions.json>\`, and produce any new plates.
- **reclassify** (a code region): in the regions file, change that region's \`kind\` to the one the user chose and rewrite its \`note\` to describe the material. Rerun \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --regions <regions.json>\`, then produce the new plates, with the asset producer when subagents are available.
- **missing**: add the region to the regions file, rerun \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --regions <regions.json>\`, and produce its plate if it is raster.

Then run \`plan\`, \`capture\` and \`serve\` again. Unchanged decisions carry over, so the user sees only what changed. Any spec change, or a plate replaced after acceptance, needs a new round; the build-phase gate stays closed until the review of the current spec is accepted.

## Assemble and review

Build the first viewport from the approved plates and plan, and run the hero gate. Human review does not waive its integrity checks. After three failed hero attempts, or three failed responsive attempts before any first viewport is accepted, stop iterating and present the first-viewport review with the current build; the user's eye settles what the readings could not.

Present a second manifest at \`.impeccable/review/hero.json\`. You write this one, and its shape is fixed:

\`\`\`json
{
  "schemaVersion": 2,
  "stage": "hero",
  "id": "hero",
  "title": "First viewport",
  "comp": {"path": ".impeccable/mocks/comp.png", "width": 1536, "height": 1024},
  "components": [{
    "id": "first-viewport",
    "name": "First viewport",
    "medium": "HTML / CSS",
    "note": "Assembled first viewport",
    "box": {"x": 0, "y": 0, "w": 1, "h": 1},
    "preview": {"kind": "page", "path": "index.html"},
    "dependencies": ["styles.css", "assets/plates/sky.png", "fonts/display.woff2"]
  }]
}
\`\`\`

- \`schemaVersion\` is 2. Version 3 is the plan review packet and requires stage \`components\`. \`codeRegions\` and \`specSha256\` exist only in version 3 and are refused here. \`reviewGroup\` is refused too: version 3 rejects it, and any other version accepts it only on a page preview in a \`components\`-stage manifest, never in a hero manifest.
- \`comp.path\` is the \`comp\` value in \`.impeccable/build/spec.json\`, and \`width\` and \`height\` are that PNG's pixel size.
- Exactly one component, with \`box\` exactly \`{"x": 0, "y": 0, "w": 1, "h": 1}\` and \`name\`, \`medium\` and \`note\` as strings.
- \`preview.path\` is the page entry the build gates (\`artifact\` in \`.impeccable/build/state.json\`).
- \`dependencies\` lists every other file the page loads (stylesheets, scripts, plates, images, fonts) as bare strings. Every path, here and above, is project-relative and plain: no leading \`./\` or \`/\`, no \`..\`, no URL, no \`?\`, \`#\`, \`%\`, \`:\` or backslash. A request to a file missing from this list, or to another host, fails the capture.

The reference stays the approved comp. Call the same host review tool, or run \`capture\`, \`serve\` and \`verify\` with this manifest. Needs-work feedback starts another assembly round.

Acceptance closes human review for this build: never request plan, asset or assembly approval again. While the page renders what the user accepted, the hero score, the palette check and every numeric reading are advisories; material vetoes still hold (a missing or unreferenced plate, an SVG illustration, an organic clip, a clipped plate, invented ink, failed rendered presence). A text, control or chrome region the accepted screenshot also lacks is settled by the acceptance; a plate it lacks is a question for the user that the gate's reason spells out: do not move off what they accepted on your own, but carry out their answer, including placing the plate. When the capture no longer matches the accepted screenshot, restore what the user accepted; until then the readings apply. Complete the rest of the page, responsive behavior, finish checks and documentation with the accepted first viewport as the visual direction. This is first-viewport calibration, not a claim that the user reviewed the rest of the page. Shared stylesheet edits do not reopen approval. Preserve the accepted direction; a later explicit user change is a new task.

Assembled-page capture executes inline and declared local scripts from the pinned inputs. Network APIs, frames and workers are unavailable; the initial viewport must settle before capture. Keep the real page and declare its scripts rather than removing behavior to pass review.
`,
  },
  {
    path: "reference/craft-floor.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Craft floor

Load this after the direction is settled, and build without announcing the checklist. A pinned brief or the committed visual world overrides anything here except a line marked as a ban; your own habit does not. When the design hook is active it already enforces the mechanical checks below as you edit: act on its findings instead of re-auditing each rule.

## Verify

Each of these is a check on the built result, not an intention. Run them together in each batched look at the render, not as separate screenshot trips; the checks share one render.

- **Contrast:** body and placeholder text ≥4.5:1, large text ≥3:1. On colored surfaces tint secondary text from that hue or the foreground; never gray.
- **Depth:** shadows carry an offset and a soft blur. A zero-offset colored halo is decoration.
- **Spacing:** tight groups, generous separation, more space above a heading than below it. Read the computed values.
- **Type:** body measure 65–75ch, display max 6rem, tracking floor -0.04em, balanced headings, obvious scale and weight steps. Run the real copy at every breakpoint and fix what overflows.
- **Motion:** one authored moment, not scattered effects and not one identical entrance on every section. Exponential ease-out from an already-visible default. Reach past transform and opacity: blur, backdrop-filter, clip-path, mask, and shadow belong to the palette when they stay smooth.
- **States:** hover, disabled, loading, error, empty. Plus real content, working controls, responsive composition, keyboard focus.
- **Browser surfaces:** the parts you did not draw still carry the design. Text selection, the caret, custom scrollbars, focus rings, underline offset, and the numerals in tabular data all ship with browser defaults that belong to no design system. Theme them from the palette. This is the cheapest signal that a page was built rather than assembled, and the one models skip most reliably.
- **Copy:** the product's own language. Controls name their action; errors name the problem and the recovery.
- **Coverage:** every brief requirement present and findable within seconds.

## Refuse

These are the category's defaults, not bans: the brief's own words can earn any of them. Reaching for one when the axis is free means you were not deciding; recognizing that means rewriting the element, not softening it.

Page scaffolds:

- Same-size cards of icon plus heading plus text as the page structure. Cards are the lazy container; nested cards are always wrong.
- The hero-metric template: big number, small label, supporting stats, accent.
- A kicker or eyebrow above a heading. This one is a ban, not a default: no brief earns it back. The heading carries its own weight; delete the label and let the heading speak.
- Section numbers (01 / 02 / 03) unless the sequence itself carries information the reader needs.
- A modal for a task that needs neither interruption nor protected focus.

Surface habits:

- Gradient text. Emphasis comes from weight or size.
- Glass and blur as decoration rather than as a specific effect.
- A colored \`border-left\` or \`border-right\` above 1px on cards, list items, callouts, or alerts.
- Hard offset shadows (\`box-shadow: 4px 4px 0\`) outside a world that is actually neobrutalist. The zero-blur block shadow is a costume, not a depth system; a world that did not choose it never earns it as a default.
- Sparklines, progress rings, and soft-shadowed rounded rectangles standing in for content.
- Monospace as a costume for "technical" rather than for code, data, or measurement.
- A system display face (Impact, Arial Black, the platform sans) as the display voice of an own-world page. Source and self-host a face whose character matches the approved lettering; the closest installed font is a failure, not a fallback.
- Unicode glyphs or emoji standing in for an icon system. Icons are drawn, from a real library or authored SVG, in one consistent stroke and weight.
- Geometric masks standing in for organic contours. A circle, polygon, or radial-gradient cutout approximating a photographic subject's edge is the cheap version of the effect and reads worse than omitting it. Derive an alpha matte from the actual image, or produce a cut-out asset.
- Light or dark picked by category. Pick it from the use scene: who, where, under what ambient light.

The floor holds the mechanics; it never picks the direction. With every check green, spend the page on the committed world, and when torn between refined and committed, commit.
`,
  },
  {
    path: "reference/craft.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Craft (deprecated alias)

\`craft\` is a deprecated alias for an ordinary request to make new visual work. It adds no setup, interview, checkpoint, tool, or quality behavior. Apply SKILL.md's normal routing: create missing PRODUCT.md through [init.md](init.md), then follow [new-work.md](new-work.md) for visual authority, world and surface decisions, implementation, and finish.

Do not tell users they need to invoke \`craft\`. Natural requests such as “build this feature,” “make a landing page,” or “redesign this screen” use the same flow.
`,
  },
  {
    path: "reference/critique.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

### Purpose

Resolve one stable target, run two independent assessments, synthesize a design critique, persist a snapshot, and ask the user what to improve next. The chat response is the primary deliverable; the snapshot is an archive of that run.

### Hard Invariants

- Assessment A (design review) and Assessment B (detector/browser evidence) are both required, except on a native platform (see Assessment Orchestration).
- Assessment A and B MUST run as two isolated sub-agents whenever a sub-agent/Task tool is exposed. Running them inline in this context is "possible" but is NOT permitted; it is a degraded run. Inline is allowed ONLY when no sub-agent tool exists (or the user declined, on harnesses that ask). Native platforms run A alone (see Assessment Orchestration).
- If you degrade for any reason, the report's first line MUST be a banner: \`⚠️ DEGRADED: single-context (<reason>)\`. A silent degraded critique is a failed critique.
- Assessment A must finish before detector findings enter the parent synthesis context. Detector output is deterministic, but it still anchors judgment.
- A skipped detector is a failed critique run unless \`impeccable detect\` is missing or crashes after a real attempt, or the platform is native (see Assessment Orchestration).
- Viewable targets require browser inspection when available.
- Any local server started only for critique visualization must run in the background, have a recorded stop method, and be stopped before final reporting unless the user asks to keep it.
- Do not claim a user-visible overlay exists unless script injection succeeded and the detector ran in the page.
- The question is the LAST thing in the response. Write the entire report out first, then ask; nothing follows the question. Prose emitted after a structured question is withheld until the user answers it, so a report written after the question reads as if the critique never ran.
- A run that ends with neither the targeted questions nor a literal \`Questions skipped: <reason>\` line is an incomplete run. The report is not the finish; the close is.

### Setup

1. **Resolve the target** to a concrete file path or URL. Prefer a source path over a dev-server URL when both identify the same surface; ports drift, paths do not.
   - "the homepage" -> \`site/pages/index.astro\` or \`index.html\`
   - "the settings modal" -> the primary component file
   - "this page" -> the current URL or source file
2. **Confirm the target slugs cleanly**:
   \`\`\`bash
   .agent/skills/impeccable/scripts/impeccable critique-storage slug "<resolved-path-or-url>"
   \`\`\`
   Every later command also accepts the resolved target directly and derives the same slug internally; never hand-write a slug. If this exits non-zero, skip persistence and trend for this run, but continue the critique.
3. **Read \`.impeccable/critique/ignore.md\`** if it exists. Drop matching findings silently; it is the only prior-run input critique consumes.

### Assessment Orchestration

**Native platforms** (\`ios\` / \`android\` / \`adaptive\`): Assessment B does not apply, because \`impeccable detect\` and the browser overlay read only web markup. Run Assessment A alone in this context and skip both sub-agent gates below, the Codex permission question included: with no B there is nothing to isolate A from, so this is the complete native method and carries no degraded banner. Do not run \`impeccable detect\` on native source; its empty result reads as clean.

Delegate Assessment A and Assessment B to separate sub-agents. They must not see each other's output. Do not show findings to the user until synthesis.

Sub-agent gate (all harnesses):
- Unless a harness-specific gate below overrides this, spawn A and B as two isolated, parallel sub-agents whenever a sub-agent/Task tool is exposed. This is the default and is mandatory; do not run them inline because it is faster.
- Desktop apps (see **Desktop apps** under Assessment B) are the one exception to parallel: both sub-agents would drive the app's single window at once. Seed the window, spawn A, wait until it has finished and put the window back, then spawn B. They are still two isolated sub-agents, so this is not the degraded path.
- "Unavailable" means exactly one thing: no sub-agent/Task tool is exposed in this session (or, on harnesses that ask, the user declined). It does not mean inconvenient.
- If and only if sub-agents are unavailable, fall back sequentially: finish and record Assessment A, then run Assessment B, then synthesize, and emit the degraded banner.
- Whichever path you take, declare it in the report header (see Report header provenance). Skipping sub-agents without the banner is the most common failure of this command.

If browser automation is available, each assessment creates its own new tab. Never reuse an existing tab, even if it is already at the right URL. Desktop apps are the exception (see **Desktop apps** under Assessment B).

### Assessment A: Design Review

Read relevant source files and visually inspect the live page when browser automation is available. Think like a design director.

Evaluate:
- **Design specificity**: Is the composition, interaction, and visual language grounded in this product, or could an unrelated product use it unchanged? Make this judgment before seeing detector output.
- **Holistic design**: hierarchy, IA, emotional fit, discoverability, composition, typography, color, accessibility, states, copy, and edge cases.
- **Cognitive load**: consult the [Cognitive Load Assessment](#cognitive-load-assessment) section below; report checklist failures and decision points with >4 visible options.
- **Emotional journey**: peak-end rule, emotional valleys, reassurance at high-stakes moments.
- **Nielsen heuristics**: consult the [Heuristics Scoring Guide](#heuristics-scoring-guide) section below; score all 10 heuristics 0-4, marking any heuristic the mode-applicability rule allows as \`n/a\` instead of forcing a number.

Return: design-specificity verdict, heuristic scores, cognitive load, emotional journey, 2-3 strengths, 3-5 priority issues, persona red flags, minor observations, and provocative questions.

### Assessment B: Detector + Browser Evidence

Run the bundled detector and browser visualization evidence. On web, Assessment B is mandatory and must remain isolated from Assessment A until both are complete.

CLI scan:
\`\`\`bash
.agent/skills/impeccable/scripts/impeccable detect --json [target]
\`\`\`

- Pass markup files/directories as \`[target]\`; do not pass CSS-only files.
- For URLs, skip CLI scan and use browser visualization.
- For very large trees (500+ scannable files), narrow scope or ask.
- Exit code 0 = clean; 2 = findings.
- If the detector entrypoint is missing or fails to load, report deterministic scan unavailable and continue with browser/manual review.

Browser visualization is required for a viewable target when browser automation is available. Use a localhost dev/static URL for local files; avoid \`file://\` unless the available browser explicitly supports this workflow. Overlay flow:

1. Create a fresh tab and navigate. Prefer the harness's native/browser-canvas screenshot path before hand-rolling a Playwright/Puppeteer script; only fall back to a custom script when no native browser tool is exposed.
2. Preflight mutable injection by setting \`document.title\` and appending a \`<script>\` tag. Read-only evaluate APIs do not count.
3. If mutation is unavailable, skip live server, browser presentation, and injection; report fallback signal.
4. If mutation is available, start \`.agent/skills/impeccable/scripts/impeccable live-server --background\`, present the browser if supported, label \`[Human]\`, scroll top, inject \`http://localhost:PORT/detect.js\`, wait 2-3 seconds, read \`impeccable\` console messages, then run \`.agent/skills/impeccable/scripts/impeccable live-server stop --keep-inject\`. The overlay went in through the browser, so the project's HTML has no script tag to strip; a bare \`stop\` also runs \`live-inject --remove\` against the project's entry file, an edit a read-only critique should not make.
5. For multi-view targets, inject on 3-5 representative pages.

**Desktop apps** (Electron, NW.js, CEF, WebView2): there is no URL to open, so Assessment B attaches to the running app instead.

1. Launch the app with a local DevTools port: \`--remote-debugging-port=9222\` (Electron, NW.js, CEF), or \`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222\` for WebView2. Keep the port on 127.0.0.1 and never expose it beyond this machine; prefer a test profile and test data.
2. Seed the state under review (route, open panel, theme, data). The scan reads the window as it stands. Keep the window on screen: a minimized or hidden window scans without the pixel contrast reads.
3. Run \`.agent/skills/impeccable/scripts/impeccable detect --cdp 9222 --target <part of the page URL or title> --json\`. It returns the same JSON as a URL scan and leaves the page as found. With several pages open it fails and lists them; rerun with a \`--target\` that names one.
4. Take screenshots through the harness's CDP tooling (\`Page.captureScreenshot\` on the same target). Skip the live-server overlay: there is no \`[Human]\` tab.

The app has one window, so the assessments take turns in it instead of opening tabs (A, then B; see the sub-agent gate), and each must leave it as found: put back any route, scroll, theme, or panel it changed. Tauri on macOS (WKWebView) and on Linux (WebKitGTK) expose no CDP: run Assessment A and the source scan only, and say so in Run Notes.

Return: CLI findings JSON/counts, browser console findings if applicable, false positives, and skipped/failed browser steps with concrete reasons.

After Assessment B returns usable CLI findings, reuse them. Do not rerun \`impeccable detect\` in the parent unless Assessment B failed, was truncated, or omitted count, rule names, or file locations.

### Generate Combined Critique Report

Synthesize both assessments into a single report. Do not simply concatenate. Weave the findings together, noting where the LLM review and detector agree, where the detector caught issues the LLM missed, and where detector findings are false positives.

The chat response is the primary user-facing deliverable. Present the full structured critique below in chat; do not replace it with a summary and a link. The persisted snapshot is an archive of that run.

Structure your feedback as a design director would:

#### Report header provenance

The report's first line MUST declare how the assessments were run, so a degraded run is never silent:
- Dual-agent: \`Method: dual-agent (A: <agent-id> · B: <agent-id>)\`
- Degraded: \`⚠️ DEGRADED: single-context (<reason, e.g. no sub-agent tool exposed>)\`
- Native: \`Method: design review only (detector not applicable, native platform)\`

#### Design Health Score
> *Consult the [Heuristics Scoring Guide](#heuristics-scoring-guide) section below.*

Present the Nielsen's 10 heuristics scores as a table:

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | ? | [specific finding or "n/a" if solid] |
| 2 | Match System / Real World | ? | |
| 3 | User Control and Freedom | ? | |
| 4 | Consistency and Standards | ? | |
| 5 | Error Prevention | ? | |
| 6 | Recognition Rather Than Recall | ? | |
| 7 | Flexibility and Efficiency | ? | |
| 8 | Aesthetic and Minimalist Design | ? | |
| 9 | Error Recovery | ? | |
| 10 | Help and Documentation | ? | |
| **Total** | | **??/[applicable max]** | **[Rating band]** |

The applicable maximum is 4 times the number of heuristics you actually scored: **/40** when all ten apply, **/32** when two are \`n/a\`. Never print \`/40\` over a partial set.

Be honest with scores. A 4 means genuinely excellent. Most real interfaces score 20-32 out of 40.

**Mode applicability**: heuristics 7 (Flexibility and Efficiency) and 10 (Help and Documentation) may be scored \`n/a\` on Persuade and Experience surfaces (landing pages, campaigns, portfolios, bodies of work), as may any other heuristic that genuinely cannot apply to the surface under review. Write \`n/a\` in the Score cell with a one-line reason, and renormalize the total to the applicable maximum (e.g. **24/32** when two heuristics are n/a) so the rating band stays proportional. The persisted snapshot must record the applicable maximum and which heuristics were scored n/a.

#### Design Specificity Verdict

**Start here.** Does the result feel authored for this product, or category-interchangeable?

**LLM assessment**: Your unanchored evaluation of design specificity. Cover overall coherence, structural sameness, category-interchangeable choices, and missed opportunities for product character.

**Deterministic scan**: Summarize what the automated detector found, with counts and file locations. Note any additional issues the detector caught that you missed, and flag any false positives. On a native platform, write \`not applicable (native platform)\` instead.

**Visual overlays** (if injection succeeded): Tell the user that overlays are now visible in the **[Human]** tab in their browser, highlighting the detected issues. Summarize what the console output reported. If browser visualization was attempted but injection failed, say that no reliable user-visible overlay is available and report the fallback signal instead.

#### Overall Impression
A brief gut reaction: what works, what doesn't, and the single biggest opportunity.

#### What's Working
Highlight 2-3 things done well. Be specific about why they work.

#### Priority Issues
The 3-5 most impactful design problems, ordered by importance.

For each issue, tag with **P0-P3 severity** (see [Issue Severity below](#issue-severity-p0p3) for definitions):
- **[P?] What**: Name the problem clearly
- **Why it matters**: How this hurts users or undermines goals
- **Fix**: What to do about it (be concrete)
- **Suggested command**: Which command could address this (from: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset)

#### Persona Red Flags
> *Consult the [Personas reference](#persona-based-design-testing) below.*

Auto-select 2-3 personas most relevant to this interface type (use the selection table in the reference). If \`AGENTS.md\` contains a \`## Design Context\` section from \`impeccable init\`, also generate 1-2 project-specific personas from the audience/brand info.

For each selected persona, walk through the primary user action and list specific red flags found:

**Alex (Power User)**: No keyboard shortcuts detected. Form requires 8 clicks for primary action. Forced modal onboarding. High abandonment risk.

**Jordan (First-Timer)**: Icon-only nav in sidebar. Technical jargon in error messages ("404 Not Found"). No visible help. Will abandon at step 2.

Be specific. Name the exact elements and interactions that fail each persona. Don't write generic persona descriptions; write what broke for them.

#### Minor Observations
Quick notes on smaller issues worth addressing.

#### Questions to Consider
Provocative questions that might unlock better solutions:
- "What if the primary action were more prominent?"
- "Does this need to feel this complex?"
- "What would a confident version of this look like?"

**Remember**:
- Be direct. Vague feedback wastes everyone's time.
- Be specific. "The submit button," not "some elements."
- Say what's wrong AND why it matters to users.
- Give concrete suggestions. Cut "consider exploring..." entirely.
- Prioritize ruthlessly. If everything is important, nothing is.
- Don't soften criticism. Developers need honest feedback to ship great design.

### Deliver the Report

Write the full report into the chat response now, before any persistence work. This is the deliverable; everything below it is bookkeeping.

Do this first because the alternative is the most common way this command fails: the report gets composed once, straight into the persistence heredoc, and the run ends with a perfect archive nobody has read. Composing it into a file is not delivering it. If the report exists only in \`.impeccable/critique/\`, the run produced nothing.

Persistence is not the end of the run. After it, the response continues with the trend line and the close.

### Persist the Snapshot

Once the report above is finalized, write it to \`.impeccable/critique/\` so the user can refer back, and so \`/impeccable polish\` can pick up the priority issues without a copy-paste.

Skip this step if the Setup slug was null (vague or root-level target).

1. **Write the body to a temp file** so you can pipe it to the helper. Use the full critique report (heuristic table, design-specificity verdict, priority issues, persona red flags, minor observations, and questions), but stop before the "Ask the User" / "Recommended Actions" sections that come later.

   This is a copy of the report you already delivered above, for later commands to read. It is not delivery. If you find yourself composing the report for the first time inside this heredoc, you have skipped Deliver the Report; go back and send it.

2. **Pass the structured metadata** through \`IMPECCABLE_CRITIQUE_META\` (JSON), then run the write command:
   \`\`\`bash
   IMPECCABLE_CRITIQUE_META='{"target":"<user phrasing>","total_score":<n>,"max_score":<n>,"na_heuristics":"<comma-separated numbers, or empty>","p0_count":<n>,"p1_count":<n>}' \\
     .agent/skills/impeccable/scripts/impeccable critique-storage write "<resolved target>" <body-file>
   \`\`\`
   \`max_score\` is the applicable maximum from the heuristic table (40 when every heuristic applied), so a later run can tell a renormalized total from a full one. For a local file target, the helper also records an exact content fingerprint so polish can distinguish the assessed bytes from later edits without relying on Git state or timestamps. The helper prints the absolute path it wrote. Leave that file on disk. Polish closes it; this run does not.

3. **Delete the temp body file** after the write attempt completes, whether the write succeeded or failed. If deletion fails, mention \`temp-file cleanup failed: <reason>\` briefly in the final output, but do not block the critique.

4. **Read the trend** for context:
   \`\`\`bash
   .agent/skills/impeccable/scripts/impeccable critique-storage trend "<resolved target>" 5
   \`\`\`
   This returns a JSON array of the last 5 frontmatter entries (including the one you just wrote).

5. **Append a single line to the user-visible output**, after the report and before the questions:

   > **Trend for \`<slug>\` (last 5 runs): 24 → 28 → 32 → 29 → 32 (out of 40)**
   > Wrote \`.impeccable/critique/<filename>\`.

   Read \`max_score\` on each trend entry. When every entry shares one maximum, state it once as above. When they differ, print each score with its own denominator (\`24/32 → 30/40\`) and note that the runs scored different heuristic sets, so the line is not a like-for-like comparison. Treat a missing \`max_score\` on an older entry as 40.

   If this is the first run for the slug, the trend is just one score; say so: "First run for this target, no trend yet."

6. **Close the run.** Go to Ask the User below and emit the questions, or the \`Questions skipped: <reason>\` line when the count allows it. The run is not complete until you do. Persistence is bookkeeping and cleanup is not an ending; stopping here leaves the user with a report and no way forward, and leaves \`/impeccable polish\` with no priorities to inherit.

This is fire-and-forget. Do not show the user the helper's JSON output; only the human-readable trend line and the written path. Failures here should not block the rest of the flow; print the error and move on.

### Ask the User

**After presenting findings**, use targeted questions based on what was actually found. Ask the user directly to clarify what you cannot infer. These answers will shape the action plan.

Ask in the same message that carries the report, with the report written out first and the question last. Do not split the two across turns: a turn that ends on the report is a turn that ends, and the questions never arrive. Order within the message is what matters, because prose emitted after a structured question is withheld until the user answers.

Ask questions along these lines (adapt to the specific findings; do not ask generic questions):

1. **Priority direction**: Based on the issues found, ask which category matters most to the user right now. For example: "I found problems with visual hierarchy, color usage, and information overload. Which area should we tackle first?" Offer the top 2-3 issue categories as options.

2. **Design intent**: If the critique found a tonal mismatch, ask whether it was intentional. For example: "The interface feels clinical and corporate. Is that the intended tone, or should it feel warmer/bolder/more playful?" Offer 2-3 tonal directions as options based on what would fix the issues found.

3. **Scope**: Ask how much the user wants to take on. For example: "I found N issues. Want to address everything, or focus on the top 3?" Offer scope options like "Top 3 only", "All issues", "Critical issues only".

4. **Constraints** (optional; only ask if relevant): If the findings touch many areas, ask if anything is off-limits. For example: "Should any sections stay as-is?" This prevents the plan from touching things the user considers done.

**Rules for questions**:
- Every question must reference specific findings from the report. Never ask generic "who is your audience?" questions.
- Keep it to 2-4 questions maximum. Respect the user's time.
- Offer concrete options, not open-ended prompts.
- Skipping is allowed only when the report listed **fewer than 3 Priority Issues**. Count them; do not judge the findings "straightforward" by feel. At 3 or more, the questions are required.

**Final-question gate.** The user-visible response must either include the targeted questions or carry the literal line \`Questions skipped: <reason>\` naming the count that permitted the skip. Each question must include 2-3 concrete answer options tied to the actual critique findings. Do not end with only open-ended questions, and do not end with neither: stopping after the report, having asked nothing and printed no skip line, is the most common way this command fails.

### Recommended Actions

**After receiving the user's answers**, present a prioritized action summary reflecting the user's priorities and scope from Ask the User.

#### Action Summary

List recommended commands in priority order, based on the user's answers:

1. **\`/command-name\`**: Brief description of what to fix (specific context from critique findings)
2. **\`/command-name\`**: Brief description (specific context)
...

**Rules for recommendations**:
- Only recommend commands from: /impeccable adapt, /impeccable animate, /impeccable audit, /impeccable bolder, /impeccable clarify, /impeccable colorize, /impeccable critique, /impeccable delight, /impeccable distill, /impeccable document, /impeccable harden, /impeccable layout, /impeccable onboard, /impeccable optimize, /impeccable overdrive, /impeccable polish, /impeccable quieter, /impeccable shape, /impeccable typeset
- Order by the user's stated priorities first, then by impact
- Each item's description should carry enough context that the command knows what to focus on
- Map each Priority Issue to the appropriate command
- Skip commands that would address zero issues
- If the user chose a limited scope, only include items within that scope
- If the user marked areas as off-limits, exclude commands that would touch those areas
- End with \`/impeccable polish\` as the final step if any fixes were recommended

After presenting the summary, tell the user:

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run \`/impeccable critique\` after fixes to see your score improve.

---

## Reference Material

The sections below were previously separate reference files (\`cognitive-load.md\`, \`heuristics-scoring.md\`, \`personas.md\`). They live inline now so the critique flow has all its deep context in one place.

### Cognitive Load Assessment

Cognitive load is the total mental effort required to use an interface. Overloaded users make mistakes, get frustrated, and leave. This reference helps identify and fix cognitive overload.

---

#### Three Types of Cognitive Load

##### Intrinsic Load: The Task Itself
Complexity inherent to what the user is trying to do. You can't eliminate this, but you can structure it.

**Manage it by**:
- Breaking complex tasks into discrete steps
- Providing scaffolding (templates, defaults, examples)
- Progressive disclosure: show what's needed now, hide the rest
- Grouping related decisions together

##### Extraneous Load: Bad Design
Mental effort caused by poor design choices. **Eliminate this ruthlessly.** It's pure waste.

**Common sources**:
- Confusing navigation that requires mental mapping
- Unclear labels that force users to guess meaning
- Visual clutter competing for attention
- Inconsistent patterns that prevent learning
- Unnecessary steps between user intent and result

##### Germane Load: Learning Effort
Mental effort spent building understanding. This is *good* cognitive load; it leads to mastery.

**Support it by**:
- Progressive disclosure that reveals complexity gradually
- Consistent patterns that reward learning
- Feedback that confirms correct understanding
- Onboarding that teaches through action, not walls of text

---

#### Cognitive Load Checklist

Evaluate the interface against these 8 items:

- [ ] **Single focus**: Can the user complete their primary task without distraction from competing elements?
- [ ] **Chunking**: Is information presented in digestible groups (≤4 items per group)?
- [ ] **Grouping**: Are related items visually grouped together (proximity, borders, shared background)?
- [ ] **Visual hierarchy**: Is it immediately clear what's most important on the screen?
- [ ] **One thing at a time**: Can the user focus on a single decision before moving to the next?
- [ ] **Minimal choices**: Are decisions simplified (≤4 visible options at any decision point)?
- [ ] **Working memory**: Does the user need to remember information from a previous screen to act on the current one?
- [ ] **Progressive disclosure**: Is complexity revealed only when the user needs it?

**Scoring**: Count the failed items. 0–1 failures = low cognitive load (good). 2–3 = moderate (address soon). 4+ = high cognitive load (critical fix needed).

---

#### The Working Memory Rule

**Humans can hold ≤4 items in working memory at once** (Miller's Law revised by Cowan, 2001).

At any decision point, count the number of distinct options, actions, or pieces of information a user must simultaneously consider:
- **≤4 items**: Within working memory limits, manageable
- **5–7 items**: Pushing the boundary; consider grouping or progressive disclosure
- **8+ items**: Overloaded; users will skip, misclick, or abandon

**Practical applications**:
- Action buttons: 1 primary, 1–2 secondary, group the rest in a menu
- Navigation menus: ≤5 top-level items (group the rest under clear categories)
- Long-form articles: one reading path; gather related links into a single block at the end instead of scattering them mid-flow
- Documentation sidebars: ≤4 sibling choices visible per level before grouping kicks in
- Portfolio and gallery indexes: one decision per screen (which piece to open), not filter, sort, and tag controls all at once

---

#### Common Cognitive Load Violations

##### 1. The Wall of Options
**Problem**: Presenting 10+ choices at once with no hierarchy.
**Fix**: Group into categories, highlight recommended, use progressive disclosure.

##### 2. The Memory Bridge
**Problem**: User must remember info from step 1 to complete step 3.
**Fix**: Keep relevant context visible, or repeat it where it's needed.

##### 3. The Hidden Navigation
**Problem**: User must build a mental map of where things are.
**Fix**: Always show current location (breadcrumbs, active states, progress indicators).

##### 4. The Jargon Barrier
**Problem**: Technical or domain language forces translation effort.
**Fix**: Use plain language. If domain terms are unavoidable, define them inline.

##### 5. The Visual Noise Floor
**Problem**: Every element has the same visual weight; nothing stands out.
**Fix**: Establish clear hierarchy: one primary element, 2–3 secondary, everything else muted.

##### 6. The Inconsistent Pattern
**Problem**: Similar actions work differently in different places.
**Fix**: Standardize interaction patterns. Same type of action = same type of UI.

##### 7. The Multi-Task Demand
**Problem**: Interface requires processing multiple simultaneous inputs (reading + deciding + navigating).
**Fix**: Sequence the steps. Let the user do one thing at a time.

##### 8. The Context Switch
**Problem**: User must jump between screens/tabs/modals to gather info for a single decision.
**Fix**: Co-locate the information needed for each decision. Reduce back-and-forth.

---

### Heuristics Scoring Guide

Score each of Nielsen's 10 Usability Heuristics on a 0–4 scale. Be honest: a 4 means genuinely excellent, not "good enough."

#### Nielsen's 10 Heuristics

##### 1. Visibility of System Status

Keep users informed about what's happening through timely, appropriate feedback.

**Check for**:
- Loading indicators during async operations
- Confirmation of user actions (save, submit, delete)
- Progress indicators for multi-step processes
- Current location in navigation (breadcrumbs, active states)
- Form validation feedback (inline, not just on submit)

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | No feedback; user is guessing what happened |
| 1 | Rare feedback; most actions produce no visible response |
| 2 | Partial; some states communicated, major gaps remain |
| 3 | Good; most operations give clear feedback, minor gaps |
| 4 | Excellent; every action confirms, progress is always visible |

##### 2. Match Between System and Real World

Speak the user's language. Follow real-world conventions. Information appears in natural, logical order.

**Check for**:
- Familiar terminology (no unexplained jargon)
- Logical information order matching user expectations
- Recognizable icons and metaphors
- Domain-appropriate language for the target audience
- Natural reading flow (left-to-right, top-to-bottom priority)

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Pure tech jargon, alien to users |
| 1 | Mostly confusing; requires domain expertise to navigate |
| 2 | Mixed; some plain language, some jargon leaks through |
| 3 | Mostly natural; occasional term needs context |
| 4 | Speaks the user's language fluently throughout |

##### 3. User Control and Freedom

Users need a clear "emergency exit" from unwanted states without extended dialogue.

**Check for**:
- Undo/redo functionality
- Cancel buttons on forms and modals
- Clear navigation back to safety (home, previous)
- Easy way to clear filters, search, selections
- Escape from long or multi-step processes

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Users get trapped; no way out without refreshing |
| 1 | Difficult exits; must find obscure paths to escape |
| 2 | Some exits; main flows have escape, edge cases don't |
| 3 | Good control; users can exit and undo most actions |
| 4 | Full control; undo, cancel, back, and escape everywhere |

##### 4. Consistency and Standards

Users shouldn't wonder whether different words, situations, or actions mean the same thing.

**Check for**:
- Consistent terminology throughout the interface
- Same actions produce same results everywhere
- Platform conventions followed (standard UI patterns)
- Visual consistency (colors, typography, spacing, components)
- Consistent interaction patterns (same gesture = same behavior)

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Inconsistent everywhere; feels like different products stitched together |
| 1 | Many inconsistencies; similar things look/behave differently |
| 2 | Partially consistent; main flows match, details diverge |
| 3 | Mostly consistent; occasional deviation, nothing confusing |
| 4 | Fully consistent; cohesive system, predictable behavior |

##### 5. Error Prevention

Better than good error messages is a design that prevents problems in the first place.

**Check for**:
- Confirmation before destructive actions (delete, overwrite)
- Constraints preventing invalid input (date pickers, dropdowns)
- Smart defaults that reduce errors
- Clear labels that prevent misunderstanding
- Autosave and draft recovery

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Errors easy to make; no guardrails anywhere |
| 1 | Few safeguards; some inputs validated, most aren't |
| 2 | Partial prevention; common errors caught, edge cases slip |
| 3 | Good prevention; most error paths blocked proactively |
| 4 | Excellent; errors nearly impossible through smart constraints |

##### 6. Recognition Rather Than Recall

Minimize memory load. Make objects, actions, and options visible or easily retrievable.

**Check for**:
- Visible options (not buried in hidden menus)
- Contextual help when needed (tooltips, inline hints)
- Recent items and history
- Autocomplete and suggestions
- Labels on icons (not icon-only navigation)

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Heavy memorization; users must remember paths and commands |
| 1 | Mostly recall; many hidden features, few visible cues |
| 2 | Some aids; main actions visible, secondary features hidden |
| 3 | Good recognition; most things discoverable, few memory demands |
| 4 | Everything discoverable; users never need to memorize |

##### 7. Flexibility and Efficiency of Use

Accelerators, invisible to novices, speed up expert interaction.

**Check for**:
- Keyboard shortcuts for common actions
- Customizable interface elements
- Recent items and favorites
- Bulk/batch actions
- Power user features that don't complicate the basics

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | One rigid path; no shortcuts or alternatives |
| 1 | Limited flexibility; few alternatives to the main path |
| 2 | Some shortcuts; basic keyboard support, limited bulk actions |
| 3 | Good accelerators; keyboard nav, some customization |
| 4 | Highly flexible; multiple paths, power features, customizable |

##### 8. Aesthetic and Minimalist Design

Interfaces should not contain irrelevant or rarely needed information. Every element should serve a purpose.

**Check for**:
- Only necessary information visible at each step
- Clear visual hierarchy directing attention
- Purposeful use of color and emphasis
- No decorative clutter competing for attention
- Focused, uncluttered layouts

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Overwhelming; everything competes for attention equally |
| 1 | Cluttered; too much noise, hard to find what matters |
| 2 | Some clutter; main content clear, periphery noisy |
| 3 | Mostly clean; focused design, minor visual noise |
| 4 | Perfectly minimal; every element earns its pixel |

##### 9. Help Users Recognize, Diagnose, and Recover from Errors

Error messages should use plain language, precisely indicate the problem, and constructively suggest a solution.

**Check for**:
- Plain language error messages (no error codes for users)
- Specific problem identification ("Email is missing @" not "Invalid input")
- Actionable recovery suggestions
- Errors displayed near the source of the problem
- Non-blocking error handling (don't wipe the form)

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | Cryptic errors; codes, jargon, or no message at all |
| 1 | Vague errors; "Something went wrong" with no guidance |
| 2 | Clear but unhelpful; names the problem but not the fix |
| 3 | Clear with suggestions; identifies problem and offers next steps |
| 4 | Perfect recovery; pinpoints issue, suggests fix, preserves user work |

##### 10. Help and Documentation

Even if the system is usable without docs, help should be easy to find, task-focused, and concise.

**Check for**:
- Searchable help or documentation
- Contextual help (tooltips, inline hints, guided tours)
- Task-focused organization (not feature-organized)
- Concise, scannable content
- Easy access without leaving current context

**Scoring**:
| Score | Criteria |
|-------|----------|
| 0 | No help available anywhere |
| 1 | Help exists but hard to find or irrelevant |
| 2 | Basic help; FAQ or docs exist, not contextual |
| 3 | Good documentation; searchable, mostly task-focused |
| 4 | Excellent contextual help; right info at the right moment |

---

#### Score Summary

**Total possible**: 40 points (10 heuristics × 4 max)

| Score Range | Rating | What It Means |
|-------------|--------|---------------|
| 36–40 | Excellent | Minor polish only; ship it |
| 28–35 | Good | Address weak areas, solid foundation |
| 20–27 | Acceptable | Significant improvements needed before users are happy |
| 12–19 | Poor | Major UX overhaul required; core experience broken |
| 0–11 | Critical | Redesign needed; unusable in current state |

When heuristics were scored \`n/a\`, the maximum is lower than 40; read the band off the percentage instead of the raw number (90%+ Excellent, 70%+ Good, 50%+ Acceptable, 30%+ Poor, below that Critical). 24/32 is 75%, so Good.

---

#### Issue Severity (P0–P3)

Tag each individual issue found during scoring with a priority level:

| Priority | Name | Description | Action |
|----------|------|-------------|--------|
| **P0** | Blocking | Prevents task completion entirely | Fix immediately; this is a showstopper |
| **P1** | Major | Causes significant difficulty or confusion | Fix before release |
| **P2** | Minor | Annoyance, but workaround exists | Fix in next pass |
| **P3** | Polish | Nice-to-fix, no real user impact | Fix if time permits |

**Tip**: If you're unsure between two levels, ask: "Would a user contact support about this?" If yes, it's at least P1.

---

### Persona-Based Design Testing

Test the interface through the eyes of 5 distinct user archetypes. Each persona exposes different failure modes that a single "design director" perspective would miss.

**How to use**: Select 2–3 personas most relevant to the interface being critiqued. Walk through the primary user action as each persona. Report specific red flags, not generic concerns.

---

#### 1. Impatient Power User: "Alex"

**Profile**: Expert with similar products. Expects efficiency, hates hand-holding. Will find shortcuts or leave.

**Behaviors**:
- Skips all onboarding and instructions
- Looks for keyboard shortcuts immediately
- Tries to bulk-select, batch-edit, and automate
- Gets frustrated by required steps that feel unnecessary
- Abandons if anything feels slow or patronizing

**Test Questions**:
- Can Alex complete the core task in under 60 seconds?
- Are there keyboard shortcuts for common actions?
- Can onboarding be skipped entirely?
- Do modals have keyboard dismiss (Esc)?
- Is there a "power user" path (shortcuts, bulk actions)?

**Red Flags** (report these specifically):
- Forced tutorials or unskippable onboarding
- No keyboard navigation for primary actions
- Slow animations that can't be skipped
- One-item-at-a-time workflows where batch would be natural
- Redundant confirmation steps for low-risk actions

---

#### 2. Confused First-Timer: "Jordan"

**Profile**: Never used this type of product. Needs guidance at every step. Will abandon rather than figure it out.

**Behaviors**:
- Reads all instructions carefully
- Hesitates before clicking anything unfamiliar
- Looks for help or support constantly
- Misunderstands jargon and abbreviations
- Takes the most literal interpretation of any label

**Test Questions**:
- Is the first action obviously clear within 5 seconds?
- Are all icons labeled with text?
- Is there contextual help at decision points?
- Does terminology assume prior knowledge?
- Is there a clear "back" or "undo" at every step?

**Red Flags** (report these specifically):
- Icon-only navigation with no labels
- Technical jargon without explanation
- No visible help option or guidance
- Ambiguous next steps after completing an action
- No confirmation that an action succeeded

---

#### 3. Accessibility-Dependent User: "Sam"

**Profile**: Uses screen reader (VoiceOver/NVDA), keyboard-only navigation. May have low vision, motor impairment, or cognitive differences.

**Behaviors**:
- Tabs through the interface linearly
- Relies on ARIA labels and heading structure
- Cannot see hover states or visual-only indicators
- Needs adequate color contrast (4.5:1 minimum)
- May use browser zoom up to 200%

**Test Questions**:
- Can the entire primary flow be completed keyboard-only?
- Are all interactive elements focusable with visible focus indicators?
- Do images have meaningful alt text?
- Is color contrast WCAG AA compliant (4.5:1 for text)?
- Does the screen reader announce state changes (loading, success, errors)?

**Red Flags** (report these specifically):
- Click-only interactions with no keyboard alternative
- Missing or invisible focus indicators
- Meaning conveyed by color alone (red = error, green = success)
- Unlabeled form fields or buttons
- Time-limited actions without extension option
- Custom components that break screen reader flow

---

#### 4. Deliberate Stress Tester: "Riley"

**Profile**: Methodical user who pushes interfaces beyond the happy path. Tests edge cases, tries unexpected inputs, and probes for gaps in the experience.

**Behaviors**:
- Tests edge cases intentionally (empty states, long strings, special characters)
- Submits forms with unexpected data (emoji, RTL text, very long values)
- Tries to break workflows by navigating backwards, refreshing mid-flow, or opening in multiple tabs
- Looks for inconsistencies between what the UI promises and what actually happens
- Documents problems methodically

**Test Questions**:
- What happens at the edges (0 items, 1000 items, very long text)?
- Do error states recover gracefully or leave the UI in a broken state?
- What happens on refresh mid-workflow? Is state preserved?
- Are there features that appear to work but produce broken results?
- How does the UI handle unexpected input (emoji, special chars, paste from Excel)?

**Red Flags** (report these specifically):
- Features that appear to work but silently fail or produce wrong results
- Error handling that exposes technical details or leaves UI in a broken state
- Empty states that show nothing useful ("No results" with no guidance)
- Workflows that lose user data on refresh or navigation
- Inconsistent behavior between similar interactions in different parts of the UI

---

#### 5. Distracted Mobile User: "Casey"

**Profile**: Using phone one-handed on the go. Frequently interrupted. Possibly on a slow connection.

**Behaviors**:
- Uses thumb only; prefers bottom-of-screen actions
- Gets interrupted mid-flow and returns later
- Switches between apps frequently
- Has limited attention span and low patience
- Types as little as possible, prefers taps and selections

**Test Questions**:
- Are primary actions in the thumb zone (bottom half of screen)?
- Is state preserved if the user leaves and returns?
- Does it work on slow connections (3G)?
- Can forms use autocomplete and smart defaults?
- Are touch targets at least 44×44pt?

**Red Flags** (report these specifically):
- Important actions positioned at the top of the screen (unreachable by thumb)
- No state persistence; progress lost on tab switch or interruption
- Large text inputs required where selection would work
- Heavy assets loading on every page (no lazy loading)
- Tiny tap targets or targets too close together

---

#### Selecting Personas

Choose personas based on the interface type:

| Interface Type | Primary Personas | Why |
|---------------|-----------------|-----|
| Landing page / marketing | Jordan, Riley, Casey | First impressions, trust, mobile |
| Dashboard / admin | Alex, Sam | Power users, accessibility |
| E-commerce / checkout | Casey, Riley, Jordan | Mobile, edge cases, clarity |
| Onboarding flow | Jordan, Casey | Confusion, interruption |
| Data-heavy / analytics | Alex, Sam | Efficiency, keyboard nav |
| Form-heavy / wizard | Jordan, Sam, Casey | Clarity, accessibility, mobile |

---

#### Project-Specific Personas

If \`AGENTS.md\` contains a \`## Design Context\` section (generated by \`impeccable init\`), derive 1–2 additional personas from the audience and brand information:

1. Read the target audience description
2. Identify the primary user archetype not covered by the 5 predefined personas
3. Create a persona following this template:

\`\`\`
##### [Role]: "[Name]"

**Profile**: [2-3 key characteristics derived from Design Context]

**Behaviors**: [3-4 specific behaviors based on the described audience]

**Red Flags**: [3-4 things that would alienate this specific user type]
\`\`\`

Only generate project-specific personas when real Design Context data is available. Don't invent audience details; use the 5 predefined personas when no context exists.
`,
  },
  {
    path: "reference/delight.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: the brand's emotional range.

Make the experience memorable at moments that earn it. Delight is not a layer of generic whimsy; it is product character revealed through a useful interaction, a humane response, or an unexpectedly considered detail.

---

## Visitor mode

- **Persuade + Experience:** personality may run through voice, composition, motion, and discovery, provided the artifact remains the focus.
- **Operate + Read:** concentrate delight at meaningful moments such as first use, completion, recovery, or mastery. Reliability carries everything else.

## Find the opportunity

Inspect the target, DESIGN.md, product voice, repeated-use frequency, and emotional context. Look for:

- effort worth acknowledging;
- waiting that can become informative;
- an empty or first-use state that can orient;
- an error or recovery moment that needs empathy;
- an interaction whose physical or verbal response could express the brand;
- a useful capability people might enjoy discovering.

Do not manufacture a celebration for an ordinary click. Ask only when the brand's emotional range or the stakes cannot be inferred.

## Define one delight thesis

State in one sentence what the user should feel and why that feeling belongs to this product. Then choose the smallest system that can deliver it:

- a distinctive response to a meaningful action;
- product-specific language that clarifies while carrying voice;
- an interaction or transition with a recognizable material behavior;
- an illustration, sound, haptic, or environmental detail grounded in the product world;
- a discovery reward that reveals real utility.

Derive the treatment from product mechanism and visual world, not a stock catalog.

## Build for the emotional moment

- **Success:** match the response to the effort and consequence. Major milestones can expand; routine saves should simply feel certain.
- **Waiting:** show truthful progress, useful context, or product-specific activity. Never fake work or delay completion to stage a flourish.
- **Empty and first use:** make the next action clear before adding personality.
- **Error and recovery:** lead with the problem and recovery. Warmth may reduce stress; jokes must not trivialize loss, money, privacy, or blocked work.
- **Repeated interaction:** keep the response satisfying after the hundredth use. Variation is useful only when it remains coherent and predictable enough to trust.
- **Discovery:** reward curiosity without hiding required functionality.

Copy must use the product's language. Generic whimsy is worse than neutral clarity.

## Protect the experience

Delight must not:

- delay, block, or obscure the primary task;
- override platform conventions or accessibility;
- add unrequested factual claims;
- play sound without consent or ignore mute settings;
- become mandatory, unskippable, or exhausting on repeat;
- add a dependency or asset cost disproportionate to the moment.

For authored motion, load [animate.md](animate.md). Respect screen readers, keyboard use, touch, localization, and cultural context. Nonessential loops stop when hidden. Make celebration intensity proportional to frequency and consequence.

## Verify

- The moment is specific enough that a neighboring product could not use it unchanged.
- It improves comprehension, confidence, motivation, or emotional recovery.
- The interface remains fast and obvious without the flourish.
- Repetition does not turn charm into friction.
- Muted, keyboard, touch, and localized paths work.
- The result feels like the selected world, not a generic “delight” treatment.

When the personality feels earned, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/distill.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Strip a design to its essence. Remove anything that doesn't earn its place: redundant elements, repeated information, decorative noise, cosmetic complexity.


---

## Assess Current State

Analyze what makes the design feel complex or cluttered:

1. **Identify complexity sources**:
   - **Too many elements**: Competing buttons, redundant information, visual clutter
   - **Excessive variation**: Too many colors, fonts, sizes, styles without purpose
   - **Information overload**: Everything visible at once, no progressive disclosure
   - **Visual noise**: Unnecessary borders, shadows, backgrounds, decorations
   - **Confusing hierarchy**: Unclear what matters most
   - **Feature creep**: Too many options, actions, or paths forward

2. **Find the essence**:
   - What's the primary user goal? (There should be ONE)
   - What's actually necessary vs nice-to-have?
   - What can be removed, hidden, or combined?
   - What's the 20% that delivers 80% of value?

If any of these are unclear from the codebase, do not guess. Ask the user directly to clarify what you cannot infer.

Simplicity is not about removing features. It's about removing obstacles between users and their goals. Every element should justify its existence.

## Plan Simplification

Create a ruthless editing strategy:

- **Core purpose**: What's the ONE thing this should accomplish?
- **Essential elements**: What's truly necessary to achieve that purpose?
- **Progressive disclosure**: What can be hidden until needed?
- **Consolidation opportunities**: What can be combined or integrated?

Expect to say no to good ideas to make room for great execution.

## Simplify the Design

Systematically remove complexity across these dimensions:

### Information Architecture
- **Reduce scope**: Remove secondary actions, redundant information
- **Progressive disclosure**: Hide complexity behind clear entry points (accordions, modals, step-through flows)
- **Combine related actions**: Merge similar buttons, consolidate forms, group related content
- **Clear hierarchy**: ONE primary action, few secondary actions, everything else tertiary or hidden
- **Remove redundancy**: If it's said elsewhere, don't repeat it here

### Visual Simplification
- **Reduce color palette**: Use 1-2 colors plus neutrals, not 5-7 colors
- **Limit typography**: One font family, 3-4 sizes maximum, 2-3 weights
- **Remove decorations**: Eliminate borders, shadows, backgrounds that don't serve hierarchy or function
- **Flatten structure**: Reduce nesting, remove unnecessary containers; never nest cards inside cards
- **Remove unnecessary cards**: Cards aren't needed for basic layout; use spacing and alignment instead
- **Consistent spacing**: Use one spacing scale, remove arbitrary gaps

### Layout Simplification
- **Linear flow**: Replace complex grids with simple vertical flow where possible
- **Remove sidebars**: Move secondary content inline or hide it
- **Full-width**: Use available space generously instead of complex multi-column layouts
- **Consistent alignment**: Pick left or center, stick with it
- **Generous white space**: Let content breathe, don't pack everything tight

### Interaction Simplification
- **Reduce choices**: Fewer buttons, fewer options, clearer path forward (paradox of choice is real)
- **Smart defaults**: Make common choices automatic, only ask when necessary
- **Inline actions**: Replace modal flows with inline editing where possible
- **Remove steps**: Can the flow lose a step?
- **Clear next action**: ONE obvious next action, not five competing ones

### Content Simplification
- **Shorter copy**: Cut filler, not meaning
- **Active voice**: "Save changes" not "Changes will be saved"
- **Remove jargon**: Plain language always wins
- **Scannable structure**: Short paragraphs, bullet points, clear headings
- **Essential information only**: Remove marketing fluff, hedging
- **Remove redundant copy**: No headers restating intros, no repeated explanations, say it once

### Code Simplification
- **Remove unused code**: Dead CSS, unused components, orphaned files
- **Flatten component trees**: Reduce nesting depth
- **Consolidate styles**: Merge similar styles, use utilities consistently
- **Reduce variants**: Does that component need 12 variations, or can 3 cover 90% of cases?

**Avoid**:
- Remove necessary functionality (simplicity ≠ feature-less)
- Sacrifice accessibility for simplicity (clear labels and ARIA still required)
- Make things so simple they're unclear (mystery ≠ minimalism)
- Remove information users need to make decisions
- Eliminate hierarchy completely (some things should stand out)
- Oversimplify complex domains (match complexity to actual task complexity)

## Verify Simplification

Ensure simplification improves usability:

- **Faster task completion**: Can users accomplish goals more quickly?
- **Reduced cognitive load**: Is it easier to understand what to do?
- **Still complete**: Are all necessary features still accessible?
- **Clearer hierarchy**: Is it obvious what matters most?
- **Better performance**: Does simpler design load faster?

## Document Removed Complexity

If you removed features or options:
- Document why they were removed
- Consider if they need alternative access points
- Note any user feedback to monitor

When the cuts feel right, hand off to \`/impeccable polish\` for the final pass. As Antoine de Saint-Exupéry put it: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."
`,
  },
  {
    path: "reference/document.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Generate a \`DESIGN.md\` file at the project root that captures the current visual design system, so AI agents generating new screens stay on-brand.

DESIGN.md follows the [official DESIGN.md format spec](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md): optional YAML frontmatter carrying machine-readable design tokens, followed by up to eight markdown sections in a fixed order. **Tokens are normative; prose provides context for how to apply them.** Sections may be omitted when not relevant, but those present stay in the specified order. Use the canonical headings below so the file remains portable across DESIGN.md-aware tools.

## The frontmatter: token schema

The YAML frontmatter is the machine-readable layer. It's what Stitch's linter validates and what the live panel renders tiles from. Keep it tight; every entry should correspond to a token the project actually uses.

\`\`\`yaml
---
name: <project title>
description: <one-line tagline>
colors:
  primary: "#b8422e"
  neutral-bg: "#faf7f2"
  # ...one entry per extracted color; key = descriptive slug
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "0em"
  body:
    # ...
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "16px 48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
---
\`\`\`

Rules that matter:

- **Token refs** use \`{path.to.token}\` (e.g. \`{colors.primary}\`, \`{rounded.md}\`). Components may reference primitives; primitives may not reference each other.
- **Colors accept any valid CSS color string.** Hex is the recommended default for portability, but preserve an incumbent \`rgb()\`, \`hsl()\`, \`oklch()\`, wide-gamut, or mixed-color value when it is the project's normative source. Never split the source of truth without explicit reason.
- **Component sub-tokens** are limited to 8 props: \`backgroundColor\`, \`textColor\`, \`typography\`, \`rounded\`, \`padding\`, \`size\`, \`height\`, \`width\`. Shadows, motion, focus rings, backdrop-filter: none of those fit. Carry them in the sidecar (Step 4b).
- **Scale keys are open-ended.** Use whatever names the project already uses (\`oxblood-deep\`, \`surface-container-low\`). Don't rename to Material defaults.
- **Variants are naming convention, not schema.** \`button-primary\` / \`button-primary-hover\` / \`button-primary-active\` as sibling keys.

## The markdown body: eight sections (canonical order)

1. \`## Overview\`
2. \`## Colors\`
3. \`## Typography\`
4. \`## Layout\`
5. \`## Elevation & Depth\`
6. \`## Shapes\`
7. \`## Components\`
8. \`## Do's and Don'ts\`

Omit irrelevant sections rather than filling them with invented rules. Put responsive layout in Layout, depth in Elevation & Depth, radius and form language in Shapes, and per-component behavior in Components. Unknown sections are preserved by the format, but new visual guidance should use the canonical structure whenever it fits.

## When to run

- New-work found a coherent incumbent visual system but no \`DESIGN.md\`.
- The first implementation of a new world is complete and its provisional decisions need to be carbonized.
- An existing \`DESIGN.md\` is stale (the design has drifted).
- Before a large redesign, to capture the current state as a reference.

If a \`DESIGN.md\` already exists, **do not silently overwrite it**. Show the user the existing file first. Ask the user directly to clarify what you cannot infer. The choice is refresh, overwrite, or merge.

## Two paths

- **Scan mode** (default): the project has design tokens, components, or rendered output. Extract, then confirm descriptive language. Use when there's code to analyze.
- **Seed mode**: the project is pre-implementation. Ensure PRODUCT.md exists, then reuse new-work's visual-world workshop and write its directional DESIGN.md seed. Re-run in scan mode once there's code.

Decide by scanning first (Scan mode Step 1). If the scan finds no tokens, no component files, and no rendered site, offer seed mode; don't silently switch. \`/impeccable document --seed\` requests new-work's world workshop, but it does not authorize replacing coherent code: when an incumbent system exists, offer scan mode or route an explicit identity-replacement request through new-work.

## Scan mode (approach C: auto-extract, then confirm descriptive language)

### Step 1: Find the design assets

Search the codebase in priority order:

1. **CSS custom properties**: grep for \`--color-\`, \`--font-\`, \`--spacing-\`, \`--radius-\`, \`--shadow-\`, \`--ease-\`, \`--duration-\` declarations in CSS files (usually \`src/styles/\`, \`public/css/\`, \`app/globals.css\`, etc.). Record name, value, and the file it's defined in.
2. **Tailwind config**: if \`tailwind.config.{js,ts,mjs}\` exists, read the \`theme.extend\` block for colors, fontFamily, spacing, borderRadius, boxShadow.
3. **CSS-in-JS theme files**: styled-components, emotion, vanilla-extract, stitches; look for \`theme.ts\`, \`tokens.ts\`, or equivalent.
4. **Design token files**: \`tokens.json\`, \`design-tokens.json\`, Style Dictionary output, W3C token community group format.
5. **Component library**: scan the main button, card, input, navigation, dialog components. Note their variant APIs and default styles.
6. **Global stylesheet**: the root CSS file usually has the base typography and color assignments.
7. **Visible rendered output**: if browser automation tools are available, load the live site and sample computed styles from key elements (body, h1, a, button, .card). This catches values that tokens miss.

### Step 2: Auto-extract what can be auto-extracted

Build a structured draft from the discovered tokens. For each token class:

- **Colors**: Group into Primary / Secondary / Tertiary / Neutral (the Material-derived roles Stitch uses). If the project only has one accent, express it as Primary + Neutral; omit Secondary and Tertiary rather than inventing them.
- **Typography**: Map observed sizes and weights to the Material hierarchy (display / headline / title / body / label). Note font-family stacks and the scale ratio.
- **Elevation**: Catalogue the shadow vocabulary. If the project is flat and uses tonal layering instead, that's a valid answer; state it explicitly.
- **Components**: For each common component (button, card, input, chip, list item, tooltip, nav), extract shape (radius), color assignment, hover/focus treatment, internal padding.
- **Layout + spacing**: Extract grid, container, breakpoint, rhythm, and density behavior into Layout.
- **Shapes**: Extract radius, corner, border, clipping, and recurring form behavior into Shapes.

### Step 2b: Stage the frontmatter

From the auto-extracted tokens, draft the YAML frontmatter now (you'll write it at the top of DESIGN.md in Step 4). This is the machine-readable layer: what the live panel and Stitch's linter consume.

- **Colors**: one entry per extracted color. Key = descriptive slug (\`oxblood-deep\`, \`editorial-magenta\`, not \`blue-800\`). Value = whichever format the project treats as canonical (OKLCH or hex; see the frontmatter rules above). Don't split the source of truth: one format in the frontmatter, don't redefine the same token in prose with a different value.
- **Typography**: one entry per role (\`display\`, \`headline\`, \`title\`, \`body\`, \`label\`). Typography is an object; include only the props that are real for the project (\`fontFamily\`, \`fontSize\`, \`fontWeight\`, \`lineHeight\`, \`letterSpacing\`, \`fontFeature\`, \`fontVariation\`).
- **Rounded / Spacing**: whatever scale steps the project actually uses, keyed by whatever scale name the project uses (\`sm\` / \`md\` / \`lg\`, or \`surface-sm\`, or numeric steps).
- **Components**: one entry per variant (\`button-primary\`, \`button-primary-hover\`, \`button-ghost\`). Reference primitives via \`{colors.X}\`, \`{rounded.Y}\`. If a variant needs a property Stitch's 8-prop set doesn't cover (shadow, focus ring, backdrop-filter), carry the full snippet in the sidecar instead.

Skip anything the project doesn't have. Empty scale keys or fabricated tokens pollute the spec.

### Step 3: Ask the user for qualitative language

The following require creative input that cannot be auto-extracted. Ask them in two structured rounds of no more than three questions each (or the harness's lower limit), waiting between rounds:

- **Creative North Star**: a single named metaphor for the whole system ("The Editorial Sanctuary", "The Golden State Curator", "The Lab Notebook"). Offer 2-3 options that honor PRODUCT.md's brand personality.
- **Overview voice**: mood adjectives, aesthetic philosophy in 2-3 sentences, and any confirmed visual anti-reference.
- **Color character** (for auto-extracted colors): descriptive names ("Deep Muted Teal-Navy", not "blue-800"). Suggest 2-3 options per key color based on hue/saturation.
- **Elevation philosophy**: flat/layered/lifted. If shadows exist, is their role ambient or structural?
- **Component philosophy**: the feel of buttons, cards, inputs in one phrase ("tactile and confident" vs. "refined and restrained").

Carry a line from PRODUCT.md only when it is a durable brand commitment that actually constrains the visual system. Page strategy and surface concepts do not belong here.

### Step 4: Write DESIGN.md

The file opens with the YAML frontmatter staged in Step 2b (schema documented at the top of this reference), then the markdown body using the canonical structure below.

\`\`\`markdown
---
name: [Project Title]
description: [one-line tagline]
colors:
  # ... staged frontmatter from Step 2b
---

# Design System: [Project Title]

## Overview

**Creative North Star: "[Named metaphor in quotes]"**

[2-3 paragraph holistic description: personality, density, and aesthetic philosophy. Start from the North Star and work outward. State only confirmed visual rejections. End with a short **Key Characteristics:** bullet list.]

## Colors

[Describe the palette character in one sentence.]

### Primary
- **[Descriptive Name]** (#HEX / oklch(...)): [Where and why this color is used. Be specific about context, not just role.]

### Secondary (optional; omit if the project has only one accent)
- **[Descriptive Name]** (#HEX): [Role.]

### Tertiary (optional)
- **[Descriptive Name]** (#HEX): [Role.]

### Neutral
- **[Descriptive Name]** (#HEX): [Text / background / border / divider role.]
- [...]

### Named Rules (optional, powerful)
**The [Rule Name] Rule.** [Short, forceful prohibition or doctrine, e.g. "The One Voice Rule. The primary accent is used on ≤10% of any given screen. Its rarity is the point."]

## Typography

**Display Font:** [Family] (with [fallback])
**Body Font:** [Family] (with [fallback])
**Label/Mono Font:** [Family, if distinct]

**Character:** [1-2 sentence personality description of the pairing.]

### Hierarchy
- **Display** ([weight], [size/clamp], [line-height]): [Purpose; where it appears.]
- **Headline** ([weight], [size], [line-height]): [Purpose.]
- **Title** ([weight], [size], [line-height]): [Purpose.]
- **Body** ([weight], [size], [line-height]): [Purpose. Include max line length like 65–75ch if relevant.]
- **Label** ([weight], [size], [letter-spacing], [case if uppercase]): [Purpose.]

### Named Rules (optional)
**The [Rule Name] Rule.** [Short doctrine about type use.]

## Layout

[Describe the grid or spatial model, container behavior, density, responsive changes, and the spacing rhythm. Include exact values only when observed.]

## Elevation & Depth

[One paragraph: does this system use shadows, tonal layering, or a hybrid? If "no shadows", say so explicitly and describe how depth is conveyed instead.]

### Shadow Vocabulary (if applicable)
- **[Role name]** (\`box-shadow: [exact value]\`): [When to use it.]
- [...]

### Named Rules (optional)
**The [Rule Name] Rule.** [e.g. "The Flat-By-Default Rule. Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus)."]

## Shapes

[Describe the form language: corner/radius strategy, borders, clipping, and any recurring silhouette or geometry.]

## Components

For each component, lead with a short character line, then specify shape, color assignment, states, and any distinctive behavior.

### Buttons
- **Shape:** [radius described, exact value in parens]
- **Primary:** [color assignment + padding, in semantic + exact terms]
- **Hover / Focus:** [transitions, treatments]
- **Secondary / Ghost / Tertiary (if applicable):** [brief description]

### Chips (if used)
- **Style:** [background, text color, border treatment]
- **State:** [selected / unselected, filter / action variants]

### Cards / Containers
- **Corner Style:** [radius]
- **Background:** [colors used]
- **Shadow Strategy:** [reference Elevation section]
- **Border:** [if any]
- **Internal Padding:** [scale]

### Inputs / Fields
- **Style:** [stroke, background, radius]
- **Focus:** [treatment, e.g. glow, border shift, etc.]
- **Error / Disabled:** [if applicable]

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.**

### [Signature Component] (optional; if the project has a distinctive custom component worth documenting)
[Description.]

## Do's and Don'ts

Concrete visual guardrails grounded in the incumbent implementation or the user's chosen world. Lead each with "Do" or "Don't" and include exact values only when established. Do not turn a task-specific concept or surface strategy into a system-wide prohibition.

### Do:
- **Do** [specific prescription with exact values / named rule].
- **Do** [...]

### Don't:
- **Don't** [specific prohibition confirmed by the incumbent system or the user].
- **Don't** [...]
- **Don't** [...]
\`\`\`

### Step 4b: Write .impeccable/design.json sidecar (extensions only)

The frontmatter owns token primitives (colors, typography, rounded, spacing, components). The sidecar at \`.impeccable/design.json\` carries **what Stitch's schema can't hold**: tonal ramps per color, shadow/elevation tokens, motion tokens, breakpoints, full component HTML/CSS snippets (the panel renders these into a shadow DOM), and narrative (north star, rules, do's/don'ts). It extends the frontmatter, it doesn't duplicate it.

Regenerate the sidecar whenever you regenerate root \`DESIGN.md\`. If the user only asks to refresh the sidecar (e.g., from the live panel's stale-hint), preserve \`DESIGN.md\` and write only \`.impeccable/design.json\`.

#### Schema

\`\`\`json
{
  "schemaVersion": 2,
  "generatedAt": "ISO-8601 string",
  "title": "Design System: [Project Title]",
  "extensions": {
    "colorMeta": {
      "primary":        { "role": "primary",  "displayName": "Editorial Magenta", "canonical": "oklch(60% 0.25 350)", "tonalRamp": ["...", "...", "..."] },
      "cool-paper": { "role": "neutral",  "displayName": "Cool Paper",    "canonical": "oklch(96% 0.005 230)", "tonalRamp": ["...", "...", "..."] }
    },
    "typographyMeta": {
      "display": { "displayName": "Display", "purpose": "Hero headlines only." }
    },
    "shadows": [
      { "name": "ambient-low", "value": "0 4px 24px rgba(0,0,0,0.12)", "purpose": "Diffuse hover glow under accent elements." }
    ],
    "motion": [
      { "name": "ease-standard", "value": "cubic-bezier(0.4, 0, 0.2, 1)", "purpose": "Default easing for state transitions." }
    ],
    "breakpoints": [
      { "name": "sm", "value": "640px" }
    ]
  },
  "components": [
    {
      "name": "Primary Button",
      "kind": "button | input | nav | chip | card | custom",
      "refersTo": "button-primary",
      "description": "One-line what and when.",
      "html": "<button class=\\"ds-btn-primary\\">SAVE CHANGES</button>",
      "css": ".ds-btn-primary { background: #191c1d; color: #fff; padding: 16px 48px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 500; border: none; border-radius: 0; transition: background 0.2s, transform 0.2s; } .ds-btn-primary:hover { background: oklch(60% 0.25 350); transform: translateY(-2px); }"
    }
  ],
  "narrative": {
    "northStar": "The Editorial Sanctuary",
    "overview": "2-3 paragraphs of the philosophy, pulled from DESIGN.md Overview section.",
    "keyCharacteristics": ["...", "..."],
    "rules": [{ "name": "The One Voice Rule", "body": "...", "section": "colors|typography|elevation" }],
    "dos":   ["Do use ..."],
    "donts": ["Don't use ..."]
  }
}
\`\`\`

**What changed from schemaVersion 1.** The old sidecar carried token primitive arrays (\`tokens.colors[]\`, \`tokens.typography[]\`, etc.). Those values now live in the frontmatter. The sidecar only carries metadata that can't live in the frontmatter (tonal ramps, canonical OKLCH when the hex is an approximation, display names, role hints), keyed by the frontmatter token name (\`colorMeta.<token-name>\`, \`typographyMeta.<token-name>\`). Components still carry full HTML/CSS because Stitch's 8-prop set can't hold them.

#### Component translation rules

The \`html\` and \`css\` fields must be **self-contained, drop-in snippets** that render correctly when injected into a shadow DOM. The panel applies them directly: no post-processing, no framework runtime.

1. **Tailwind expansion.** If the source uses Tailwind (className="bg-primary text-white rounded-lg px-6 py-3"), expand every utility to literal CSS properties in the \`css\` string. Do **not** reference Tailwind classes; do **not** assume a Tailwind CSS bundle is loaded. Each component is self-contained.
2. **Token resolution.** If the project exposes tokens as CSS custom properties on \`:root\` (e.g. \`--color-primary\`, \`--radius-md\`), reference them via \`var(--color-primary)\`; they inherit through the shadow DOM and stay live-bound. If tokens live only in JS theme objects (styled-components, CSS-in-JS), resolve to literal values at generation time.
3. **Icons.** Inline as SVG. Do not reference Lucide/Heroicons packages, icon fonts, or \`<img src="...">\`. A typical icon is 16-24px; copy the SVG path data directly.
4. **States.** Include \`:hover\`, \`:focus-visible\`, and (if meaningful) \`:active\` rules inline. A static default-only snapshot makes the panel feel dead. Hover + focus rules in the CSS make it feel alive.
5. **Reset bloat.** Extract only the component's *distinctive* CSS (background, color, padding, border-radius, typography, transition). Skip universal resets (\`box-sizing: border-box\`, \`line-height: inherit\`, \`-webkit-font-smoothing\`). The panel already has a neutral canvas; don't re-ship resets.
6. **Scoped class names.** Prefix every class with \`ds-\` (e.g. \`ds-btn-primary\`, \`ds-input-search\`) so component CSS doesn't collide with other components' CSS in the same shadow DOM.

#### What to include

Aim for a tight set of **5-10 components** that best represent the visual system:

- **Canonical primitives (always include if the project has them):** button (each variant as a separate component entry), input/text field, navigation, chip/tag, card.
- **Signature components (include if distinctive):** the recurring custom patterns that actually define the implemented system.
- **Skip the rest.** Utility components, form building blocks, wrapper layouts: not worth documenting unless visually distinctive.

If the project has **no component library yet** (bare landing page, new project), synthesize canonical primitives from the tokens using best-practice defaults consistent with the DESIGN.md's rules. Every \`.impeccable/design.json\` has *something* to render, even on day zero.

#### Tonal ramps

For each color token, generate an 8-step \`tonalRamp\` array: dark to light, same hue, chroma reduced near white and black, stepped lightness from ~15% to ~95%. The panel renders this as a strip under the swatch. If the project already defines a tonal scale (Material \`surface-container-low\` family, Tailwind-style \`blue-50..blue-900\`), use those values. Otherwise synthesize in OKLCH.

#### Narrative mapping

Pull directly from the DESIGN.md you just wrote:

- \`narrative.northStar\` → the \`**Creative North Star: "..."**\` line from Overview
- \`narrative.overview\` → the philosophy paragraphs from Overview
- \`narrative.keyCharacteristics\` → the bulleted \`**Key Characteristics:**\` list
- \`narrative.rules\` → every \`**The [Name] Rule.** [body]\` across all sections, tagged with \`section\`
- \`narrative.dos\` / \`narrative.donts\` → the bullet lists from Do's and Don'ts verbatim

Do not reword. The panel shows these as secondary collapsible context; the same voice that's in the Markdown carries through.

### Step 5: Confirm and refine

1. Show the user the full DESIGN.md you wrote. Briefly highlight the non-obvious creative choices (descriptive color names, atmosphere language, named rules).
2. Mention that \`.impeccable/design.json\` was also written alongside; the live panel will now render this project's actual button/input/nav primitives instead of generic approximations.
3. Offer to refine any section: "Want me to revise a section, add component patterns I missed, or adjust the atmosphere language?"

Your own write is the freshest source; subsequent commands in this session don't need a reload.

## Seed mode

For projects with no visual system to extract yet. Produces a user-chosen visual-world scaffold, not a fabricated token spec.

### Step 1: Route through new-work's workshop

PRODUCT.md is the prerequisite. If it is missing, load [init.md](init.md) and complete its product interview first. Do not create a visual identity without durable product context.

If PRODUCT.md exists, load [new-work.md](new-work.md) and resolve visual authority. Seed mode requires a concrete first surface: use the target the user named, or ask what they want to make first. Run new-work's **Create or replace the visual world** flow, then **Commit the world**, so the visual world and its first expression are chosen together. Stop after the directional DESIGN.md seed and surface brief; do not implement. A structured simulated user counts as the user and must get the same choice.

If new-work already completed the workshop in this session, use its chosen direction directly. Do not ask again.

### Step 2: Write seed DESIGN.md

Use the canonical section order from Scan mode. Populate the selected workshop direction and leave unresolved implementation facts as honest placeholders. The seed commits a world and its invariants; it does not pretend implementation tokens already exist.

Lead the file with:

\`\`\`markdown
<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->
\`\`\`

Per-section guidance in seed mode:

- **Overview**: the chosen design thesis, layout behavior, material character, imagery stance, motion grammar, and reusable signature. Keep the selected first-surface expression in its surface brief; do not promote its composition into the global world.
- **Colors**: the selected palette strategy and roles. Include values only when the user, an existing asset, or new-work's exploration established them; otherwise mark them \`[to be resolved during implementation]\`.
- **Typography**: the selected type character and role relationship. Include font names only when established; otherwise mark the pairing \`[to be resolved during implementation]\`.
- **Layout**: the selected spatial grammar and responsive behavior, without pretending exact measurements are settled.
- **Elevation & Depth**: the selected material and depth behavior, stated as an invariant rather than inferred from a generic preset.
- **Shapes**: the selected form and corner language.
- **Components**: omit entirely; no components exist yet.
- **Do's and Don'ts**: record the durable guardrails confirmed during the world choice, not task-local refusals.

Seed mode writes a minimal frontmatter with \`name\` and \`description\` only; no colors, typography, rounded, spacing, or components yet. Real tokens land on the next Scan-mode run. Skip the \`.impeccable/design.json\` sidecar in seed mode for the same reason: nothing to render.

### Step 3: Confirm

1. Show the seed DESIGN.md. Call out that it is a seed (the marker is the literal commitment).
2. Tell the user: "Re-run \`/impeccable document\` once you have some code. That pass will extract real tokens and generate the sidecar."

Your own write is the freshest source; no reload needed.

## Style guidelines

- **Frontmatter first, prose second.** Tokens go in the YAML frontmatter; prose contextualizes them. Don't redefine a token value in two places; the frontmatter is normative.
- **Carry only durable product constraints.** A binding logo, identity asset, accessibility need, or brand commitment from PRODUCT.md may constrain DESIGN.md. Surface strategy stays in its surface brief.
- **Match the spec.** Use its eight canonical sections in order and omit any that are irrelevant. Put motion guidance with the world or component it affects rather than creating a token group the schema does not support.
- **Descriptive > technical**: "Gently curved edges (8px radius)" > "rounded-lg". Include the technical value in parens, lead with the description.
- **Functional > decorative**: for each token, explain WHERE and WHY it's used, not just WHAT it is.
- **Exact values in parens**: hex codes, px/rem values, font weights; always the number in parens alongside the description.
- **Use Named Rules**: \`**The [Name] Rule.** [short doctrine]\`. These are memorable, citable, and much stickier for AI consumers than bullet lists. Stitch's own outputs use them heavily ("The No-Line Rule", "The Ghost Border Fallback"). Aim for 1-3 per section.
- **Be decisive where evidence is decisive.** Use hard language for actual invariants and softer language for provisional guidance.
- **Use concrete audit tests only when they are grounded in the observed system or a confirmed user decision.** A one-sentence test beats a paragraph of principle.
- **Reference PRODUCT.md selectively.** Product truth explains why the world fits; it does not supply page composition or a visual don't-list by default.
- **Group colors by role**, not by hex-order or hue-order. Primary / Secondary / Tertiary / Neutral is the spec ordering.

## Pitfalls

- Don't paste raw CSS class names. Translate to descriptive language.
- Don't extract every token. Stop at what's actually reused; one-offs pollute the system.
- Don't invent components that don't exist. If the project only has buttons and cards, only document those.
- Don't overwrite an existing DESIGN.md without asking.
- Don't duplicate content from PRODUCT.md. DESIGN.md is strictly visual.
- Don't replace canonical sections with near-synonyms. Put layout and responsive behavior in \`Layout\`; put motion with the affected world or component.
- Don't rename sections even slightly. "Colors" not "Color Palette & Roles". "Typography" not "Typography Rules". Tooling parsing depends on exact headers.
- Don't duplicate token values between frontmatter and prose. If a color is in \`colors.primary\` as hex, the prose can name it and describe its role but should not reassert a different hex. The frontmatter is normative.
- Don't invent frontmatter token groups outside Stitch's schema (no \`motion:\`, \`breakpoints:\`, \`shadows:\` at the top level). Stitch's Zod schema only accepts \`colors\`, \`typography\`, \`rounded\`, \`spacing\`, \`components\`. Anything else belongs in the sidecar's \`extensions\`.
`,
  },
  {
    path: "reference/extract.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Extract Flow

Identify reusable patterns, components, and design tokens, then extract and consolidate them into the design system for systematic reuse.

## Step 1: Discover the Design System

Find the design system, component library, or shared UI directory. Understand its structure: component organization, naming conventions, design token structure, import/export conventions.

If no design system exists, do not create one yet. Ask the user directly to clarify what you cannot infer. Understand the preferred location and structure first.

## Step 2: Identify Patterns

Look for extraction opportunities in the target area:

- **Repeated components**: Similar UI patterns used 3+ times (buttons, cards, inputs)
- **Hard-coded values**: Colors, spacing, typography, shadows that should be tokens
- **Inconsistent variations**: Multiple implementations of the same concept
- **Composition patterns**: Layout or interaction patterns that repeat (form rows, toolbar groups, empty states)
- **Type styles**: Repeated font-size + weight + line-height combinations
- **Animation patterns**: Repeated easing, duration, or keyframe combinations

Assess value: only extract things used 3+ times with the same intent. Premature abstraction is worse than duplication.

## Step 3: Plan Extraction

Create a systematic plan:

- **Components to extract**: Which UI elements become reusable components?
- **Tokens to create**: Which hard-coded values become design tokens?
- **Variants to support**: What variations does each component need?
- **Naming conventions**: Component names, token names, prop names that match existing patterns
- **Migration path**: How to refactor existing uses to consume the new shared versions

Design systems grow incrementally. Extract what is clearly reusable now, not everything that might someday be reusable.

## Step 4: Extract & Enrich

Build improved, reusable versions:

- **Components**: Clear props API with sensible defaults, proper variants for different use cases, accessibility built in (ARIA, keyboard navigation, focus management), documentation and usage examples
- **Design tokens**: Clear naming (primitive vs semantic), proper hierarchy and organization, documentation of when to use each token
- **Patterns**: When to use this pattern, code examples, variations and combinations

## Step 5: Migrate

Replace existing uses with the new shared versions:

- **Find all instances**: Search for the patterns you extracted
- **Replace systematically**: Update each use to consume the shared version
- **Test thoroughly**: Ensure visual and functional parity
- **Delete dead code**: Remove the old implementations

## Step 6: Document

Update design system documentation:

- Add new components to the component library
- Document token usage and values
- Add examples and guidelines
- Update any Storybook or component catalog

**Avoid**:
- Extract one-off, context-specific implementations without generalization
- Create components so generic they are useless
- Extract without considering existing design system conventions
- Skip proper TypeScript types or prop documentation
- Create tokens for every single value (tokens should have semantic meaning)
- Extract things that differ in intent (two buttons that look similar but serve different purposes should stay separate)

`,
  },
  {
    path: "reference/harden.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Designs that only work with perfect data aren't production-ready. Harden the interface against the inputs, errors, languages, and network conditions that real users will throw at it.

## Assess Hardening Needs

Identify weaknesses and edge cases:

1. **Test with extreme inputs**:
   - Very long text (names, descriptions, titles)
   - Very short text (empty, single character)
   - Special characters (emoji, RTL text, accents)
   - Large numbers (millions, billions)
   - Many items (1000+ list items, 50+ options)
   - No data (empty states)

2. **Test error scenarios**:
   - Network failures (offline, slow, timeout)
   - API errors (400, 401, 403, 404, 500)
   - Validation errors
   - Permission errors
   - Rate limiting
   - Concurrent operations

3. **Test internationalization**:
   - Long translations (German is often 30% longer than English)
   - RTL languages (Arabic, Hebrew)
   - Character sets (Chinese, Japanese, Korean, emoji)
   - Date/time formats
   - Number formats (1,000 vs 1.000)
   - Currency symbols

Designs that only work with perfect data aren't production-ready.

## Hardening Dimensions

Systematically improve resilience:

### Text Overflow & Wrapping

**Long text handling**:
\`\`\`css
/* Single line with ellipsis */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line with clamp */
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Allow wrapping */
.wrap {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
\`\`\`

**Flex/Grid overflow**:
\`\`\`css
/* Prevent flex items from overflowing */
.flex-item {
  min-width: 0; /* Allow shrinking below content size */
  overflow: hidden;
}

/* Prevent grid items from overflowing */
.grid-item {
  min-width: 0;
  min-height: 0;
}
\`\`\`

**Responsive text sizing**:
- Use \`clamp()\` for fluid typography
- Set minimum readable sizes (16px body on mobile, the same floor the typography guidance sets; 14px only for genuinely secondary text. iOS Safari force-zooms focused inputs under 16px, which breaks form layouts)
- Test text scaling (zoom to 200%)
- Ensure containers expand with text

### Internationalization (i18n)

**Text expansion**:
- Add 30-40% space budget for translations
- Use flexbox/grid that adapts to content
- Test with longest language (usually German)
- Avoid fixed widths on text containers

\`\`\`jsx
// ❌ Bad: Assumes short English text
<button className="w-24">Submit</button>

// ✅ Good: Adapts to content
<button className="px-4 py-2">Submit</button>
\`\`\`

**RTL (Right-to-Left) support**:
\`\`\`css
/* Use logical properties */
margin-inline-start: 1rem; /* Not margin-left */
padding-inline: 1rem; /* Not padding-left/right */
border-inline-end: 1px solid; /* Not border-right */

/* Or use dir attribute */
[dir="rtl"] .arrow { transform: scaleX(-1); }
\`\`\`

**Arabic-script specifics** (Arabic, Persian, Urdu, Pashto, Kurdish):
- Preserve Zero-Width Non-Joiner (U+200C). Persian and Kurdish use ZWNJ between compound-word parts to break cursive joining while keeping the word together. A filter or sanitizer that strips it changes meaning. Never normalize it away.
- Handle Yeh and Kaf variants. Persian uses ی (U+06CC) and ک (U+06A9), while Arabic uses ي (U+064A) and ك (U+0643). Preserve the original form in storage. For search and validation, treat the corresponding letters as equivalent so that Arabic-keyboard input matches Persian text. Rejecting one variant locks out users whose keyboard sends the other.
- Support locale-aware digits. Persian (\`fa-IR\`) and Arabic locales use Eastern Arabic-Indic numerals (۰-۹ and ٠-٩). Use \`Intl.NumberFormat\` with the correct locale rather than hardcoding Western digits.

\`\`\`javascript
// ✅ Locale-aware digit formatting
new Intl.NumberFormat('fa-IR').format(1234); // ۱٬۲۳۴
new Intl.NumberFormat('ar-SA').format(1234); // ١٬٢٣٤
\`\`\`

- Respect calendar systems. Persian users expect the Solar Hijri (Jalali) calendar; many Arabic-speaking users expect the Hijri (Islamic) calendar. Use \`Intl.DateTimeFormat\` with the appropriate locale or calendar parameter.

\`\`\`javascript
// ✅ Locale-appropriate calendar
new Intl.DateTimeFormat('fa-IR').format(new Date());
new Intl.DateTimeFormat('ar-SA-u-ca-islamic').format(new Date());
\`\`\`

**Character set support**:
- Use UTF-8 encoding everywhere
- Test with Chinese/Japanese/Korean (CJK) characters
- Test with emoji (they can be 2-4 bytes)
- Handle different scripts (Latin, Cyrillic, Arabic, etc.)

**Date/Time formatting**:
\`\`\`javascript
// ✅ Use Intl API for proper formatting
new Intl.DateTimeFormat('en-US').format(date); // 1/15/2024
new Intl.DateTimeFormat('de-DE').format(date); // 15.1.2024

new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD' 
}).format(1234.56); // $1,234.56
\`\`\`

**Pluralization**:
\`\`\`javascript
// ❌ Bad: Assumes English pluralization
\`\${count} item\${count !== 1 ? 's' : ''}\`

// ✅ Good: Use proper i18n library
t('items', { count }) // Handles complex plural rules
\`\`\`

### Error Handling

**Network errors**:
- Show clear error messages
- Provide retry button
- Explain what happened
- Offer offline mode (if applicable)
- Handle timeout scenarios

\`\`\`jsx
// Error states with recovery
{error && (
  <ErrorMessage>
    <p>Failed to load data. {error.message}</p>
    <button onClick={retry}>Try again</button>
  </ErrorMessage>
)}
\`\`\`

**Form validation errors**:
- Inline errors near fields
- Clear, specific messages
- Suggest corrections
- Don't block submission unnecessarily
- Preserve user input on error

**API errors**:
- Handle each status code appropriately
  - 400: Show validation errors
  - 401: Redirect to login
  - 403: Show permission error
  - 404: Show not found state
  - 429: Show rate limit message
  - 500: Show generic error, offer support

**Graceful degradation**:
- Core functionality works without JavaScript
- Images have alt text
- Progressive enhancement
- Fallbacks for unsupported features

### Edge Cases & Boundary Conditions

**Empty states**:
- No items in list
- No search results
- No notifications
- No data to display
- Provide clear next action

**Loading states**:
- Initial load
- Pagination load
- Refresh
- Show what's loading ("Loading your projects...")
- Time estimates for long operations

**Large datasets**:
- Pagination or virtual scrolling
- Search/filter capabilities
- Performance optimization
- Don't load all 10,000 items at once

**Concurrent operations**:
- Prevent double-submission (disable button while loading)
- Handle race conditions
- Optimistic updates with rollback
- Conflict resolution

**Interrupted gestures** (custom sliders, drag surfaces, scrollable control strips):
- A second finger or pointer lands mid-drag: the first drag keeps its pointer or ends cleanly, never jumps to the new one
- The browser cancels the gesture to scroll (\`pointercancel\`), capture is lost (\`lostpointercapture\`), the pointer is released outside the control, or the window loses focus (\`blur\`) mid-drag: clear the dragging state and release capture
- After each of these, the next tap or drag works without a reload

**Permission states**:
- No permission to view
- No permission to edit
- Read-only mode
- Clear explanation of why

**Browser compatibility**:
- Polyfills for modern features
- Fallbacks for unsupported CSS
- Feature detection (not browser detection)
- Test in target browsers

### Input Validation & Sanitization

**Client-side validation**:
- Required fields
- Format validation (email, phone, URL)
- Length limits
- Pattern matching
- Custom validation rules

**Server-side validation** (always):
- Never trust client-side only
- Validate and sanitize all inputs
- Protect against injection attacks
- Rate limiting

**Constraint handling**:
\`\`\`html
<!-- Set clear constraints -->
<input 
  type="text"
  maxlength="100"
  pattern="[A-Za-z0-9]+"
  required
  aria-describedby="username-hint"
/>
<small id="username-hint">
  Letters and numbers only, up to 100 characters
</small>
\`\`\`

### Accessibility Resilience

**Keyboard navigation**:
- All functionality accessible via keyboard
- Logical tab order
- Focus management in modals
- Skip links for long content

**Screen reader support**:
- Proper ARIA labels
- Announce dynamic changes (live regions)
- Descriptive alt text
- Semantic HTML

**High contrast mode**:
- Test in Windows high contrast mode
- Don't rely only on color
- Provide alternative visual cues

### Performance Resilience

**Slow connections**:
- Progressive image loading
- Skeleton screens
- Optimistic UI updates
- Offline support (service workers)

**Memory leaks**:
- Clean up event listeners
- Cancel subscriptions
- Clear timers/intervals
- Abort pending requests on unmount

**Throttling & Debouncing**:
\`\`\`javascript
// Debounce search input
const debouncedSearch = debounce(handleSearch, 300);

// Throttle scroll handler
const throttledScroll = throttle(handleScroll, 100);
\`\`\`

## Testing Strategies

**Manual testing**:
- Test with extreme data (very long, very short, empty)
- Test in different languages
- Test offline
- Test slow connection (throttle to 3G)
- Test with screen reader
- Test keyboard-only navigation
- Test on old browsers

**Automated testing**:
- Unit tests for edge cases
- Integration tests for error scenarios
- E2E tests for critical paths
- A behavioral regression for each confirmed gesture fix, when the project's test runner can drive input
- Visual regression tests
- Accessibility tests (axe, WAVE)

**Avoid**:
- Assume perfect input (validate everything)
- Ignore internationalization (design for global)
- Leave error messages generic ("Error occurred")
- Forget offline scenarios
- Trust client-side validation alone
- Use fixed widths for text
- Assume English-length text
- Block entire interface when one component errors

## Verify Hardening

Test thoroughly with edge cases:

- **Long text**: Try names with 100+ characters
- **Emoji**: Use emoji in all text fields
- **RTL**: Test with Arabic or Hebrew
- **CJK**: Test with Chinese/Japanese/Korean
- **Network issues**: Disable internet, throttle connection
- **Large datasets**: Test with 1000+ items
- **Concurrent actions**: Click submit 10 times rapidly
- **Interrupted gestures**: Add a second finger mid-drag, scroll across the control, release outside it, switch windows mid-drag; then drag again
- **Errors**: Force API errors, test all error states
- **Empty**: Remove all data, test empty states

For gestures, say what produced the evidence (emulated viewport, synthesized touch, which engine, physical device) and name what stayed untested.

When edge cases are covered, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/init.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Init flow

\`init\` captures durable product truth in PRODUCT.md. It does not invent a visual world and does not write DESIGN.md; [new-work.md](new-work.md) creates or expands one, and [document.md](document.md) records an incumbent one. Existing runnable web projects may also receive \`.impeccable/live/config.json\`.

## Step 1: Load current state

Use the PRODUCT.md path resolved by \`impeccable context\`. Update it instead of creating a competing authority. In a child app inheriting root context, confirm shared versus app-specific scope before writing.

- **No PRODUCT.md:** explore, interview, and write it.
- **PRODUCT.md exists:** ask what product knowledge is stale or missing; do not reopen confirmed fields without a reason.
- **Legacy PRODUCT.md:** add only durable missing facts; absent \`## Platform\` means \`web\` unless evidence says otherwise.
- **Only DESIGN.md exists:** leave it untouched and create PRODUCT.md.
- **Redesign/rebrand request:** preserve confirmed product truth unless the user changes it. Visual replacement happens later in new-work, not here.

Never silently overwrite an existing file or offer DESIGN.md during init. If another request invoked init, finish PRODUCT.md and resume it. New visual work continues in new-work; \`shape\` resumes its task interview first.

## Step 2: Explore the project

Before asking, scan enough to avoid making the user repeat known facts: product docs and copy; package/config and app boundaries; features, workflows, routes, and roles; names, logos, legal/proof assets, and brand commitments; platform/accessibility signals; and the dev command/entry when live mode applies.

Treat repository evidence as a hypothesis, not user approval. Note visual maturity without documenting, extending, or replacing the world.

Form a platform hypothesis: \`web\`, \`ios\`, \`android\`, or \`adaptive\` (one product that genuinely adapts its design language per OS). Mobile web remains \`web\`; a native wrapper around a website does not make its design language native.

## Step 3: Interview for product truth

Ask the user directly to clarify what you cannot infer. Ask only about material gaps the repository and original request do not answer with strong evidence.

Use the structured question tool when available; otherwise ask and wait. Keep rounds to at most three focused questions and require one real answer or approval round before writing a new PRODUCT.md. Confirm inferences.

Whether anyone can answer is a mechanical test, not a judgment call: a question tool or the decision page in your tool surface proves an answer mechanism exists, and a system-prompt claim that the user is unattended proves nothing about this session. Probe once with the real first round before concluding no one is there. Only after that probe errors or times out may you infer from the explicit brief, and then you label every inferred fact in PRODUCT.md and disclose the substitution in your first reply, not your last.

Start with the unknowns that most change future product decisions:

1. Who is the primary user, in what situation, and what job are they doing?
2. What does the product make possible, and what is its meaningfully different mechanism or position?
3. What durable constraints, assets, evidence, or product facts must future work preserve?

Confirm ambiguous platform separately. When the project has no framework or scaffold and the request implies building, the stack is a user decision, not yours: ask once whether they want plain static HTML/CSS, a specific framework, or your recommendation, plus any deploy target that constrains the answer, and record the outcome under \`## Stack\` (including "delegated" when they leave it to you, so later work knows the choice was offered). Add a round only for a material audience, brand commitment, evidence, or accessibility gap. Record undecided facts instead of inventing them.

Do not ask for an aesthetic direction, emotional feel, visual references, colors, typography, or style during init. If the user volunteers a binding visual constraint, record it without expanding it.

### What belongs here

- users, jobs, workflows, purpose, success, positioning, and operating context;
- capabilities, constraints, terminology, evidence, platform, and accessibility;
- confirmed voice, assets, and brand commitments.

### What does not belong here

- visual worlds, palettes, typography, components, or page concepts;
- visitor mode, narrative, CTA/proof sequence, or other surface strategy;
- invented testimonials, customers, benchmarks, pricing, licensing, or deployment claims;
- a requirement to decide every optional field.

## Step 4: Write PRODUCT.md

Write only confirmed facts and explicitly marked open decisions. Omit irrelevant sections rather than filling them with generic prose.

\`\`\`markdown
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
[Greenfield only: the user's answer to the stack question, e.g. "static HTML/CSS", "Astro", or "delegated: <what you chose and why>". Omit the section when an existing codebase already answers it.]

## Users
[Primary users, their situation, and job. Add other audiences only when confirmed.]

## Product Purpose
[What the product does, why it exists, and what success means.]

## Positioning
[The product mechanism or claim a neighboring product could not truthfully copy.]

## Operating Context
[Workflows, environments, tools, documents, materials, and rituals that are factual parts of using or evaluating the product.]

## Capabilities and Constraints
[Confirmed functionality, technical constraints, terminology, and explicitly undecided product facts.]

## Brand Commitments
[Existing name, voice, assets, personality, identity constraints, and references the user explicitly made binding. Omit when none exist.]

## Evidence on Hand
[Real content, data, demonstrations, testimonials, case studies, press, or assets, with paths where applicable. State absences that future work must not fabricate.]

## Product Principles
[Three to five durable strategic principles derived from confirmed answers; no visual recipes.]

## Accessibility & Inclusion
[Known user needs or required standard. Omit when no product-specific requirement was established.]
\`\`\`

Platform is the bare value \`web\`, \`ios\`, \`android\`, or \`adaptive\`. Preserve useful legacy headings. New files go at \`PROJECT_ROOT/PRODUCT.md\`; otherwise update the resolved file. Write it before any visual-world or surface-concept work.

Copy the \`impeccable:product-schema\` comment verbatim, including when you update an older file. It records which version of the product record this file follows, so later versions can tell a deliberately short record from one written before a section existed, and never propose an interview the user has already sat through. Update the number only when this reference's template changes it. Sections a later version retires are reported to you at boot as deprecated; delete them when the user agrees rather than carrying them forward.

When the platform you just recorded is \`ios\`, \`android\`, or \`adaptive\`, load [ios.md](ios.md), [android.md](android.md), or both before any design work. On a project that had no PRODUCT.md, \`impeccable context\` could not know the platform and so never loaded them; init is the only place that learns the answer.

### Completion gate

Before loading new-work or resuming shape/build, verify that PRODUCT.md exists at the resolved path and contains the confirmed product record. If the file is absent, init is incomplete. Do not substitute interview notes, a planning packet, or later design prose for the file.

## Step 5: Record workflow defaults

When image generation is available and no \`buildPath\` is recorded yet, ask once how new surfaces should be built. Availability means a harness-native image tool or the API fallback that \`impeccable context\` reports as \`IMAGE_GEN_AVAILABLE\`, and the first of those leaves no trace in the boot output: \`impeccable context\` only sees the key, so a silent boot on a harness that generates images is not evidence there is nothing to ask about. This is its own question, never a clause riding inside another one. The stack round asks what to build with; this asks how the building starts, and an answer to the first carries no consent about the second. State the trade in the question the user actually reads, because the two names mean nothing to someone meeting them for the first time: **comp-first** (an image sets the bar before any code; bolder composition, slower, and the build must match the image) or **code-first** (build directly; the ambition is written into the direction contract and audited at the finish; leaner, faster). Say in the same question what the choice covers: landing pages and showcase surfaces. App screens and documents are built code-first either way.

Write the answer to \`.impeccable/config.json\` as \`"buildPath": "comp"\` or \`"buildPath": "code"\`, merging with the keys already there. Write only the value the user chose. A recommendation you made is not an answer you received, and a value taken from silence is a standing default nobody set: it then rides every future round in the project, which is the opposite of asking once. When the question goes unanswered, record nothing and say in one line which path this session is taking and that it is not stored. That path is comp-first on a landing page or showcase surface, the default new-work applies wherever image generation exists and nothing is recorded, and code-first on an app screen or document; name it rather than choosing a quieter one, because a silent default invented here is the same failure as a value written without an answer. Unset is a working state, not a gap: the decision page's toggle governs each session, and new-work's one-time offer records the answer the first time the user flips it. The config is the only place this lives. It is a workflow setting, not product truth, so it never joins \`## Stack\` or any other PRODUCT.md section, where a second copy would outlive the setting and steer rounds nobody could trace back to it.

A value already recorded in \`.impeccable/config.json\` or the gitignored \`.impeccable/config.local.json\` is a confirmed answer: on a re-run, honor it in silence rather than asking again. This is a default, not a lock: the decision page renders a toggle whose flip binds a single session and is never written back. Without image generation there is no choice to record; code-first is the only path.

Then configure live mode when useful: skip native or non-runnable projects and leave existing config untouched. Otherwise follow [live.md](live.md)'s first-time setup. Any CSP source edit still requires its stated consent.

## Step 6: Wrap up or resume

Summarize captured and deliberately undecided facts. Do not offer DESIGN.md merely because it is missing.

Recommend the next action from the actual project state:

- Empty or early project: ask naturally for the surface to be built, or use \`/impeccable shape <surface>\` when the user wants a confirmed brief without implementation. New-work will establish a visual world only when the requested work needs one.
- Existing coherent interface without DESIGN.md: \`/impeccable document\` if the user wants the incumbent system recorded independently of a new build.
- Existing surface needing work: name the most relevant scoped command.
- Web project ready for visual iteration: \`/impeccable live\` when configured.

If init was invoked by another request, resume without rerunning \`impeccable context\`; the native reference above is the one thing that run could not have given you, and new-work owns later visual decisions.
`,
  },
  {
    path: "reference/ios.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# iOS platform

For native iOS / iPadOS apps: SwiftUI, UIKit, React Native, Expo, Flutter shipping to Apple hardware.

On native, the visitor mode narrows what expression may override. HIG conformance governs structure, navigation, and interaction in every mode; brand expresses through the layer the platform leaves open (tint, type, motion, content).

## The iOS slop test

Would a fluent iPhone user trust this app, or pause at off-spec controls? The tell is "ported from a website": reinvented navigation bars, custom back gestures, web-shaped buttons, hover-dependent affordances. Default to the platform's components; depart only for a reason the user would thank you for.

## Layout & structure

- **Safe area.** Lay out inside the safe-area insets. No controls under the notch, Dynamic Island, home indicator, or rounded corners.
- **System navigation.** Tab bar for 2–5 top-level sections (sections, never actions), navigation stack for hierarchy, sheet for self-contained tasks. No custom global nav, no mixed metaphors.
- **Edge-swipe back stays alive.** The left-edge back gesture is muscle memory; never disable or overlay it.
- **Large titles** on top-level screens, collapsing to inline on scroll. Deep detail screens stay inline.

## Touch targets

- **44×44 pt minimum** for every tappable control, with breathing room between adjacent targets.

## Typography

- **Dynamic Type.** Use the system text styles (Large Title through Caption) so text follows the user's reading size. No hard-coded point sizes.
- **San Francisco carries the UI.** Body, labels, and controls stay on SF Pro / SF Compact; a brand face may appear in display moments.
- **11 pt floor**; Body is 17 pt.

## Color & materials

- **Semantic system colors** (label, secondaryLabel, systemBackground, separator, tint). They adapt to Dark Mode and increased contrast automatically; raw hex breaks there.
- **Dark Mode is a first-class appearance.** Design and test both.
- **One tint color** drives interactive elements; decoration is not its job.
- **System materials** for blur and translucency behind bars and sheets; no hand-rolled glassmorphism.

## Components & controls

- **Platform controls.** Switch, segmented control, stepper, system pickers, action sheets, alerts, context menus, swipe actions. Reinventing these for flavor is the most common native slop.
- **SF Symbols** for iconography: baseline-aligned, Dynamic Type-aware, weight and scale variants. Don't mix in a web icon set.
- **Deliberate modality.** Sheet for a focused dismissible sub-task, full-screen cover for immersion. Clear Cancel/Done; honor swipe-to-dismiss unless data loss requires a guard.
- **Grouped/inset lists** for settings-shaped content; no bespoke card stacks.

## Motion

- **System transitions.** Push slides, sheets rise, dismiss reverses the entrance. Custom transitions that fight the navigation model disorient.
- **Honor Reduce Motion.** Crossfade instead of parallax and large slides.

## Verifying the build

- **Screenshots come from the Simulator, never a browser.** Build and run, then capture with \`xcrun simctl io booted screenshot <path>\` (with several running, replace \`booted\` with the target's UDID from \`xcrun simctl list devices booted\`; display names can collide, the UDID never does). Capture every device class the app ships to, at least one iPhone and, when iPad is a target, one iPad, and write the files where the review flow expects them.
- **Dark Mode and Dynamic Type belong in the pass.** \`xcrun simctl ui booted appearance dark\` flips appearance, reusing the capture's UDID when several are booted; a check at a large Dynamic Type size catches the truncation a fixed layout hides.
- **Simulators give breadth; posture, gestures, and performance need hardware.** Say which one produced the evidence.
`,
  },
  {
    path: "reference/layout.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Layout turns product priority into reading order, grouping, rhythm, and usable space. Diagnose the structural problem before moving boxes.

---

## Visitor mode

- **Persuade + Experience:** composition may be asymmetric, fluid, or intentionally disruptive when the selected world earns it.
- **Operate + Read:** predictable structure, stable density, and navigable linearity are affordances.
- **Native:** follow [ios.md](ios.md) or [android.md](android.md) for navigation, insets, adaptation, and touch targets.

Preserve the established visual world. A layout command changes structure inside it; identity replacement belongs to [new-work.md](new-work.md).

## Two isolated assessments

When a sub-agent tool is available and permitted, run these independently; otherwise run them yourself in this order.

1. **Layout assessment:** inspect representative states and viewports. Answer every question below with rendered or source evidence:
   - **Reading order:** Apply the squint test. With detail blurred, can you still identify the primary element, the secondary element, and the major groups in order?
   - **Grouping:** Are related items close and distinct groups separated, or are containers compensating for weak proximity?
   - **Rhythm:** Do tight and generous intervals create a deliberate cadence, or is one spacing value repeated until everything has equal weight?
   - **Structure:** Does the topology match the content and task? Are repeated cards, columns, or sections genuinely equivalent, or merely a framework default?
   - **Density:** Does the amount of information per region fit use frequency, decision complexity, and visitor mode?
   - **Adaptation:** At narrow, intermediate, wide, zoomed, and localized states, what reorders, collapses, wraps, scrolls, or remains fixed? Does DOM and focus order still agree with the visual order?
   - **Extremes:** Do long content, empty states, overlays, sticky elements, safe areas, and small touch targets expose structural failures?
2. **Mechanical scan:** run:

\`\`\`bash
.agent/skills/impeccable/scripts/impeccable detect --json --scope layout [target files or dirs]
\`\`\`

Also inspect arbitrary spacing, overflow, stacking, and container behavior the detector cannot resolve. Keep mechanical evidence out of the first assessment, then synthesize both passes before editing. A clean scan cannot prove hierarchy or rhythm.

## Set the spatial thesis

Before editing, name:

- the primary reading or task path;
- what belongs together and what must separate;
- which element leads and which supports;
- the intended density and spacing rhythm;
- how the structure changes across containers, viewports, input modes, and content extremes.

Choose the simplest structural model that expresses those relationships. Use layout primitives according to the relationships they control, and name reusable spacing and container roles semantically.

## Apply

- Group by meaning. Use proximity before adding containers or decoration.
- Create rhythm through deliberate contrast between tight and generous intervals.
- Use a documented spacing scale rather than one-off values. A 4-unit base usually provides the useful middle steps that an 8-only scale misses.
- Let hierarchy follow product priority, not framework defaults.
- Keep distinct content visually distinct without turning every group into an isolated component.
- Make responsive behavior structural: reorder, collapse, reflow, or reveal based on what remains important.
- Prefer container-aware components when the same component appears in different contexts.
- Use \`gap\` for sibling rhythm when it expresses the relationship more directly than child margins.
- Keep touch targets usable even when their visible marks are small.
- Use depth only when it clarifies state or hierarchy.
- Make optical corrections only after inspecting the rendered result.

Variation is not a goal by itself. Repetition should support recognition; break it only when content or priority changes.

## Verify

- The squint test still reveals the primary, secondary, and major groups in order.
- The reading and task path remains clear at every supported size.
- Related content groups naturally; unrelated content does not blur together.
- Tight and generous spacing create intentional rhythm instead of monotonous repetition.
- Density matches use frequency and content complexity.
- Long text, empty states, localization, zoom, and dynamic content do not break the structure.
- Keyboard, touch, and assistive-technology order agree with the visual order.
- The final mechanical scan has no unexplained findings.

Answer each item with rendered or source evidence, then rerun the scan. Do not substitute a bare “yes” for verification.

When the structure holds, hand off to \`/impeccable polish\`.

## Live-mode signature params

Every variant declares a coarse \`density\` parameter and authors spacing against \`var(--p-density, 1)\`.

\`\`\`json
{"id":"density","kind":"range","min":0.6,"max":1.4,"step":0.05,"default":1,"label":"Density"}
\`\`\`

Add one structural parameter only when the topology genuinely branches. Follow [live.md](live.md)'s parameter contract.
`,
  },
  {
    path: "reference/mode-operate.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Operate

\`impeccable concept-seed --mode operate\` prints the two sections below as its MODE RULES block. On an Operate surface the visitor came to get a job done, so the page is first a working product of its category and the world serves it.

## Directions

Someone who uses tools like this one should know where everything is before they notice the world. The world lends four things and only these: type, palette, density, and one signature move. It never supplies the layout, the navigation model, or the controls. Colour is part of the world's contribution, and it does real jobs: a committed palette for the shell (a coloured rail or header, a tinted ground), state colours, data series, selection, and the signature move. A grey screen with one accent colour is the category default without the category's polish, not restraint.

Read every candidate, the assigned direction, and every challenger through that limit before you fuse or judge it. A world taken from a tool or instrument the audience operates (a terminal, a scope, a control panel, a cockpit) or from a fictional interface comes back as a costume of that tool on a working screen: take from it only what transfers as type, palette, density, and a signature move, or replace it from your list. When a catalog world's source is itself an interface language, the same limit holds: it lends type, density, palette, and one signature move, while navigation and controls stay the standard ones for the platform, web components on the web and native controls in an app.

Write each direction's first viewport as the product's shell first: the navigation, the work areas and what each is for, the data the visitor reads first and its states, and then where the signature move lives. Expression may never obscure the task, state, or familiar affordance. Name the signature move concretely, so the comp and the build can find it: service health drawn as a transit map, a schedule set in a timetable's column rhythm. A direction whose world shows up only as a colour scheme has not found its move yet. When you weigh fused challengers, product clarity includes reading as a working product of this category.

## Comps

The comp is the product screen, in the direction's committed palette: its shell and navigation with a distinct area for each job and, where there is data, filters over what they scope and charts and tables with clear states. The world enters only through type, palette, density, and the one signature move; it never supplies the page's organisation, so a working screen never reads as a newspaper, a poster, or any other artifact of the world. Every control is a standard one the visitor already knows how to use, a web component on the web and the platform's native control in an app: buttons, tabs, inputs, selects, filters, tables with sortable headers, navigation that reads as navigation. Never a costume of the world's own interface: a terminal's function-key bar or command prompt, an instrument's bezel, ruled ledger paper standing in for a table. A comp an engineer could not build from the platform's standard components is a picture of the tool, not the tool. The finish bar is the best product in the category: an aligned grid, consistent spacing, a real type scale, and clear hierarchy. The signature move adds to a screen that is already that clean; it never stands in for it.

Prompt with the screen's real content: the product name, realistic data with plausible values and units, real labels, and one state worth seeing (an alert, a degraded service, an empty filter result), never placeholder tiles. State colours (red for critical, amber for degraded) sit on top of the world's palette only where they carry meaning, and a headline number that moves over time shows its recent history, with the onset marked when something changed.

Comps two and three vary the product's organisation, never its world coverage: the navigation model (side rail, top bar, command-first), how the work areas divide the screen, which data leads, the density, and where the signature move sits. Each must be recognisably different from the first at thumbnail size; a variant only its prompt can tell apart adds no choice. A variant that adds world material, texture, or ornament goes further in the wrong direction; on a working screen, more world is a costume.

Self-check every render: with the name covered, does it read as a product of its category, could the visitor do the task from it, and is it at least as clean as the category standard and more distinctive than it? If it reads as an artifact of the world first, regenerate with the shell and the work areas named region by region and the world held to its four contributions.
`,
  },
  {
    path: "reference/mode-persuade.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Persuade and Experience

\`impeccable concept-seed --mode persuade\` (or \`experience\`) prints the two sections below as its MODE RULES block. On these surfaces the design is what the visitor judges, so the world may own and structure the page.

## Directions

When a catalog world's source is itself an interface language, the surface may carry its native grammar across navigation, content, controls, and states, within the platform conventions a native app keeps.

For **Persuade**, the opening must make the offer intelligible and desirable, expose a clear action, and demonstrate something only this product can prove. The action is the one the category's visitors came to take, in its working form: an airline's route-and-dates search, a clinic's open appointment slots, a store's add to cart. A decorative link pointing at it elsewhere does not count. Conversion lives inside the form's own vocabulary: a hook that lands in one line, a visible primary action, a legible reading order. A committed form that hides the offer or the action has not finished translating. For **Experience**, the work itself leads from the first viewport.

## Comps

The world may be the carrier of the page, never a picture of it: a facade, a shutter or a book can be what the page is built on, while a viewport painted whole as a facade, a book cover or a travel poster, with no working parts in it, is a picture of the world, not its website. Material coverage is wanted: the world's material is the ground and the major surfaces, its type sets the headlines, and a world reduced to an accent on a neutral template is the category default with a sticker on it. Coverage is not performance: how many regions act out the concept is limited by the depth rule in visualize.md, and the rest stay in the world's material without performing it. Both ends erase the direction: the painted poster, and the generic product page (a headline over subcopy and a button, a row of equal cards below). The dealt composition sets the skeleton, and the compositions you write for comps two and three answer to the same test: a split hero (copy on one side, the product on the other, a badge row under it) or a centred headline over a row of cards is the template whatever world paints it.

The world carries the page's parts and never absorbs them, so wherever it puts one, the page still works as a page: navigation set into a facade reads as links, copy on a shutter as set text a visitor reads, an action on a door plaque as plainly clickable, text reads against whatever sits behind it, the sections keep a steady vertical rhythm, the primary action is unmistakable, and the section below starts as a section rather than more painting. Fix a poster by making its parts work where the world put them, never by moving them into a standard layout on the world's colour: a cover that becomes copy beside a device on marigold has lost the cover.

When the world is an object, the page is that one object seen once, at one scale and from one point of view, and the object keeps its real form: a book opens to two pages on one gutter, never a third panel, and a spine that carries the navigation belongs to the book on the page, never a second book beside it. More content goes on the object's own surfaces or on the next spread below, never on extra copies or impossible folds.

Comps two and three each go further than the first, never cleaner: a bolder use of the same world, where the world's material carries more of the page's structure (still one dominant move, per the depth rule), a larger or stranger focal move, or a composition the category would not attempt.
`,
  },
  {
    path: "reference/mode-read.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Read

\`impeccable concept-seed --mode read\` prints the two sections below as its MODE RULES block. On a Read surface the visitor came to understand something, so the page is first a document of its kind, framed by the world.

## Directions

The reader's question leads, and comprehension and wayfinding stay intact at every step. Documentation reads as documentation, a guide as a guide, an article as an article, a changelog as a changelog. The world owns the frame and serves the column. The frame is the masthead, the navigation rail, the ground, the title and section openers, and the way code, tables, and callouts are set: there the world's palette, type, and signature move commit fully, so the page could belong to no other product. The reading column inside it stays calm: a reading face, real contrast, a real measure, nothing performing behind the text. The world never supplies the reading order or replaces the navigation with something a reader has to learn. Documentation still reads as documentation, a guide as a guide, an article as an article.

Candidates from the world's own publishing traditions transfer best: reference books, type specimens, timetables, field guides, technical manuals, scholarly apparatus, a newspaper's wayfinding. A tool, instrument, or fictional interface from the audience's world comes back as a costume on a page meant for reading: take from it only what transfers as type, palette, density, and a signature move, or replace it from your list. When a catalog world's source is itself an interface language, the same limit holds: it lends type, density, palette, and one signature move, while navigation and controls stay the standard ones for the platform.

Write each direction's first viewport as the document's shell first: the navigation and where the reader stands in it, the title and the opening that answers or frames the reader's question, the reading column, and the way forward (contents, section headings, next and previous). Then name where the world owns the frame and where the signature move lives: a masthead, a coloured rail, a running head, a margin system, a numbering scheme, a way of setting code or tables. When you weigh fused challengers, product clarity includes how fast a reader finds and understands the answer.

## Comps

The comp is the document as the reader meets it: a frame the world owns, in the direction's committed palette and type, around a calm reading column at a real measure (on the web about 60 to 75 characters with body text near 16px; in a native app, the platform's body text style and its readable width), with headings in a clear hierarchy and the wayfinding that carries the reader through. Body text is set in a reading face with real contrast against its ground; a monospace face is for code, parameters, and small labels, never the running text or the headings by default. Code, tables, notes, and figures sit in the standard forms readers already know, set in the world's type and palette. The signature move is one system used where it earns its place, never a frame repeated around every element. The world never supplies the page's reading order, so a document never reads as a poster, a magazine cover, or a book photographed open.

Prompt with the real material: the actual title, a real opening paragraph, real section names, and one example of the hardest content the surface holds (a code sample, a reference table, a diagram), never filler text.

Comps two and three vary the reading structure and how the frame carries the world, never the column: the navigation model (sidebar tree, top tabs, inline contents), the column and margin system, how densely the reference material sits, and where the signature move appears. Each must be recognisably different from the first at thumbnail size; a variant only its prompt can tell apart adds no choice. A variant that pushes world material into the reading column makes reading harder and goes the wrong way.

Self-check every render: can a reader tell where they are and where to go next, and read the body comfortably? Then cover the name: could this be any other product's documentation? If so, the frame has not taken the world; push the masthead, rail, ground, and openers further into it. If the render reads as an artifact of the world before it reads as a document, the world has reached the column; pull it back to the frame.
`,
  },
  {
    path: "reference/new-work.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# New visual work

Use this flow for a new surface or a replacement visual identity. PRODUCT.md owns product truth. DESIGN.md owns durable visual decisions. A surface brief keeps strategy that belongs to one route or artifact. Complete [init.md](init.md) first when PRODUCT.md is missing; a missing DESIGN.md does not route back to init.

For a chosen comp’s region map, see [region-map.md](region-map.md) for the command sequence and schema.

## 1. Decide what is already true

Read DESIGN.md, representative code, tokens, components, and assets.

- **Redesign:** preserve product truth, content, function, constraints, and explicit brand commitments; replace the old visual world rather than polishing it. The old look is evidence of what the subject is, not authority over what it becomes.
- **Established world:** inherit it. A missing DESIGN.md does not erase a coherent identity already in code; document that identity instead of inventing a replacement.
- **Incomplete brand:** preserve confirmed assets and recognizable traits, then expand the system with the user for this surface.
- **No visual authority:** create a new world with the user.

A section, component, feature, or state inside an established surface inherits that surface. Never turn a local addition into a new identity exercise.

## 2. Ask what will change the work

Before implementation, get the user's answer through the structured question tool when available. Ask two or three related questions; a precise request needs only a compact confirmation. Skip settled facts, not the confirmation: DESIGN.md settles the visual world, not this surface's purpose or concept.

- **Persuade:** who must act, what they should believe, which real proof, content, or assets earn that belief.
- **Operate:** the task, information, important states, frequency, constraints.
- **Read:** the reader's question, source material, structure, wayfinding.
- **Experience:** what leads, how exploration unfolds, which interaction or transition matters.

Across modes, ask what success looks like, what must remain untouched, and what would make a polished result feel wrong. Never ask for CSS values or canned aesthetic lanes.

## 3. Choose the right amount of invention

### Extend an existing surface

Inherit its world and composition. Resolve only the new purpose, content, hierarchy, states, interaction, and how the addition joins the surrounding experience. No concept tournament, and no DESIGN.md change unless the user approves a durable system change.

### Create a whole surface inside an established world

Keep the visual system fixed. Derive five to seven materially different structures from the content, task, and user behavior, ordered by resonance. For a genuinely open whole page, screen, or flow, run:

\`.agent/skills/impeccable/scripts/impeccable concept-seed --scope surface --mode <mode>\`

The script deals three of your structures; the dice pick which three reach the user, breaking the ranking rut while the user keeps a real choice. Present them on the decision page as full cards of equal salience, the dealt lead under kicker THE ROLL, with steer and re-roll; the user locks one. Each card declares \`kind\`: \`assigned\` on the dealt lead, \`dealt\` on the other dealt structures, and \`challenger\` with its \`catalogId\` (the SOURCE ID) on a challenger that won its place. No canon card and no pick card at surface scope: the world is settled, so every card visualizes composition, not identity. With image generation and a comp-led build path (the path the PRESENTATION block printed for this surface; the build-path paragraph below), each card declares a \`comp\` under \`.impeccable/mocks/decision/\`, generated after serving, in reading order, under [visualize.md](visualize.md)'s comp discipline and the MODE RULES block concept-seed printed for this surface. Anchor each comp on the established identity: pass a screenshot of a representative existing page as a reference image (the harness image tool's input image, or \`impeccable generate-image --ref\`) with a short prompt in visualize.md's shape; prose paraphrases of a design system drift, pixel references do not. Without image generation, or on a code-led round, each card carries an HTML sketch of the first viewport, declared as its \`html\`, which the page draws as a skeleton; the PRESENTATION block names its shape, and a card without one falls back to a \`wireframe\` schematic (\`impeccable serve-question --schema\`). Locking a card is the approval and sets the build path: a locked comp builds comp-led with that comp as the approved comp, discharging [visualize.md](visualize.md)'s three-option round with no second approval point; a locked sketch or wireframe builds code-led, its ambition carried by the direction contract, and a locked sketch is the composition the build matches. Never run the script for a local extension or a precisely specified narrow request; shape those directly.

### Create or replace the visual world

1. Name the product's unique mechanism in one sentence, the audience's real scene, its cultural home, and what this first surface must prove. Note the page this category always ships and its predictable opposite; both are the rut, kept out of the seven-candidate list. A brief that paints its own picture, a product name, a titled artifact, a governing metaphor, adds its literal reading to the rut: spend at most one candidate on it and derive the rest from elsewhere in the audience's world.
2. From that cultural world, list seven concrete visual systems, artifacts, places, or rituals the audience knows by heart, each with one line on why it resonates and can carry the mechanism and one on how it looks (its ground and main colours, its type voices, the one signature that makes it recognisable), ordered by resonance. The audience's world includes its graphic and screen traditions, not only its physical objects: the notation, publications, identity programs, data graphics, and interfaces it reads daily. On an Operate or Read surface, the seven still come from anywhere in that world (its graphic traditions, places, rituals, and artifacts), never from the tools and instruments the audience operates: a terminal, a scope, or a control panel handed to a working screen comes back as a costume of that tool. A nameable abstract system (a school of poster, a documentation standard) is as concrete a candidate as any artifact. On a Persuade or Experience surface, the tools and instruments the audience operates count toward the rut: spend at most one candidate on them. Also ask what this thing would look like as a physical object and what its world looked like before the web. Near-duplicates count once. When more than three of the seven share one material family, the derivation stopped at the subject's most obvious artifact; dig until the list spans at least three families.
3. Turn that material into complete directions: each joins a reusable visual world to a concrete first-surface experience.
4. Run \`.agent/skills/impeccable/scripts/impeccable concept-seed --scope direction --mode <mode>\` and follow what it prints. No substitute, no skip: on a new or replacement world, writing artifact code before this script has run and its assignment is acknowledged is a contract violation, whatever the harness, the model, or the time pressure; the roll is what keeps every run from converging on the category default. The script assigns the direction to build and deals catalog challengers. Fuse each challenger before judging it: the challenger supplies the form and its system grammar, the product supplies every fact, clarity wins conflicts. Weigh fused challengers against the assigned direction on exactly two axes, audience identification and product clarity. Losing to strong grounded material is a valid outcome; beating a thin or tool-monoculture list is the point. Close with a verdict per challenger, decided before any borrowing: wins (beats the assigned direction on both axes; becomes the build candidate), competitive (holds one axis; stays a full alternate), or declined (loses both). A declined challenger is not spent: name the one discipline of its system the assigned direction lacks, and raise the assigned direction to match before presenting it. A donation transfers ambition and system discipline (a palette's total commitment, a grid's density courage, a form's structural honesty), never the challenger's clothes. A component treatment, such as a button's shadow or a display face, is clothes, not discipline; a lifted motif is a costume note, not a raise, and one world owns the page. Write each raise into the presented direction as its own line, named for its donor; a raise nobody can read did not happen.
5. Present one direction, fully committed and already raised by the hand it beat, raises visible as named lines: world, first viewport, visitor path, signature interaction, cross-surface reach, honest risk. Route each challenger by verdict: winning and competitive challengers are full alternates with their QUALITY BAR cards and one-line case; declined challengers render demoted, compact and quiet, each carrying its verdict and what the direction kept from it, never full-size, never silently dropped, still adoptable on request. The verdict informs the user's choice, never pre-empts it; the demoted row is the hand's proof of judgment. A hand holds at most three full-card challengers: when the roll deals more, the three strongest join and the rest wait in the re-roll pool, noted in one line; dropping a challenger from the hand itself takes a named product-truth failure, disclosed. The hand's size follows the verdicts, never a number the user named: when the weighing yields fewer full cards than asked, deliver the honest hand, say in one line why it is smaller, and offer a re-roll to deal candidates that could earn full cards. A declined challenger is never promoted to fill a slot; a promoted card looks exactly like a competitive one, so the promotion leaves no trace. The standing exit does not count toward a requested number once the user has seen and rejected it; it stays present as the quiet door. Add one card for your own top-ranked grounded candidate when it is not the assigned direction, kicker IMPECCABLE’S PICK, same anatomy as every card, with an honest risk line naming its familiarity when true: the strongest grounded direction is often where most runs in this category land, and the user deciding that trade is the point of showing it. Familiar and effective is a legitimate destination, not a failure of nerve; the pick card and the standing exit serve it at two depths. One pick card, never two, never a ranked list: a lineup of your candidates hands selection back to a taste function and invites the safest card. The pick never takes the lead position; when the dice assign your top candidate there is no pick card, and the assigned card notes it topped your list. Add re-roll with an optional one-line steer, in three registers: plain (a fresh hand, same spread), safer (your remaining conventional grounded candidates plus the canon against named competitors), bolder (foreign forms only, at full commitment). The register is the user's steering on the familiar-to-bold axis, never yours to pre-select; when the answer carries one, re-run the seed with \`--register <value>\` and the next \`--reroll\` round, and follow what it prints. A user saying "bolder" or "safer" while a direction round is open means these registers, never the bolder or harden commands. The two channels share this structure and differ only in richness: cards and boards on the decision page, names and one-liners through the structured tool, whose option list carries the assigned direction, the pick, the winning and competitive challengers, and the standing exit last; declined challengers fold into the assigned option's description as their kept lines, so the raise survives the text channel.

The standing exit: every direction round offers one quiet, permanent alternative, the category standard, played straight. It is the user's door, never yours: never recommend it, never weigh it against the roll, never let it soften the dealt directions; the counterweights bind the unchosen default, not the chosen one. When the user takes it (the canon action, a safer-steer, or plain words asking for the familiar or competitor-like path), convention becomes the commitment: ask once for two or three products this should sit alongside, make their craft level the bar, and execute the canon at full fidelity, without irony or smuggled quirk. Record a standing preference as a brand commitment in PRODUCT.md. Re-roll eliminates every direction already shown, grounded and challenger alike; after two consecutive re-rolls, ask what quality is missing. Re-roll on your own only on named factual grounds, when the assigned direction cannot carry the product's truth or task; taste is never grounds. The user may re-roll freely, and a user- or brief-pinned direction beats the roll, always. Resolve collisions field by field: preserve every user- or brief-pinned constraint. In dimensions the brief leaves open, the assignment still binds through its topology, controls, state vocabulary, and ritual; when only its materials conflict with a pinned visual direction or PRODUCT.md brand commitment, translate that material expression and name the translation in the presented direction. A look mismatch is not grounds to re-roll. Present the decision visually: write an options payload with the assigned direction leading, its raised lines included; the pick card when one exists; the dealt challengers as alternates with their QUALITY BAR cards, verdicts, and kept lines; re-roll with its safer and bolder registers; steer; canon enabled; and \`buildPath\` carrying the recorded default with \`toggle: true\` whenever image generation exists (details in the build-path paragraph below). A degraded roll with no challengers still uses the page, as a single text-only card with re-roll. Every option declares its identity: \`kind\` is \`assigned\`, \`pick\`, \`challenger\`, \`grounded\` (another of your own grounded directions, such as each card of a safer hand's lineup, any number of them), or \`dealt\` (a surface round's dealt structures other than the lead), and each challenger carries \`catalogId\`, the SOURCE ID concept-seed printed for its world, never the card's own id; \`--start\` and \`--update\` refuse a direction or surface payload without them, and the page reports the choice from them. Give every card the same anatomy: thesis, palette, materials, first viewport, honest risk, and the challengers' case lines (\`--schema\` prints the exact shape); the page renders identity from these fields, demotes declined challengers to their row on its own, and a challenger's catalog image rides as labeled inspiration, never the promise of the build. Author \`canonCard\` too: the category standard as one honest card, same anatomy; the page keeps it subordinate, and the counterweights still bind you. Run \`.agent/skills/impeccable/scripts/impeccable serve-question --start --payload <file>\` (\`--schema\` first for the payload shape). It daemonizes, prints the page URL and a key, and exits; open that URL for the user, in-app browser first, then the system opener, then showing the URL. Collect the choice with \`--wait --key <key>\`, repeating while it exits 3; the ANSWER prints as JSON. An ANSWER of \`{"optionId":"reroll"}\` keeps the server alive and the page open on a loading hand: rerun concept-seed with the same \`--scope\` and \`--mode\` plus \`--from <seed-key> --reroll <n>\` (1 on the first re-roll, counting up), build the next payload, deliver it with \`--update --key <same key> --payload <file>\`, then return to \`--wait\` on that key. Never \`--start\` a second server or fall back to chat here: either strands the open tab on a hand that never arrives. Exit 4 means the page closed unanswered: re-present once through the structured question tool, and with no answer there either, proceed unattended with the assigned direction and state the assumptions. A harness that can leave a shell blocked in the background may run the script without \`--start\` and let it auto-open and block. A harness that cannot hold a blocking \`--wait\` (it detaches long-running commands without ever returning their output, or reaps a backgrounded child) takes the structured tool without starting the page and discloses the substitution in the first reply, so the tab is never left unanswered. A shell that hands back a still-running command as a session you can poll holds the wait: poll that session until it exits, and rerun \`--wait\` only after it exits without an answer. Never predict any other fallback: run the script, and only exit code 2 from starting it, or that wait check before starting, routes the decision to the structured tool; those are the fallback, never an error to retry. concept-seed closes every roll with this procedure, condensed, as a PRESENTATION block that names the recorded build path.

When image generation exists, every card also declares a \`comp\` path under \`.impeccable/mocks/decision/\`, the canon card included. Where the harness sandboxes its shell, start the page through the least-sandboxed command path it offers: a sandboxed shell cannot bind the board's port, and the first-attempt failure costs a retry every session. Serve the page first, then produce the comps; the page shimmer-waits per slot and the user may answer before they land. Load [visualize.md](visualize.md) before writing the first decision comp prompt, not at the comp round: each card's image is that direction's north-star comp at full fidelity under its comp discipline and the MODE RULES block concept-seed printed, and a prompt written before reading them misses every rule there: the requested surface as the real page, its first viewport and the start of the section below it, held like every comp to visualize.md's rule that a template skeleton stays the template whatever world paints it (your own pick included: a safe layout under a world skin is the template), a short prompt in visualize.md's shape, real product name and real content, no invented commercial claims, in that card's own palette, type character, and material world, committed all the way. Once a round declares comps it has not generated yet, \`impeccable serve-question --start\` (and \`--update\`, and a flip to comp) prints a \`NEXT read <path>/visualize.md\` line; read that file then, before the first prompt. \`--wait\` prints \`COMP SIDECAR MISSING\` for any landed decision comp with no prompt sidecar (the image's full file name plus \`.json\`: \`a.png\` gets \`a.png.json\`); write the missing sidecar before you continue. \`COMP STALE\` names a file an earlier round left at one of this hand's slots; regenerate it there. Generation takes the same time at any fidelity, so an unfinished draft pays comp cost for draft quality; fairness between cards is equal fidelity in each card's own grammar, one surface, one aspect, never shared unfinishedness. The frame's aspect is the surface's own: portrait at device viewport for a native app or mobile-first surface, landscape for desktop web; the decision page adapts to either, and a phone screen comped landscape is a broken frame, not a neutral default. Produce in reading order, the assigned card, then the pick, then the full-card hand, then canon, each file written with its prompt sidecar the moment it is done, so a re-roll's spend front-loads onto the cards read first; declined challengers get no comp, their catalog thumb is their face. With parallel subagents, fan out one agent per card: each spawn is the shipped asset producer with a single-comp packet, that card's fields, its world's card images when the NEXT line names them, PRODUCT.md, the shared frame, the path to visualize.md for its comp discipline, the COMPS section of the MODE RULES block copied verbatim (the subagent never sees the roll's output), and the card's declared path, up to four in flight. Regenerate inline any slot still empty when its agent returns; drop without ceremony any slot still empty when the user answers. No other supervision is owed. Without parallel subagents, generate in the main thread after serving, same order, and let the harness's own generation display carry the progress; the wait for the answer follows the last file. The chosen card's comp is not spent by the choice: comp-led, it enters the comp round as compositional option one; code-led, it returns at the finish review as the critique reference, what the image dared that the build did not. Unchosen comps stay in \`.impeccable/mocks/decision/\` as the round's spent hand; they carry no approval and imply none. With no image generation, cards carry their identity in palette chips and facts, and that page is complete, not a lesser version; the page then also demotes every challenger's catalog art to a labeled thumbnail on its own, because salience must encode the verdict, never the accident of which cards have images.

The execution contract, comp-led or code-led, is never asked inside a round; the page's toggle handles the exception. An Operate or Read surface is code-led whatever the project records: working screens and documents come out better built than pictured. A Persuade or Experience surface takes the recorded default: read it from \`.impeccable/config.json\` (\`buildPath\`), the gitignored \`.impeccable/config.local.json\` winning where one machine differs from the team's committed value; with neither, comp-led is the default whenever image generation exists. concept-seed's PRESENTATION block prints the path for the surface in hand; follow that line. Author every direction and surface payload with \`buildPath: { "value": <default>, "toggle": true }\`; the page renders a footer toggle with the trade stated beside it, and the ANSWER returns \`buildPath\` plus \`buildPathFlipped\`. A flipped value binds that session only and is never written back, with one exception, the only question this preference ever earns inside a round (init records it up front on projects that get the chance): when \`buildPathFlipped\` comes back true on a Persuade or Experience surface in a project that records no \`buildPath\` at all, ask once after the round closes whether to keep it as the standing default; a flip on an Operate or Read surface is one round's choice and is never offered for recording. Either answer writes \`.impeccable/config.json\`; the answer picks the value, never whether to record one. Yes writes the flipped value; "no, just this once" writes the value they flipped away from, the standing default they just confirmed by declining. Ask on the flip, never on the untouched default: a user who left the toggle alone told you nothing. A declined offer nothing writes down is an offer the next session makes again. When the user asks in words to change the standing default, update the file without asking. **Comp-led**: the chosen card's comp is law, generated before building when it does not yet exist, and the finish review audits the build against it; boldest composition on the table, fix rounds expected, and the comp is non-optional, no silent skipping. **Code-led**: no comp of this page and no apology for it; each card's HTML sketch is what the user chooses from, and the picked one is the composition the build matches and the finish review audits; the QUALITY BAR boards still calibrate finish, and the ambition moves into the written contract, the FIRST VIEWPORT block plus a named signature interaction and motion grammar, which the finish reviewer audits in behavior; code-led is not a discount on commitment. A code-led round still declares each card's comp path as a flip reserve: when the user flips the toggle to comp mid-round, \`--wait\` returns once with BUILD PATH FLIPPED while the page shimmers the slots; generate each open card's comp into its declared path then, lead first, and wait again. The flip back is free, and a comp that already rendered rides at the finish review as the critique reference. Without image generation there is no toggle and no choice: code-led is the only path, stated in one line rather than asked. The structured-tool fallback has no toggle either: it builds on the path the PRESENTATION block printed for the surface and asks nothing about the build path. The old two-card execution-contract round is retired; \`followup: true\` remains the general mechanism for delivering any later round over the same table via \`--update\`.

Catalog worlds are working systems, not mood references. When one survives, carry its palette and material, type and composition, topology, controls and state, and responsive rules into the product, as far as the surface's mode allows. How far a source that is itself an interface language may carry its grammar is the mode's call, in the MODE RULES block. Open the QUALITY BAR board and hero for the world you build the moment the choice lands, even if you viewed another card earlier; the ANSWER line names the chosen card's images (when the harness only reads files or runs sandboxed, download them into the workspace and open the relative path; sandboxed viewers reject absolute paths outside it). They set the craft level the build must reach, a rendered reference's finish, commitment, and art direction, never the composition; your surface serves this product.

Every direction the roll can land on must already be viable: every relationship and claim it visualizes true, a real palette and component family, a distinctive composition with one product-specific experience, workable at full-surface scale within the available assets, tools, and performance budget. A candidate that fails on truth is replaced before the roll, never rescued by it. Truth binds claims, not demonstrations: in greenfield work, author whatever illustrative material the concept needs at full fidelity, label it synthetic wherever a visitor could mistake it for the real thing, and hand the user the list of what to replace with real material. What stays uninventable are commercial and factual claims: prices, customers, benchmarks, endpoints, capabilities the product does not have. Refusing a bold direction because its demonstration data does not exist yet is the timidity reflex wearing honesty's clothes.

What the opening must do, and how far the world may reach into the page, depends on the surface's mode. \`concept-seed --mode <mode>\` prints that mode's rules as a MODE RULES block, DIRECTIONS and COMPS; they govern every direction, card, and comp for this surface, and where they conflict with shared guidance they win. A session that reaches directions or comps without concept-seed having run (a direction the user or brief pinned) reads the mode's file instead: [mode-persuade.md](mode-persuade.md) for Persuade and Experience, [mode-operate.md](mode-operate.md), or [mode-read.md](mode-read.md).

## 4. Commit the world

Pick a color strategy before picking colors: Restrained (neutrals tinted from the world plus one accent; common on screens people operate or read, where the mode's rules still ask colour to do real jobs), Committed (one saturated color carries 30-60% of the surface), Full palette (3-4 named roles), or Drenched (the surface IS the color). Persuade and Experience surfaces have permission for the bolder strategies; take them when the brief allows. Color commits at page scale: fields that own whole regions, not accents scattered over a neutral ground. Dark or light is never a default: write one sentence of physical scene (who uses this, where, under what light) and let it force the answer.

Choose faces like objects from the subject's world, in the mode's register. Operate and Read surfaces are well served by system stacks and workhorse UI faces; Persuade and Experience surfaces want faces with a point of view, and these training-data defaults mean you stopped looking: Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans. Naming one of these faces anyway requires a reason no other face could satisfy, and a subject association is never that reason: books wanting a serif, bookshops wanting hand-lettering, and tech wanting a mono are the associations the list exists to break.

Calibration: AI-generated interfaces cluster around a few looks regardless of subject: warm cream ground, high-contrast serif display, and a terracotta or signal-red accent; near-black with one neon accent and glowing edges; broadsheet-editorial hairlines, italic display serif, and small tracked mono labels; flat saturated ink with black boxes, hard offset shadows, and heavy condensed display type. All are legitimate when the brief calls for them. Where the brief leaves the aesthetic free, landing in one means the self-check failed: if someone could guess your aesthetic from the category alone, or from category-plus-avoidance, rework until neither answer is obvious. Energy is not the enemy of trust: a brief's negative constraints (no gamification, no hype) rule out those devices, not exuberance, and adjectives describing the product's behavior (quiet support, calm coaching) do not dictate the surface's energy. A bookish, warm, or child-facing subject does not soften the calibration: book cloth, thread, jackets, endpapers, and shelf ephemera span the whole saturated spectrum, and cream paper is the smallest corner of that world; landing on cream plus serif for a book subject is the default wearing the subject's clothes. A brief-pinned world pins the world, not its softest rendition: the pinned world's full material range stays in play, and a rendition matching what any model ships for that world failed the self-check at execution rather than selection.

## 5. Record the decision

Before code, record the chosen direction as a development-only contract under \`## Direction contract\` in the relevant surface brief. A direction contract is durable route or artifact strategy, so create or update the brief even when no other surface strategy needs persistence. Use six short blocks, roughly 150 words; do not spend tool calls counting words. THESIS: the one idea this surface owns and the category-default arrangement it refuses. OWN-WORLD: the palette and component language, specific enough to be recognizable with all content removed. STORY: what the visitor understands, believes, and does. FIRST VIEWPORT: the exact composition, what is where and at what scale, and where the primary action sits. FORM: the chosen form, its position on your ordered list, and the SEED REFERENCE concept-seed printed (\`seed:\` and 16 hex), never the raw seed key: the brief is committed, and on this machine the reference stands in for the key wherever a command takes one. When the roll printed SEED REFERENCE unavailable, write \`seed: none (unavailable)\` instead, and nothing else. Close with one more line, FINISH: the run's exit condition, verbatim "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance". The surface brief is the reminder later agents reload across edits and sessions: a page that looks complete with the FINISH line undischarged is not done, it is abandoned at the finish line. If a block reads like a mood, the direction is not decided yet; the finishing review audits the render against this contract.

Never copy the direction contract into implementation source or any browser-delivered artifact. This includes HTML or framework comments, hidden DOM, \`<template>\` elements, \`data-*\` attributes, rendered JSX or TSX output, serialized props or state, React Server Component payloads, client bundles, metadata or JSON-LD, accessibility-only text, and files served beside the artifact. A compiler or optimizer removing development metadata is not a safety boundary. Reviewers and documenters receive the contract from the surface brief.

On a new or replacement world, DESIGN.md is written at finish, from the built world, by the shipped documenter (section 7); a rulebook written before the build gets defended against reality instead of describing it, and hands the design-system detector an unstable target. A new world shipped with no DESIGN.md is still an incomplete run. An ordinary extension does not rewrite DESIGN.md.

Read the existing surface brief before updating it:

\`.agent/skills/impeccable/scripts/impeccable surface-brief read <primary-target>\`

\`.agent/skills/impeccable/scripts/impeccable surface-brief write <primary-target> <body-file> [related-target ...]\`

After writing, read the brief once more and verify that all six contract blocks and the seed reference (or \`seed: none (unavailable)\` when the roll printed that) are present before building.

Keep the brief small: scope and visitor mode; audience, job, action/task, proof/content, and constraints; chosen direction and memorable moment; unresolved decisions. Do not copy global product truth or DESIGN.md tokens into it.

On a comp-led build, whenever any image generation is available (a harness-native tool or the API fallback \`impeccable context\` reports), the locked direction is visualized before it is built, never skipped: load [visualize.md](visualize.md) and follow it, three compositional options put before the user for approval, the chosen card's decision comp plus two variations. This step is proven to produce the most compositional and ambitious work. A comp locked in a surface-scope structure round has already discharged this round (Create a whole surface inside an established world, above). On a code-led build the comp round is skipped by contract, never by drift: the ambition it would have carried lives in the direction contract's FIRST VIEWPORT block and named signature interaction, and the finish reviewer audits those promises in behavior.

For \`shape\`, return the selected direction to [shape.md](shape.md) and stop before persistence or implementation.

## 6. Build with full commitment

Build the assigned direction, not a safer interpretation of it. The form supplies structure, reading order, component conventions, and native motion; the product supplies every fact. Commit every atom: nav, buttons, inputs, and links are rebuilt in the form's vocabulary, and a stock component inside a committed form is a lapse. Land the first build fully committed; the passes that follow exist to make the committed thing clear and effective, never to dilute it. In unattended work, the safe rendition is the known risk.

### Comp-led: the comp is a measured contract

When an approved comp exists, it is a spatial contract, not a mood board: only the user can downgrade its authority, in explicit words. Models systematically believe their HTML, CSS, and SVG recreation of an image succeeded when it did not, so the build runs as a state machine on disk whose gates measure the screen against the comp instead of asking you to remember it. Start it once, and let it tell you what is next:

\`.agent/skills/impeccable/scripts/impeccable build-phase start --direction <seed reference, or none when it was unavailable> --artifact <entry file>\` right after the direction choice, adding \`--decision-comp <path>\` when the chosen card has a decision comp (the path CHOSEN COMP names) so the comps gate counts it as option one, or \`start --comp <approved comp> --artifact <entry file>\` when a surface round already locked one. Start is not the choice ping: that is the \`concept-seed --kind\` rerun the roll's TELEMETRY line names, sent once when the roll printed one.

Then, in order, each closed by \`.agent/skills/impeccable/scripts/impeccable build-phase advance\` (every verb below runs as \`.agent/skills/impeccable/scripts/impeccable <verb>\`; exit 2 means the gate failed and printed why; fix that and advance again; write nothing for a later phase while an earlier gate is open):

0. **comps.** The comp round from [visualize.md](visualize.md): three compositional comps of the requested surface at its own viewport under \`.impeccable/mocks/\`, each with a prompt sidecar, put in front of the user; the chosen one's sidecar gets \`"approved": true\`. The gate counts them and reads the approval; a \`start --comp\` skips this phase because it already happened.
The comp-led path is a frontier-tier job: it asks the builder to hold a measured layout, place plates at their boxes, and act on numeric readings across a dozen attempts. Smaller or faster models produce a recognisable page and stall under the hero gate; if the model in hand is one of those, say so before the direction round and take the code-led path, or expect the run to end at the hero with its readings unmet.

1. **spec.** Measure the comp: \`impeccable comp-spec --comp <comp> --grid\` writes a coordinate grid over the comp; open it, name every salient region by grid span in a regions file (text and control regions narrow to an ink cluster only when it retains at least 95% of the span’s contrasting pixels; inspect the resulting crop, especially for compound controls and multiline text; \`snap: false\` keeps the span, and an explicit \`box\` is taken as drawn) (kind \`plate\` / \`image\` / \`texture\` for anything painted: every illustration, photograph, figure, product object, and material texture; \`text\` / \`control\` / \`chrome\` for what code draws; every region carries a \`note\` saying what the comp shows there, which the plate prompt and the gate messages read), and run \`impeccable comp-spec --comp <comp> --regions <file>\`. The spec carries each region's box, sampled palette, and medium; \`impeccable comp-spec --print\` is the build's reference from here on. Type is measured, not guessed: \`impeccable font-match --measure <text region>\` reads the comp's cap height, width class, and weight off the pixels, and \`impeccable font-match --rank <region> --text "..."\` takes its candidates from a fingerprint index of the Google Fonts catalog (the nearest faces to the crop's shape) plus any names you pass with \`--candidates\`, renders them at that cap height with the region's words, and ranks them by fingerprint distance (its \`USE\` line is the CSS); with no browser resolvable it records the catalog's nearest face and says the size is estimated, which is still the choice to build on. Do not install a browser to rank, and never write a \`chosen\` face into the spec by hand: the gate accepts only what font-match wrote. The spec gate refuses to close until the lead text region is measured and ranked. A region note that describes painted material (a diagram, drawing, photograph, texture) under a code kind is refused at the spec: reclassify it as a plate, or reword the note if code really draws it. The script refuses a regions file that leaves comp ink unnamed: what is never named can never be missing. It also refuses a \`text\` / \`control\` / \`chrome\` region larger than a quarter of the comp: that is a column, not an element. Name each element inside it (\`container: true\` only when it truly is one undivided element). Anything drawn is a plate: an inline SVG past an icon's budget (a diagram, notation, leader lines with arrows, a "quick approximation" of the artwork) is refused at the hero; icon-sized SVG (under 64px, a few paths) is fine, and a chart the page draws from data at runtime is a chart, not an illustration. Callout lines and arrows that annotate a drawing belong to that drawing's plate, with only their labels set as text. Split regions by what varies independently, as [region-map.md](region-map.md) sets out; a framed view is a frame plate over its own image region. A crop of the comp is never a plate (the plates gate refuses a resample of the comp region); the crop is the reference the plate is generated from. A plate region's box has to hold its whole artwork with a margin: the spec measures the artwork's contact with the box edges and refuses a box that cuts through it (\`bleed: true\` only when the page really crops it there), because a plate placed with \`object-fit: cover\` on such a box shows the artwork minus the side the box lost. Anything not in the spec does not exist on the page: no borders, rules, containers, or chrome the comp does not show. Only three concessions exist: fonts (the closest obtainable face), icon glyphs (close enough, exact if the user chose an icon library; this covers the pictogram only, never a control's chrome, so a chevron, an arrow, a dropdown's border and fill, a button's shape are the comp's), and genuine defects in the comp such as spelling errors.
Inspect the proposed map before producing assets: \`impeccable comp-spec --comp <comp> --regions <file> --inspect-map\` writes a numbered overlay, exact crops, foreground-mask previews, and a consolidated report without changing the spec or build state. Inspect boundaries and excluded pixels together; an empty reference needs corrected geometry. \`parentId\` names an enclosing \`container\`; it never removes regions or approves assets. The report diagnoses geometry, not semantic completeness.

2. **plates.** Every raster region ships as a plate: an illustration, photo, or figure regenerated at asset resolution from its comp crop, UI text removed, at its \`plate\` path (isolated ink, figures, or objects use native transparent PNG so they sit on the page's own ground; photos and textures stay opaque); a texture (paper, cloth, grain) is a clean patch of the comp region mirror-tiled to size, generated only when no clean patch exists. \`impeccable comp-spec --crop <id>\` writes the reference; save \`impeccable comp-spec --plate-prompt <id> --background transparent\` to a prompt file for a cutout, or use \`--background opaque\` otherwise. Prefer the harness-native image tool with that crop and prompt, then \`impeccable embed-prompt <plate> --prompt-file <prompt.txt>\`. The API fallback is \`impeccable generate-image --ref <crop.png> --prompt-file <prompt.txt> --out <plate.png> --size <WxH> --quality high --background transparent\` (use \`--background opaque\` for full-frame assets); create the output directory first. Verify actual alpha, white foregrounds, fine edges, and clear holes on light and dark grounds; do not chroma-key native output. The plates gate scores the assets against the comp; also inspect placement and scale visually. With parallel subagents, spawn the shipped asset producer (\`impeccable-asset-producer\`; \`impeccable_asset_producer\` in codex; \`/impeccable-asset-producer\` in Cursor; on GitHub Copilot say "Use the impeccable-asset-producer agent") with the spec path and let it produce them all; without subagents, produce them here. A crop of the comp is a reference, never a shipping pixel. The approved comp is a fixed reference: never edit it, composite into it, or regenerate it, and never copy a crop of it in as a plate (the crop is only the reference you generate from). The gate checks every plate exists, is at least 1.5x the region's size, and reads as the region. Page code waits for this gate: a page written before its plates exist is a page that draws its material in CSS. A single-file deliverable changes nothing here: the plate is produced the same way and inlined as a data URI. \`--force\` exists for one case only, the user downgrading the comp's authority in words you quote in \`--reason\`; the script refuses every other reason. Score the plates before the review opens: once \`build-phase advance\` reports nothing but the pending review, run the plan and asset review in [component-review.md](component-review.md), where the user checks the plates and which regions code draws. A plate replaced after they accept needs a new round. No page code is written before they accept it; \`build-phase advance\` refuses until they do.

3. **hero.** \`impeccable build-phase scaffold\` first: it writes the measured layout as CSS custom properties (\`.impeccable/build/scaffold/layout.css\`: \`--r-<id>-x/y/w/h\` in % of the comp, plus cap height, font-size, family, and weight where measured) and a reference page (\`hero-reference.html\`) with every region at its box and every plate placed. Bind the numbers to your own semantic structure, an element per region; the reference is a check on positions, never the page, and overlapping boxes are overlapping boxes. Then build only the first viewport, at the comp's own dimensions, the comp's words copied verbatim (the user approved that comp with those words; rewording is a stated decision after the hero passes, never a silent one inside it), every text region sized from its measured cap height and set in its ranked face (served from the project: put the face's font files beside the page and load them with \`@font-face\`, never a hosted font stylesheet such as fonts.googleapis.com or a font data URI, because the first-viewport capture allows fonts only from the page's own files and refuses any other host as an external dependency), plates first: place every plate at its spec box (\`object-fit: cover\`, an \`<img>\`, a background image, or an inlined data URI named for it) before any text or control, capture into \`.impeccable/review/hero-repro.png\`, run \`impeccable build-phase record hero\` once so you see the plate regions read as match before any text exists, then lay the semantic layer over the plates from the spec's palette and boxes and advance. The gate first refuses while any plate is unreferenced by the source, then runs \`impeccable comp-diff\`, writes \`.impeccable/review/diff/hero/\` (side-by-side, heatmap, one paired crop per region, \`report.json\`; \`raw-report.json\` preserves the uninterpreted measurements). The report and crop labels use the gate's verdicts; \`gate.reasons\` lists the remaining blockers even when a region is called drift. An accepted plate is revalidated if its file, measured region, or comp changes. The gate passes at 72% overall with no hard veto outstanding (a missing region, a contradicted plate or text block, an SVG illustration, a clipped plate, invented ink block at any score); above the bar, the numeric readings become advisories printed with the pass, and the polish pass before responsive is where they get fixed: the gate also reads each text region's cap height, line count, weight, ink colour, and position against the comp, each chrome strip's height off its rule, and the frame for ink where the comp is calm (a kicker, an extra nav item, a divider), and says each miss as a number ("cap height 78px in the build, 103px in the comp"); those numbers are the edit. When it fails, open the region crops it lists, in order, before editing: a region scored \`missing\` needs its material, \`contradicted\` needs its structure re-derived from the spec box, \`drift\` is where size and spacing edits belong; repeated attempts do not clear unresolved blockers. After three failed attempts, present the first-viewport review from [component-review.md](component-review.md) instead of iterating. Once the user accepts a first viewport, the overall bar, the palette check and every numeric reading are advisories while the capture still matches it; a missing or unreferenced plate, an SVG illustration, an organic clip, a clipped plate, invented ink and failed rendered presence still block. When the capture drifts from what they accepted, restore it: that review is closed and is never requested again. This is where the run's ambition is won or lost, and a retry here costs minutes where a rebuild verdict at the finish costs the run.
4. **sections.** Build the rest of the surface inside the spec's system: the same corner language, line weights, and palette, and nothing the comp never shows. Where the comp does not cover a region, it inherits the recorded system.
5. **motion.** The signature interaction, reveals, and motion, orchestrated once rather than scattered.
6. **responsive.** The other viewports, and the first viewport at common desktop widths (1280 to 1600), not only at the comp's exact size: fluid columns, no fixed-pixel grid that wraps a hundred pixels narrower, and sizes in proportion to the viewport rather than px floors, so nothing the comp's first viewport shows is pushed below it and an accepted first viewport still matches at desktop width. Capture \`desktop.png\` (1440 wide, full page) and \`mobile.png\` (390 wide) into \`.impeccable/review/\`; the gate diffs the desktop first viewport (1440 wide at the comp's aspect; a native capture renders its own) against the comp and refuses a first viewport that only held at the comp's width. When it fails, open the crops it lists, in order: a \`displaced\` region is present but pushed out of the first viewport, so restore it there by resizing what sits above it, not by moving it alone. After three failed attempts the gate names the route (the first-viewport review, or the user's decision once one is accepted); take it instead of iterating or recording \`fix\`. A comp'd surface that is mobile-first was comped portrait; the plates were produced for that frame.

### Code-led

No comp and no apology for it: the ambition lives in the direction contract's FIRST VIEWPORT block and the named signature interaction, and the finish reviewer audits those promises in behavior. The chosen decision comp rides to the finish review as the critique reference.

### Both paths

- **The first viewport is a thesis, not a header.** Demonstrate the mechanism immediately, at the scale the form has in life; do not trap the concept inside a standard hero or card shell. The memory test: if someone left after one viewport, what would they describe an hour later? If the honest answer is a mood, the concept has not committed yet.
- **Prove, don't claim.** Show the subject doing its job: the interface at work, the mechanism dramatized, specifics a competitor could not copy-paste. Demonstration data is design material: author it at full fidelity and label it synthetic; claims stay uninventable.
- **Author the assets; never substitute chrome.** Great surfaces live on carefully made content: names, entries, copy, covers, thumbnails, textures. In greenfield work every blank the ask round left open is yours to author at production fidelity; content is authorable, claims are labelable, no section is omittable. Gradients, glass, generic icon tiles, and many-vertex \`clip-path\` polygons where an authored asset belongs are the gap wearing chrome; the detector flags the last two.
- **Build the form's web leverage.** When the chosen world names a technique (canvas, WebGL, view transitions, generative motion), build the technique itself, not a static imitation of it.
- **Pace the scroll like a studio.** Vary density, scale, image, motion, and quiet inside one grammar; a dense passage earns a quiet one, and the page ends anchored by a real close. One spacing rhythm throughout, with more space above a heading than below it.
- **Use real, verified imagery when the brief implies it.** Search for the subject's physical object rather than the category; one decisive photo beats five mediocre ones. Verify stock URLs resolve.
- **Author motion as material.** Give the page the form's native motion once, orchestrated, rather than scattered hover effects. Bound expensive effects and keep content visible by default.

Preserve semantics, accessibility, performance, responsiveness, project conventions, and working behavior.

## 7. Inspect and finish

Inspect the surface's target sizes in one batched screenshot round: desktop and mobile on the web; on a native platform (\`ios\` / \`android\` / \`adaptive\`), the shipped device classes per OS, captured from the simulator or emulator the way the platform reference's Verifying the build section describes. When the harness reports the user's actual viewport (an in-app browser's size, a named resolution), add that width to the set: the width that breaks is the one the user sees first. On anything interactive, the round drives every interaction and reachable state (open, closed, hover, focus, error, empty, overlong content) and checks each for overlap and clipping, not only the resting screen. Critique the render against the user's request and the direction contract, fix material gaps, and confirm with one final round; two rounds is the ceiling, and fixes batch between them rather than earning per-tweak screenshots. The ceiling bounds inspection and never closes an open build-phase gate: a gate stays open until it passes or the route it names is taken. On a comp-led build, run \`.agent/skills/impeccable/scripts/impeccable comp-diff --comp <approved comp> --build .impeccable/review/desktop.png --spec .impeccable/build/spec.json --out-dir .impeccable/review/diff/final\` and read its region rows and paired crops as the critique: the side-by-side is the view the build thread never has on its own, and a region it scores missing or contradicted is a fix whatever the page looks like from memory. Never judge fidelity from one full-page thumbnail; it hides exactly the failures that matter. On a Persuade surface, verify the mode did its job: a first-time visitor should know what this is, why it matters, and what to do within seconds, in the form's own vocabulary.

A capture is evidence only when it is valid, and you validate before you send. Settle or disable entrance motion first: an element hidden by animation timing reads as a missing element and gets fixed into a regression. Capture full-page shots from the document top. Capture the comp comparison at the comp's own pixel dimensions. Then open every file once and confirm it shows what its name claims: no black or blank regions, no wrong section behind a right filename, no half-loaded state. A malformed capture sent onward costs the whole round; the reviewer answers it with \`disposition: recapture\` and nothing it reviewed binds.

After the second inspection round the build thread's polishing is over: no further defect hunts, micro-edit scripts, or rebuilds here (an open build-phase gate is not a defect hunt; it closes as above); whatever remains ships through the handoffs, where a fresh context does the finding better and cheaper. On the web, where this harness runs no design hook, run \`.agent/skills/impeccable/scripts/impeccable detect --json\` on the changed targets once here, fix what is mechanical, and pass the remaining findings to the reviewer; a hookless web build that skips this ships every tell the hook exists to catch. A native platform skips the detector entirely: it reads HTML and CSS and has no verdict on native code, so the reviewer's floor check is the only slop gate and the input packet says so. Capture the screenshots into \`.impeccable/review/\`, one file per captured viewport (on the web, \`desktop.png\` and \`mobile.png\`, plus \`user-<width>.png\` whenever the user's viewport joined the inspected set; on native, one per device class, such as \`phone.png\` and \`tablet.png\`, suffixed per OS on adaptive), creating that directory when the harness does not; the paths you pass the reviewer are its spec, every viewport you inspected is named required in the packet, and that directory is where it looks when a passed path is missing.

Then spawn the shipped finish reviewer, \`impeccable-finish-reviewer\` (\`impeccable_finish_reviewer\` in codex; \`/impeccable-finish-reviewer\` in Cursor; on GitHub Copilot say "Use the impeccable-finish-reviewer agent"), with the original request, confirmed answers, the artifact path, the screenshot paths, the direction contract, existing hook findings, the QUALITY BAR card and approved comp paths (a code-led build has no approved comp; the chosen decision comp rides in that slot as the critique reference, named as such), on a comp-led build the build state (\`.impeccable/build/state.json\`), the spec, and the diff directories (\`.impeccable/review/diff/hero/\` and \`.impeccable/review/diff/final/\`, whose side-by-side, heatmap, region pairs, and \`report.json\` are the fidelity evidence), the craft-floor reference path, and on a native platform the platform reference path(s), [ios.md](ios.md) / [android.md](android.md), both on adaptive, plus one line saying no detector ran, so the reviewer judges in the platform's conventions rather than the web's. The reviewer has no browser; screenshots you fail to pass are checks it cannot run. Never read the shipped agents' definition files before spawning; the harness loads them at spawn, and you owe only the input packet. Wait on any agent with one long timeout rather than a loop of short polls, and spend the wait on the next independent step. Verify the return carries the five contract sections (a recapture return carries one, its recapture list); on an empty or thrashed return, respawn once with the same inputs. This review never runs inside the build thread and never inherits it: spawn the reviewer fresh, with no forked conversation history (\`fork_turns: 0\` in codex); a reviewer that inherits your transcript inherits your framing, your optimism, and your abstractions, and everything it needs travels in the inputs above. Only a harness with no subagent capability at all substitutes a fresh in-thread pass after stepping fully out of the build context, run from [degraded/finish-reviewer.md](degraded/finish-reviewer.md), and a substituted or failed-and-replaced review is disclosed in one line at finish, never silently.

Act on the disposition word; there are exactly four. **recapture**: the evidence failed, not the build. Recapture what the return names under the capture-validity rules, then run a full review over the new evidence. A review conducted on invalid evidence binds nothing, and a verdict pass may never follow it. **rebuild**: fidelity failed wholesale, not in patches. Skip the fix batch and execute the rebuild immediately: re-derive the named regions, produce the named assets, and send the result back for a fresh full review, never a verdict pass; a rebuild replaces regions wholesale, so the whole matrix runs again over the recaptures. Tell the user what is happening rather than asking permission to fix a failure. Consult the user only on a second rebuild directive, both verdicts on the table, or when rebuilding would discard content the user approved. **ship**: nothing is owed; report the verdict at its scope and continue to the documenter. **fix**: apply the material fixes in one batch, rebuild once, and recapture the same viewports over the same files. On a comp-led build the batch keeps its gates passing: while a phase is open, rerun \`.agent/skills/impeccable/scripts/impeccable build-phase advance\` after it. Once all are closed, the final \`finish --disposition ship\`, recorded only on the reviewer's ship verdict, rechecks the page and reopens responsive when it no longer holds. A recapture measures positions, loading, and overflow; it cannot measure whether a fix reached the quality the finding named, so send the recaptured screenshots back to the same reviewer for a verdict scoring every material fix resolved, partial, or unresolved (through the harness's agent continuation; without one, run the scoring fresh from [degraded/finish-reviewer.md](degraded/finish-reviewer.md)'s Verdict Pass). Fixes scored partial or unresolved get another batch, recapture, and verdict. Two rounds is the budget an unattended run ends at; an attended session's ceiling belongs to the user, so when the second verdict still lists open items, put the table in front of them and let them choose between shipping as it stands and funding another round. Whoever decides, stop the moment a round resolves nothing, and the reviewer's findings are the only list you work from, never your own re-opened hunt. Do not run a second detector.

A rebuild and a fix round share one asset rule: a raster either round creates or replaces is still asset work under [visualize.md](visualize.md)'s Produce section and keeps its **provenance** like every build raster, and a raster the round abandons is deleted in the same batch. Before either round's result goes back for review or verdict, run \`.agent/skills/impeccable/scripts/impeccable embed-prompt --scan <asset-dir...>\` over the directories the artifact's rasters ship from and clear every file it reports by embedding what it is missing: the exact generation prompt for a produced raster, the origin for a sourced, stock, or pre-existing one. The scan only reads; deletion is reserved for rasters the round abandoned, never for a file the scan flagged.

Report the final verdict under the reviewer's own disposition word and at its actual scope. A verdict pass scores the listed fixes and nothing else: "the reviewer scored all three fixes resolved" is a claim it supports, "no material issues remain" is not. A table with open material findings is never announced as a pass, never softened, and never dressed as whole-surface approval when only a fix list was scored. When the user answers a ship with evidence against it, their own screenshot, a named mismatch with the comp, that evidence outranks every capture you made: put their material in the packet and spawn a fresh reviewer for a new full review. Patching inline and self-certifying is how a rejected page ships twice.

After the last correction, on a new or replacement world or an approved system change where a DESIGN.md already exists at the write boundary, collect the choice [document.md](document.md) requires: show the user the existing file. Ask the user directly to clarify what you cannot infer. Offer refresh, overwrite, or merge. Then spawn the shipped documenter, \`impeccable-documenter\` (\`impeccable_documenter\` in codex), with the project root, artifact path, direction contract, PRODUCT.md, [document.md](document.md), write boundary, and that choice; the documenter cannot ask and writes nothing over an existing DESIGN.md without it. Without subagents, load [degraded/documenter.md](degraded/documenter.md) and [document.md](document.md) before writing. Verify the outcome: new worlds and approved system changes require token-bearing DESIGN.md **and** \`.impeccable/design.json\`, not prose alone. Ordinary extensions compare the finished build against the incumbent system, preserve its files, and report the evidence checked; report pre-existing drift without repairing it unasked. Recheck after later edits. Finish only when review and documentation are complete.

On a comp-led build, record the final review disposition with \`.agent/skills/impeccable/scripts/impeccable build-phase finish --disposition <ship|fix|rebuild|recapture>\` before the final response. A refused \`ship\` is an unfinished build; report the outstanding phase with the verdict. Any edit after the last captured gate, a fix for a hook finding after \`ship\` included, voids that capture: run \`finish --disposition ship\` again before you stop, which rechecks the current files against the gate and names any recapture it needs. Never record \`fix\` to end a run over an open gate: take the route the gate names, and when the user leaves it open, report that phase as open.
`,
  },
  {
    path: "reference/onboard.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: the "aha moment" you want users to reach, and users' experience level.

Get users to first value as fast as possible. Onboarding's job is not to teach the product. Its job is to get people to the moment that proves the product is worth their time.

## Assess Onboarding Needs

Understand what users need to learn and why:

1. **Identify the challenge**:
   - What are users trying to accomplish?
   - What's confusing or unclear about current experience?
   - Where do users get stuck or drop off?
   - What's the "aha moment" we want users to reach?

2. **Understand the users**:
   - What's their experience level? (Beginners, power users, mixed?)
   - What's their motivation? (Excited and exploring? Required by work?)
   - What's their time commitment? (5 minutes? 30 minutes?)
   - What alternatives do they know? (Coming from competitor? New to category?)

3. **Define success**:
   - What's the minimum users need to learn to be successful?
   - What's the key action we want them to take? (First project? First invite?)
   - How do we know onboarding worked? (Completion rate? Time to value?)

Onboarding should get users to value as quickly as possible, not teach everything possible.

## Onboarding Principles

Follow these core principles:

### Show, Don't Tell
- Demonstrate with working examples, not just descriptions
- Provide real functionality in onboarding, not separate tutorial mode
- Use progressive disclosure, teach one thing at a time

### Make It Optional (When Possible)
- Let experienced users skip onboarding
- Don't block access to product
- Provide "Skip" or "I'll explore on my own" options

### Time to Value
- Get users to their "aha moment" ASAP
- Front-load most important concepts
- Teach 20% that delivers 80% of value
- Save advanced features for contextual discovery

### Context Over Ceremony
- Teach features when users need them, not upfront
- Empty states are onboarding opportunities
- Tooltips and hints at point of use

### Respect User Intelligence
- Don't patronize or over-explain
- Be concise and clear
- Assume users can figure out standard patterns

## Design Onboarding Experiences

Create appropriate onboarding for the context:

### Initial Product Onboarding

**Welcome Screen**:
- Clear value proposition (what is this product?)
- What users will learn/accomplish
- Time estimate (honest about commitment)
- Option to skip (for experienced users)

**Account Setup**:
- Minimal required information (collect more later)
- Explain why you're asking for each piece of information
- Smart defaults where possible
- Social login when appropriate

**Core Concept Introduction**:
- Introduce 1-3 core concepts (not everything)
- Use simple language and examples
- Interactive when possible (do, don't just read)
- Progress indication (step 1 of 3)

**First Success**:
- Guide users to accomplish something real
- Pre-populated examples or templates
- Celebrate completion (but don't overdo it)
- Clear next steps

### Feature Discovery & Adoption

**Empty States**:
Instead of blank space, show:
- What will appear here (description + screenshot/illustration)
- Why it's valuable
- Clear CTA to create first item
- Example or template option

Example:
\`\`\`
No projects yet
Projects help you organize your work and collaborate with your team.
[Create your first project] or [Start from template]
\`\`\`

**Contextual Tooltips**:
- Appear at relevant moment (first time user sees feature)
- Point directly at relevant UI element
- Brief explanation + benefit
- Dismissable (with "Don't show again" option)
- Optional "Learn more" link

**Feature Announcements**:
- Highlight new features when they're released
- Show what's new and why it matters
- Let users try immediately
- Dismissable

**Progressive Onboarding**:
- Teach features when users encounter them
- Badges or indicators on new/unused features
- Unlock complexity gradually (don't show all options immediately)

### Guided Tours & Walkthroughs

**When to use**:
- Complex interfaces with many features
- Significant changes to existing product
- Industry-specific tools needing domain knowledge

**How to design**:
- Spotlight specific UI elements (dim rest of page)
- Keep steps short (3-7 steps max per tour)
- Allow users to click through tour freely
- Include "Skip tour" option
- Make replayable (help menu)

**Best practices**:
- Interactive over passive (let users click real buttons)
- Focus on workflow, not features ("Create a project" not "This is the project button")
- Provide sample data so actions work

### Interactive Tutorials

**When to use**:
- Users need hands-on practice
- Concepts are complex or unfamiliar
- High stakes (better to practice in safe environment)

**How to design**:
- Sandbox environment with sample data
- Clear objectives ("Create a chart showing sales by region")
- Step-by-step guidance
- Validation (confirm they did it right)
- Graduation moment (you're ready!)

### Documentation & Help

**In-product help**:
- Contextual help links throughout interface
- Keyboard shortcut reference
- Search-able help center
- Video tutorials for complex workflows

**Help patterns**:
- \`?\` icon near complex features
- "Learn more" links in tooltips
- Keyboard shortcut hints (\`⌘K\` shown on search box)

## Empty State Design

Every empty state needs:

### What Will Be Here
"Your recent projects will appear here"

### Why It Matters
"Projects help you organize your work and collaborate with your team"

### How to Get Started
[Create project] or [Import from template]

### Visual Interest
Illustration or icon (not just text on blank page)

### Contextual Help
"Need help getting started? [Watch 2-min tutorial]"

**Empty state types**:
- **First use**: Never used this feature (emphasize value, provide template)
- **User cleared**: Intentionally deleted everything (light touch, easy to recreate)
- **No results**: Search or filter returned nothing (suggest different query, clear filters)
- **No permissions**: Can't access (explain why, how to get access)
- **Error state**: Failed to load (explain what happened, retry option)

## Implementation Patterns

### Technical approaches:

**Tooltip libraries**: Tippy.js, Popper.js
**Tour libraries**: Intro.js, Shepherd.js, React Joyride
**Modal patterns**: Focus trap, backdrop, ESC to close
**Progress tracking**: LocalStorage for "seen" states
**Analytics**: Track completion, drop-off points

**Storage patterns**:
\`\`\`javascript
// Track which onboarding steps user has seen
localStorage.setItem('onboarding-completed', 'true');
localStorage.setItem('feature-tooltip-seen-reports', 'true');
\`\`\`

Show onboarding once: track completion and respect dismissals.

**Avoid**:
- Force users through long onboarding before they can use product
- Patronize users with obvious explanations
- Show same tooltip repeatedly (respect dismissals)
- Block all UI during tour (let users explore)
- Create separate tutorial mode disconnected from real product
- Overwhelm with information upfront (progressive disclosure!)
- Hide "Skip" or make it hard to find
- Forget about returning users (don't show initial onboarding again)

## Verify Onboarding Quality

Test with real users:

- **Time to completion**: Can users complete onboarding quickly?
- **Comprehension**: Do users understand after completing?
- **Action**: Do users take desired next step?
- **Skip rate**: Are too many users skipping? (Maybe it's too long or not valuable)
- **Completion rate**: Are users completing? (If low, simplify)
- **Time to value**: How long until users get first value?

When users hit the aha moment fast and don't drop off, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/operate.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Operate mode depth (and Read notes)

When design SERVES the product: app UIs, admin dashboards, settings panels, data tables, tools, authenticated surfaces, anything where the user is in a task. The essentials live in SKILL.md's modes and [craft-floor.md](craft-floor.md); this file is extended depth, written for Operate surfaces. Read surfaces (docs, guides, long-form) take SKILL.md's Read mode plus this file's typography and consistency rules; their prose measure and navigation matter more than component density.

## The product slop test

Familiarity is often a feature here. The test is whether a category-fluent user can trust the interface immediately or must pause at every subtly-off component.

Product UI's failure mode isn't flatness, it's strangeness without purpose: over-decorated buttons, mismatched form controls, gratuitous motion, display fonts where labels should be, invented affordances for standard tasks. The bar is earned familiarity. The tool should disappear into the task.

## Typography

- **One family is often right.** Product UIs don't need display/body pairing. A well-tuned sans carries headings, buttons, labels, body, data.
- **Fixed rem scale, not fluid.** Clamp-sized headings don't serve product UI. Users view at consistent DPI, and a fluid h1 that shrinks in a sidebar looks worse, not better.
- **Tighter scale ratio.** 1.125–1.2 between steps is typical. More type elements here than on brand surfaces; exaggerated contrast creates noise.
- **Line length still applies for prose** (65–75ch). Data and compact UI can run denser; tables at 120ch+ are fine.

## Color

Product defaults to Restrained. A single surface can earn Committed (a dashboard where one category color carries a report, an onboarding flow with a drenched welcome screen), but Restrained is the floor.

- State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success, info. Standardize these.
- Accent color used for primary actions, current selection, and state indicators only, not decoration.
- A second neutral layer for sidebars, toolbars, and panels (slightly cooler or warmer than the content surface).

## Layout

- Responsive behavior is structural (collapse sidebar, responsive table, breakpoint-driven columns), not fluid typography.

## Components

Every interactive component has: default, hover, focus, active, disabled, loading, error. Don't ship with half of these.

- Skeleton states for loading, not spinners in the middle of content.
- Empty states that teach the interface, not "nothing here."
- Consistent affordances across the surface. Same button shape. Same form-control vocabulary. Same icon style.
- Overlays escape their container. An absolutely positioned dropdown inside an \`overflow: hidden\` or \`overflow: auto\` ancestor gets clipped; reach for \`<dialog>\`, the popover API, \`position: fixed\`, or a portal.

## Motion

- 150–250 ms on most transitions. Users are in flow; don't make them wait for choreography.
- Motion conveys state, not decoration. State change, feedback, loading, reveal: nothing else.
- No orchestrated page-load sequences. Product loads into a task; users don't want to watch it load.

## Product constraints

- Decorative motion that doesn't convey state.
- Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong.
- Display fonts in UI labels, buttons, data.
- Reinventing standard affordances for flavor (custom scrollbars, weird form controls, non-standard modals).
- Heavy color or full-saturation accents on inactive states.
- Modal as first thought. Modals are usually laziness. Exhaust inline / progressive alternatives first.

## Product permissions

Product can afford things brand surfaces can't.

- System fonts and familiar sans defaults.
- Standard navigation patterns: top bar + side nav, breadcrumbs, tabs, command palettes.
- Density. Tables with many rows, panels with many labels, dense information when users need it.
- Consistency over surprise. The same visual vocabulary screen to screen is a virtue; delight is saved for moments, not pages.
`,
  },
  {
    path: "reference/optimize.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Performance is a feature. Identify the actual bottleneck for THIS interface, fix it, then measure. Don't optimize what isn't slow.

## Assess Performance Issues

Understand current performance and identify problems:

1. **Measure current state**:
   - **Core Web Vitals**: LCP, INP, CLS scores
   - **Load time**: Time to interactive, first contentful paint
   - **Bundle size**: JavaScript, CSS, image sizes
   - **Runtime performance**: Frame rate, memory usage, CPU usage
   - **Network**: Request count, payload sizes, waterfall

2. **Identify bottlenecks**:
   - What's slow? (Initial load? Interactions? Animations?)
   - What's causing it? (Large images? Expensive JavaScript? Layout thrashing?)
   - How bad is it? (Perceivable? Annoying? Blocking?)
   - Who's affected? (All users? Mobile only? Slow connections?)

Measure before and after. Optimizing without a measurement spends effort on things that do not matter.

## Optimization Strategy

Create systematic improvement plan:

### Loading Performance

**Optimize Images**:
- Use modern formats (WebP, AVIF)
- Proper sizing (don't load 3000px image for 300px display)
- Lazy loading for below-fold images
- Responsive images (\`srcset\`, \`picture\` element)
- Compress images (80-85% quality is usually imperceptible)
- Use CDN for faster delivery

\`\`\`html
<img 
  src="hero.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
  alt="Hero image"
/>
\`\`\`

**Reduce JavaScript Bundle**:
- Code splitting (route-based, component-based)
- Tree shaking (remove unused code)
- Remove unused dependencies
- Lazy load non-critical code
- Use dynamic imports for large components

\`\`\`javascript
// Lazy load heavy component
const HeavyChart = lazy(() => import('./HeavyChart'));
\`\`\`

**Optimize CSS**:
- Remove unused CSS
- Critical CSS inline, rest async
- Minimize CSS files
- Use CSS containment for independent regions

**Optimize Fonts**:
- Use \`font-display: swap\` or \`optional\`
- Subset fonts (only characters you need)
- Preload critical fonts
- Use system fonts when appropriate
- Limit font weights loaded

\`\`\`css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
  unicode-range: U+0020-007F; /* Basic Latin only */
}
\`\`\`

**Optimize Loading Strategy**:
- Critical resources first (async/defer non-critical)
- Preload critical assets
- Prefetch likely next pages
- Service worker for offline/caching
- HTTP/2 or HTTP/3 for multiplexing

### Rendering Performance

**Avoid Layout Thrashing**:
\`\`\`javascript
// ❌ Bad: Alternating reads and writes (causes reflows)
elements.forEach(el => {
  const height = el.offsetHeight; // Read (forces layout)
  el.style.height = height * 2; // Write
});

// ✅ Good: Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight); // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] * 2; // All writes
});
\`\`\`

**Optimize Rendering**:
- Use CSS \`contain\` property for independent regions
- Minimize DOM depth (flatter is faster)
- Reduce DOM size (fewer elements)
- Use \`content-visibility: auto\` for long lists
- Virtual scrolling for very long lists (react-window, TanStack Virtual)

**Reduce Paint & Composite**:
- Use \`transform\` and \`opacity\` for reliable movement, but allow blur, filters, masks, clip paths, shadows, and color shifts when they create meaningful polish
- Avoid casual animation of layout-driving properties (\`width\`, \`height\`, \`top\`, \`left\`, margins)
- Use \`will-change\` sparingly for known expensive operations
- Bound expensive paint areas for blur/filter/shadow effects (smaller and isolated is faster)

### Animation Performance

**GPU Acceleration**:
\`\`\`css
/* ✅ GPU-accelerated (fast) */
.animated {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ CPU-bound (slow) */
.animated {
  left: 100px;
  width: 300px;
}
\`\`\`

**Smooth 60fps**:
- Target 16ms per frame (60fps)
- Use \`requestAnimationFrame\` for JS animations
- Debounce/throttle scroll handlers
- Use CSS animations when possible
- Avoid long-running JavaScript during animations

**Intersection Observer**:
\`\`\`javascript
// Efficiently detect when elements enter viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element is visible, lazy load or animate
    }
  });
});
\`\`\`

### React/Framework Optimization

**React-specific**:
- Use \`memo()\` for expensive components
- \`useMemo()\` and \`useCallback()\` for expensive computations
- Virtualize long lists
- Code split routes
- Avoid inline function creation in render
- Use React DevTools Profiler

**Framework-agnostic**:
- Minimize re-renders
- Debounce expensive operations
- Memoize computed values
- Lazy load routes and components

### Network Optimization

**Reduce Requests**:
- Combine small files
- Use SVG sprites for icons
- Inline small critical assets
- Remove unused third-party scripts

**Optimize APIs**:
- Use pagination (don't load everything)
- GraphQL to request only needed fields
- Response compression (gzip, brotli)
- HTTP caching headers
- CDN for static assets

**Optimize for Slow Connections**:
- Adaptive loading based on connection (navigator.connection)
- Optimistic UI updates
- Request prioritization
- Progressive enhancement

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP < 2.5s)
- Optimize hero images
- Inline critical CSS
- Preload key resources
- Use CDN
- Server-side rendering

### Interaction to Next Paint (INP < 200ms)
- Break up long tasks
- Defer non-critical JavaScript
- Use web workers for heavy computation
- Reduce JavaScript execution time

### Cumulative Layout Shift (CLS < 0.1)
- Set dimensions on images and videos
- Don't inject content above existing content
- Use \`aspect-ratio\` CSS property
- Reserve space for ads/embeds
- Avoid animations that cause layout shifts

\`\`\`css
/* Reserve space for image */
.image-container {
  aspect-ratio: 16 / 9;
}
\`\`\`

## Performance Monitoring

**Tools to use**:
- Chrome DevTools (Lighthouse, Performance panel)
- WebPageTest
- Core Web Vitals (Chrome UX Report)
- Bundle analyzers (webpack-bundle-analyzer)
- Performance monitoring (Sentry, DataDog, New Relic)

**Key metrics**:
- LCP, INP, CLS (Core Web Vitals; INP replaced FID in March 2024)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Total Blocking Time (TBT)
- Bundle size
- Request count

Measure on real devices with real network conditions. Desktop Chrome on a fast connection isn't representative.

**Avoid**:
- Optimize without measuring (premature optimization)
- Sacrifice accessibility for performance
- Break functionality while optimizing
- Use \`will-change\` everywhere (creates new layers, uses memory)
- Lazy load above-fold content
- Optimize micro-optimizations while ignoring major issues (optimize the biggest bottleneck first)
- Forget about mobile performance (often slower devices, slower connections)

## Verify Improvements

Test that optimizations worked:

- **Before/after metrics**: Compare Lighthouse scores
- **Real user monitoring**: Track improvements for real users
- **Different devices**: Test on low-end Android, not just flagship iPhone
- **Slow connections**: Throttle to 3G, test experience
- **No regressions**: Ensure functionality still works
- **User perception**: Does it *feel* faster?

When the user-facing numbers move, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/overdrive.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Start your response with:

\`\`\`
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
\`\`\`

Push an interface past conventional limits. This isn't just about visual effects. It's about using the full power of the browser to make any part of an interface feel extraordinary: a table that handles a million rows, a dialog that morphs from its trigger, a form that validates in real-time with streaming feedback, a page transition that feels cinematic.

Context decides what "extraordinary" means. A particle system on a creative portfolio is impressive. The same particle system on a settings page is embarrassing. But a settings page with instant optimistic saves and animated state transitions? That's extraordinary too. Understand the project's personality and goals before deciding what's appropriate.

### Propose Before Building

This command has the highest potential to misfire. Do NOT jump straight into implementation. You MUST:

1. **Think through 2-3 different directions**: consider different techniques, levels of ambition, and aesthetic approaches. For each direction, briefly describe what the result would look and feel like.
2. **Get the user's pick before writing any code.** Ask the user directly to clarify what you cannot infer. Carry each direction's description and its trade-offs (browser support, performance cost, complexity) inside the option itself, so the user is choosing between things they can read. A structured question blocks the message it rides in until the user answers, so directions written alongside the question stay invisible while the user is being asked to choose between them.
3. Only proceed with the direction the user confirms.

Skipping this step risks building something embarrassing that needs to be thrown away.

### Verify in the Browser

Ambitious effects rarely work on the first try, so verify them in the browser rather than from code: an effect that technically runs can still stutter, ease wrong, or land on the wrong frame. Aim the checks at timing, easing, and smoothness, batch the fixes between looks, and keep refining until the effect is extraordinary.

---

## Assess What "Extraordinary" Means Here

The right kind of technical ambition depends entirely on what you're working with. Before choosing a technique, ask: **what would make a user of THIS specific interface say "wow, that's nice"?**

### For visual/marketing surfaces
Pages, hero sections, landing pages, portfolios: the "wow" is often sensory: a scroll-driven reveal, a shader background, a cinematic page transition, generative art that responds to the cursor.

### For functional UI
Tables, forms, dialogs, navigation: the "wow" is in how it FEELS: a dialog that morphs from the button that triggered it via View Transitions, a data table that renders 100k rows at 60fps via virtual scrolling, a form with streaming validation that feels instant, drag-and-drop with spring physics.

### For performance-critical UI
The "wow" is invisible but felt: a search that filters 50k items without a flicker, a complex form that never blocks the main thread, an image editor that processes in near-real-time. The interface just never hesitates.

### For data-heavy interfaces
Charts and dashboards: the "wow" is in fluidity: GPU-accelerated rendering via Canvas/WebGL for massive datasets, animated transitions between data states, force-directed graph layouts that settle naturally.

**The common thread**: something about the implementation goes beyond what users expect from a web interface. The technique serves the experience, not the other way around.

## The Toolkit

Organized by what you're trying to achieve, not by technology name.

### Make transitions feel cinematic
- **View Transitions API** (same-document: all browsers; cross-document: no Firefox): shared element morphing between states. A list item expanding into a detail page. A button morphing into a dialog. This is the closest thing to native FLIP animations.
- **\`@starting-style\`** (all browsers): animate elements from \`display: none\` to visible with CSS only, including entry keyframes
- **Spring physics**: natural motion with mass, tension, and damping instead of cubic-bezier. Libraries: motion (formerly Framer Motion), GSAP, or roll your own spring solver.

### Tie animation to scroll position
- **Scroll-driven animations** (\`animation-timeline: scroll()\`): CSS-only, no JS. Parallax, progress bars, reveal sequences all driven by scroll position. (Chrome/Edge/Safari; Firefox: flag only; always provide a static fallback)

### Render beyond CSS
- **WebGL** (all browsers): shader effects, post-processing, particle systems. Libraries: Three.js, OGL (lightweight), regl. Use for effects CSS can't express.
- **WebGPU** (Chrome/Edge; Safari 26+; Firefox on Windows/macOS; flag only on Firefox Linux/Android): next-gen GPU compute, more powerful than WebGL. Always fall back to WebGL2.
- **Canvas 2D / OffscreenCanvas**: custom rendering, pixel manipulation, or moving heavy rendering off the main thread entirely via Web Workers + OffscreenCanvas.
- **SVG filter chains**: displacement maps, turbulence, morphology for organic distortion effects. CSS-animatable.

### Make data feel alive
- **Virtual scrolling**: render only visible rows for tables/lists with tens of thousands of items. No library required for simple cases; TanStack Virtual for complex ones.
- **GPU-accelerated charts**: Canvas or WebGL-rendered data visualization for datasets too large for SVG/DOM. Libraries: deck.gl, regl-based custom renderers.
- **Animated data transitions**: morph between chart states rather than replacing. D3's \`transition()\` or View Transitions for DOM-based charts.

### Animate complex properties
- **\`@property\`** (all browsers): register custom CSS properties with types, enabling animation of gradients, colors, and complex values that CSS can't normally interpolate.
- **Web Animations API** (all browsers): JavaScript-driven animations with the performance of CSS. Composable, cancellable, reversible. The foundation for complex choreography.

### Push performance boundaries
- **Web Workers**: move computation off the main thread. Heavy data processing, image manipulation, search indexing: anything that would cause jank.
- **OffscreenCanvas**: render in a Worker thread. The main thread stays free while complex visuals render in the background.
- **WASM**: near-native performance for computation-heavy features. Image processing, physics simulations, codecs.

### Interact with the device
- **Web Audio API**: spatial audio, audio-reactive visualizations, sonic feedback. Requires user gesture to start.
- **Device APIs**: orientation, ambient light, geolocation. Use sparingly and always with user permission.

**NOTE**: This command is about enhancing how an interface FEELS, not changing what a product DOES. Adding real-time collaboration, offline support, or new backend capabilities are product decisions, not UI enhancements. Focus on making existing features feel extraordinary.

## Implement with Discipline

### Progressive enhancement is non-negotiable

Every technique must degrade gracefully. The experience without the enhancement must still be good.

\`\`\`css
@supports (animation-timeline: scroll()) {
  .hero { animation-timeline: scroll(); }
}
\`\`\`

\`\`\`javascript
if ('gpu' in navigator) { /* WebGPU */ }
else if (canvas.getContext('webgl2')) { /* WebGL2 fallback */ }
/* CSS-only fallback must still look good */
\`\`\`

### Performance rules

- Target 60fps. If dropping below 50, simplify.
- Lazy-initialize heavy resources (WebGL contexts, WASM modules) only when near viewport.
- Pause off-screen rendering. Kill what you can't see.
- Test on real mid-range devices, not just your development machine.

### Polish is the difference

The gap between "cool" and "extraordinary" is in the last 20% of refinement: the easing curve on a spring animation, the timing offset in a staggered reveal, the subtle secondary motion that makes a transition feel physical. Don't ship the first version that works; ship the version that feels inevitable.

**NEVER**:
- Ship effects that cause jank on mid-range devices
- Use bleeding-edge APIs without a functional fallback
- Add sound without explicit user opt-in
- Use technical ambition to mask weak design fundamentals; fix those first with other commands
- Layer multiple competing extraordinary moments. Focus creates impact, excess creates noise

## Verify the Result

- **The wow test**: Show it to someone who hasn't seen it. Do they react?
- **The removal test**: Take it away. Does the experience feel diminished, or does nobody notice?
- **The device test**: Run it on a phone, a tablet, a Chromebook. Still smooth?
- **The context test**: Does this make sense for THIS brand and audience?

"Technically extraordinary" isn't about using the newest API. It's about making an interface do something users didn't think a website could do.
`,
  },
  {
    path: "reference/polish.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

> **Additional context needed**: quality bar and shipping constraints.

Polish is refinement, never concealed redesign. Preserve the incumbent visual world, content, behavior, and everything outside scope. If the concept itself is wrong, say so and recommend redesign or \`bolder\` instead of smuggling in a replacement.

A detector result is defect evidence, not proof of quality. Inspect the rendered experience and real interaction path.

## 1. Establish the system

Read DESIGN.md and representative tokens, shared components, patterns, and neighboring flows. If no formal system exists, use coherent project conventions.

Classify each drift before fixing it:

- **missing token:** the system needs a reusable value;
- **one-off implementation:** an existing shared component or pattern should replace it;
- **conceptual mismatch:** the flow, information architecture, or hierarchy differs from comparable product areas;
- **local defect:** the implementation is simply incomplete or inconsistent.

Fix the cause at the narrowest correct level. Ask when a binding system principle cannot be inferred.

## 2. Gather the evidence

Use the feature yourself at the surface's representative sizes: desktop and mobile on the web; on a native platform (\`ios\` / \`android\` / \`adaptive\`), the shipped device classes on the simulator, emulator, or hardware, captured per the platform reference's Verifying the build section. Determine:

- whether the path is functionally complete;
- the intended quality bar and time available;
- known constraints or deliberately unfinished work;
- the states, content lengths, roles, and input methods users will actually encounter.

If a prior critique exists, use it as one input:

\`\`\`bash
.agent/skills/impeccable/scripts/impeccable critique-storage latest "<resolved target>" --json
\`\`\`

Exit 0 returns JSON with the latest snapshot's \`body\` and an exact \`snapshot_file\` identity. Retain \`snapshot_file\` until the end of the pass. For a local file target, the helper compares the file's exact current content fingerprint with the fingerprint captured by critique. Unchanged staged, unstaged, or untracked content remains current; any byte change, deletion, or replacement with a non-file closes the backlog it identified while preserving its trend history and exits 2. A URL target has no local fingerprint and remains current until explicitly closed. When current, incorporate relevant P0/P1 findings from \`body\` and name the snapshot read. Exit 2 means none exists or the target changed. Perform an independent pass either way.

## 3. Triage

Separate functional defects from cosmetic ones and fix in this order:

1. broken or blocked tasks, data loss, misleading state, and inaccessible paths;
2. missing loading, empty, error, success, disabled, and permission states;
3. flow, hierarchy, responsive, and design-system drift;
4. visual and motion inconsistencies;
5. code and asset cleanup.

Do not perfect one corner while leaving the rest below the same quality bar.

## 4. Polish the whole path

### Flow and hierarchy

- Match neighboring mental models, terminology, disclosure, routing, save behavior, and optimistic or pessimistic patterns.
- Make the primary task and current state obvious without flattening every element to equal weight.
- Ensure arrival, transition, empty, and recovery paths connect instead of behaving as isolated screens.

### Layout and type

- Align to the project's grid and spacing scale; fix optical as well as mathematical alignment.
- Group related content tightly and separate distinct groups generously.
- Keep same-role typography consistent; test measure, wrapping, localization expansion, zoom, and font loading.
- Verify every supported viewport rather than correcting only the current screenshot.

### Color, imagery, and icons

- Use semantic tokens and stable color meanings across themes.
- Verify text, control, and focus contrast in every state.
- Keep icon families, stroke/weight, sizing, and optical alignment coherent.
- Prevent image layout shift; use correct aspect ratios, responsive sources, and useful alt text.

### Interaction and state

- Every control needs appropriate default, hover, focus, active, disabled, loading, error, and success behavior.
- Preserve visible keyboard focus, logical tab order, labels, and platform-appropriate touch targets.
- Keep motion coherent, interruptible, and performant. Do not add animation merely to make polish visible.
- Validate long, missing, localized, offline, slow, and permission-limited content where the product can encounter it.

### Content and code

- Keep terminology, capitalization, punctuation, and factual copy consistent. Ask before changing claims.
- Remove debug output, dead code, unused imports, obsolete styles, and polish-created duplication.
- Replace custom implementations with shared components where the system owns the pattern.
- Promote genuinely reusable values to tokens; do not create a system abstraction for one local exception.

## 5. Verify and finish

Walk the complete path again with mouse, keyboard, and touch where applicable. Check:

- mobile, intermediate, and wide layouts on the web; phone and tablet size classes in both supported orientations on native;
- loading, empty, error, success, disabled, long-content, and missing-content states;
- zoom, contrast, focus, semantics, and screen-reader names;
- console errors, layout shift, interaction latency, and image loading everywhere; supported browsers on the web; supported OS versions, runtime warnings, and dropped frames on native;
- agreement with DESIGN.md, neighboring features, and the user's scope.

Follow the quality guidance supplied by \`impeccable context\` and hooks, then run any other relevant QA commands. Context requests a manual scan only when no automatic detector is active; never add another detector pass. Fix real defects and document only narrow intentional exceptions. A clean scan does not replace visual judgment.

Finish with a source diff: remove accidental churn, orphaned code, redundant values, and temporary artifacts. Ship only when the feature is functionally complete and consistently finished across the path.

When this pass clears every Priority Issue it took from a snapshot, close that snapshot:

\`\`\`bash
.agent/skills/impeccable/scripts/impeccable critique-storage close "<resolved target>" "<snapshot_file returned by latest>"
\`\`\`

This closes only the snapshot this pass actually processed; if a newer critique landed meanwhile, its backlog stays live. Do not close when no snapshot was read, when \`snapshot_file\` was not retained, or when Priority Issues remain.
`,
  },
  {
    path: "reference/quieter.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Quiet design is harder than bold design. Subtlety needs precision. Reduce visual intensity in designs that are too loud, aggressive, or overstimulating without losing personality or making the result generic.

---

## Visitor mode

Persuade + Experience: "quieter" means more restrained palette, more whitespace, more typographic air. Drama is reduced, not eliminated; the POV stays intact.

Operate + Read: "quieter" means reducing visual noise. Fewer background accents, flatter cards, less color, less motion. The tool should disappear more completely into the task.

---

## Assess Current State

Analyze what makes the design feel too intense:

1. **Identify intensity sources**:
   - **Color saturation**: Overly bright or saturated colors
   - **Contrast extremes**: Too much high-contrast juxtaposition
   - **Visual weight**: Too many bold, heavy elements competing
   - **Animation excess**: Too much motion or overly dramatic effects
   - **Complexity**: Too many visual elements, patterns, or decorations
   - **Scale**: Everything is large and loud with no hierarchy

2. **Understand the context**:
   - What's the purpose? (Marketing vs tool vs reading experience)
   - Who's the audience? (Some contexts need energy)
   - What's working? (Don't throw away good ideas)
   - What's the core message? (Preserve what matters)

If any of these are unclear from the codebase, do not guess. Ask the user directly to clarify what you cannot infer.

"Quieter" means refined and easier on the eyes, not generic. Generic quiet looks like gray text on white, one sans at a uniform weight, and a grid of identical cards; restraint still needs a point of view.

## Plan Refinement

Create a strategy to reduce intensity while maintaining impact:

- **Color approach**: Desaturate or shift to more restrained tones?
- **Hierarchy approach**: Which elements should stay bold (very few), which should recede?
- **Simplification approach**: What can be removed entirely?
- **Sophistication approach**: How can we signal quality through restraint?

Subtlety requires precision. Quiet without intent collapses to generic.

## Refine the Design

Systematically reduce intensity across these dimensions:

### Color Refinement
- **Reduce saturation**: Shift from fully saturated to 70-85% saturation
- **Soften palette**: Replace bright colors with muted tones
- **Reduce color variety**: Use fewer colors more thoughtfully
- **Neutral dominance**: Let neutrals do more work, use color as accent (10% rule)
- **Gentler contrasts**: High contrast only where it matters most
- **Tinted grays**: Use warm or cool tinted grays instead of pure gray. Adds depth without loudness
- **Never gray on color**: If you have gray text on a colored background, use a darker shade of that color or transparency instead

### Visual Weight Reduction
- **Typography**: Reduce font weights (900 → 600, 700 → 500), decrease sizes where appropriate
- **Hierarchy through subtlety**: Use weight, size, and space instead of color and boldness
- **White space**: Increase breathing room, reduce density
- **Borders & lines**: Reduce thickness, decrease opacity, or remove entirely

### Simplification
- **Remove decorative elements**: Gradients, shadows, patterns, textures that don't serve purpose
- **Simplify shapes**: Reduce border radius extremes, simplify custom shapes
- **Reduce layering**: Flatten visual hierarchy where possible
- **Clean up effects**: Reduce or remove blur effects, glows, multiple shadows

### Motion Reduction
- **Reduce animation intensity**: Shorter distances (10-20px instead of 40px), gentler easing
- **Remove decorative animations**: Keep functional motion, remove flourishes
- **Subtle micro-interactions**: Replace dramatic effects with gentle feedback
- **Refined easing**: Use ease-out-quart for smooth, understated motion. Never bounce or elastic
- **Remove animations entirely** if they're not serving a clear purpose

### Composition Refinement
- **Reduce scale jumps**: Smaller contrast between sizes creates calmer feeling
- **Align to grid**: Bring rogue elements back into systematic alignment
- **Even out spacing**: Replace extreme spacing variations with consistent rhythm

**Avoid**:
- Make everything the same size/weight (hierarchy still matters)
- Remove all color (quiet ≠ grayscale)
- Eliminate all personality (maintain character through refinement)
- Sacrifice usability for aesthetics (functional elements still need clear affordances)
- Make everything small and light (some anchors needed)

## Verify Quality

Ensure refinement maintains quality:

- **Still functional**: Can users still accomplish tasks easily?
- **Still distinctive**: Does it have character, or is it generic now?
- **Better reading**: Is text easier to read for extended periods?
- **Restrained, not absent**: Does the POV survive the cuts?

When the result feels right, hand off to \`/impeccable polish\` for the final pass.
`,
  },
  {
    path: "reference/region-map.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Region map

A region map names what is actually visible in the approved comp before asset production. It is not a page build or an asset approval.

1. Run \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --grid\` and open the original and gridded images.
2. Run \`.agent/skills/impeccable/scripts/impeccable comp-spec --schema\` for the JSON fields. Write \`regions.json\` with a \`regions\` array. Each region needs a stable \`id\`, \`kind\`, \`note\`, and exactly one of \`pixelBox\`, normalized \`box\`, or \`grid\`. Use the original comp’s dimensions.
3. Run \`.agent/skills/impeccable/scripts/impeccable comp-spec --comp <comp.png> --regions regions.json --inspect-map\`. The output points to a report, overlay, exact crops and \`COMPARE\` sheets of masked references. The default prints findings; \`--json\` prints the entire report, with sheet paths in \`comparisonSheets\`.
4. Open the comparison sheets first to inspect affected crops together, then open individual crops where more detail is needed. Compare their bounds with the original. Inspect excluded foreground pixels as well as geometry errors. Every overlapping non-container code box is masked in full, including empty space inside it. Bound separate text elements separately so artwork in the gaps stays visible; a container describes their layout extent and never replaces its children. Correct the map and inspect again; use a new output directory each time. Zero errors does not certify crop accuracy. Coverage warnings are hints, not proof of completeness.

If the request ends at mapping, stop with the map, inspection report and unresolved findings. To continue a build, measure the inspected map with \`comp-spec --comp <comp.png> --regions regions.json\` and follow [new-work.md](new-work.md).

\`--auto\` produces horizontal band scaffolding, not element identification. It is optional and does not replace authoring a map.

## Containment

\`parentId\` identifies an enclosing \`container: true\` region. Parent and children keep separate IDs and crops. Containment never transfers approval.

## What varies independently

Split regions by what varies independently: content the site swaps (room photos, products, people), moving parts (anything a hover or the signature interaction moves), and structure (frames, surrounds, ornament). A window with open shutters onto a room is three kinds of region: the surround as a plate with a transparent opening, the room as an image region beneath it, and each shutter as its own plate. Overlapping regions are composited in the page. \`comp-spec\` flags a raster region whose note names a frame and the view it opens onto (\`baked-composite\`), and the plan and asset review shows it to the user first.

## Painted material

When measuring, \`comp-spec\` flags a \`text\`, \`control\` or \`chrome\` region, containers included, whose crop looks painted (\`painted-pixels\`: many colours, soft gradients) and lists it in its summary. The plan and asset review shows flagged regions, and those marked \`codeDrawn\` (painted material you chose to draw in code), to the user first. Do not leave the catch to them: if a region is painted material (a figure, a photograph, a metal or paper surface), classify it \`plate\`, \`image\` or \`texture\` now.

Comp crops are reference evidence only, never production assets. The map inspector marks its PNGs as comp-derived.
`,
  },
  {
    path: "reference/routing.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Command guidance

## Workflow questions

Give advice without executing commands; the menu below is only for bare invocations. Consult relevant command references as needed for prerequisites and scope. Link to the [docs](https://impeccable.style/docs/) for the broader workflow guide. If the user also requests execution, follow that request.

## No-argument routing: the context-aware menu

Read this when the user invokes \`/impeccable\` with no argument. They are asking "what should I do?" Make the menu context-aware instead of static.

Setup has already run \`impeccable context\`. If that reported \`NO_PRODUCT_MD\`, the project has no captured context yet: lead the menu with \`/impeccable init\` as the top recommendation (one line on why) and still show the rest below; don't silently jump into init. Otherwise run \`.agent/skills/impeccable/scripts/impeccable signals\` once and read its JSON, then lead with the **2-3 highest-value next commands**, each with a one-line reason pulled from the signals, followed by the full menu (the Commands table in SKILL.md, grouped by category). **Never auto-run a command; the recommendation is a suggestion the user confirms.**

Reason over the signals; there is no score to obey:

- \`setup.hasDesign\` false while \`setup.hasCode\` true → \`document\` (capture the visual system).
- \`critique.latest\` is \`null\` → the project has never been critiqued; for a set-up project with a real surface, offering \`/impeccable critique <surface>\` is a strong default.
- \`critique.latest\` with a low \`score\` or non-zero \`p0\` / \`p1\` → \`polish\` (it reads that snapshot as its backlog and closes it when stale or cleared).
- \`git.changedFiles\` pointing at one surface → scope \`audit\` or \`polish\` to those files specifically, naming them.
- \`devServer.running\` true → \`live\` is available for in-browser iteration, and \`generate\` for one-shot variant runs on a named element; if false, don't lead with either. **\`live\`, \`generate\`, and the bundled \`impeccable detect\` are web-only.** If \`setup.platform\` is \`ios\`, \`android\`, or \`adaptive\`, don't lead with any of them; the browser overlay and the HTML rule engine don't apply to native app code.
- Otherwise group by intent (build new / improve what's there / iterate visually), tailored to the current surface and \`setup.platform\`.

**If \`scan.targets\` is non-empty and \`setup.platform\` is not \`ios\`/\`android\`/\`adaptive\`, run \`.agent/skills/impeccable/scripts/impeccable detect --json <scan.targets joined by spaces>\` once** (the bundled detector over local files: no network, no npx; it reads HTML/CSS, so skip it for native projects). \`scan.via\` tells you what they are: \`git-changes\` (the markup/style files in your dirty tree, the most relevant set), \`source-dir\` (e.g. \`src\`, \`app\`), \`html\`, or \`root\`. Fold the hits into your picks: many quality / contrast hits → \`audit\` or \`polish\`; a specific slop family → the matching command (gradient text or eyebrows → \`quieter\` / \`typeset\`, flat or gray palette → \`colorize\`, and so on). It's a real, current signal that beats guessing. If detect errors or the tree is large and slow, skip it and recommend the user run \`audit\` themselves; never block the suggestion on it.

Keep it to 2-3 pointed picks with the exact command to type. The menu stays the fallback; the recommendation is the lede.
`,
  },
  {
    path: "reference/shape.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Shape

Discover what should be made and how it should work, then return a confirmed design brief without code.

## Phase 1: Discovery interview

Do not write code or choose visual direction yet.

### Cadence

- Use the structured question tool when available; otherwise ask and stop.
- Ask two or three related questions per round, then wait. One round is the default; add a second only when the answers expose a material gap.
- Do not dump a questionnaire, repeat settled facts, or turn obvious facts into menus. Assert the likely reading and invite correction.
- A sparse prompt requires at least one answer round. A precise prompt may need only a compact confirmation.

### Round 1: purpose, people, and outcome

Choose the two or three questions that most change the result:

- What is this surface or feature for, and what problem must it solve?
- Who specifically reaches it, in what situation and state of mind?
- What is the primary thing they must understand or do? What would success look like?
- What is uniquely true here that a neighboring product or generic template could not claim?

### Round 2: material, behavior, and boundaries

Run only for material unresolved decisions:

- What real content, evidence, data, and assets must the experience carry? What are realistic minimum, typical, and maximum ranges?
- Which states and transitions matter: first-run, empty, loading, error, success, permissions, overflow, or expert use?
- What is the intended fidelity, breadth, and interactivity: exploration, production-ready screen, full flow, or broader surface?
- What must remain untouched? What would make the result feel wrong even if it looked polished?
- Which platform, framework, performance, accessibility, localization, or delivery constraints are binding?

Never ask for CSS values or canned aesthetic lanes. New-work owns visual-world and concept choices.

## Phase 2: Resolve the design direction

For new surfaces, brand expansion, or replacement, follow [new-work.md](new-work.md) through visual authority, any world workshop, and concept choice. Reuse discovery, then return before its contract, persistence, or implementation. Inside an established world, use its concept process only when composition or interaction remains materially open.

## Phase 3: Write the brief

Write the smallest useful brief:

1. **Job and audience:** who arrives, their context, need, and visitor mode.
2. **Outcome and proof:** primary task/action, success, real evidence, and product-specific truth.
3. **Selected direction:** visual authority, structural/interaction thesis, sequence, focal moment, and implementation consequence.
4. **Scope and boundaries:** fidelity, breadth, interactivity, named target, what remains untouched, and explicit anti-goals.
5. **States and ranges:** realistic content/data ranges and material states.
6. **Interaction and layout:** hierarchy, topology, responsiveness, affordances, feedback, and transitions; intent, not CSS.
7. **Constraints and open decisions:** platform, delivery, accessibility, localization, reusable components, and choices a builder must not invent.

Use three to five bullets when the task is settled; use the full structure only for ambiguous, multi-screen, or standalone planning. Do not restate the conversation.

## Confirm and stop

Present the brief for explicit confirmation or one correction round, then stop: shape never writes code or a direction contract.

When no human or structured answer mechanism exists, mark assumptions plainly, return the brief, and stop.
`,
  },
  {
    path: "reference/typeset.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

Typography carries information, hierarchy, and voice. Improve it inside the established visual world; do not replace the identity unless the user asked to.

---

## Visitor mode

- **Persuade + Experience:** display type may carry the voice. Use decisive contrast and responsive scale when the composition benefits.
- **Operate + Read:** stability, scanability, and measure come first. A single well-tuned family and fixed role scale are often right.
- **Native:** follow [ios.md](ios.md) or [android.md](android.md), including platform scaling and accessibility behavior.

If typography replacement would create a new identity, route through [new-work.md](new-work.md) and update DESIGN.md. Otherwise preserve confirmed families and improve their use.

## Two isolated assessments

When a sub-agent tool is available and permitted, run these independently; otherwise run them yourself in this order. Do not let detector findings anchor the design assessment.

1. **Typographic assessment:** inspect representative pages and styles. Answer every question below with a file, selector, or computed value:
   - **Authority and fit:** Which faces, weights, and roles are established? Do they fit the product and selected world, or are they unexamined defaults? Is every family necessary?
   - **Hierarchy:** Can heading, body, label, metadata, and data roles be distinguished at a glance? Are adjacent sizes or weights too close to carry different jobs?
   - **Scale and consistency:** Is there a deliberate role scale, or a collection of arbitrary values? Do repeated roles stay identical across screens and states?
   - **Reading:** Does body copy stay within a comfortable 45–75 character measure? Are line height, paragraph rhythm, contrast, and tracking tuned to the actual face, width, language, and surface?
   - **Stress:** What happens with long headings, localization expansion, zoom, narrow containers, missing weights, and font fallback?
   - **Delivery:** Are only used assets loaded? Do fallback metrics, loading strategy, and variable-font settings avoid invisible text and disruptive reflow?
2. **Mechanical scan:** run:

\`\`\`bash
.agent/skills/impeccable/scripts/impeccable detect --json --scope type [target files or dirs]
\`\`\`

Also inspect dynamic or arbitrary font values the detector cannot interpret. Synthesize both assessments before editing, noting what each caught alone. A clean scan is a floor, not proof of good typography.

## Set the system

Before editing, state:

- the roles the interface needs;
- the intended contrast between those roles;
- the reading measure and density;
- which existing faces and weights are authoritative;
- any performance, localization, or accessibility constraints.

Use the fewest roles and families that make the hierarchy unmistakable. Combine size, weight, space, and tone deliberately instead of asking size alone to do all the work. Role names and tokens should describe purpose rather than values.

## Apply

- Keep body copy comfortably readable and zoomable. Use 1rem / 16px as the ordinary web body floor unless a dense role, platform convention, or user setting justifies otherwise.
- Keep prose in the 45–75ch range. Tune line height inversely with measure: wider lines generally need more leading.
- Compensate light text on dark surfaces on all three perceptual axes: slightly more line height, a touch more tracking, and one step more weight when the face needs it.
- Tune line height to the face, width, language, and contrast, not a universal ratio.
- Keep repeated roles consistent across screens and states.
- Use numeric, tabular, code, and label features when their content benefits.
- Load only used font assets and weights. Provide metric-compatible fallbacks and avoid blocking text.
- Let marketing display type respond to available space when useful; keep dense product and reading surfaces spatially predictable.
- Preserve browser zoom, user font settings, Dynamic Type, and platform text scaling.
- Use paragraph spacing or first-line indentation as the primary paragraph rhythm; combining both usually double-marks the boundary.

Do not make type decorative at the expense of comprehension, or introduce a second family without a clear role it alone can perform.

## Line breaks

After Matthew Butterick's *Practical Typography*, paraphrased; where his numbers differ from these, these stand.

- Set \`text-wrap: balance\` on headings and short centered blocks, and \`text-wrap: pretty\` on body copy. Both are progressive: a browser that ignores them keeps its default wrap.
- \`pretty\` pulls a word down beside a lone last word. It does not fill the last line, and a two-word tail is fine.
- In a column too narrow for either to help, edit the copy or widen the column.
- Break a heading by hand only between phrases, and check the break at every width the heading renders at. A hard break that lands mid-line on a phone is worse than the default wrap.
- An uneven break can carry meaning: a headline that lands on one word for weight, a poster line, a pull quote. Make it deliberate with a hard break or a wrap set on that element, and keep it rare. The detector's \`straggler\` and \`unbalanced-heading\` findings are advisory for this reason; say which breaks are intended.

## Verify

- Primary, secondary, body, and metadata roles are recognizable without reading the copy.
- Long text remains comfortable across relevant widths and languages.
- The typography belongs to the product and its established world.
- Loading does not create disruptive reflow or invisible text.
- Zoom, text scaling, focus, contrast, and reduced viewport paths remain usable.
- The final mechanical scan has no unexplained findings.

Answer each item with rendered or source evidence, then rerun the scan. Do not substitute a bare “yes” for verification.

When the hierarchy holds, hand off to \`/impeccable polish\`.

## Live-mode signature params

Every variant declares a coarse \`scale\` parameter and authors its type ramp against \`var(--p-scale, 1)\`.

\`\`\`json
{"id":"scale","kind":"range","min":0.85,"max":1.3,"step":0.05,"default":1,"label":"Scale"}
\`\`\`

Add at most one pairing or weight parameter when it represents a real system choice. Follow [live.md](live.md)'s parameter contract.
`,
  },
  {
    path: "reference/visualize.md",
    content: `> **Nota del harness ChiaNative:** esta skill corre en un agente movil, no en un CLI de escritorio.
> No existe el binario \`scripts/impeccable\`, ni los slash-commands \`/impeccable ...\`, ni el design hook.
> Donde el playbook diga \`.agent/skills/impeccable/scripts/impeccable <verbo>\`, hace el equivalente con las
> tools del harness: \`shell_exec\` en el VPS, \`read\`/\`write\`/\`edit\` (\`target:"vps"\` para el proyecto,
> \`target:"phone"\` para esta skill) y \`playwright-cli\` o \`npx playwright screenshot\` para ver el render,
> mirando el PNG con \`read\`. Si un paso depende del script, decilo y segui a mano: nunca inventes su salida.
> Las rutas \`.impeccable/...\` son relativas al proyecto en el VPS; los enlaces relativos de estos playbooks
> (\`reference/x.md\`, \`x.md\`) son archivos de esta misma skill en el telefono.

# Visualize: Direction Comps & Asset Production

Load this from [new-work.md](new-work.md) on a comp-led build, when image generation is available (a harness-native tool or the API fallback \`impeccable context\` reports). A code-led contract skips this file by design, not by drift; do not load it then. PRODUCT.md is a precondition; DESIGN.md is one only on an established world, since a new or replacement world writes it at the finish. The MODE RULES block concept-seed printed for this surface (COMPS) governs these comps together with this file and wins where they conflict; with no roll this session, read the mode's file named in new-work.md. New-work has already resolved the visual world; this file must not reopen it. A surface-scope structure round that already put three visualized cards before the user (new-work.md, established world) has discharged this round: the locked card's comp is the approved comp, so record the approval and continue at After approval; generate nothing new.

A probe tests composition, narrative, hierarchy, density, focal moment, signature use, and image requirements. It is not a second identity workshop. Keep the world's palette, typography direction, material language, component character, imagery stance, and motion grammar fixed: DESIGN.md's on an established world, the chosen direction's on a new one.

## Generate three compositional options

The comp round runs inside the build's phase state: \`impeccable build-phase start --direction <seed reference>\` has already run (with \`--decision-comp <path>\` when the chosen card has a decision comp) and its \`comps\` phase is open before the first comp is generated; a comp rendered before that sits outside the state, and a session resumed from that point has no phases to follow. \`impeccable generate-image\` refuses to write under \`.impeccable/mocks/\` until start has run; a harness-native image tool is bound by the same order.

Render three distinct high-fidelity north-star comps of the requested surface, saved under \`.impeccable/mocks/\` so they survive the session. When the chosen card has a decision comp, it is option one: it stays at its path under \`.impeccable/mocks/decision/\`, where the gate counts it through \`--decision-comp\`, and is never regenerated; render the other two. Comp at the surface's own viewport: portrait at device size for a native app or mobile-first surface, desktop landscape otherwise; a phone screen comped landscape misstates the composition before anything is built against it. Comps are the build thread's own work, never delegated: the thread that writes the prompts holds the direction's full context and has seen every comp when the build starts. Open every image by its workspace-relative path; sandboxed viewers reject absolute paths, and everything under the project root has a relative one. Base the comps on real content and the surface concepts already developed with the user. On an established world, anchor every comp on the real identity: capture a screenshot of a representative existing page and pass it as a reference image (the harness image tool's input image, or \`impeccable generate-image --ref\`); the prompt leads with the new surface's structure while the reference carries palette, type, and component character, because DESIGN.md words alone drift where a pixel reference does not. Name what the reference contributes and what it must not: chrome, palette, type, and component character carry over; the reference page's own content does not, and a banner, hero, or card lifted verbatim is the reference leaking, not fidelity. Three is the number: one comp invites rubber-stamping; the spread between three surfaces the composition worth building. The chosen card's decision comp is the first of the three: it already renders this direction at full fidelity under this discipline, so generate two more that vary what the first held fixed, from the direction in words rather than with the first comp as an input image (a reference image anchors the layout, and three comps collapse into one composition). How comps two and three vary from the first is the mode's call, in its COMPS rules. A variant that simplifies the first into a tidier version of itself adds no choice to the round. Send all three to the approval point together. Only a round arriving with no decision comp (a degraded roll, an identity-mode page, a direction pinned without the decision round) renders all three here.

- A comp prompt is short, 150 to 300 words, and carries only what the image model cannot know. The model draws what the prompt names and stops deciding whatever the prompt pins down, so a prompt that specifies everything gets back a template. Open with the surface: the kind of screen it is (a desktop web app, a documentation page, a landing page, a native app screen at its device viewport) for the product, by name, rendered edge to edge with crisp readable text and no browser window, device, or desk around it. Then the product and the visitor's job in plain words, with the real content that answers it: names, numbers with units, the offer or the state, any claim at its honest certainty, and the next action by name. Then what leads this comp, its product concept (summary-led, timeline-led, offer-led, reference-led), and the parts the screen holds in reading order, a phrase each. Then the frame in one line: the product's mark and name, its navigation, its utility controls, and the far edge, so the comp is a finished screen, never a fragment; a page with no navigation says so instead of inventing one. Leave sizes, positions, colours, and component styling out, except a colour, typeface, or brand element the user pinned: that is content, so state it. Self-check every render: if it could hang as a poster, or reads as a photograph with some text on it, it is not a comp; regenerate.
- The look comes from the world, and from a picture wherever one exists. An established world has the screenshot reference above: it carries the look, so the prompt adds one sentence on what the reference contributes and nothing more about style. A catalog world has card images: attach its board and hero as reference images (the NEXT line names them; \`impeccable generate-image --ref <board> --ref <hero>\`, or the harness image tool's input images) and write one sentence, that the references are style inspiration adapted into a real working product, their layout and content not to be copied. Describing the style as well overrides the picture. A direction with no card images carries its look in two to four sentences of concrete visual law: the ground and main colours with what each does, the type voices, and the one signature that makes it recognisable. No path lists colours past the main few or describes components one by one.
- The subject must be in it. Before accepting a render, point at the subject: a render that depicts the world and nothing of the subject fails however faithful its atmosphere, and the deletion usually rides in on an exclusion list. Regenerate with the subject's content named.
- Judge a comp as the shipped screen: the visitor's job must be readable from the image alone. Name the surface's mode from the render with no caption; a render whose mode cannot be read back is art direction without a surface. Regenerate with the visitor's job as the prompt's spine.
- Commitment is depth, not performance spread across regions. The world enters through one dominant move plus the material, type, and spacing that support it; the remaining regions hold still in that material and keep their content at real reading size. A second element competing with the lead at the same scale is the comp shouting: regenerate keeping the strongest move and quieting the rest. Busy is louder, not bolder.
- When the user shortlisted multiple concepts, spread the three across them.
- When one direction is committed, vary the structural uncertainty an image can resolve: what leads the screen, topology, sequence, density, hierarchy, focal composition, or interaction framing.
- Show enough beyond the opening moment to prove the concept can govern the whole surface.
- Do not generate a palette artifact, ask new atmosphere questions, introduce a different type voice, or invent a new motif. If the committed world cannot support the concept, return to the concept shortlist rather than changing the world.

Each comp is a direction test, not a screenshot specification. Core UI text, responsive behavior, accessibility, semantics, and interaction states remain implementation responsibilities.

## One approval point

Show the three together on the decision page (\`impeccable serve-question\`, one option per comp with the comp as its hero), or in the harness only when it renders images inline; a text-only surface does not count as display. Ask what should carry forward, what feels false to the world, and whether the selected concept should be approved, combined, revised, or rejected. Then stop and wait. A structured simulated user counts as attended and receives the same question.

Do not begin code until the user approves a direction or explicitly delegates the choice. If they delegate, choose using the task brief, PRODUCT.md, and DESIGN.md (the chosen direction on a new world), and state the evidence. Approval refines the task concept; it does not modify DESIGN.md.

This approval point has no substitute and no skip condition. When the structured question tool errors, fall back to the decision page; only after both fail may you treat the choice as delegated, and a delegated pick is recorded exactly as an approval is and disclosed in your first reply, not your last. The finish reviewer treats comp-round comps with no recorded approval as a material finding; decision comps under \`.impeccable/mocks/decision/\` are the direction round's hand, not comp-round output, and imply no approval on their own.

After approval, record the choice where tools can find it: the approved comp's path goes in the surface brief, and its prompt sidecar (the image's full file name plus \`.json\`: \`a.png\` gets \`a.png.json\`) gains \`"approved": true\` (every comp generated through \`impeccable generate-image\` has one; create it if a native tool didn't). The sidecar travels with the mocks folder, so the approval survives sessions and machines that never see the brief, and it is what \`impeccable build-phase advance\` reads to close the comps phase. Summarize the composition and the parts of the comp that must not be literalized, return to new-work.md, record the direction contract from the approved concept, and build.

## After approval: the comp becomes a spec

The approved comp is a north star for translation into semantic, responsive, accessible code, never a license to recompose: keeping the palette and mood while redrawing the topology is a second art direction. Do not rasterize core UI text or controls. Do not substitute a different visual driver after approval without asking.

What the comp shows is measured, not remembered. new-work.md section 6 runs the build as phases (\`impeccable build-phase\`): the spec phase turns the comp into region boxes with sampled palettes (\`impeccable comp-spec\`), and the medium of every region follows from what the pixels are, never from what feels buildable: a figure, a product object, machinery, any illustration with perspective, shading, or drawing skill in it, and any texture by name (woven cloth, paper grain, fabric, leather, brushed metal) is a \`plate\` / \`image\` / \`texture\` region and ships as a raster; text, controls, chrome, diagrams with countable elements, flat shape systems, and anything that must move, scale, or respond are semantic. Writing "CSS" for a sculpted panel's finish, or a many-vertex \`clip-path\` for a torn edge, is the quiet deletion of the approved design; the detector's organic-clip-path and buried-raster rules and the hero gate's region scores catch it. Dropping an image-native region is a scope decision the user makes at the approval point, never a silent flattening after it. Generated imagery is a material, not a claim: evidence rules bind assertions, specs, testimonials, and photographs presented as real, never render fidelity.

## Plates and provenance

Every raster region's plate is produced in the plates phase, before any page code, by the shipped asset producer or in the current thread (use \`impeccable comp-spec --crop <id>\` and save \`impeccable comp-spec --plate-prompt <id>\` to a prompt file; pass the crop and prompt to the harness image tool, or use \`impeccable generate-image --ref <crop.png> --prompt-file <prompt.txt> --out <plate.png> --size <WxH> --quality high\`). For isolated cutouts, add \`--background transparent\` to both the plate-prompt and API generation commands; use native PNG alpha and preserve white paint and clear gaps. Use \`--background opaque\` for full-frame imagery. Create output directories first and inspect alpha on light and dark grounds. Generation context is part of the asset: after generating any image with any tool, run \`.agent/skills/impeccable/scripts/impeccable embed-prompt <image> --prompt "<prompt>"\` with the exact string the tool received (\`impeccable generate-image\` does this itself), so the intent lives inside the file; \`--read\` recovers it, \`--scan <dir>\` lists rasters still missing one. The embedded prompt plus the region's row in the spec is the raster's **provenance**, and every raster the artifact references carries it; a sourced, stock, or pre-existing raster embeds its origin instead. A raster created or replaced later, in a fix batch or a reviewer's rebuild, is produced the same way; a raster a fix abandons is deleted in the same batch.

Convert images with a converter \`impeccable context\` reported at boot (the IMAGE_TOOLS line); probe only when it reported none, at most once per session, never per image.

Return to [new-work.md](new-work.md) for the direction contract, the phased build, and the finishing pass.
`,
  },
];
