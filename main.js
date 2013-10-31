var Morse = {
  codes: {
    A: '.-',
    B: '-...',
    C: '-.-.',
    D: '-..',
    E: '.',
    F: '..-.',
    G: '--.',
    H: '....',
    I: '..',
    J: '.---',
    K: '-.-',
    L: '.-..',
    M: '--',
    N: '-.',
    O: '---',
    P: '.--.',
    Q: '--.-',
    R: '.-.',
    S: '...',
    T: '-',
    U: '..-',
    V: '...-',
    W: '.--',
    X: '-..-',
    Y: '-.--',
    Z: '--..',
    ' ': '|',
    '.': '*'
  },
  audio_ctx: null,
  rgx_validate_input: /(\w| |.|,)+/g,

  tone_length: 0.1,

  tonify: false,

  frequency: 440,

  init: function() {
    if(!window.AudioContext) {
      throw new Error('AudioContext is unsupported.');
    }

    Morse.audio_ctx = new AudioContext();
    window.a = Morse.audio_ctx;
    window.o = window.a.createOscillator();
    window.o.connect(window.a.destination);
  },

  getTone: function(freq) {
    freq = freq || Morse.frequency;

    if(Morse.tonify)
      freq += Math.floor(Math.random() * 600);

    var o = Morse.audio_ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(Morse.audio_ctx.destination);

    return o;
  },

  playTone: function(tone, delay, len) {
    tone.start(delay);
    tone.stop(delay+len);
  },

  encode: function(str) {
    if(typeof str !== 'string')
      throw new TypeError('Input must be string: ' + str);

    if(str.match(Morse.rgx_validate_input)[0] !== str)
      throw 'Bad input, invalid characters: ' + str;

    str = str.toUpperCase();

    var encoded = '';
    // For character in str
    for(var c_n = 0, c_len = str.length; c_n < c_len; ++c_n){
      var morse = Morse.codes[ str[c_n] ];

      encoded += morse;
      if(c_n < c_len-1)
        encoded += ' ';
    }

    return encoded;
  },

  scheduleAll: function(morse) {
    var a = Morse.audio_ctx,
        t = a.currentTime;

    // For each m in morse
    for(var m_n = 0, m_len = morse.length; m_n < m_len; ++m_n){
      var m = morse[m_n],
          tone = Morse.getTone(),
          len = 0,
          delay = 0;

      switch(m) {
        case '.':
          delay = len = Morse.tone_length;
          break;
        case '-':
          delay = Morse.tone_length;
          len = delay * 3;
          break;
        case ' ':
          delay = Morse.tone_length;
          break;
        case '|':
          delay = Morse.tone_length * 3;
          break;
        case '*':
          delay = Morse.tone_length * 7;
          break;
      }

      if(len > 0) {
        Morse.playTone(tone, t, len);
        // tone.start(t);
        // tone.stop()
        t += len;
      }
      t += delay;
    }
  },

  playMessage: function() {
    var m = Morse.encode($('#message').val());

    Morse.scheduleAll(m);
  },

  showMessage: function() {
    var m = Morse.encode($('#message').val());

    $('.output .encoded').text(m);
  }
};



var morse = Morse.codes;
var beep;
var queue = [];
var morseplay = {};
var t = 150;

function getMorse(message){
  // var regex = //;
  message = message.toUpperCase();

  var str = '';

  for(var i = 0; i < message.length; ++i){
    str += morse[ message[ i ] ] + ' ';
  }

  return str;
}
function putInQueue(message){
  for(var i = 0; i < message.length; ++i){
    queue.push(message[i]);
  }
}

morseplay.next = function(){
  if(queue.length === 0)
    return;

  var n = queue.shift();

  morseplay[n]();
};

morseplay[' '] = function(){
  setTimeout(function(){
    morseplay.next();
  }, 150);
};
morseplay['*'] = function(){
  setTimeout(function(){
    morseplay.next();
  }, 450);
};
morseplay['.'] = function(){
  beep.play();
  setTimeout(function(){
    beep.pause();
    beep.currentTime = 0;
    morseplay.next();
  }, 150);
};
morseplay['-'] = function(){
  beep.play();
  setTimeout(function(){
    beep.pause();
    beep.currentTime = 0;
    morseplay.next();
  }, 450);
};

vibrate = {};
vibrate.vibrate = function(message){
  $('body').append('<p>vibrate');
  var v = {
    ' ': 3*t,
    '.': t,
    '|': 7*t,
    '-': 3*t
  };
  var q = [];
  for (var i = 0; i < message.length; i++) {
    if(message[ i ] == '.' || message[ i ] == '-'){
      q.push(v[ message[ i ] ]);
      q.push(t);
    } else {
      q[q.length-1] = v[ message[ i ] ];
    }
  }

  $('body').append('<p>'+message);
  $('body').append('<p>'+q);
  
  navigator.vibrate(q);
};

vibrate.next = function(){
  $('body').append('<p>next');
  if(queue.length === 0)
    return;

  var v = queue.shift();

  $('body').append('<p>shift');
  vibrate[v]();
};
vibrate[' '] = function(){
  $('body').append('<p> ');
  setTimeout(vibrate.next, 150);
};
vibrate['*'] = function(){
  $('body').append('<p>*');
  setTimeout(vibrate.next, 450);
};
vibrate['.'] = function(){
  $('body').append('<p>.');
  navigator.vibrate(150);
  vibrate[' ']();
};
vibrate['-'] = function(){
  $('body').append('<p>-');
  navigator.vibrate(450);
  vibrate['*']();
};



// Prefix
window.AudioContext =
  window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  undefined;



$(function(){
  Morse.init();

  beep = document.getElementById('beep');
  
  if('vibrate' in navigator){
    $('#btn_vibrate').click(function(){
      var message = $('#message').val();
      // putInQueue(getMorse(message));
      vibrate.vibrate(getMorse(message));
    });
  } else {
    $('#btn_vibrate').css('display', 'none');
  }

  Morse.showMessage();

  $('#message')
    .on('input', Morse.showMessage)
    .on('keypress', function(ev) {
      if(ev.which === 13) {
        ev.preventDefault();
        Morse.playMessage();
      }
    });

  $('#btn_sound').click(Morse.playMessage);

  $('#check_tune').on('change', function(ev) {
    Morse.tonify = this.checked;
  });
});