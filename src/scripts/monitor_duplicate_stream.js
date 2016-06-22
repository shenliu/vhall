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

require(['jquery', 'semantic', 'dataTable', 'underscore', './constant', './tool'],
    function($, semantic, dataTable, _, C, T) {

    $(function() {
        monitor_log_search_table();
    });

    /**
     * 生成table数据
     */
    function monitor_log_search_table() {
        var url = C.url.monitor_duplicate_stream;

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
                            return C.modules[row["mod"]];
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

            }).on('init', function() {
                // 隐藏type栏
                table.column(16).visible(false);
            });
        }

    }
});
