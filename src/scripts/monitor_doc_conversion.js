/**
 * Created by shen on 2016/7/5.
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
        }
    },
    paths: {
        "jquery": "../../node_modules/jquery/dist/jquery.min",
        "semantic": "../semantic/semantic.min",
        "dataTable": "./3rd/jquery.dataTables",
        "underscore": "../../node_modules/underscore/underscore-min"
    }
});

require(['jquery', 'semantic', 'dataTable', 'underscore', './constant', './tool'],
    function($, semantic, dataTable, _, C, T) {

    $(function() {
        monitor_doc_conversion_table();
    });

    /**
     * 生成table数据
     */
    function monitor_doc_conversion_table() {
        var url = C.url.monitor_doc_conversion;

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
                    "dataSrc": function(json) {
                        var data = [];
                        $.each(json, function(k, v) {
                            var ks = k.split("_");
                            var o = {
                                "id": ks[0],
                                "hostname": v["hostname"],
                                "session": ks[1] + "_" + ks[2],
                                "232101": v["232101"] || "-",
                                "232001": v["232001"] || "-",
                                "232011": v["232011"] || "-",
                                "232002": v["232002"] || "-",
                                "234001": v["234001"] || "-",
                                "234011": v["234011"] || "-"
                            };
                            data.push(o);
                        });
                        return data;
                    }
                }
                ,"order": [[ 7, "desc" ]]
                ,"columns": [{
                    // ID idx: 0
                    data: "id"
                }, {
                    // hostname idx: 1
                    data: "hostname"
                }, {
                    // session ID idx: 2
                    data: "session"
                }, {
                    // 232101 转换服务启动 idx: 3
                    data: "232101"
                }, {
                    // 232001 成功收到任务 idx: 4
                    data: "232001"
                }, {
                    // 232011 转换任务开始 idx: 5
                    data: "232011"
                }, {
                    // 232002 转换任务完成 idx: 6
                    data: "232002"
                }, {
                    // 234001 接收任务失败 idx: 7
                    data: "234001",
                    render: function (data, type, row, meta) {
                        if (typeof data == "object") {
                            var html = ["<ul>"];
                            $.each(data, function(k, v) {
                                html.push('<li>', k, ": ", v, '</li>');
                            });
                            var tr = table.row(meta.row).node();
                            $(tr).addClass("danger-bg");
                            html.push("</ul>");
                            return html.join("");
                        } else if (typeof data == "string" && data != "-") {
                            tr = table.row(meta.row).node();
                            $(tr).addClass("danger-bg");
                            return data;
                        } else {
                            return "-";
                        }
                    }
                }, {
                    // 234011 转换任务失败 idx: 8
                    data: "234011",
                    render: function (data, type, row, meta) {
                        if (typeof data == "object") {
                            var html = ["<ul>"];
                            $.each(data, function(k, v) {
                                html.push('<li>', k, ": ", v, '</li>');
                            });
                            var tr = table.row(meta.row).node();
                            $(tr).addClass("danger-bg");
                            html.push("</ul>");
                            return html.join("");
                        } else if (typeof data == "string" && data != "-") {
                            tr = table.row(meta.row).node();
                            $(tr).addClass("danger-bg");
                            return data;
                        } else {
                            return "-";
                        }
                    }
                }]
            });
        }

    }
});
