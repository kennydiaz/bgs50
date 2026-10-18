<?php
// Contenido del sitio: todo lo editable vive en data/site.json.

function site(): array {
    static $site = null;
    if ($site === null) {
        $site = json_decode(file_get_contents(__DIR__ . '/../data/site.json'), true) ?: [];
    }
    return $site;
}

function e(?string $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

// Ruta base del sitio: "" en bgs50.com, "/bgs50" en localhost. Así los enlaces
// funcionan igual en ambos y también desde 404.php en cualquier URL.
function url(string $path = ""): string {
    static $base = null;
    $base ??= rtrim(str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"] ?? "/")), "/");
    return $base . "/" . ltrim($path, "/");
}

// Versión del asset según su fecha de modificación, para invalidar la caché del
// navegador en cada deploy sin tocar el HTML a mano.
function asset(string $path): string {
    $file = __DIR__ . '/../' . $path;
    return url($path) . (is_file($file) ? '?v=' . filemtime($file) : '');
}

// Las dos páginas comparten <head>, header y footer.
function render_head(string $title, string $description, bool $index = true): void {
    $s = site();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?></title>
    <meta name="description" content="<?= e($description) ?>">
    <meta name="author" content="<?= e($s['name']) ?>">
    <meta name="robots" content="<?= $index ? 'index, follow' : 'noindex' ?>">
    <meta name="theme-color" content="#0f0f0f">
<?php if ($index): ?>
    <link rel="canonical" href="<?= e($s['url']) ?>/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= e($s['url']) ?>/">
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:description" content="<?= e($description) ?>">
    <meta property="og:image" content="<?= e($s['url']) ?>/images/og-image.jpg">
    <meta name="twitter:card" content="summary_large_image">
<?php endif; ?>
    <link rel="icon" type="image/png" href="<?= e(url('images/favicon.png')) ?>">
    <link rel="apple-touch-icon" href="<?= e(url('images/apple-touch-icon.png')) ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= e(asset('assets/css/style.css')) ?>">
</head>
<body>
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="header">
        <div class="container header-inner">
            <a href="<?= e(url()) ?>" class="logo" aria-label="<?= e($s['name']) ?> home">
                <span class="logo-text"><?= e($s['name']) ?></span>
            </a>
        </div>
    </header>
<?php
}

function render_footer(): void {
    $s = site();
    $year = (int)date('Y');
    $years = $year > $s['since'] ? $s['since'] . '–' . $year : (string)$year;
    ?>
    <footer class="footer">
        <div class="container footer-inner">
            <span class="logo-text"><?= e($s['name']) ?></span>
            <p>&copy; <?= $years ?> <?= e($s['name']) ?>. All rights reserved.</p>
        </div>
    </footer>

    <script src="<?= e(asset('assets/js/main.js')) ?>" defer></script>
    <script src="<?= e(asset('assets/js/circuit-bg.js')) ?>" defer></script>
</body>
</html>
<?php
}
