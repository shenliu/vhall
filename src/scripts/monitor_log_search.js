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

require(['jquery', 'semantic', 'dataTable', 'mscroll', 'underscore', './constant', './tool'],
    function($, semantic, dataTable, mscroll, _, C, T) {

    $(function() {
        _init(monitor_auto_search);
        monitor_log_search_event();
    });

    function _init(callback) {
        // <模块>初始化
        var html = ['<div class="item" data-value="">无</div>'];
        $.each(C.modules, function(k, v) {
            html.push('<div class="item" data-value="', k, '">', v, '</div>');
        });
        $(".vh-search-module").find(".menu").html(html.join(""));

        $.when(
            // 流ID
            $.get(C.url.monitor_get_streams),
            // 主机
            $.get(C.url.monitor_get_hosts)
        ).done(function(data_id, data_host) {
            data_id = JSON.parse(data_id[0]);
            data_host = JSON.parse(data_host[0]);
            // 流ID
            html = ['<div class="item" data-value="">无</div>'];
            $(data_id).each(function(i, elem) {
                html.push('<div class="item" data-value="', elem, '">', elem, '</div>');
            });
            $(".vh-search-id").find(".menu").html(html.join(""));

            // 主机
            html = ['<div class="item" data-value="">无</div>'];
            $(data_host).each(function(i, elem) {
                html.push('<div class="item" data-value="', elem, '">', elem, '</div>');
            });
            html.push('<div class="item" data-value="None">None</div>');
            $(".vh-search-host").find(".menu").html(html.join(""));

            $(".ui.dropdown").dropdown();

            // 日期
            var now = new Date(),
                until = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

            $('#vh-date').mobiscroll().date({
                theme: 'material',
                lang: 'zh',
                display: 'bottom',
                dateWheels: 'yymmdd',
                dateFormat: 'yy/mm/dd',
                min: until,
                minWidth: 100,
                max: now
            }).val(T.dateFormat(now, "yyyy/MM/dd"));

            $('#vh-date').mobiscroll('getInst').setVal(now);

            // 时间
            $('#vh-time-start').mobiscroll().time({
                theme: 'material',
                lang: 'zh',
                display: 'bottom',
                timeFormat: 'HH:ii:00',
                timeWheels: 'HHii'
            }).val("00:00:00");

            $('#vh-time-end').mobiscroll().time({
                theme: 'material',
                lang: 'zh',
                display: 'bottom',
                timeFormat: 'HH:ii:59',
                timeWheels: 'HHii'
            }).val("23:59:59");

            callback && callback();
        });
    }

    function monitor_log_search_event() {
        var bar = $(".vh-search-bar");

        // 查询按钮
        bar.find(".vh-search-btn").on("click", function(e) {
            var id, host, module, code, date, timeStart, timeEnd;

            // 流ID
            id = bar.find(".ui.dropdown.vh-search-id").dropdown("get value");

            // 主机
            host = bar.find(".ui.dropdown.vh-search-host").dropdown("get value");

            // 模块
            module = bar.find(".ui.dropdown.vh-search-module").dropdown("get value");
            if (module == "") {
                _message();
                return;
            }

            // 错误代码
            code = bar.find(".vh-search-code input").val().trim();
            if (code == "") {
                _message();
                return;
            }

            // 时间范围
            date = bar.find("#vh-date").val();
            timeStart = bar.find("#vh-time-start").val();
            timeEnd = bar.find("#vh-time-end").val();

            $(e.currentTarget).addClass("loading").attr("disabled", "disabled");

            monitor_log_search_table(id, host, module, code, date, timeStart, timeEnd);
        });

        // message close
        $(".vh-search-warning").on("click", ".close.icon", function() {
            $(".ui.message.vh-search-warning").hide("normal");
        });

        // 警告
        function _message() {
            $(".ui.message.vh-search-warning").show("fast", function() {
                var that = $(this);
                setTimeout(function() {
                    that.hide("normal");
                }, 2500);
            });
        }
    }

    /**
     * 生成table数据
     * @param id
     * @param host
     * @param module
     * @param code
     * @param date
     * @param timeStart
     * @param timeEnd
     */
    function monitor_log_search_table(id, host, module, code, date, timeStart, timeEnd) {
        var url = C.url.monitor_log_search
            .replace("{id}", id)
            .replace("{host}", host)
            .replace("{mod}", module)
            .replace("{code}", code)
            .replace("{date}", date.replace(/\//g, ""))
            .replace("{start}", timeStart)
            .replace("{end}", timeEnd);

        var $table = $("table.ui.table");

        if ($.fn.dataTable.tables().length) {
            // 如果第二次 只改变url值
            $.fn.dataTable.tables({api:true}).ajax.url(url).load();
        } else {
            var table = $table.DataTable({
                destroy: true,
                "dom": 'iftlp',
                "language": C.tableLocale
                ,"autoWidth": false
                ,"scrollX": true
                ,"lengthMenu": [[25, 50, 75, 100, -1], [25, 50, 75, 100, '全部']]
                ,"ajax": {
                    "url": url,
                    "dataSrc": ""
                }
                ,"order": [[ 4, "desc" ]]
                ,"columns": [{
                    // 流ID idx: 0
                    data: "streamid"
                }, {
                    // 主机名 idx: 1
                    data: "hostname"
                }, {
                    // 模块 idx: 2
                    data: "mod",
                    render: function (data, type, row, meta) {
                        if (data) {
                            return C.modulesAll[row["mod"]];
                        } else
                            return "-";
                    }
                }, {
                    // 错误代码 idx: 3
                    data: "code"
                }, {
                    // 时间 idx: 4
                    data: "timestamp",
                    render: function (data, type, row, meta) {
                        if (data) {
                            return new Date(data.$date).toISOString().replace("T", " ");
                        } else
                            return "-";
                    }
                }, {
                    // src_ip idx: 5
                    data: "src_ip",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // ci idx: 6
                    data: "ci",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // uid idx: 7
                    data: "uid",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // log_id idx: 8
                    data: "log_id",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // tt idx: 9
                    data: "tt",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // pid idx: 10
                    data: "pid",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // si idx: 11
                    data: "si",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // log_session idx: 12
                    data: "log_session",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // s idx: 13
                    data: "s",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // sd idx: 14
                    data: "sd",
                    render: function (data, type, row, meta) {
                        return data || "-";
                    }
                }, {
                    // attr idx: 15
                    data: "attr",
                    render: function (data, type, row, meta) {
                        var html = ["<ul>"];
                        $.each(data, function(k, v) {
                            html.push('<li>', k, ": ", v, '</li>');
                        });
                        html.push("</ul>");
                        return html.join("");
                    }
                }, {
                    // type idx: 16
                    data: "type",
                    render: function (data, type, row, meta) {
                        if (data == 4) {
                            var tr = table.row(meta.row).node();
                            $(tr).addClass("danger-bg");
                        }
                        return data || "-";
                    }
                }]
            });

            table.on( 'draw', function (e) {

            }).on('xhr', function() {
                // 恢复<查询>按钮的状态
                $(".vh-search-btn").removeClass("loading").attr("disabled", false);
            }).on('init', function() {
                // 隐藏type栏
                table.column(16).visible(false);
            });
        }

    }

    /**
     * url有search时 自动运行
     * @param params
     */
    function monitor_auto_search(params) {
        var host, module, id, code, start, end;
        if (params) {

        } else {
            var search = location.search.slice(1);
            if (search.charAt(search.length - 1) == "?") {
                search = search.slice(0, -1);
            }
            if (search == "") {
                return;
            }
            host = T.urlParam("host", search);
            module = T.urlParam("module", search);
            id = T.urlParam("id", search);
            code = T.urlParam("code", search);
            start = T.urlParam("start", search);
            end = T.urlParam("end", search);
        }

        var bar = $(".vh-search-bar");

        if (id) {
            bar.find(".ui.dropdown.vh-search-id").dropdown("set selected", id);
        }

        if (host && host != "None") {
            bar.find(".ui.dropdown.vh-search-host").dropdown("set selected", host);
        }

        if (module) {
            bar.find(".ui.dropdown.vh-search-module").dropdown("set selected", module);
        }

        if (code) {
            bar.find(".ui.input.vh-search-code input").val(code);
        }

        if (start) {
            bar.find("#vh-date").val(T.dateFormat(new Date(), "yyyy/MM/dd"));
            bar.find("#vh-time-start").val(start + ":00:00");
            bar.find("#vh-time-end").val(end + ":00:00");
        }

        bar.find(".vh-search-btn").trigger("click");
    }
});
