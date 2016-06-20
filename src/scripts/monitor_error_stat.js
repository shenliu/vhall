/**
 * Created by shen on 2016/6/12.
 *
 * 错误统计页面js
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
        "underscore": "../../node_modules/underscore/underscore-min",
        "echarts": "../../node_modules/echarts/dist/echarts.min"
    }
});

require(['jquery', 'semantic', 'underscore',  'echarts', './constant', './tool'],
    function($, semantic, _, E, C, T) {

    var errorStatData = {}; // {"17:52:00": {"1": {"14001": 32}}}

    var curModule; // 当前点击饼图后的模块id

    // init
    $(function() {
        monitor_error_overview();
    });

    /**
     *  第一个柱状图 总览图 组织数据
     */
    function monitor_error_overview() {
        var _datas = {};
        T.xhr_get(C.url.monitor_error_stat_overview, function(data, textStatus, jqXHR) {
            $(data).each(function(idx, elem) {
                $.each(elem, function(k, v) { // k: "17:52:00" v: {"1": {"14001": 32}}
                    errorStatData[k] = v; // 储存数据 用在饼图上
                    $.each(v, function(x, y) { // x: "1" y: {"14001": 32}
                        var sum = _.reduce(_.values(y), function(memo, num){ return memo + num; }, 0);
                        if (!(x in _datas)) {
                            _datas[x] = [];
                        }
                        _datas[x].push(sum);
                    });
                });
            });
            var series = [];
            $.each(_datas, function(k, v) {
                series.push({
                    name: C.modules[k],
                    type: "bar",
                    stack: '总量',
                    data: v
                });
            });
            var legend = _.map(_.keys(_datas), function(i) {
                return C.modules[i];
            });
            var dom = $(".vh-error-stat-overview")[0];
            var axis = _.keys(errorStatData);

            monitor_error_overview_graph(dom, axis, legend, series, monitor_error_overview_event);
        }, null);

    }

    /**
     *  第一个柱状图 总览图
     */
    function monitor_error_overview_graph(dom, axis, legend, series, doEvent) {
        var myChart = E.init(dom);

        var option = {
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: legend,
                x: "right"
            },
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

        doEvent && doEvent(myChart);
    }

    /**
     * 总览图 点击事件
     * @param myChart
     */
    function monitor_error_overview_event(myChart) {
        myChart.on("click", function(params) {
            var time = params.name;
            var data = errorStatData[time];
            // data -> {1: {14002: 29, ...}, 2: Object, 11: Object, 12: Object, 13: Object, 14: Object, 20: Object}
            $.each(data, function(k, v) { // k: 1, 2, 11, 12, ... v: {14002: 29, ...}
                var name = C.modules[k];
                var legend = [], vals = [], series = [];
                $.each(v, function(i, j) { // i: 14002  j: 29
                    var _s = i + " " + C.message[i];
                    legend.push(_s);
                    vals.push({
                        value: j,
                        name: _s
                    });
                });

                series.push({
                    name: name,
                    type: 'pie',
                    radius : '50%',
                    center: ['50%', '75%'],
                    data: vals,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                });

                $(".vh-error-stat-header-pie").html(time + "数据");

                var dom = $('.vh-error-stat-modules-' + k)[0];
                var instance = E.getInstanceByDom(dom);
                if (instance) {
                    instance.dispose();
                }

                monitor_error_modules_graph(dom, legend, series);
            });

            // 删除第二个柱状图
            var instance = E.getInstanceByDom($(".vh-error-stat-host")[0]);
            if (instance) {
                instance.dispose();
                $(".vh-error-stat-header-col").empty();
            }
        });
    }

    /**
     * 七个饼状图
     * @param dom
     * @param legend
     * @param series
     */
    function monitor_error_modules_graph(dom, legend, series) {
        var myChart = E.init(dom);

        var option = {
            tooltip : {
                trigger: 'item',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                data: legend
            },
            series: series
        };
        myChart.setOption(option);

        monitor_error_modules_event(myChart);
    }

    /**
     * 饼状图点击事件
     * @param myChart
     */
    function monitor_error_modules_event(myChart) {
        myChart.on("click", function(params) {
            var module = params.seriesName; // module
            var name = params.name;
            var code = name.split(" ")[0]; // 要显示的错误代码
            var times = []; // 时间轴
            var data = []; // 只保留要显示的错误代码的数组 [{"09:10:50": {"xxx.vhall.com": 2, ...}}, ...]
            T.xhr_get(C.url.monitor_error_stat_host, function(_data, textStatus, jqXHR) {
                // 找出code在每个时间的数据 其余错误代码忽略
                // _data -> [{"09:10:50": {"14002": {"xxx.vhall.com": 2, ...}, ...}}, {...}, ...]
                $(_data).each(function(idx, elem) { // idx: 0, 1, 2 ...  elem: {"09:10:50": {"14002": {"xxx.vhall.com": 2, ...}, ...}}
                    var key = _.keys(elem); // key: ["09:10:50"]
                    var obj = elem[key[0]]; // obj: {"14002": {"xxx.vhall.com": 2, ...}, ...}
                    //times.push(key[0]);
                    var o = obj[code]; // o: {"xxx.vhall.com": 2, ...}
                    if (o) {
                        var _o = {};
                        _o[key] = o;
                        data.push(_o);
                    }
                });

                // 找出所有可能的主机
                var hosts = []; // 所有可能的主机

                // data -> [{"09:10:50": {"xxx.vhall.com": 2, ...}}, ...]
                $(data).each(function (idx, elem) { // idx: 0, 1, 2 ... elem: {"09:10:50": {"xxx.vhall.com": 2, ...}}
                    var key = _.keys(elem)[0];
                    times.push(key);
                    $.each(elem[key], function(k, v) { // elem[key]: {"xxx.vhall.com": 2, ...}
                        if (_.indexOf(hosts, k) === -1) {
                            hosts.push(k);
                        }
                    });
                });

                var hostNumber = {}; // 各个主机按时间的错误数 {"xxx.vhall.com": [2, 0, 5, ...], ...}

                $(data).each(function (idx, elem) { // idx: 0, 1, 2 ... elem: {"09:10:50": {"xxx.vhall.com": 2, ...}}
                    var key = _.keys(elem)[0];
                    var o = elem[key]; // o: {"xxx.vhall.com": 2, ...}
                    $(hosts).each(function(i, item) {
                        if (!(item in hostNumber)) {
                            hostNumber[item] = [];
                        }
                        hostNumber[item].push(o[item] || 0);
                    });
                });

                var legend = _.keys(hostNumber);
                var series = [];

                $.each(legend, function(i, o) {
                    series.push({
                        name: legend[i],
                        type: "bar",
                        stack: '总量',
                        data: hostNumber[o]
                    });
                });

                $(".vh-error-stat-header-col").html(code + ": " + C.message[code]);

                var dom = $(".vh-error-stat-host")[0];

                // 销毁上一个图型
                var instance = E.getInstanceByDom(dom);
                if (instance) {
                    instance.dispose();
                }
                
                curModule = _.invert(C.modules)[module]; // 当前的模块id
                monitor_error_overview_graph(dom, times, legend, series, monitor_error_host_event);
            }, null);
        });
    }

    function monitor_error_host_event(myChart) {
        myChart.on("click", function(params) {
            var host = params.seriesName; // 主机名

            var url = C.pages.log_search;
            var p = {
                host: host,
                module: curModule
            };
            url += "?" + $.param(p);

            $(".ui.modal.vh-modal-log_search")
                .modal({
                    closable: false,
                    onShow: function() {
                        $('.ui.embed').embed({
                            url: encodeURI(url)
                        });
                    },
                    onVisible: function() {
                        var ifr = $("iframe");
                        var doc = $(ifr[0].contentWindow.document);
                        if (doc.length) {
                            doc.find("html").css("overflow", "auto");
                            doc.find(".vh-main-header").remove();
                            doc.find("h2.ui.header.vh-table").remove();
                        }
                    },
                    onHide: function() {
                        $('.ui.embed').find(".embed").remove();
                    }
                })
                .modal('setting', 'transition', "swing right")
                .modal('show').modal("refresh");

            //window.open(encodeURI(url), "_blank");
        });
    }
});
