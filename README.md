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
    "slug": "ebop",
    "name": "E-BOP",
    "description": "Technology and business automation",
    "logo": "images/logo-ebop.png",
    "url": "https://e-bop.com"
}
```

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
`SSH_PRIVATE_KEY`. El acceso SSH se activa en hPanel → Avanzado → Acceso SSH (puerto 65002),
donde también se registra la clave pública.

### Primera vez: retirar WordPress

El deploy no borra archivos, así que el WordPress anterior queda en `public_html` hasta
quitarlo a mano. Nuestro `index.php` y `.htaccess` lo reemplazan, pero `wp-login.php`,
`xmlrpc.php`, `wp-admin/`, etc. siguen accesibles mientras existan.

1. Respaldar (hPanel → Archivos → Copias de seguridad, o descargar `public_html` y la base de datos).
2. Borrar de `public_html`: `wp-*`, `wp-admin/`, `wp-content/`, `wp-includes/`,
   `xmlrpc.php`, `license.txt`, `readme.html`.
3. Desactivar/quitar LiteSpeed Cache y purgar la caché en hPanel para que no sirva la página vieja.
4. La base de datos de WordPress se puede eliminar después de confirmar que el sitio nuevo está bien.
