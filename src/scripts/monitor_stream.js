/**
 * Created by shen on 2016/5/25.
 */

require.config({
    //baseUrl: "../node_modules/",
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
        "fixedCol": "./3rd/dataTables.fixedColumns.min",
        "underscore": "../../node_modules/underscore/underscore-min",
        "scroll": "./3rd/scroll",
        "echarts": "../../node_modules/echarts/dist/echarts.min"
    }
});

require(['jquery', 'semantic', 'dataTable', 'fixedCol', 'underscore', 'scroll', 'echarts', './constant', './tool'],
    function($, semantic, dataTable, fixedCol, _, scroll, echarts, C, tool) {
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
        monitor_table(C.url.monitor_stream);
        monitor_table_event();
    });

    function monitor_table(url) {
        C.debug && (url = "./data.json"); // mock!!!!!

        var templateCollect = _.template($("#tpl_td_collect").html());
        var template = _.template($("#tpl_td_list").html());

        var $table = $("table.ui.table");
        var table = $table.DataTable({
            "dom": "<iftlp>",
            "language": C.tableLocale
            ,"autoWidth": false
            ,"scrollX": true
            ,"lengthMenu": [[25, 50, 75, 100, -1], [25, 50, 75, 100, '全部']]
            //,"order": [[ 0, 'desc' ]]
            ,"ajax": {
                "url": url,
                "dataSrc": ""
            }
            ,"order": [[ 12, "desc" ]]
            //,fixedColumns: {
            //   leftColumns: 1
            //}
            ,"columns": [{
                // 流ID
                data: "streamid",
                render: function(data, type, row, meta) {
                    if (data)
                        return data.substring(0, 32);
                    else
                        return "";
                }
            }, {
                // 流信息 todo
                data: "baduser.user"

            }, {
                // 第三方
                data: "20.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["20"], row["streamid"], "20", template);
                    } else
                        return "-";
                }
            }, {
                // 直播助手
                data: "1.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["1"], row["streamid"], "1", template);
                    } else
                        return "-";
                }
            }, {
                // SRS接收
                data: "2.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["2"], row["streamid"], "2", template);
                    } else
                        return "-";
                }
            }, {
                // SRS分发
                data: "11.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["11"], row["streamid"], "11", template);
                    } else
                        return "-";
                }
            }, {
                // HLS切片
                data: "12.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["12"], row["streamid"], "12", template);
                    } else
                        return "-";
                }
            }, {
                // HLS同步
                data: "13.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["13"], row["streamid"], "13", template);
                    } else
                        return "-";
                }
            }, {
                // HLS回放
                data: "14.log_list",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genList(row["14"], row["streamid"], "14", template);
                    } else
                        return "-";
                }
            }, {
                // 移动
                data: "baduser.mobile_cdn",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genCollect(row, "mobile_cdn", "6", templateCollect);
                    } else
                        return "-";
                }
            }, {
                // Flash
                data: "baduser.flash_cdn",
                render: function (data, type, row, meta) {
                    if (data) {
                        return _genCollect(row, "flash_cdn", "7", templateCollect);
                    } else
                        return "-";
                }
            }, {
                // 卡顿用户数
                data: "baduser.user"
            }, {
                // 用户总数
                data: "alluser.user"
            }]
        });

        table.on( 'draw', function (e) {
            monitor_table_event_list_details();
            //monitor_table_event_collect_details();
            monitor_table_event_show_stream();
            //$(e.currentTarget).find(".DTFC_LeftBodyLiner").css("overflow-y", "none");
        });
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
        $(document).on("click", ".link.icon", function() {
            var that = $(this);
            var code = that.attr("data-code"),
                id = that.attr("data-id"),
                k = that.attr("data-k");
            var template;
            var grid = that.parents(".ui.grid");
            if (that.hasClass("history")) { // 历史
                var url = C.url.monitor_stream_query_list_history.replace("{id}", id).replace("{k}", k).replace("{code}", code);
                tool.xhr_get(url, function(data, textStatus, jqXHR) {
                    var axis = [], nums = [];
                    $.each(data, function(k, v) {
                        axis.push(k);
                        nums.push(v);
                    });

                    template = _.template($("#tpl_popup_history").html());
                    var html = template({
                        errorCode: code,
                        activeCode: "最近" + nums.length + "数据",
                        localCode: "-",
                        all: _.reduce(nums, function(memo, num){ return memo + num; }, 0)
                    });
                    grid.find(".vh-error-list-oper-box").html(html);
                    var graph = grid.find(".vh-history-graph");
                    monitor_table_graph(graph[0], axis, nums);
                }, null);
            } else { // 操作
                template = _.template($("#tpl_popup_oper").html());
                html = template({
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
                            tool.xhr_get(url, function(data, textStatus, jqXHR) {
                                $.each(data, function(idx, obj) {
                                    // parse base64
                                    //if ("_m" in obj["attr"]) {
                                        //obj["attr"]["_m"] = tool.base64.decode(obj["attr"]["_m"]);
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
                .modal('setting', 'transition', "fly down")
                .modal('show').modal("refresh");
        });

    }

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

            var url = ["rtmp://", domain, "/vhall/", id];

            // 格式: rtmp://domain/vhall/id
            // http://cn_domain/vhall/id/livestream.m3u8
            // http://cc_domain/vhall/id/index.m3u8
            $(".ui.modal.vh-modal-player")
                .modal({
                    closable: true,
                    onShow: function() {
                        $('.ui.embed').embed({
                            url: encodeURI('./player/srs.html#' + url.join(""))
                        });
                    },
                    onHide: function() {
                        var ifr = $("iframe")[0];
                        ifr.contentWindow.player_stop();
                    }
                })
                .modal('setting', 'transition', "fly down")
                .modal('show').modal("refresh");
        });
    }

    function monitor_table_event_collect_details() {
        var td = $("table.ui.table").find(".vh-error-collect");
        var template = _.template($("#tpl_modal_collect").html());

        td.off("click").on("click", function(e) {
            var that = $(e.currentTarget);
            var selector = ".vh-modal-collect-details";

            $(selector + ".ui.modal")
                .modal({
                    closable: true,
                    onShow: function() {
                        var id = that.attr("data-id");
                        var k = that.attr("data-k");
                        var type = that.attr("data-type");
                        if (id) {
                            var data = streamData[id][k];
                            var bad = data["baduser"][type];
                            var all = data["alluser"][type];
                            var arr = [];
                            var sum = 0, total = 0;
                            $.each(bad, function(k, v) {
                                var o = {};
                                o[k] = v + "/" + all[k];
                                arr.push(o);
                                sum += v;
                                total += all[k];
                            });

                            if (total === 0) { // 没有错误的情况
                                $.each(all, function(k, v) {
                                    total += v;
                                    var o = {};
                                    o[k] = 0 + "/" + v;
                                    arr.push(o);
                                });
                            }

                            $(selector).find(".content").html(template({
                                sum: sum,
                                total: total,
                                items: arr,
                                id: id,
                                k: k
                            }));
                        } else {
                            return false; // 没有streamID 不显示列表
                        }
                    }
                })
                .modal('setting', 'transition', "vertical flip")
                .modal('show').modal("refresh");
        });

    }

    function monitor_table_graph(dom, axis, num) {
        var myChart = echarts.init(dom);

        // 指定图表的配置项和数据
        var option = {
            tooltip: {},
            legend: {},
            xAxis: {
                type: 'category',
                data: axis,
                boundaryGap: true
            },
            yAxis: {
                minInterval: 1
            },
            series: [{
                name: '个数',
                type: 'bar',
                data: num
            }]
        };

        // 使用刚指定的配置项和数据显示图表。
        myChart.setOption(option);
    }

});
