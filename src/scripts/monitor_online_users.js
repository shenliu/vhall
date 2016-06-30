/**
 * Created by shen on 2016/6/30.
 *
 * 在线用户
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
        //,"chartheme": "../../node_modules/echarts/theme/dark"
    }
});

require(['jquery', 'semantic', 'underscore',  'echarts', './constant', './tool'],
    function($, semantic, _, E, C, T) {

    var EACH_LINE = 6; // 每行6个
    var MAP = {
        1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
        6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten"
    };

    // init
    $(function() {
        monitor_online_users();
    });

    /**
     *  第一个pie图 总览图 组织数据
     */
    function monitor_online_users() {
        var datas = [];
        T.xhr_get(C.url.monitor_online_users, function(data, textStatus, jqXHR) {
            var cdn = data["cdn"];
            var keys = _.keys(cdn);
            var total = keys.length + 1;

            // 处理全部用户的
            var o = {
                "alluser": data["alluser"],
                "baduser": data["baduser"],
                "name": "全部用户",
                "dom": ".vh-online-users-0"
            };
            datas.push(o);

            $(keys).each(function(idx, elem) {
                o = {
                    "alluser": cdn[elem]["alluser"],
                    "baduser": cdn[elem]["baduser"],
                    "name": elem || "-",
                    "dom": ".vh-online-users-" + (idx + 1)
                };
                datas.push(o);
            });

            var lines = Math.ceil(total / EACH_LINE); // 需要几行 每行6个

            var html = [],
                n = 0;
            for (var i = 0; i < lines; i++) {
                html.push('<div class="' + MAP[EACH_LINE] + ' column row divided">');
                for (var j = 0; j < EACH_LINE; j++) {
                    html.push('<div class="column">');
                    html.push('<h5 class="ui header"></h5>');
                    html.push('<div class="vh-online-users vh-online-users-' + (n++) + '"></div>');
                    html.push('</div>');
                }
                html.push('</div>');
            }
            $(".vh-online-users-box").html(html.join(""));

            $.each(datas, function(k, v) {
                _gen(v);
            });

        }, null);

    }

    function _gen(obj) {
        var alluser = obj["alluser"],
            baduser = obj["baduser"],
            vals = [],
            series = [],
            dom;
        var legend = ["正常用户", "卡顿用户"];

        vals.push({
            name: "正常用户",
            value: alluser - baduser
        });
        vals.push({
            name: "卡顿用户",
            value: baduser
        });

        series.push({
            name: obj["name"],
            type: 'pie',
            radius : '50%',
            center: ['50%', '60%'],
            data: vals,
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        });
        dom = $(obj["dom"]);
        alluser && _graph(dom[0], legend, series);

        dom.prev(".ui.header").html(obj["name"] + " (" + baduser + "/" + alluser + ")"); // h5 标题
    }

    /**
     * 饼状图
     * @param dom
     * @param legend
     * @param series
     */
    function _graph(dom, legend, series) {
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
