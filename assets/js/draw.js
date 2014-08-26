

var main = function(){

    d3.tsv("usstock.tsv", function(raw) {
        draw_heat(raw);
        draw_line(raw);
        draw_hist(raw);
    });

    var draw_heat = function(raw){
        var table = d3.select('#canvas_heat').append('table').attr("class", "htbl"); //tableタグ追加

        var set_color = function(d, i){
            var c = "#fff";
            if (d.value > 0){
                var redScale = d3.scale.linear().domain([0, 16]).range(["#FFF0F5", "#DC143C"]);
                c = redScale(d.value);
            } else if (d.value < 0){
                var blueScale = d3.scale.linear().domain([-16, 0]).range(["#143Cdc", "#F0F5ff"]);
                c = blueScale(d.value);
            }
            return c;
        }
        var td_text = function(d,i){
            //return d.value;
            if (i==0){
                return d.value;
            } else {
                return '';
            }
        }

        var headerKyes = d3.map(raw[0]).keys(); //ヘッダー用にkeyを取得
        
        table.append('thead')
            .append('tr')
            .selectAll('th') 
            .data(headerKyes) 
            .enter()
            .append('th')    //thタグ追加
            .html(function(key){return key.replace(/\//,'<br />')});
        
        var tbody = table.append('tbody'); //tbodyタグ追加
        tbody.selectAll('tr')
            .data(raw)
            .enter()
            .append('tr')    //trタグ追加
                .selectAll('td')
                .data(function (row) { return d3.entries(row) }) //rowオブジェクトを配列へ変換
                .enter()
                .append('td')    //tdタグ追加   
                //.style("background-color", function(){return '#a77'})
                //.text(function(d,i){ return d.value })
                .style("background-color", set_color)
                .text(td_text)
                
    }

    var draw_line = function(raw){
        var L = (function(){
            var margin = {top: 20, right: 100, bottom: 30, left: 50},
                width = 1000 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var format = d3.time.format("%m/%d");
            var start = format.parse("05/22");
            var end = format.parse("08/22");
            var range = d3.time.days(start,end);

            var x = d3.time.scale()
                .range([0,width])
                .domain([start,end]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = function(i) {
              return d3.hcl(48*i,95,45).toString();
            };

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var line = d3.svg.line()
                .interpolate("basis")
                .defined(function(d) { return d != null; })
                .x(function(d,i) { return x(range[i]); })
                .y(function(d) { return y(d); });

            var svg = d3.select("#canvas_line").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            return {margin:margin, width:width, height:height, format:format
                , start:start, end:end, range:range 
                ,x:x, y:y, color:color
                ,xAxis:xAxis, yAxis:yAxis, line:line, svg:svg
            };
        }());

          var data = [];
          //var goods = _(raw).pluck("Name");
          var goods = _(raw).pluck("date");
          //console.log(goods)

          _(raw).each(function(series) {
            var value = {};
            data.push({
              //id: series["Series ID"],
              //name: series["Name"],
              name: series["date"],
              values: _(L.range).map(function(month) {
                        return parseFloat(series[L.format(month)]) || null;
                      })
            });
          });

          //var values = _(data).chain().pluck('values').flatten().value();
          L.y.domain([
            //0,
            //d3.max(values)
            -11,
            11
          ]);


          L.svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + L.height + ")")
              .call(L.xAxis);

          L.svg.append("g")
              .attr("class", "y axis")
              .call(L.yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .style("font-weight", "bold")
              //.text("Average Price");
              .text("Change rate");

          var series = L.svg.selectAll(".series")
              .data(data)
            .enter().append("g")
              .attr("class", "series");

          series.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return L.line(d.values); })
              .style("stroke", function(d,i) { return L.color(i); });

          series.append("path")
              .attr("class", "invisible hover")
              .attr("d", function(d) { return L.line(d.values); });

          series.append("text")
              .attr("class", "label hover")
              .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
              .attr("transform", function(d) { return "translate(" + L.x(L.end) + "," + L.y(d.value) + ")"; })
              .attr("x", 3)
              .attr("dy", ".35em")
              .style("fill", function(d,i) { return L.color(i); })
              .text(function(d) { return d.name; });

          series.selectAll(".hover")
              .on("mouseover", function(d,i) {
                d3.selectAll(".line")
                  .style("opacity", 0.12)
                  .filter(function(p) { return p.name == d.name; })
                  .style("opacity", 1)
                  .style("stroke-width", 2.5);
                d3.selectAll(".series text")
                  .style("opacity", 0)
                  .filter(function(p) { return p.name == d.name; })
                  .style("opacity", 1);
              })
              .on("mouseout", function(d,i) {
                d3.selectAll(".line")
                  .style("opacity", 1)
                  .style("stroke-width", null);
                d3.selectAll(".series text")
                  .style("opacity", 1);
              });

    }  // draw_line()

    var draw_hist = function(raw){
        var vals = _.values(raw[0]);
        vals = _.rest(vals);
        //console.log(vals);

        var values = _.map(vals, function(v){return Math.abs(v)});
        //var values = _.map(vals, function(v){return parseFloat(v)});
        ////console.log(values);
        //console.log(_.values(raw[0]));

        // A formatter for counts.
        var formatCount = d3.format(",.0f");

        var margin = {top: 10, right: 30, bottom: 30, left: 30},
            //width = 960 - margin.left - margin.right,
            //height = 500 - margin.top - margin.bottom;
            width = 330 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        var x = d3.scale.linear()
            //.domain([0, 1])
            .domain([0, 10])
            .range([0, width]);

        // Generate a histogram using twenty uniformly-spaced bins.
        var data = d3.layout.histogram()
            .bins(x.ticks(20))
            (values);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y; })])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        //var svg = d3.select("body").append("svg")
        var svg = d3.select("#canvas_hist").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var bar = svg.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function(d) { return height - y(d.y); });

        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) / 2)
            .attr("text-anchor", "middle")
            .text(function(d) { return formatCount(d.y); });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

    } // hist

} // main
