# BGS Group — bgs50.com

Portal del grupo BGS: una página con las empresas del grupo y el enlace a cada sitio.
PHP sin base de datos ni dependencias; reemplaza al WordPress que estaba en bgs50.com
(su contenido real venía del sitio estático anterior, `bgs50-old`).

## Estructura

```
index.php              Página principal (tarjetas de empresas)
404.php                Página de error; .htaccess manda aquí toda URL que no existe
includes/site.php      Carga del contenido + <head>, header y footer compartidos
data/site.json         TODO el contenido editable: título, SEO y empresas
assets/css/style.css   Estilos
assets/js/main.js      Efectos (aparición al scroll, header, botón subir)
images/                Logos, favicon, og-image
.htaccess              HTTPS, sin www, bloqueo de data/ e includes/, caché, 404
robots.txt, sitemap.xml
.github/workflows/deploy.yml   Deploy automático a Hostinger
```

## Editar empresas

Todo está en [data/site.json](data/site.json). Cada empresa:

```json
{
    "name": "E-BOP",
    "description": "Technology and business automation",
    "logo": "images/logo-ebop.png",
    "url": "https://e-bop.com"
}
```

El botón **Webmail** del encabezado lleva a la dirección de la clave `webmail` de
[data/site.json](data/site.json) (`https://mail.bgs50.com`, el correo de la empresa). Sin esa
clave el botón no aparece.

El orden del arreglo es el orden en la página. Los logos van en `images/`; se muestran
completos (sin recorte) sobre un panel blanco, en gris hasta pasar el mouse.
Mantenerlos livianos: WebP o PNG de menos de ~50 KB.

## Local

Con Apache de XAMPP encendido: <http://localhost/bgs50/>. Las rutas se calculan solas
(`url()` en `includes/site.php`), así que funciona igual en una subcarpeta y en la raíz.

## Deploy

Cada push a `main` sube el sitio por rsync/SSH a
`/home/<usuario>/domains/bgs50.com/public_html` (ver
[.github/workflows/deploy.yml](.github/workflows/deploy.yml)). Antes de subir valida la
sintaxis PHP y el JSON. No borra nada del servidor.

Secrets del repo (Settings → Secrets and variables → Actions): `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`. Ya están configurados con una clave dedicada (`gh-actions-bgs50`,
registrada en `~/.ssh/authorized_keys` de la cuenta). Hosting: Hostinger del cliente,
212.107.19.157, puerto SSH 65002; la misma cuenta aloja e-bop.com, bgselectrician.com, etc.

Como el deploy no borra, si se elimina o renombra un archivo del repo hay que quitarlo
también del servidor a mano.

### WordPress anterior

bgs50.com tenía un WordPress sin contenido real (solo "Hello world!"). Se retiró el
2026-10-18 y se eliminó por completo (archivos, respaldo y tablas de la base de datos).
`.private/` en `public_html` es de Hostinger y no se toca.
