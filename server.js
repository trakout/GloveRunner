var fs = require('fs')
,http = require('http'),
socketio = require('socket.io'),
url = require("url"), 
SerialPort = require("serialport").SerialPort;

var shell = require('shelljs'), shellArr, shellArrLen;

var Leap = require('leapjs'),
leapCtrl = new Leap.Controller(),
hand, leapBoxX, leapBoxY, leapX, leapY;

var windowX = 1440, 
windowY= 900;

var isFPSDemo = false;

// leap
leapCtrl.on( 'frame' , function(frame){
    
    hand = frame.hands[0];


    if (hand !== undefined) {
        socketServer.emit('leapState', true);
        leapBoxX = frame.interactionBox['width'];
        leapBoxY = frame.interactionBox['height'];

        var leapBoxTop = ((frame.interactionBox['center'][1]) + (frame.interactionBox['height'] / 2));
        var leapBoxLeft = (frame.interactionBox['center'][0] - (frame.interactionBox['width'] / 2));

        leapX = (hand.palmPosition[0] - leapBoxLeft);
        leapY = (hand.palmPosition[1] - leapBoxTop);

        leapX = Math.floor((leapX / frame.interactionBox['width']) * windowX);
        leapY = Math.floor((leapY / frame.interactionBox['height']) * windowY * -1);

        if (leapX < 0) {
            leapX = 0;
        }
        if (leapY < 0) {
            leapY = 0;
        }


        var sensitivity = 25; // lower int for less sensitivity
        var x = parseInt((leapX-(windowX/2))/sensitivity);
        var y = parseInt((leapY-(windowY/2))/sensitivity);

        if (x >= 0) {
            x = '+' + x.toString();
        } else {
            x = x.toString();
        }

        if (y >= 0) {
            y = '+' + y.toString();
        } else {
            y = y.toString();
        }
        // console.log((parseInt(( leapX-(1440/2)) / 10) ) .toString()+' '+(parseInt( (leapY-(900/2) )/10 ) ).toString());
        // console.log('cliclick m:"'+x +', '+y+'"');
        
        if (isFPSDemo) {
            shell.exec('cliclick m:"'+x+','+y+'"', {async:true});    
        } else {
            socketServer.emit('updateLeap', {x:(leapX - 25), y:(leapY - 115)});
            shell.exec('cliclick m:"' + leapX + ','+ leapY + '"', {async:true});
        }

        // shell.exec('cliclick m:"' + leapX + ', '+ leapY + '"', {async:true});
       

    } else { socketServer.emit('leapState', false); }
}).on( 'deviceConnected' , function() {
    socketServer.emit('leapState', true);
}).on( 'deviceDisconnected' , function() {
    socketServer.emit('leapState', false);
}).on( 'ready' , function(){
    socketServer.emit('leapState', false);
});



// var HID = require('node-hid');
// var devices = HID.devices();
// var keyboard = new HID.HID('USB_05ac_0262_1d182000');

var socketServer;
var serialPort;
// var portName = '/dev/tty.usbserial-A6008m1K'; // jason
var portName = '/dev/tty.usbmodem1421'; // seb & Travis
var sendData = "";
var receivedData = "";

var THUMB_STRAIGHT = 0;
var THUMB_BENT = 1;
var INDEX_STRAIGHT = 2;
var INDEX_BENT = 3;
var MIDDLE_STRAIGHT = 4;
var MIDDLE_BENT = 5;
var RING_STRAIGHT = 6;
var RING_BENT = 7;
var PINKY_STRAIGHT = 8;
var PINKY_BENT = 9;
var PALM_Y_UP = 10;
var PALM_Y_FLAT = 11;
var PALM_Y_DOWN = 12;
var PALM_X_LEFT = 13;
var PALM_X_DOWN = 14;
var PALM_X_RIGHT = 15;
var PALM_Z_LEFT = 13;
var PALM_Z_MIDDLE = 14;
var PALM_Z_RIGHT = 15;

