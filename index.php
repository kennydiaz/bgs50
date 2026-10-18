<?php
require_once __DIR__ . '/includes/site.php';

$s = site();

render_head($s['title'], $s['description']);
?>
    <main id="main" class="companies">
        <div class="container">
            <h1 class="sr-only"><?= e($s['name']) ?> companies</h1>

            <div class="companies-grid">
<?php foreach ($s['companies'] as $c): ?>
                <article class="company-card" data-company="<?= e($c['slug']) ?>">
                    <div class="logo-panel">
                        <img src="<?= e(url($c['logo'])) ?>" alt="<?= e($c['name']) ?> logo" class="company-logo" loading="lazy" decoding="async">
                    </div>
                    <div class="card-body">
                        <h2 class="company-name"><?= e($c['name']) ?></h2>
                        <p class="company-description"><?= e($c['description']) ?></p>
                        <a href="<?= e($c['url']) ?>" class="visit-button" target="_blank" rel="noopener" aria-label="Visit <?= e($c['name']) ?> website (opens in a new tab)">
                            <svg class="icon-external" viewBox="0 0 24 24" aria-hidden="true"><path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/></svg>
                            Visit website
                        </a>
                    </div>
                </article>
<?php endforeach; ?>
            </div>
        </div>
    </main>

    <script type="application/ld+json">
<?= json_encode([
    '@context'     => 'https://schema.org',
    '@type'        => 'Organization',
    'name'         => $s['name'],
    'url'          => $s['url'],
    'logo'         => $s['url'] . '/images/icon-512.png',
    'subOrganization' => array_map(fn($c) => [
        '@type' => 'Organization',
        'name'  => $c['name'],
        'url'   => $c['url'],
        'description' => $c['description'],
    ], $s['companies']),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>

    </script>
<?php render_footer(); ?>
