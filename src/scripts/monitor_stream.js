/**
 * Created by shen on 2016/5/25.
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

        'scroll': {
            deps: ['jquery'],
            exports: 'scroll'
        }
    },
    paths: {
        "jquery": "../../node_modules/jquery/dist/jquery.min",
        "semantic": "../semantic/semantic.min",
        "dataTable": "./3rd/jquery.dataTables",
        //"fixedCol": "./3rd/dataTables.fixedColumns.min",
        "underscore": "../../node_modules/underscore/underscore-min",
        "scroll": "./3rd/scroll",
        "echarts": "../../node_modules/echarts/dist/echarts.min"
    }
});

require(['jquery', 'semantic', 'dataTable', 'underscore', 'scroll', 'echarts', './constant', './tool'],
    function($, semantic, dataTable, _, scroll, E, C, T) {
    /*
       保存每个td中的数据
       {
            streamID: {
                "1": [],
                "2": [],
                ...
                "alluser": {}
            }
       }
     */
    var streamData = {};

    // init
    $(function() {
        monitor_table();
        monitor_table_event();
    });

    function monitor_table() {
        var reloadInterval, countDownInterval;

        var templateCollect = _.template($("#tpl_td_collect").html());
        var template = _.template($("#tpl_td_list").html());

        // 自定义sort
        $.fn.dataTable.ext.order['dom-error-number'] = function  ( settings, col ) {
            return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
                var dom = $(td).find('.vh-td-error-number');
                if (dom.length > 0) {
                    return dom[0].innerHTML * 1;
                } else {
                    return 0;
                }
            } );
        };

        var $table = $("table.ui.table");
        var table = $table.DataTable({
            "dom": 'if<"vh-table-toolbar">tlp',
            "language": C.tableLocale
            ,"autoWidth": false
            ,"scrollX": true
            ,"lengthMenu": [[25, 50, 75, 100, -1], [25, 50, 75, 100, '全部']]
            //,"order": [[ 0, 'desc' ]]
            ,"ajax": {
                "url": C.url.monitor_stream,
                "dataSrc": ""
            }
            ,"order": [[ 12, "desc" ]]
            //,fixedColumns: {
            //   leftColumns: 1
            //}
            ,"columns": [{
                // 流ID idx: 0
                data: "streamid",
                render: function(data, type, row, meta) {
                    if (data)
                        return data.substring(0, 32);
                    else
                        return "";
                }
            }, {
                // 流信息 idx: 1  todo
                data: "baduser.user"

            }, {
                // 第三方 idx: 2
                data: "20.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["20"], row["streamid"], "20", template);
                    } else
                        return "-";
                }
            }, {
                // 直播助手 idx: 3
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "1.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["1"], row["streamid"], "1", template);
                    } else
                        return "-";
                }
            }, {
                // SRS接收 idx: 4
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "2.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["2"], row["streamid"], "2", template);
                    } else
                        return "-";
                }
            }, {
                // SRS分发 idx: 5
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "11.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["11"], row["streamid"], "11", template);
                    } else
                        return "-";
                }
            }, {
                // HLS切片 idx: 6
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "12.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["12"], row["streamid"], "12", template);
                    } else
                        return "-";
                }
            }, {
                // HLS同步 idx: 7
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "13.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["13"], row["streamid"], "13", template);
                    } else
                        return "-";
                }
            }, {
                // HLS回放 idx: 8
                orderDataType: "dom-error-number",
                type: "numeric",
                data: "14.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["14"], row["streamid"], "14", template);
                    } else
                        return "-";
                }
            }, {
                // 移动 idx: 9
                data: "baduser.mobile_cdn",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genCollect(row, "mobile_cdn", "6", templateCollect);
                    } else
                        return "-";
                }
            }, {
                // Flash idx: 10
                data: "baduser.flash_cdn",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genCollect(row, "flash_cdn", "7", templateCollect);
                    } else
                        return "-";
                }
            }, {
                // 卡顿用户数 idx: 11
                data: "baduser.user",
                render: function(data, type, row, meta) {
                    var dom = ["<a class='vh-summery-count-each vh-block' data-id='", row["streamid"], "' href='###'>", data, "</a>"];
                    return dom.join("");
                }
            }, {
                // 用户总数 idx: 12
                data: "alluser.user",
                render: function(data, type, row, meta) {
                    var dom = ["<a class='vh-summery-count-each vh-block' data-id='", row["streamid"], "' href='###'>", data, "</a>"];
                    return dom.join("");
                }
            }]
        });

        table.on( 'draw', function (e) {
            monitor_table_event_list_details();
            monitor_table_event_show_stream();
        }).on('init', function() {
            var tpl = _.template($("#tpl_table_toolbar").html());
            var toolbar = $(".vh-table-toolbar").eq(0);
            toolbar.html(tpl());

            // 筛选按钮
            toolbar.find(".ui.button.vh-tb-filter").on("click", function() {
                _filter(table, false);
            });

            $('.ui.dropdown').dropdown();

            // 倒计时
            var countdown = toolbar.find(".vh-auto-reload-countdown");

            // 自动刷新
            toolbar.find(".ui.checkbox").checkbox({
                onChecked: function() {
                    reloadInterval = setInterval(function() {
                        table.ajax.reload();
                    }, C.reloadInterval);

                    countDownInterval = setInterval(function() {
                        var n = countdown.html() - 1;
                        if (n === 0) {
                            n = C.reloadInterval / 1000;
                        }
                        countdown.html(n);
                    }, 1000);
                },
                onUnchecked: function() {
                    clearInterval(reloadInterval);
                    reloadInterval = undefined;

                    clearInterval(countDownInterval);
                    countDownInterval = undefined;
                    countdown.html(C.reloadInterval / 1000);
                }
            });

            // 手动刷新
            toolbar.find(".vh-tb-reload").on("click", function() {
                table.ajax.reload();
            });

            // 快捷筛选
            toolbar.find(".ui.idea").popup({
                position: "bottom right",
                offset: 12,
                hoverable: true
            });

            toolbar.find(".vh-tb-shortcut").on("click", "a", function(e) {
                var target = $(e.currentTarget);
                var id = target.attr("data-id");
                switch(id) {
                    case "1": // 过滤结束流
                        _setFilter(4, "text", 5, "结束");
                        _filter(table, false);
                        break;
                    case "2": // 流ID大于10的
                        _setFilter("0", "length", 3, 10);
                        _filter(table, false);
                        break;
                    default:
                        break;
                }
            });

            // 取消筛选
            toolbar.find("button.vh-tb-filter-cancel").on("click", function() {
                $.fn.dataTable.ext.search.length = 0;
                _resetFilter();
                table.draw();
            });

        });
    }

    /**
     *  toolbar筛选条件
     *  @param {object} table 控件
     *  @param {boolean} isMultiple 是否多重查询
      * @private
     */
    function _filter(table, isMultiple) {
        var search = $.fn.dataTable.ext.search;

        // 多重查询
        !isMultiple &&　_default();

        var filters = _getFilter();
        if (filters) {
            $(filters).each(function(idx, item) {
                var col = parseInt(item.col, 10),
                    dimension = item.dimension,
                    oper = parseInt(item.oper, 10),
                    val = item.val;
                var func;

                switch(col) {
                    case 0: // 流ID
                        if (dimension === "length") { // 长度
                            switch(oper) {
                                case 1: // <=
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        return searchData[col].length <= parseInt(val, 10);
                                    };
                                    break;
                                case 2: // ==
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        return searchData[col].length == parseInt(val, 10);
                                    };
                                    break;
                                case 3: // >=
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        return searchData[col].length >= parseInt(val, 10);
                                    };
                                    break;
                                default:
                                    _default();
                            }
                        } else if (dimension === "number") { // 大小
                            _default();
                        } else if (dimension === "text") { // 文本
                            switch(oper) {
                                case 4: // 包含
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        return searchData[col].indexOf(val) !== -1;
                                    };
                                    break;
                                case 5: // 不包含
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        return searchData[col].indexOf(val) === -1;
                                    };
                                    break;
                                case 1: case 2: case 3: default:
                                    _default();
                            }
                        }
                        break;

                    case 4: // SRS接收
                    case 5: // SRS分发
                    case 6: // HLS切片
                    case 7: // HLS同步
                    case 8: // HLS回放
                        if (dimension === "number") {
                            switch(oper) {
                                case 1: // <=
                                case 2: // ==
                                case 3: // >=
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        var s = searchData[col];
                                        var reg = /<span class="vh-td-error-number">(\d+)<\/span>/;
                                        var match = reg.exec(s);
                                        if (match) {
                                            return _compare(parseInt(match[1], 10), parseInt(val, 10), oper);
                                        }
                                        return false;
                                    };
                                    break;
                                default:
                                    _default();
                            }
                        } else if (dimension === "text") {
                            switch(oper) {
                                case 4: // 包含
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        var s = searchData[col];
                                        return s.indexOf(val) !== -1;
                                    };
                                    break;
                                case 5: // 不包含
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        var s = searchData[col];
                                        return s.indexOf(val) === -1;
                                    };
                                    break;
                                default:
                                    _default();
                            }
                        } else {
                            _default();
                        }
                        break;

                    case 11: // 卡顿用户数
                    case 12: // 用户总数
                        if (dimension === "number") {
                            switch(oper) {
                                case 1: // <=
                                case 2: // ==
                                case 3: // >=
                                    func = function( settings, searchData, index, rowData, counter ) {
                                        var s = searchData[col];
                                        var v = T.stripHTML(s);
                                        return _compare(parseInt(v, 10), parseInt(val, 10), oper);
                                    };
                                    break;
                                default:
                                    _default();
                                    break;
                            }
                        } else {
                            _default();
                        }
                        break;

                    default:
                        _default();
                }

                func && search.push(func);
            });
        } else {
            _default();
        }

        table.draw();

        function _default() {
            search.length = 0;
        }

        function _compare(n1, n2, oper) {
            switch(oper) {
                case 1:
                    return n1 <= n2;
                    break;
                case 2:
                    return n1 == n2;
                    break;
                case 3:
                    return n1 >= n2;
                    break;
            }
        }
    }

    /**
     *  解析toolbar中的筛选条件
     * @returns {*[]} 无筛选条件  {array} 一个或多个条件
     * @private
     */
    function _getFilter() {
        var toolbar = $(".vh-table-toolbar").eq(0);
        // 列 vh-tb-col
        var col = toolbar.find(".ui.dropdown.vh-tb-col").dropdown("get value");
        if (col && col.length === 0) {
            return null;
        }

        // 维度 vh-tb-dimension
        var dimension = toolbar.find(".ui.dropdown.vh-tb-dimension").dropdown("get value");
        if (dimension && dimension.length === 0) {
            return null;
        }

        // 操作 vh-tb-oper
        var oper = toolbar.find(".ui.dropdown.vh-tb-oper").dropdown("get value");
        if (oper && oper.length === 0) {
            return null;
        }

        // 值 vh-tb-val
        var val = toolbar.find(".ui.input.vh-tb-val input").val().trim();
        if (val == "") {
            return null;
        }

        return [{
            col: col,
            dimension: dimension,
            oper: oper,
            val: val
        }];
    }

    /**
     *  设置toolbar中的筛选条件
     * @param col
     * @param dimension
     * @param oper
     * @param val
     * @private
     */
    function _setFilter(col, dimension, oper, val) {
        var toolbar = $(".vh-table-toolbar").eq(0);
        // 列 vh-tb-col
        toolbar.find(".ui.dropdown.vh-tb-col").dropdown("set selected", col);

        // 维度 vh-tb-dimension
        toolbar.find(".ui.dropdown.vh-tb-dimension").dropdown("set selected", dimension);

        // 操作 vh-tb-oper
        toolbar.find(".ui.dropdown.vh-tb-oper").dropdown("set selected", oper);

        // 值 vh-tb-val
        toolbar.find(".ui.input.vh-tb-val input").val(val);
    }

    function _resetFilter() {
        var toolbar = $(".vh-table-toolbar").eq(0);
        // 列 vh-tb-col
        toolbar.find(".ui.dropdown.vh-tb-col").dropdown("restore defaults");

        // 维度 vh-tb-dimension
        toolbar.find(".ui.dropdown.vh-tb-dimension").dropdown("restore defaults");

        // 操作 vh-tb-oper
        toolbar.find(".ui.dropdown.vh-tb-oper").dropdown("restore defaults");

        // 值 vh-tb-val
        toolbar.find(".ui.input.vh-tb-val input").val("");
    }

    /**
     * 生成模版(id="tpl_td_list") 并向 streamData中填入数据
     * @param data  {Array}    每一个单元格td的数据 如: 直播助手
     * @param streamID {String}  作为key的streamID
     * @param k  {String}       模块编号
     * @param tpl  {function}   模版方法
     * @returns {string}  返回生成的模版
     * @private
     */
    function _genList(data, streamID, k, tpl) {
        if (data["log_list"].length > 0) {
            if (!(streamID in streamData)) {
                streamData[streamID] = {};
            }

            streamData[streamID][k] = data;

            var arr = [];

            $.each(data["log_list"], function(idx, item) {
                var o = {};
                data["log_list"][idx]["code"] = o["code"] = item.code; // 记录code
                data["log_list"][idx]["desc"] = o["desc"] = C.message[item.code]; // 记录描述文字
                data["log_list"][idx]["date"] = o["date"] = new Date(item.timestamp.$date).toISOString().replace("T", " "); // 记录格式化时间
                data["log_list"][idx]["level"] = o["level"] = item.type; // 记录level
                data["log_list"][idx]["bg"] = o["bg"] = C.level[item.type]; // 记录bg
                arr.push(o);
            });

            return tpl({
                row1: arr[0],
                row2: arr[1],
                row3: arr[2],
                errorNum: data["error_no"],
                id: streamID,
                k: k
            });
        } else {
            return "-";
        }
    }

    /**
     *
     * @param data  一行数据
     * @param type  类型
     * @param k     模块编号
     * @param tpl   模版方法
     * @private
     */
    function _genCollect(data, type, k, tpl) {
        if (data["alluser"]["user"] > 0) {
            var streamID = data["streamid"];
            if (!(streamID in streamData)) {
                streamData[streamID] = {};
            }

            streamData[streamID][k] = data;

            var bad = data["baduser"][type];
            var all = data["alluser"][type];
            var arr = [];
            var sum = 0, total = 0;
            $.each(all, function(k, v) {
                var o = {};
                o[k] = (bad[k] || 0) + "/" + v;
                arr.push(o);
                sum += (bad[k] || 0);
                total += v;
            });

            if (total === 0) { // 没有错误的情况
                $.each(all, function(k, v) {
                    total += v;
                    var o = {};
                    o[k] = 0 + "/" + v;
                    arr.push(o);
                });
            }

            if (total === 0) { // 还为0
                return "-";
            }

            return tpl({
                sum: sum,
                total: total,
                items: arr.slice(0, 3),
                itemsRest: arr.length > 3 ? arr.slice(3) : [],
                id: streamID,
                k: k,
                type: type
                ,more: arr.length > 3
            });
        } else {
            return "-";
        }
    }

    function monitor_table_event() {
        // 历史 操作 点击事件
        $(document).on("click", ".link.icon.vh-tb-list-oper", function() {
            var that = $(this);
            var code = that.attr("data-code"),
                id = that.attr("data-id"),
                host = that.attr("data-host"),
                k = that.attr("data-k");
            var template;
            var grid = that.parents(".ui.grid");
            if (that.hasClass("history")) { // 历史
                var url = C.url.monitor_stream_query_list_history.replace("{id}", id).replace("{host}", host).replace("{code}", code);
                T.xhr_get(url, function(data, textStatus, jqXHR) {
                    var axis = [], all = [], host = [], stream = [];
                    $.each(data, function(k, v) {
                        axis.push(k);
                        all.push(v["all"]);
                        host.push(v["host"]);
                        stream.push(v["stream"]);
                    });

                    template = _.template($("#tpl_modal_history").html());
                    var html = template({
                        errorCode: code,
                        num: axis.length
                    });
                    grid.find(".vh-error-list-oper-box").html(html);
                    var graph = grid.find(".vh-history-graph");
                    monitor_table_graph(graph[0], axis, all, host, stream);
                }, null);
            } else { // 操作
                template = _.template($("#tpl_modal_oper").html());
                var html = template({
                    errorCode: code,
                    needHandle: code,
                    reason: code,
                    method: code
                });
                grid.find(".vh-error-list-oper-box").html(html);
            }
            grid.find(".item").removeClass("current-bg");
            that.parents(".item").eq(1).addClass("current-bg"); // 上边第二个 eq(1)
        });
    }

    /**
     *  点击每个绿红td 弹出对话框
     */
    function monitor_table_event_list_details() {
        var td = $("table.ui.table").find(".vh-error-list");
        var template = _.template($("#tpl_modal_list").html());

        td.off("click").on("click", function(e) {
            var that = $(e.currentTarget);
            var selector = ".vh-modal-list-details";

            $(selector + ".ui.modal")
                .modal({
                    closable: true,
                    onShow: function() {
                        var id = that.attr("data-id");
                        var k = that.attr("data-k");
                        var n = C.queryNumber + "";
                        if (id) {
                            var url = C.url.monitor_stream_query_list.replace("{id}", id).replace("{k}", k).replace("{len}", n);
                            T.xhr_get(url, function(data, textStatus, jqXHR) {
                                $.each(data, function(idx, obj) {
                                    // parse base64
                                    //if ("_m" in obj["attr"]) {
                                        //obj["attr"]["_m"] = T.base64.decode(obj["attr"]["_m"]);
                                    //}

                                    data[idx]["desc"] = C.message[obj.code]; // 记录描述文字
                                    data[idx]["date"] = new Date(obj.timestamp.$date).toISOString().replace("T", " "); // 记录格式化时间
                                    data[idx]["level"] = obj.type; // 记录level
                                    data[idx]["bg"] = C.level[obj.type]; // 记录bg
                                });

                                $(selector).find(".vh-error-list-box").html(template({
                                    items: data,
                                    id: id,
                                    k: k
                                }));

                                $(selector).find(".vh-error-list-oper-box").empty();

                                $(selector).find(".ui.checkbox").checkbox({
                                    onChecked: function() {
                                        $(selector).find(".vh-error-list-box").find(".success").parents(".item").hide();
                                        $(selector).find(".vh-should-view")[0].scrollIntoView();
                                    },
                                    onUnchecked: function() {
                                        $(selector).find(".vh-error-list-box").find(".success").parents(".item").show();
                                        $(selector).find(".vh-should-view")[0].scrollIntoView();
                                    }
                                });

                                // 隐藏 显示后 选择的显示在屏幕中
                                $(selector).find(".vh-error-list-box").on("click", ".item", function(e) {
                                    var items = $(selector).find(".vh-error-list-box").find(".item");
                                    items.removeClass("vh-should-view");

                                    $(e.currentTarget).addClass("vh-should-view");
                                });
                            }, null);
                        } else {
                            return false; // 没有streamID 不显示列表
                        }
                    }
                })
                .modal('setting', 'transition', "browse")
                .modal('show').modal("refresh");
        });

    }

    /**
     *  点击每个灰色的td中的list 弹出视频窗口
     */
    function monitor_table_event_show_stream() {
        // more...
        $('.ui.accordion').accordion({
            selector: {
                trigger: '.title.vh-more'
            }
        });

        var td = $("table.ui.table").find(".vh-error-collect");
        td.off("click").on("click", ".item", function(e) {
            var that = $(e.currentTarget);
            var _td = that.parents(".vh-error-collect");
            var id = _td.attr("data-id");
            var k = _td.attr("data-k");
            var type = _td.attr("data-type");

            var domain = that.text().split(":")[0].trim();
            var url, hash;

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
            }

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
                .modal('setting', 'transition', "fly down")
                .modal('show').modal("refresh");
        });

        // 汇总
        $("table.ui.table td").off("click").on("click", ".vh-summery-count-each", function(e) {
            var that = $(e.currentTarget);
            var _td = that.parents(".vh-error-collect");
            if (_td.length === 0) {
                _td = that;
            }
            var id = _td.attr("data-id");
            var type = _td.attr("data-type") || "total"; // flash h5 ...

            $(".ui.modal.vh-modal-summery-count")
                .modal({
                    closable: true,
                    onShow: function() {
                        var url = C.url.monitor_stream_summery_count.replace("{id}", id);
                        T.xhr_get(url, function(data, textStatus, jqXHR) {
                            var times = [], legend = [], series = [], series_quality = [];
                            var app = [], flash = [], h5 = [],
                                app_quality = [], flash_quality = [], h5_quality = [],
                                each = {}, each_bad = {}, each_quality = {}, // 当不是全部时 存储各个分流的数据 如 "cnrtmplive02.e.vhall.com": 2
                                sum = 0, sum_bad;

                            var mobile_cdn = [],
                                flash_cdn = [],
                                h5_cdn = [];

                            // 取得所有分类的名称
                            $.each(data, function(k, v) {
                                var key = _.keys(v)[0]; // 时间
                                var cur = v[key]["alluser"];

                                $.each(cur["mobile_cdn"], function(i, j) {
                                    if (_.indexOf(mobile_cdn, i) === -1) {
                                        mobile_cdn.push(i);
                                    }
                                });

                                $.each(cur["flash_cdn"], function(i, j) {
                                    if (_.indexOf(flash_cdn, i) === -1) {
                                        flash_cdn.push(i);
                                    }
                                });

                                $.each(cur["h5_cdn"], function(i, j) {
                                    if (_.indexOf(h5_cdn, i) === -1) {
                                        h5_cdn.push(i);
                                    }
                                });
                            });

                            $.each(data, function(k, v) {
                                var key = _.keys(v)[0]; // 时间
                                times.push(key);

                                var cur = v[key]; // 当前对象 如 "14:15:16": {"alluser":{}, "baduser":{}}
                                var alluser = cur["alluser"];
                                var baduser = cur["baduser"];

                                if (type === "total") {
                                    sum = 0;
                                    sum_bad = 0;
                                    $.each(alluser["mobile_cdn"], function(i, j) {
                                        sum += j;
                                    });
                                    app.push(sum);

                                    $.each(baduser["mobile_cdn"], function(i, j) {
                                        sum_bad += j;
                                    });
                                    app_quality.push(_formula(sum, sum_bad));

                                    sum = 0;
                                    sum_bad = 0;
                                    $.each(alluser["flash_cdn"], function(i, j) {
                                        sum += j;
                                    });
                                    flash.push(sum);

                                    $.each(baduser["flash_cdn"], function(i, j) {
                                        sum_bad += j;
                                    });
                                    flash_quality.push(_formula(sum, sum_bad));

                                    sum = 0;
                                    sum_bad = 0;
                                    // h5 暂时没有数据
                                    h5.push(0);
                                    h5_quality.push(0);
                                } else {
                                    // 格式: each{"cnrtmplive02.e.vhall.com": [2, 4, 6], ...}
                                    var obj;
                                    if (type === "mobile_cdn") {
                                        obj = mobile_cdn;
                                    } else if (type === "flash_cdn") {
                                        obj = flash_cdn;
                                    } else if (type === "h5_cdn") {
                                        obj = h5_cdn;
                                    }
                                    $.each(obj, function(i, elem) {
                                        if (!(elem in each)) {
                                            each[elem] = [];
                                        }

                                        if (alluser[type]) {
                                            each[elem].push(alluser[type][elem] || 0);
                                        } else {
                                            each[elem].push(0);
                                        }

                                    });

                                    $.each(obj, function(i, elem) {
                                        if (!(elem in each_bad)) {
                                            each_bad[elem] = [];
                                        }
                                        if (baduser[type]) {
                                            each_bad[elem].push(baduser[type][elem] || 0);
                                        } else {
                                            each_bad[elem].push(0);
                                        }

                                    });
                                }

                            });

                            if (type === "total") {
                                legend = ["app", "flash", "h5"];

                                $([app, flash, h5]).each(function(i, d) {
                                    series.push({
                                        name: legend[i],
                                        type: "bar",
                                        stack: '总量',
                                        data: d
                                    });
                                });

                                $([app_quality, flash_quality, h5_quality]).each(function(i, d) {
                                    series_quality.push({
                                        name: legend[i],
                                        type: "line",
                                        data: d
                                    });
                                });

                            } else {
                                legend = _.keys(each);

                                $.each(legend, function(i, o) {
                                    series.push({
                                        name: legend[i],
                                        type: "bar",
                                        stack: '总量',
                                        data: each[o]
                                    });
                                });

                                $.each(each, function(k, v) { // {"cnrtmplive02.e.vhall.com": [2, 4, 6]}
                                    each_quality[k] = [];
                                    $.each(v, function(i, j) { // 如: [2, 4, 6]
                                        each_bad[k] && each_quality[k].push(_formula(j, each_bad[k][i]));
                                    });
                                });

                                $.each(legend, function(i, o) {
                                    series_quality.push({
                                        name: legend[i],
                                        type: "line",
                                        data: each_quality[o]
                                    });
                                });
                            }

                            var template = _.template($("#tpl_modal_summery_count").html());
                            var html = template({
                                num: times.length
                            });
                            var box = $(".ui.modal.vh-modal-summery-count");
                            box.find(".content").html(html);

                            var graph = box.find(".vh-summery-count-graph-statistics");
                            monitor_summery_count_graph_statistics(graph[0], times, legend, series);

                            graph = box.find(".vh-summery-count-graph-quality");
                            monitor_summery_count_graph_quality(graph[0], times, legend, series_quality);
                        }, null);
                    }
                })
                .modal('setting', 'transition', "browse right")
                .modal('show').modal("refresh");
        });
    }

    function _formula(total, bad) {
        if (total === bad) {
            return 0;
        }
        var n = ((total - bad) / total * 100).toFixed(2);
        return n < 0 ? 0 : n;
    }

    function monitor_table_graph(dom, axis, all, host, stream) {
        var myChart = E.init(dom);

        // 指定图表的配置项和数据
        var option = {
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['活动', '本机', '全部']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: axis
            },
            yAxis: {
                type: 'value',
                minInterval: 1
            },
            series: [{
                name: "活动",
                type: "line",
                data: stream
            }, {
                name: "本机",
                type: "line",
                data: host
            }, {
                name: "全部",
                type: "line",
                data: all
            }]
        };

        // 使用刚指定的配置项和数据显示图表。
        myChart.setOption(option);
    }


    /**
     * 汇总统计图
     * @param dom
     * @param axis
     * @param legend
     * @param series
     */
    function monitor_summery_count_graph_statistics(dom, axis, legend, series) {
        var myChart = E.init(dom);

        var option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type : 'shadow'
                }
            },
            legend: {
                data: legend,
                x: 'right'
            },
            dataZoom: [{
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: 0
                ,bottom: 0
            }],
            grid: [{
                left: '20',
                right: '40',
                bottom: '50',
                containLabel: true
            }],
            xAxis: [{
                type : 'category',
                boundaryGap : true,
                axisLine: {onZero: true},
                name: "时间",
                axisLabel: {
                    rotate: -30
                },
                data: axis
            }],
            yAxis: [{
                name : '个数',
                type : 'value'
            }],
            series: series
        };

        myChart.setOption(option);
    }


    function monitor_summery_count_graph_quality(dom, axis, legend, series) {
        var myChart = E.init(dom);

        var option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type : 'shadow'
                }
            },
            legend: {
                data: legend,
                x: 'right'
            },
            dataZoom: [{
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: 0
                ,bottom: 0
            }],
            grid: [{
                left: '20',
                right: '40',
                bottom: '50',
                containLabel: true
            }],
            xAxis: [{
                type : 'category',
                boundaryGap : true,
                axisLine: {onZero: true},
                name: "时间",
                axisLabel: {
                    rotate: -30
                },
                data: axis
            }],
            yAxis: [{
                name : '百分比',
                //max: 110,
                type : 'value'
            }],
            series: series
        };

        myChart.setOption(option);
    }
});