var THUMB_STATE = -10;
var INDEX_STATE = -10;
var MIDDLE_STATE = -10;
var RING_STATE = -10;
var PINKY_STATE = -10;
var PALM_Y_STATE = -10;
var PALM_X_STATE = -10;
var PALM_Z_STATE = -10;

var OPEN_GESTURE = 0;
var OK_GESTURE = 1;
var MIDDLE_FINGER_GESTURE = 2;
var ROCK_ON_GESTURE = 3;
var POINT_GESTURE = 4;
var FIST_GESTURE = 5;
var GUN_GESTURE = 6;
var THUMBS_UP_GESTURE = 7;
var CURRENT_GESTURE = OPEN_GESTURE;

var KEY_MAP = {
    OPEN_GESTURE: [],
    OK_GESTURE: [],
    MIDDLE_FINGER_GESTURE: [],
    ROCK_ON_GESTURE: [],
    POINT_GESTURE: [],
    FIST_GESTURE: []
};




// handle contains locations to browse to (vote and poll); pathnames.
function startServer(route,handle,debug)
{
    // on request event
    function onRequest(request, response) {
        // parse the requested url into pathname. pathname will be compared
        // in route.js to handle (var content), if it matches the a page will 
        // come up. Otherwise a 404 will be given. 
        var pathname = url.parse(request.url).pathname; 
        console.log("Request for " + pathname + " received");
        var content = route(handle,pathname,response,request,debug);
    }
    
    var httpServer = http.createServer(onRequest).listen(1200, function(){
        console.log("Listening at: http://localhost:1200");
        console.log("Server is up");

        leapCtrl.connect();
        // testing NativeControl()
        // var testArr = [];
        // testArr[0] = 'cmd';
        // testArr[1] = 'v';
        // NativeControl(testArr, testArr.length);

    }); 

    // UNCOMMENT THIS TO USE THE ARDUINO STUFF
    // serialListener(debug);
    initSocketIO(httpServer,debug);
}

function NativeControl(shellArr) {

    console.log(shellArr.length);
    switch (shellArr.length) {
        case 0:
            return;
            break;
        case 1:
            console.log(shellArr[0]);
            // Check for mouse clicks
            if (shellArr[0] == 'lClick') {
                shell.exec('cliclick c:"+0,+0"', {async:true});
            } else if (shellArr[0] == 'lClickHold') {
                console.log('hold');
                shell.exec('cliclick ch:"+0,+0"', {async:true});
            } else if (shellArr[0] == 'lClickRelease') {
                shell.exec('cliclick cr:"+0,+0"', {async:true});
            } else {

                // Not mouse click
                shell.exec('cliclick kp:"' + shellArr[0] + '"', {async:true});    
            }
            break;
        case 2: // 2-key shortCut
            shell.exec('cliclick kd:"' + shellArr[0] + '" kp:"' + shellArr[1] + '" ku:"' + shellArr[0] + '"', {async:true}); 
            break;
        default:
            break;
    }

    // shell.exec('cliclick w:"3000" kd:"ctrl" kp:"c" ku:"ctrl"', {async:true});
    // click & hold: 'cliclick w:5000 ch:+0,+0 w:1000 cr:+0,+0'
    
}

function initSocketIO(httpServer,debug)
{
    socketServer = socketio.listen(httpServer);
    if(debug == false){
        socketServer.set('log level', 1); // socket IO debug off
    }
    socketServer.on('connection', function (socket) {
        console.log("user connected");
        socket.emit('onconnection', {pollOneValue:sendData});
    
        socketServer.on('update', function(data) {
            socket.emit('updateData',data);
        });

        socket.on('mapGesture', function(data) {
            // console.log(exec('cliclick w:"3000" kp:"tab"'));
            KEY_MAP[data.gesture] = data.keys;
            console.log(KEY_MAP[data.gesture]);
        });

        socket.on('switchedToFPS', function(data) {
            // console.log(exec('cliclick w:"3000" kp:"tab"'));
            console.log(data);
            isFPSDemo = data;
        });

        socketServer.on('updateGesture', function(data) {
            socket.emit('updateGesture',data);
        });

        socketServer.on('updateLeap', function(data) {
            socket.emit('updateLeap', data);
        }).on('leapState', function(data) {
            socket.emit('leapState', data);
        });

    });
}

