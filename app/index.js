/*
 * Sequence of initialization:
 *  show popup for room name
 *  popup OK -> init CsioWebrtcApp
 *  CsioWebrtcApp emit localName -> init callstats
 *  callstats callback csInitCallback -> initLocalMedia
 */

'use strict';

// HTTP elements
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
var roomInput = document.getElementById('roomInput');
var localVideo = document.getElementById('localVideo');

var popup = document.getElementById('popup');
var popupCloseButton = document.getElementById('popupCloseButton');
var popupError = document.getElementById('popupError');

// parse URL for room name
var urlRoom = window.location.pathname.split('/')[1];
if (urlRoom !== '') {
  roomInput.value = decodeURI(urlRoom);
}
// update url for easy distribution
roomInput.onchange = function() {
  var room = roomInput.value;
  history.replaceState({'room': room} /* state object */,
                       'Room ' + room /* title */,
                       room /* URL */);
};

// callstats
var callstats = new callstats();

var appConfig = new AppConfiguration();
var AppID = appConfig.appId;
var AppSecret = appConfig.appSecret;
var localUserId = '';
var roomName = '';

function csInitCallback(csError, csErrMsg) {
  console.log('Status: errCode= ' + csError + ' errMsg= ' + csErrMsg);
  initLocalMedia();
}
var reportType = {
  inbound: 'inbound',
  outbound: 'outbound'
};
var csStatsCallback = function(stats) {
  var ssrc;
  for (ssrc in stats.streams) {
    console.log('SSRC is: ', ssrc);
    var dataSsrc = stats.streams[ssrc];
    console.log('SSRC Type ', dataSsrc.reportType);
    if (dataSsrc.reportType === reportType.outbound) {
      console.log('RTT is: ', dataSsrc.rtt);
    } else if (dataSsrc.reportType === reportType.inbound) {
      console.log('Inbound loss rate is: ', dataSsrc.fractionLoss);
    }
  }
};
var configParams = {
  disableBeforeUnloadHandler: false,
  applicationVersion: 'v1.0'
};

// This event is triggered by CsioWebrtcApp when the name is available
// from the server
document.addEventListener('localName',
    function(e) {
      localUserId = e.detail.localname;
      console.log('Initialize callstats', localUserId);
      callstats.initialize(AppID, AppSecret, localUserId, csInitCallback,
          csStatsCallback, configParams);
    },
    false);

function pcCallback(err, msg) {
  console.log('Monitoring status: '+ err + ' msg: ' + msg);
}
document.addEventListener('newPeerConnection',
    function(e) {
      var pcObject = e.detail.pc;
      var remoteUserID = e.detail.userId;
      var usage = callstats.fabricUsage.multiplex;
      callstats.addNewFabric(pcObject, remoteUserID, usage,
          roomName, pcCallback);
    },
    false);

document.addEventListener('createOfferError',
    function(e) {
      var pcObject = e.detail.pc;
      var err = e.detail.error;
      callstats.reportError(pcObject, roomName,
          callstats.webRTCFunctions.createOffer, err);
    },
    false);


// library
var lib;

// When the user clicks 'OK', room name should be available
popupCloseButton.onclick = function() {
  roomName = roomInput.value;
  if (roomName !== '') {
    console.log('init webRTC app');
    lib = new CsioWebrtcApp();
    popup.style.display = 'none';
  } else {
    popupError.innerHTML = 'Please provide a room name!';
  }
};

// handle video add/remove provided by library
document.addEventListener('addRemoteVideo',
    function(e) {
      var pc = e.detail.pc;
      var remoteUserId = e.detail.userId;
      addRemoteVideo(remoteUserId, e.detail.stream);

      // associate SSRCs
      var ssrcs = [];
      var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
      var reg = /^ssrc:(\d*) ([\w_]*):(.*)/;
      pc.remoteDescription.sdp.split(/(\r\n|\r|\n)/).filter(validLine)
      .forEach(function(l) {
        var type = l[0];
        var content = l.slice(2);
        if (type === 'a') {
          if (reg.test(content)) {
            var match = content.match(reg);
            if (!(match[1] in ssrcs)) {
              ssrcs.push(match[1]);
            }
          }
        }
      });
      for (var ssrc in ssrcs) {
        callstats.associateMstWithUserID(pc, remoteUserId, roomName, ssrc,
            'camera', 'video_'+remoteUserId);
      }
    },
    false);
function addRemoteVideo(userId,stream) {
  var v;
  if ((v = document.getElementById(userId)) === null) {
    v = document.createElement('video');
    v.id = userId;
    v.width = 320;
    v.height = 240;
    v.autoplay = true;
    v.style = 'transform: scaleX(-1)'; // flip video

    document.getElementById('remoteVideos').append(v);
  }
  v.srcObject = stream;
}

document.addEventListener('removeRemoteVideo',
    function(e) {
      removeRemoteVideo(e.detail.userId);
    },
    false);
function removeRemoteVideo(userId) {
  var v = document.getElementById(userId);
  if (v !== null) {
    document.getElementById(userId).remove();
  }
}

// startup settings
callButton.disabled = true;
hangupButton.disabled = true;

// Initialize (local media)
function initLocalMedia() {
  console.log('Requesting local stream');
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(function(stream) {
    console.log('Received local stream');
    localVideo.srcObject = stream;
    window.localStream = stream;
    callButton.disabled = false;
  })
  .catch(function(e) {
    console.log('getUserMedia() error: ', e);
    callstats.reportError(null, roomName,
        callstats.webRTCFunctions.getUserMedia, e);
  });
}

// assign functions to buttons
callButton.onclick = function() {
  callButton.disabled = true;
  roomInput.disabled = true;
  hangupButton.disabled = false;
  lib.call(roomName);
};

hangupButton.onclick = function() {
  hangupButton.disabled = true;
  roomInput.disabled = false;
  callButton.disabled = false;
  lib.hangup();

  popup.style.display = 'block';
};
