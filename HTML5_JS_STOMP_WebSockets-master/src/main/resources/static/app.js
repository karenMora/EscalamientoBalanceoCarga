var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var id = 0;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    var addPolygonToCanvas = function (points) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.fillStyle= '#01DFA5' ;
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
            if (i === 0) {
                ctx.moveTo(points[i].x, points[i].y);
            }
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        //canvas.width="800";
    };

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };
    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint.' + id, function (eventbody) {
                addPointToCanvas(JSON.parse(eventbody.body));
            });
            stompClient.subscribe('/topic/newpolygon.' + id, function (eventbody) {
                addPolygonToCanvas(JSON.parse(eventbody.body));
            });

        });
    };

    return {
        
        conectar: function (solicitud) {
            id = solicitud;
            connectAndSubscribe();
        },
        
        init: function () {
            var can = document.getElementById("canvas");
            if (window.PointerEvent) {
                can.addEventListener("pointerdown", function (event) {
                    app.publishPoint(getMousePosition(event).x, getMousePosition(event).y);
                });
            } else {
                can.addEventListener("mousedown", function (event) {
                    app.publishPoint(getMousePosition(event).x, getMousePosition(event).y);
                }
                );
            }
        },

        publishPoint: function (px, py) {
            //x = (document.getElementById("x")).value;
            //y = (document.getElementById("y")).value;
            var pt = new Point(px, py);
            console.info("publishing point at " + pt.value);
            // alert("X: " + x + " Y: " + y);
            //addPointToCanvas(pt);
            stompClient.send("/app/newpoint." + id, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };
})();