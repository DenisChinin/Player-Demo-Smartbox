(function () {

  var LocalPlayer = {
    hasMedia: false,
    initialize: function () {
      this.$el = $('.player');
      this.$overlay = $('.player-overlay');
      this.$seek = this.$el.find('.player-seek');
      this.seekWidth = this.$seek.width();
      this.$progressStyle = this.$seek.find('.player-seek-progress')[0].style;
      this.$play = this.$el.find('.player-play');
      this.$pause = this.$el.find('.player-pause');

      // store link to smartbox plugin
      this.plugin = window.Player;
      this.plugin.setSize({
        left: 350,
        top: 50,
        width: 930,
        height: 523
      });
      this.addNativePlayerEvents();
      this.addEvents();
    },

    init: function (media) {
      this.media = media;
      if(media.type === 'hls') {
        this.isHLS = true;
        this.$seek.hide();
      } else {
        this.isHLS = false;
        this.$seek.show();
      }
      this.plugin.play(media);
    },

    addNativePlayerEvents: function () {
      var plugin = this.plugin,
        self = this;

      plugin.on('pause', function () {
        self.$play.show();
        self.$pause.hide();
      });
      plugin.on('resume', function () {
        self.$play.hide();
        self.$pause.show();
      });
      plugin.on('update', _.bind(this.onUpdate, this));
      plugin.on('stop', _.bind(this.onStop, this));
      plugin.on('complete', _.bind(this.onStop, this));
      plugin.on('ready', _.bind(this.onReady, this));
    },

    onReady: function () {
      this.duration = this.plugin.videoInfo.duration;
      this.$play.hide();
      this.$pause.show();
      this.$overlay.hide();
      this.hasMedia = true;
    },

    onStop: function (  ) {
      this.$progressStyle.width = '0%';
      this.$play.show();
      this.$pause.hide();
      this.$overlay.show();
      this.hasMedia = false;
    },

    onUpdate: function (  ) {
      var info = this.plugin.videoInfo,
        progressWidth;

      if (this.isHLS) {
        return;
      }

      progressWidth = (info.currentTime / info.duration) * 100;
      if (progressWidth > 100) {
        progressWidth = 100;
      }
      this.$progressStyle.width = progressWidth + '%';
    },

    addEvents: function () {
      var playFunc = _.bind(this.onPlayClick, this),
        pauseFunc = _.bind(this.onPauseClick, this),
        stopFunc = _.bind(this.onStopClick, this),
        RWFunc = _.bind(this.onRWClick, this),
        FFFunc = _.bind(this.onFFClick, this),
        jumpInterval;

      this.$pause.on('click', pauseFunc);
      this.$play.on('click', playFunc);
      this.$el.find('.player-rw').on({
        'mousedown': function (e) {
          jumpInterval = setInterval(function () {
            RWFunc();
          }, 200);
        },
        'mouseup': function () {
          clearInterval(jumpInterval);
        }
      });
      this.$el.find('.player-ff').on({
        'mousedown': function (e) {
          jumpInterval = setInterval(function () {
            FFFunc();
          }, 200);
        },
        'mouseup': function () {
          clearInterval(jumpInterval);
        }
      });
      this.$seek.on('click', _.bind(this.onSeekClick, this));

      $(document.body).on({
        'nav_key:play': playFunc,
        'nav_key:stop': stopFunc,
        'nav_key:pause': pauseFunc,
        'nav_key:rw': RWFunc,
        'nav_key:ff': FFFunc
      });
    },

    onStopClick: function () {
      this.plugin.stop();
    },

    onPlayClick: function () {
      this.plugin.play();
    },

    onPauseClick: function () {
      this.plugin.pause();
    },

    /**
     * handler for click on seek bar
     * @param e
     */
    onSeekClick: function ( e ) {
      var offsetX = e.offsetX,
        offset,
        time;
      if (this.hasMedia && this.media.type !== 'hls') {
        offset = offsetX / this.seekWidth;
        time =  offset * this.duration;
        this.plugin.seek(time);

        // set progress width before seek
        this.$progressStyle.width = (offset * 100) + '%';
      }
    },

    onRWClick: function () {
      console.log('on rw click');
      this.plugin.backward();
    },

    onFFClick: function () {
      console.log('on ff click');
      this.plugin.forward();
    }
  };

  window.App = {

    // main initialization point
    initialize: function () {
      this.$menu = $('.menu-list');

      this.renderVideoItems();
      this.addEvents();
      LocalPlayer.initialize();

      // start navigation
      $$nav.on();
    },

    addEvents: function () {
      this.$menu.on('click', '.menu-item', _.bind(this.onVideoClick, this));
      $(document.body).bind('nav_key:return nav_key:exit nav_key:smart nav_key:smarthub', function (e) {
        e.stopPropagation();
        e.preventDefault();
        SB.exit();
      });
    },

    // handler for click on item in videos menu
    onVideoClick: function ( e ) {
      var el = e.currentTarget;

      LocalPlayer.init({
        url: el.getAttribute('data-url'),
        type: el.getAttribute('data-type')
      })
    },

    // show items from videos.js in menu
    renderVideoItems: function () {
      var videos = this.videos || [],
        result = '';
      _.each(videos, function ( item ) {
        result += '<li class="menu-item nav-item" data-url="'+ item.url +'" ' +
                  'data-type="'+ item.type +'">' + item.title + '</li>';
      });

      this.$menu.html(result);
    }
  };

  SB(_.bind(App.initialize, App));

})();