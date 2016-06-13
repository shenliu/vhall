/**
 * Created by shen on 2016/6/12.
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

    // init
    $(function() {
        monitor_error_overview();
    });

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
            var legend = _.keys(_datas);
            var dom = $(".vh-error-stat-overview")[0];
            var axis = _.keys(errorStatData);

            monitor_error_overview_graph(dom, axis, legend, series);
        }, null);

    }

    function monitor_error_overview_graph(dom, axis, legend, series) {
        var myChart = E.init(dom);

        var option = {
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: legend,
                x: 'right'
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

        monitor_error_overview_event(myChart);
    }

    /**
     * 总览图 点击事件
     * @param myChart
     */
    function monitor_error_overview_event(myChart) {
        myChart.on("click", function(params) {
            var time = params.name;
            var data = errorStatData[time];
            $.each(data, function(k, v) { // {1: {14002: 29, ...}, 2: Object, 11: Object, 12: Object, 13: Object, 14: Object, 20: Object}
                var name = C.modules[k];
                var legend = [], vals = [], series = [];
                $.each(v, function(i, j) { // i: "1"  j: {14002: 29, ...}
                    legend.push(C.message[i]);
                    vals.push({
                        value: j,
                        name: C.message[i]
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

                });

                var dom = $('.vh-error-stat-modules-' + k)[0];
                var instance = E.getInstanceByDom(dom);
                if (instance) {
                    console.log(instance, k);
                    instance.dispose();
                }
                monitor_error_modules_graph(dom, legend, series);
            });
        });
    }

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
    }

});
