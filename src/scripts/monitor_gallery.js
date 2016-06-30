/**
 * Created by shen on 2016/6/23.
 */

require.config({
    shim: {
        'underscore': {
            exports: 'underscore'
        },

        'semantic': {
            deps: ['jquery'],
            exports: 'semantic'
        }
    },
    paths: {
        "jquery": "../../node_modules/jquery/dist/jquery.min",
        "semantic": "../semantic/semantic.min",
        "underscore": "../../node_modules/underscore/underscore-min"
    }
});

require(['jquery', 'semantic', 'underscore', './constant', './tool'],
    function($, semantic, _, C, T) {

    var rotation = ['flipped-vertical-bottom', 'flipped-vertical-top', 'flipped-horizontal-left', 'flipped-horizontal-right'];

    var showYolo = false;

    $(function() {
        // 识别yolo
        var path = location.pathname;
        if (path.indexOf("yolo") !== -1) {
            showYolo = true;
        }
        _init();
        setInterval(_animateIt, 15000);
        _event();
    });

    function _init() {
        T.xhr_get(C.url.monitor_gallery, function(data, textStatus, jqXHR) {
            var html = [],
                imgs = [];
            $(data).each(function(idx, elem) {
                var streamID = elem["streamid"];
                if (showYolo && streamID.length <= 9 ) {
                    return true;
                }
                if (!showYolo && streamID.length > 9) {
                    return true;
                }
                html.push('<div class="two wide column vh-gallery-img-box">');
                html.push('<div class="ui vh-gallery-img-box-inner" data-id="', streamID ,'">');
                //html.push('<img class="ui medium image" src="', elem["attr"]["_m"]["url"], '" onerror="imgError(this);" />');
                imgs.push(elem["attr"]["_m"]["url"]);
                html.push('</div>');
                html.push('<span>', elem["streamid"], '</span>');
                html.push('</div>');
            });
            var grid = $(".ui.grid");
            grid.html(html.join(""));
            grid.find(".vh-gallery-img-box-inner").each(function(idx, elem) {
                _addImg(imgs[idx], $(elem));
            });
        }, null);

    }

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
                        } (), 500);

                        dom.parent(".vh-gallery-img-box").on('transitionend webkitTransitionEnd MSTransitionEnd oTransitionEnd', function() {
                            $(this).removeClass(animation);
                        });
                    }
                } else {
                    var html = [], _img;
                    if (showYolo && streamID.length <= 9 ) {
                        return true;
                    }
                    if (!showYolo && streamID.length > 9) {
                        return true;
                    }
                    html.push('<div class="two wide column vh-gallery-img-box">');
                    html.push('<div class="ui vh-gallery-img-box-inner" data-id="', elem["streamid"] ,'">');
                    //html.push('<img class="ui medium image" src="', elem["attr"]["_m"]["url"], '" onerror="imgError(this);" />');
                    _img = elem["attr"]["_m"]["url"];
                    html.push('</div>');
                    html.push('<span>', elem["streamid"], '</span>');
                    html.push('</div>');
                    box.append(html.join(""));
                    box.find(".vh-gallery-img-box-inner").eq(-1).each(function(idx, elem) {
                        _addImg(_img, $(elem));
                    });

                    window.setTimeout(function () {
                        return function () {
                            box.find("[data-id='" + streamID + "']").parent(".vh-gallery-img-box").addClass("animated-move rubberBand").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                                $(this).removeClass("animated-move rubberBand")[0].scrollIntoView();
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
                            dom.parent(".vh-gallery-img-box").addClass("animated-move hinge").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                                $(this).removeClass("animated-move hinge").remove();
                            });
                        };
                    } (), 500);
                });
            }
        }, null);
    }

    function _addImg(src, dom) {
        var maxH = 150;
        var img = new Image();
        img.className = "ui medium image";
        img.src = src;
        img.onload = function () {
            var imgW = img.width;
            var imgH = img.height;
            var w = dom.width(), h;

            h = maxH;
            w = imgW * h / imgH;
            $(img).width(w).height(h);
            dom.height(h);
            dom.append(img);
        };
        img.onerror = function() {
            imgError(this);
        };

    }

    function _event() {
        $(document).on("mouseover", ".vh-gallery-img-box", function(e) {
            var img = $(e.currentTarget).find("img");
            var w = img.width(),
                h = img.height(),
                left = parseFloat(img.css("left")),
                top = parseFloat(img.css("top"));
            var already = img.attr("data-w");
            if (!already) {
                img.attr("data-w", w);
                img.attr("data-h", h);
                img.attr("data-l", left);
                img.attr("data-t", top);
            } else {
                w = img.attr("data-w");
                h = img.attr("data-h");
                left = img.attr("data-l");
                top = img.attr("data-t");
            }

            var _w = (200 * w / h);
            img.stop().animate({
                width: (_w) + "px",
                height: "200px",
                top: (top - 25) + "px"
                //left: (left - _w / 2) + "px"
            });
        }).on("mouseout", ".vh-gallery-img-box", function(e) {
            var img = $(e.currentTarget).find("img");
            var w = img.attr("data-w"),
                h = img.attr("data-h"),
                left = img.attr("data-l"),
                top = img.attr("data-t");
            img.stop().animate({
                width: (w) + "px",
                height: (h) + "px",
                top: (top) + "px"
                //left: (left) + "px"
            });
        });

        $(document).on("click", ".vh-gallery-img-box", function(e) {
            var target = $(e.currentTarget);
            var id = target.find("span").html();

            T.xhr_get(C.url.monitor_stream, function(data) {
                var obj = undefined;
                $(data).each(function(idx, elem) {
                    if (elem["streamid"] === id) {
                        obj = elem;
                        return false;
                    }
                });
                if (!obj) return;
                var o = obj["alluser"];
                var keys;
                if (!$.isEmptyObject(o["flash_cdn"])) {
                    keys = _.keys(o["flash_cdn"]);
                } else if (!$.isEmptyObject(o["mobile_cdn"])){
                    keys = _.keys(o["mobile_cdn"]);
                }

                if (keys && keys.length) {
                    var domain = keys[1] ? keys[1] : keys[0];
                    var hash, url;

                    if (domain.indexOf("rtmp") !== -1) { // rtmp
                        // 格式: rtmp://domain/vhall/id
                        hash = ["rtmp://", domain, "/vhall/", id];
                        url = './player/srs.html#' + hash.join("");
                    } else if (domain.indexOf("hls") !== -1) { // hls
                        // 格式: http://cn_domain/vhall/id/livestream.m3u8
                        // 格式: http://cc_domain/vhall/id/index.m3u8
                        var suffix = domain.startsWith("cn") ? "/livestream.m3u8" : "/index.m3u8";
                        hash = ["http://", domain, "/vhall/", id, suffix];
                        url = './player/jwp.html#' + hash.join("");
                    } else {
                        return;
                    }

                    if (url) {
                        $(".ui.modal.vh-modal-player")
                            .modal({
                                closable: true,
                                onShow: function() {
                                    $('.ui.embed').embed({
                                        url: encodeURI(url)
                                    });
                                },
                                onHide: function() {
                                    var ifr = $("iframe")[0];
                                    ifr.contentWindow.player_stop();
                                    $('.ui.embed').find(".embed").remove();
                                }
                            })
                            .modal('setting', 'transition', "swing up")
                            .modal('show').modal("refresh");
                    }
                }

            }, null);
        });
    }
});
