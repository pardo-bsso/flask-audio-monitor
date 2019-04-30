/**
 *
 */
function PPM_Meter (element, options) {
  if (!element) {
    element = document.createElement('div');
  }

  var options = options || {};
  var defaultOptions = {
    style: 'horizontal',
    decayRate: 100,
    peakLimit: 0.95,
    peakLimitDisplayTime: 1000,
    showFps: true,
  };

  for (var key in options) {
    if (defaultOptions[key] !== undefined) {
      var value = options[key];
      if (value !== undefined) {
        defaultOptions[key] = value;
      }
    }
  }
  this.options = defaultOptions;
  options = defaultOptions;

  this.element = element;
  this.element.innerHTML = '<div class="js-vumeter"> <div class="bar bar-level"> </div> <div class="bar bar-opaque"> </div> <div class="fps-meter"> </div> </div>';

  var fpsMeter = this.element.querySelector('.fps-meter');
  if (options.showFps) {
    this.element.querySelector('.js-vumeter').classList.add('show-fps');
  }

  var levelBar  = this.element.querySelector('.bar-level');
  var opaqueBar = this.element.querySelector('.bar-opaque');

  var state = this.state = {
    active: true,
    level: 0,
    last_draw_time: 0,
    last_peak_time: 0,
    last_peak_value: 0,
  };

  this.draw = draw.bind(this);
  this.setStyle(this.options.style);
  this.start();

  function draw (now) {
    if (now === undefined) {
      now = state.last_draw_time;
    }
    var decayRate = options.decayRate;
    var dT = now - state.last_draw_time;
    state.last_draw_time = now;

    // dLevel = -1.0 * dT * Level * (1/decayRate)
    var dL = dT / decayRate;

    if (dT && options.showFps) {
      fpsMeter.textContent = 1000 / dT;
    }

    var level = state.level;

    if (level > options.peakLimit) {
      state.last_peak_time = now;
      state.last_peak_value = level;
      opaqueBar.classList.add('above-peak-limit');
    }

    if ((now - state.last_peak_time) > options.peakLimitDisplayTime) {
      state.last_peak_time = 0;
      state.last_peak_value = 0;
      opaqueBar.classList.remove('above-peak-limit');
    }

    // For the lower range increase the decay rate
    if (level < 0.05) {
      dL = dL * (1 + 20*(1 - level/.05));
    }

    var nextLevel = level * (1 - dL*level);

    state.level = clampLevel(nextLevel);

    var styleProp = {
      'horizontal': 'width',
      'vertical': 'height'
    }[options.style];
    levelBar.style[styleProp] = 100*level + '%';

    if (state.active) {
      window.requestAnimationFrame(this.draw);
    }
  }

  function clampLevel (level) {
    if (level > 1) {
      level = 1;
    }

    if (level < .005) {
      level = 0;
    }
    return level;
  }
}


/**
 * Sets the display style.
 * @param {string} style - 'horizontal' (default) or 'vertical'
 */
PPM_Meter.prototype.setStyle = function (style) {
  var validStyles = ['horizontal', 'vertical'];
  style = style.toLowerCase();

  if (validStyles.indexOf(style) === -1) {
    style = 'horizontal';
  }

  this.options.style = style;
  var other = validStyles[1 - validStyles.indexOf(style)];
  this.element.querySelector('.js-vumeter').classList.add(style);
  this.element.querySelector('.js-vumeter').classList.remove(other);

  return this.draw();
};

/**
 * Sets the current level in absolute units.
 * @param {float} level - A level value between 0 and 1
 */
PPM_Meter.prototype.setLevel = function (level) {
  this.state.level = level;
  if (!this.state.active) {
    this.draw();
  }
  return this;
};

PPM_Meter.prototype.start = function () {
  this.state.active = true;
  window.requestAnimationFrame(this.draw);
  return this;
};

PPM_Meter.prototype.stop = function () {
  this.state.active = false;
  return this;
};

