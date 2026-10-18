<?php
require_once __DIR__ . '/includes/site.php';

http_response_code(404);
render_head('Page not found | ' . site()['name'], 'The page you are looking for does not exist.', false);
?>
    <main id="main" class="not-found">
        <div class="container">
            <p class="not-found-code">404</p>
            <h1>Page not found</h1>
            <p>The page you are looking for does not exist or has moved.</p>
            <a href="<?= e(url()) ?>" class="visit-button">Back to BGS Group</a>
        </div>
    </main>
<?php render_footer(); ?>