function simulateKeyPress(gesture)
{
    socketServer.emit('updateGesture', gesture);
    console.log(KEY_MAP[gesture]);

    NativeControl(KEY_MAP[gesture]);
}

function findGesture()
{
    // Open
    if (CURRENT_GESTURE != OPEN_GESTURE && THUMB_STATE == THUMB_STRAIGHT && INDEX_STATE == INDEX_STRAIGHT && MIDDLE_STATE == MIDDLE_STRAIGHT && RING_STATE == RING_STRAIGHT && PINKY_STATE == PINKY_STRAIGHT) {
        CURRENT_GESTURE = OPEN_GESTURE;
        simulateKeyPress('OPEN_GESTURE');
        // console.log('OPEN');
        socketServer.emit('updateGesture', 'OPEN_GESTURE');
    } else if (CURRENT_GESTURE != OK_GESTURE && THUMB_STATE == THUMB_BENT && INDEX_STATE == INDEX_BENT && MIDDLE_STATE == MIDDLE_STRAIGHT && RING_STATE == RING_STRAIGHT && PINKY_STATE == PINKY_STRAIGHT) {
        CURRENT_GESTURE = OK_GESTURE;
        simulateKeyPress('OK_GESTURE');
        // console.log('OK');
    } else if (CURRENT_GESTURE != MIDDLE_FINGER_GESTURE && THUMB_STATE == THUMB_BENT && INDEX_STATE == INDEX_BENT && MIDDLE_STATE == MIDDLE_STRAIGHT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_BENT) {
        CURRENT_GESTURE = MIDDLE_FINGER_GESTURE;
        simulateKeyPress('MIDDLE_FINGER_GESTURE');
        // console.log('CENSORED');
    } else if (CURRENT_GESTURE != ROCK_ON_GESTURE && THUMB_STATE == THUMB_STRAIGHT && INDEX_STATE == INDEX_STRAIGHT && MIDDLE_STATE == MIDDLE_BENT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_STRAIGHT) {
        CURRENT_GESTURE = ROCK_ON_GESTURE;
        simulateKeyPress('ROCK_ON_GESTURE');
        // console.log('ROCK ON');
    } else if (CURRENT_GESTURE != POINT_GESTURE  && THUMB_STATE == THUMB_BENT && INDEX_STATE == INDEX_STRAIGHT && MIDDLE_STATE == MIDDLE_BENT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_BENT) {
        CURRENT_GESTURE = POINT_GESTURE;
        simulateKeyPress('POINT_GESTURE');
        // console.log('POINT');
    } else if (CURRENT_GESTURE != FIST_GESTURE  && THUMB_STATE == THUMB_BENT && INDEX_STATE == INDEX_BENT && MIDDLE_STATE == MIDDLE_BENT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_BENT) {
        CURRENT_GESTURE = FIST_GESTURE;
        simulateKeyPress('FIST_GESTURE');
        // console.log('FIST');
    } else if (CURRENT_GESTURE != GUN_GESTURE  && THUMB_STATE == THUMB_STRAIGHT && INDEX_STATE == INDEX_STRAIGHT && MIDDLE_STATE == MIDDLE_BENT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_BENT) {
        CURRENT_GESTURE = GUN_GESTURE;
        simulateKeyPress('FIST_GESTURE');
        // console.log('FIST');
    } else if (CURRENT_GESTURE != THUMBS_UP_GESTURE  && THUMB_STATE == THUMB_STRAIGHT && INDEX_STATE == INDEX_BENT && MIDDLE_STATE == MIDDLE_BENT && RING_STATE == RING_BENT && PINKY_STATE == PINKY_BENT) {
        CURRENT_GESTURE = THUMBS_UP_GESTURE;
        simulateKeyPress('THUMBS_UP_GESTURE');
        // console.log('FIST');
    }
}

