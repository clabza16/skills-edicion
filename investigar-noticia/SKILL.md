---
name: investigar-noticia
description: Investiga un hecho de actualidad (un aluvión, una tormenta, un anuncio, una noticia que se está moviendo) leyendo varias fuentes y devuelve una ficha de hechos con la fuente de cada dato, las cifras que no calzan entre medios y lo que todavía no se sabe. Es el primer paso para hacer un video explicativo o un post sin decir algo falso. Úsala cuando digan "investiga qué pasó con X", "averigua las causas de", "qué se sabe de", "hazme un video explicando lo que pasó" o "chequea este dato antes de publicarlo".
---

# investigar-noticia

El video explicativo se cae si un dato está mal: la gente lo nota en los comentarios y lo
comparte. Esta skill deja una **ficha de hechos** que todo lo demás (guion, video, caption) tiene
que respetar.

## Pasos

### 1. Busca

- 3-4 búsquedas distintas: el hecho + el lugar + la fecha; las causas; las cifras (afectados,
  milímetros, montos); la fuente oficial (gobierno, servicio meteorológico, empresa).
- Prioriza: fuente oficial > medio grande nacional > medio local > redes. Las redes sirven para
  saber qué se está diciendo, nunca como fuente de un dato.

### 2. Lee de verdad

- Abre **al menos 6 fuentes** y léelas completas, no solo el titular. Si una página no carga o
  pide suscripción, anótala como fallida y busca otra: **no cuentes como leída una que no abriste**.
- Para cada dato anota: el dato, la fuente, la hora de publicación.

### 3. Arma la ficha

Guárdala como `ficha.md`:

```markdown
# <El hecho> — ficha al <fecha y hora>

## Lo que está confirmado
- <dato> — <fuente, hora> (y <otra fuente> si coincide)

## Cifras que no calzan
- Lluvia: 13 mm (fuente A, 18:10) · 7-10 mm (fuente B, 18:40) → en pantalla: "entre 7 y 13 mm"

## Lo que todavía no se sabe
- <pregunta abierta>

## Fuentes
- leídas: <n> · fallidas: <n> (<cuáles>)
```

### 4. Reglas para lo que venga después

- **Cada cifra que salga en pantalla está en la ficha con su fuente.** Si no está, no sale.
- Si dos fuentes no coinciden, se muestra el rango o la fuente más oficial, nunca la cifra más llamativa.
- Lo que se cuenta de la propia investigación también tiene que ser exacto: si se leyeron 7
  fuentes, no se dice "leyó 8".
- Un hecho que cambia rápido (alertas, cortes, cifras de afectados) lleva la hora en el caption:
  "datos a las 17:30".
- Si en la búsqueda aparece algo que contradice lo que la persona quería decir, se lo dices antes
  de seguir.
