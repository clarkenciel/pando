var m = require('../mithril/mithril');
var Touch = require('../mithril-touch/mithril-touch');
var common = require('./common');
var exports = module.exports = {};

exports.renderMessage = function (thisUser, roomName) {
  return function (message) {
    var userDiv, messageUser = message.userName;

    if (thisUser == messageUser)
      userDiv = m("div.message.username.medium_text.this_user", messageUser + ":");
    else if (roomName == messageUser)
      userDiv = m("div.message.username.medium_text.room_user", messageUser + ":");
    else
      userDiv = m("div.message.username.medium_text", messageUser + ":");
    return m("div.message",
             [userDiv,
              m("div.message.body.small_text",
                message.message.split("\n").map(function (l) { return m("p", l); }))]);
  };
};

exports.participantView = function (ctl, formCallback) {
  return m("div.container",[    
    m("audio#audio",
      { style: "display:none;",/* autoplay: true, */ loop:true, muted:true, type:'audio/mpeg',
        src:"/pando/audio/pin_drop.mp3" }),
    m("div#messages", ctl.messages().map(exports.renderMessage(ctl.user(), ctl.name()))),
    m("div#messageForm", [
      m("form", [
        m("textarea#messageBody.medium_text",
          { oninput: function (e) {
            ctl.currentMessage(e.target.value);
            if (ctl.entryStart === null) ctl.entryStart(Date.now());
          }
          },
          ctl.currentMessage()),
        m("div#messageSend.button",
          { onlick: formCallback,
            config: Touch.touchHelper({ tap: formCallback }) },
          m("div.imageHolder",
             m("img[src='/pando/img/send.svg']")))])])]);
};

exports.observerView = function (ctl) {
  return m("div#messages",
           m("audio#audio",
             { style: "display:none;", /*autoplay: true,*/ loop:true, muted:true, type:'audio/mpeg',
               src:"/pando/audio/pin_drop.mp3" }),
           ctl.messages().map(exports.renderMessage(ctl.user(), ctl.name())));
};

exports.formView = function (room, roomList, connectCallback) {
  return m("div#roomFormHolder.interactionHolder",
           m("form#roomForm",
             [common.textInput("User Name:", "userName", room.user),
              m("br"),
              common.textInput("Create a new room ...", "roomName", room.name),
              m("br"),
              common.label("... or select an existing room", "roomName"),
              m("br"),
              roomList.data().list.map(common.modelNameRadio(room)),
              m("br"),
              common.button("Connect", "#connect", function () {connectCallback(room, roomList);})]));
};

exports.audioPrompt = function (app, enableCallback, cancelCallback) {
  return m("div.popup.interactionHolder",
           [m("p.medium_text.bold",
              "You need to enable web audio to continue"),
            m("br"),
            m("p.medium_text",
              [m("span.bold.red_text", "HEADS UP! "),
               "Enabling this will play a silent audio track on this page, which will keep"
               + " your web browser open in the background. You will need to manually close"
               + " this page, or your browser to stop audio playback."]),
            m("br"),
            m("div.buttonRow",
              [m("button.button",
                 { onclick: function () {
                   var audio = document.getElementById('audio');
                   if (audio) audio.play();
                   enableCallback();
                 },
                   config: Touch.touchHelper({ tap: function (){enableCallback();} })
                 },
                 "Enable"),
               m("button.button",
                 { onclick: function () { cancelCallback(); },
                   config: Touch.touchHelper({ tap: function () {cancelCallback();} })
                 },
                 "Cancel & Leave")])]);
};

exports.onTheFlyJoin = function (app, clickCallback) {
  return m("div#roomFormHolder.interactionHolder",
           [common.textInput("User name:", "userName", app.room.user, true),
            m("br"),
            common.button("Join", "#connect", function () {
              clickCallback(); })]);
};

exports.errorDisplay = function (app) {
  if (app.errors().length > 0)
    return common.displayErrors(app);
  else
    return [];
};
