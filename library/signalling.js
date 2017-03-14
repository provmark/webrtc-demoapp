/**
 * Callbacks: events for userJoin, userLeave, userMessage
 * Functions: send a message on event sendMessage
 */

'use strict';

var modCommon = require('./common');

class CsioSignalling {
  constructor() {
    this.socket = null;
    document.addEventListener('sendMessage',
        function(e) {
          this.send(e.detail.userId, e.detail.message);
        }.bind(this),
        false);
  }

  /**
   * Open connection and set hooks for users joining,
   * leaving and incoming message
   */
  start(room) {
    // annouce your presence
    this.socket = io.connect();

    this.socket.on('connect', function(data) {
      console.log('Joining', room);
      modCommon.triggerEvent('localName', {'localname': this.id});
      this.emit('join', room);
    });

    // hear from others
    this.socket.on('join', function(userId) {
      console.log(userId, 'user joining');
      modCommon.triggerEvent('userJoin', {'userId': userId});
    }.bind(this));

    this.socket.on('leave', function(userId) {
      console.log(userId, 'user leaving');
      modCommon.triggerEvent('userLeave', {'userId': userId});
    }.bind(this));

    this.socket.on('message', function(userId, message) {
      modCommon.triggerEvent('userMessage',
          {'userId': userId, 'message': message});
    }.bind(this));
  }

  /**
   * Leaving, tell others
   */
  stop() {
    // server automatically tells others it's leaving
    this.socket.disconnect();
  }

  /**
   * Send a signalling message to another user
   */
  send(to, msg) {
    this.socket.emit('message', to, msg);
  }
}

module.exports.CsioSignalling = CsioSignalling;