function processPacket(packet)
{
    var data = packet.split(':');

    // Remove the start and end delimiters 's' and 'e'
    data.shift();
    data.pop();

    // This is for debug only
    var state = '';
    
    if (data.length == 8) {

        // console.log(packet);
        socketServer.emit('update', data);

        if (data[0] > 30) {
            THUMB_STATE = THUMB_STRAIGHT;
            state += '0 ';
        } else {
            THUMB_STATE = THUMB_BENT;
            state += '1 ';
        }

        if (data[1] > 30) {
            INDEX_STATE = INDEX_STRAIGHT;
            state += '0 ';
        } else {
            INDEX_STATE = INDEX_BENT;
            state += '1 ';
        }

        if (data[2] > 30) {
            MIDDLE_STATE = MIDDLE_STRAIGHT;
            state += '0 ';
        } else {
            MIDDLE_STATE = MIDDLE_BENT;
            state += '1 ';
        }

        if (data[3] > 30) {
            RING_STATE = RING_STRAIGHT;
            state += '0 ';
        } else {
            RING_STATE = RING_BENT;
            state += '1 ';
        }

        if (data[4] > 30) {
            PINKY_STATE = PINKY_STRAIGHT;
            state += '0 ';
        } else {
            PINKY_STATE = PINKY_BENT;
            state += '1 ';
        }

        if (data[5] > 25) {
            PALM_Y_STATE = PALM_Y_UP;
            state += '1 ';
        } else if (data[5] > -25) {
            PALM_Y_STATE = PALM_Y_FLAT;
            state += '0 ';
        } else {
            PALM_Y_STATE = PALM_Y_DOWN;
            state += '-1 ';
        }

        if (data[6] > 25) {
            PALM_X_STATE = PALM_X_LEFT;
            state += '1 ';
        } else if (data[6] > -25) {
            PALM_X_STATE = PALM_X_DOWN;
            state += '0 ';
        } else {
            PALM_X_STATE = PALM_X_RIGHT;
            state += '-1 ';
        }

        if (data[7] > 25) {
            PALM_Z_STATE = PALM_Z_LEFT;
            state += '1 ';
        } else if (data[7] > -25) {
            PALM_Z_STATE = PALM_Z_MIDDLE;
            state += '0 ';
        } else {
            PALM_Z_STATE = PALM_Z_RIGHT;
            state += '-1 ';
        }

        // console.log(state);
        findGesture();
    }
}

function findPackets()
{
    var currentPacket = '';
    var lastPacketIdx = 0;
    var foundStart = false;
    for (var i=0; i<receivedData.length; ++i) {

        if (receivedData[i] == 's') {

            // Found the start character
            currentPacket = receivedData[i];
            foundStart = true;

        } else if (foundStart && receivedData[i] == 'e') {

            // Found the end character
            currentPacket += receivedData[i];
            processPacket(currentPacket);
            lastPacketIdx = i;
            foundStart = false;
            currentPacket = '';

        } else if (foundStart) {

            // Add characters to current packet
            currentPacket += receivedData[i];

        } else {

            // Bad characters
            lastPacketIdx = i;
        }
    }

    // Removed the packets from received data that were processed
    receivedData = receivedData.slice(lastPacketIdx, receivedData.length+1);
}

// Listen to serial port
function serialListener(debug)
{
    serialPort = new SerialPort(portName, {
        baudrate: 9600,
        // defaults for Arduino serial communication
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: true
    });
 
    serialPort.on("open", function () {
        console.log('open serial communication');
        
        // Listens to incoming data
        serialPort.on('data', function(data) {

            receivedData += data.toString();
            findPackets();
      });  
    });  
}

exports.start = startServer;