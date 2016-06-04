var gulp = require('gulp');

// 引入组件
var plugins = require('gulp-load-plugins')(),
	del = require('del'),
    combiner = require('stream-combiner2');

// step 1: 清空dist
gulp.task('clean', function() {
    del('./src/*.html');
    del('./src/css/*.css');
    del('./dist/**/');
});

// step 2: jade
gulp.task("jade", function() {
    gulp.src('./src/jade/*.jade')
        .pipe(plugins.jade({
            pretty: true
        }))
        .pipe(gulp.dest('./dist/'));
});

// step 3: 将库文件copy到指定位置
gulp.task('buildlib', function() {

    //--------------------------js--------------------------------------

    gulp.src('./src/scripts/3rd/*.js')
        .pipe(gulp.dest('./dist/scripts/3rd/'));
    
    gulp.src('./src/semantic/semantic.min.js')
        .pipe(gulp.dest('./dist/scripts/3rd/semantic/'));

    gulp.src('./node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('./dist/scripts/3rd/'));

    gulp.src('./node_modules/underscore/underscore-min.js')
        .pipe(gulp.dest('./dist/scripts/3rd/'));

    gulp.src('./node_modules/echarts/dist/echarts.min.js')
        .pipe(gulp.dest('./dist/scripts/3rd/'));


    gulp.src('./dist/scripts/monitor_stream.js')
        .pipe(plugins.replace('../../node_modules/jquery/dist/jquery.min', './3rd/jquery.min'))
        .pipe(plugins.replace('../semantic/semantic.min', './3rd/semantic/semantic.min'))
        .pipe(plugins.replace('../../node_modules/underscore/underscore-min', './3rd/underscore-min'))
        .pipe(plugins.replace('../../node_modules/echarts/dist/echarts.min', './3rd/echarts.min'))
        .pipe(gulp.dest('./dist/scripts/'));

    //--------------------------css-------------------------------------

    gulp.src('./src/css/**/*')
        .pipe(gulp.dest('./dist/css/'));

    gulp.src('./src/semantic/semantic.min.css')
        .pipe(gulp.dest('./dist/css/3rd/semantic/'));

    gulp.src('./src/semantic/font/**')
        .pipe(gulp.dest('./dist/css/3rd/semantic/font/'));

    gulp.src('./src/semantic/themes/**')
        .pipe(gulp.dest('./dist/css/3rd/semantic/themes/'));

    //--------------------------html-------------------------------------

    gulp.src('./dist/monitor_stream.html')
        .pipe(plugins.replace('semantic/semantic.min.css', 'css/3rd/semantic/semantic.min.css'))
        .pipe(gulp.dest('./dist/'));

    //--------------------------images-----------------------------------

    gulp.src('./src/images/*.*')
        .pipe(gulp.dest('./dist/images/'));

    //--------------------------fin-----------------------------------
    del('./dist/_*.html');
});

// step 4: 合并，压缩js文件
gulp.task('javascripts', function() {
    var combined = combiner.obj([
        gulp.src('./src/scripts/*.js'),
        plugins.uglify(),
        gulp.dest('./dist/scripts/')
    ]);
    combined.on('error', console.error.bind(console));
    return combined;
});

// step 5.1: less解析
gulp.task('build-less', function() {
    gulp.src('./src/less/*.less')
        .pipe(plugins.less())
        .pipe(gulp.dest('./src/css/'));
        //.pipe(browserSync.stream()); // 监听
});

// step 5.2: 合并、压缩、重命名css
gulp.task('stylesheets', ['build-less'], function() {
    gulp.src('./src/css/*.css')
        //.pipe(plugins.concat('all.css'))
        //.pipe(gulp.dest('./dist/css/'))
        //.pipe(plugins.rename({
        //    suffix: '.min'
        //}))
        .pipe(plugins.minifyCss())
        .pipe(gulp.dest('./src/css/'));
});

// distribution
gulp.task('dist', plugins.sequence(['clean'], ['jade', 'javascripts', 'stylesheets'], 'buildlib'));

//=============================================================//

// develop
gulp.task('dev', function() {
    gulp.src('./src/less/**/*.less')
        .pipe(plugins.less())
        .pipe(gulp.dest('./src/css/'))
        .pipe(plugins.livereload());

    gulp.src('./src/jade/*.jade')
        .pipe(plugins.jade({
            pretty: true
        }))
        .pipe(gulp.dest('./src/'))
        .pipe(plugins.livereload());
});

// default
gulp.task('default', function() {
    del('./src/*.html');
    del('./src/css/*.css');
    plugins.livereload.listen();
    gulp.run('dev');
    gulp.watch(['./src/less/**/*.less', './src/jade/*.jade'], ['dev']);
});
