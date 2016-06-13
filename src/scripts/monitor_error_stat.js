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

                var series = [], legend = [];
                $.each(_datas, function(k, v) {
                    legend.push(C.modules[k]);
                    series.push({
                        name: C.modules[k],
                        type: "bar",
                        stack: '总量',
                        data: v
                    });
                });
                
                var dom = $(".vh-error-stat-overview")[0];
                var axis = _.keys(errorStatData);

                monitor_error_overview_graph(dom, axis, legend, series);
            });
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
});
