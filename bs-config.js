


const gulp = require('gulp');
const browserSync = require('browser-sync').create();

// Tarefa para iniciar o servidor do BrowserSync
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});

// Tarefa para assistir a alterações nos arquivos .js e recarregar o navegador
gulp.task('watch-js', function() {
    gulp.watch('js/*.js').on('change', browserSync.reload);
});

// Tarefa padrão que inicia o servidor do BrowserSync e assiste a alterações nos arquivos .js
gulp.task('default', gulp.series('browser-sync', 'watch-js'));
