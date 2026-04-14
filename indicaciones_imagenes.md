# Guía de Imágenes a Reemplazar - Landing Page

Esta guía detalla las imágenes provisionales "aleatorias" (placeholders) que he colocado en el archivo `index.html`. Deben ser reemplazadas posteriormente por imágenes reales de la empresa.

| Referencia en HTML | Ubicación Visual | Tipo de Imagen Recomendada | Tamaño Sugerido |
|:---|:---|:---|:---|
| `<header id="inicio">` | Fondo del Hero Section (Cabecera Principal) | Una fotografía extensa, imponente y oscura mostrando maquinaria industrial, una nave siderúrgica en actividad o acero fundido. | **1920x1080 px** |
| `id="img-about"` | Sección "Nuestra Empresa" | Fotografía corporativa del equipo de planta o fachada externa de las instalaciones principales. | **800x600 px** |
| `id="img-prod1"` | Card Productos: Barras de Acero | Primer plano de lotes de acero corrugado en almacenamiento. | **600x400 px** |
| `id="img-prod2"` | Card Productos: Planchas Metálicas | Foto de planchas LAF/LAC brillantes apiladas. | **600x400 px** |
| `id="img-prod3"` | Card Productos: Tubos Estructurales | Pilas de tubos de acero rectangulares y circulares amarrados, listos para envío. | **600x400 px** |
| `id="img-prod4"` | Card Productos: Perfiles | Vigas metálicas (forma U, H o I) industriales. | **600x400 px** |

---

### 🔧 Instrucciones para actualizar:

1. **Para las imágenes dentro del cuerpo de la página:** (Productos y Nuestra Empresa)
   * Abre `index.html`.
   * Realiza una búsqueda por el **ID** (*ejemplo:* `img-prod1`).
   * Reemplaza la ruta en `src="https://picsum.photos/..."` por la ruta local de tu imagen, por ejemplo `src="img/barras-acero.jpg"`.

2. **Para la imagen de fondo principal (Hero):**
   * En `index.html` busca la etiqueta `<header id="inicio" class="hero" style="...">`.
   * Dentro del atributo `style`, ubica la línea: `url('https://picsum.../1920/1080')`.
   * Reemplázala por la ruta de la nueva foto, por ejemplo: `url('img/hero-fondo.jpg')`. La capa oscura degradada (código `linear-gradient`) ya está implementada y funcionará automáticamente sobre tu nueva imagen para que los textos resalten.
