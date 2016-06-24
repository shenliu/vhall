/**
 * Created by shen on 2016/6/16.
 */

require.config({
    shim: {
        'underscore': {
            exports: 'underscore'
        },

        'semantic': {
            deps: ['jquery'],
            exports: 'semantic'
        },

        'dataTable': {
            deps: ['jquery'],
            exports: 'dataTable'
        },

        'fixedCol': {
            deps: ['dataTable'],
            exports: 'fixedCol'
        },

        'mscroll': {
            deps: ['jquery'],
            exports: 'mscroll'
        }
    },
    paths: {
        "jquery": "../../node_modules/jquery/dist/jquery.min",
        "semantic": "../semantic/semantic.min",
        "dataTable": "./3rd/jquery.dataTables",
        "mscroll": "./3rd/mobiscroll.custom-3.0.0.min",
        "underscore": "../../node_modules/underscore/underscore-min",
        "echarts": "../../node_modules/echarts/dist/echarts.min"
    }
});

require(['jquery', 'semantic', 'underscore', './constant', './tool'],
    function($, semantic, _, C, T) {

    $(function() {
        _init();
        setInterval(_animateIt, 2000);
    });

    function _init() {
        T.xhr_get(C.url.monitor_gallery, function(data, textStatus, jqXHR) {
            var html = [];
            $(data).each(function(idx, elem) {
                html.push('<div class="two wide column vh-gallery-img-box">');
                html.push('<div class="ui vh-gallery-img-box-inner" data-id="', elem["streamid"] ,'">');
                html.push('<img class="ui medium image" src="', elem["attr"]["_m"]["url"], '" onerror="imgError(this);" />');
                html.push('</div>');
                html.push('<span>', elem["streamid"], '</span>');
                html.push('</div>');
            });
            $(".ui.grid").html(html.join(""));
        }, null);

    }

    var rotation = ['flipped-vertical-bottom', 'flipped-vertical-top', 'flipped-horizontal-left', 'flipped-horizontal-right'];

    function _animateIt() {
        var box = $(".vh-monitor-gallery");
        var dom_ids = box.find("[data-id]"); // 已经存在的所有图片dom
        var ids = [];
        $.each(dom_ids, function(k, v) {
            ids.push($(v).attr("data-id"));
        });
        T.xhr_get(C.url.monitor_gallery, function(data, textStatus, jqXHR) {
            $(data).each(function(idx, elem) {
                var streamID = elem["streamid"];
                var dom = box.find("[data-id='" + streamID + "']");
                if (dom.length) { // 已经存在
                    var img = dom.find("img");
                    var url = elem["attr"]["_m"]["url"];

                    var _idx = _.indexOf(ids, streamID); // 找到ids中对应的streamID索引
                    if (_idx !== -1) {
                        ids[_idx] = undefined; // 数组中置为undefined
                    }

                    if (img.attr("src") !== url) { // 图片改变了 才换
                        var random = T.random(0, 3);
                        var animation = "animated " + rotation[random]; // 旋转style
                        dom.parent(".vh-gallery-img-box").addClass(animation);
                        window.setTimeout(function () {
                            return function () {
                                img.attr("src", url);
                            };
                        } (), 0);

                        dom.parent(".vh-gallery-img-box").on('transitionend webkitTransitionEnd MSTransitionEnd oTransitionEnd', function() {
                            $(this).removeClass(animation);
                        });
                    }
                } else {
                    var html = [];
                    html.push('<div class="two wide column vh-gallery-img-box">');
                    html.push('<div class="ui vh-gallery-img-box-inner" data-id="', elem["streamid"] ,'">');
                    html.push('<img class="ui medium image" src="', elem["attr"]["_m"]["url"], '" onerror="imgError(this);" />');
                    html.push('</div>');
                    html.push('<span>', elem["streamid"], '</span>');
                    html.push('</div>');
                    box.append(html.join(""));
                    window.setTimeout(function () {
                        return function () {
                            box.find("[data-id='" + streamID + "']").parent(".vh-gallery-img-box").addClass("animated-move rubberBand").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                                $(this).removeClass("animated-move rubberBand");
                            });
                        };
                    } (), 500);

                }
            });

            ids = _.filter(ids, function(num){ return !!num; });
            if (ids.length) { // 有已经停止播放的流
                $(ids).each(function(idx, elem) {
                    var dom = box.find("[data-id='" + elem + "']");
                    window.setTimeout(function () {
                        return function () {
                            dom.parent(".vh-gallery-img-box-inner").addClass("animated-move hinge").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                                $(this).removeClass("animated-move hinge");
                                $(this).remove();
                            });
                        };
                    } (), 500);
                });
            }
        }, null);
    }

});
