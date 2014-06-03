$(document).on('ready', function () {

    var round_count = 5;
    var scores = {1: 3, 2: 2, 3: 1};
    var max_count = 3;
    var time_round = 3;


    var Round = Backbone.Model.extend({
        defaults: {
            'status': 'not_play',
            'used': false,
            'score': 0,
            'shoot': 0
        },

        initialize: function () {
            var model = this;
            this.on("change:status", function () {
                model.set('used', true);
            });
            this.setScore(scores);
            this.setMaxCount(max_count);
        },
        setScore: function (scores) {
            this.scores = scores;
        },
        setMaxCount: function (max_count) {
            this.max_count = max_count;
        },
        setWin: function () {
            this.set('status', 'win');
        },
        setLoose: function () {
            this.set('status', 'loose');
        },
        _isMaxShoot: function () {
            return this.get('shoot') == this.max_count;
        },
        _addScore: function () {
            this.set('score', +this.get('score') + this.scores[+this.get('shoot') + 1]);
        },
        _addShoot: function () {
            this.set('shoot', +this.get('shoot') + 1);
            $('#shot' + this.get('shoot')).hide();
        },
        setHit: function () {
            if (!this._isMaxShoot()) {
                this._addScore();
                this.set('status', 'win');
            } else {
                console.warn('Max shoots!')
            }
        },
        setMiss: function () {
            var status = this.get('status');
            if (status != 'loose') {
                this._addShoot();
                if (this._isMaxShoot()) {
                    this.set('status', 'loose');
                }
            }
        }

    });

    var Rounds = Backbone.Collection.extend({
        model: Round,
        initialize: function () {
            this.bind('add', this.onAdd, this);
            $('#duckBoard').html('');
        },
        currentRound: function () {
            return this.find(function (round) {
                return round.get('used') == false;
            });
        },
        setOnModel: function (name) {
            var first = name.charAt(0).toUpperCase();
            var func_name = first + name.substr(1);
            var not_played_round = this.currentRound();

            if (not_played_round != undefined) {
                not_played_round['set' + func_name]();
            } else {
                //alert('end of game!');
            }
        },
        onAdd: function (model) {
            var view = new Status_bar({
                'model': model
            });
            $('#duckBoard').append(view.render());
        },
        getScore: function () {
            var score = 0;
            this.forEach(function (round) {
                score += round.get('score');
            });
            return score;
        }
    });

//    var Widget = Backbone.View.extend({
//
//        el: $('#widget'),
//
//        events: {
//            'click #win:button': 'win',
//            'click #loose:button': 'loose'
//        },
//
//        win: function () {
//            rounds.setOnModel('win');
//
//        },
//        loose: function () {
//            rounds.setOnModel('loose');
//        }
//    });

    var Shoots = Backbone.View.extend({

        el: $('#shoots'),

        events: {
            'click  #hit:button': 'hit',
            'click #miss:button': 'miss',
            'touchstart  #hit:button': 'hit',
            'touchstart #miss:button': 'miss'
        },

        hit: function () {
            this.collection.setOnModel('hit');
        },
        miss: function () {
            this.collection.setOnModel('miss');
        }
    });


    var Status_bar = Backbone.View.extend({

        template: _.template($('#status_bar').html()),
        tagName: 'span',
        initialize: function () {
            this.model.bind('change', this.render, this);
            this.render();

        },
        render: function () {
            return this.$el.html(this.template(this.model.toJSON()));
        }
    });

    var Duck = Backbone.View.extend({
        el: $('.duck'),
        template: _.template($('#duck').html()),
        initialize: function () {
            this.$el.show();
            this.wind_width = $('.game').width();
            this.wind_height = $('.game').height() - 100;
            this.render();
            this.hideDuck();
            this.over_round = false;
        },

        setRoundBind: function () {
            var self = this;
            this.current_round = this.collection.currentRound();
            if (this.current_round != undefined) {
                this.current_round.bind('change:status', this.over, this);
                $('html').on('click', function () {
                    self.current_round.setMiss();
                });
                return true;
            }
            return false;

        },

        over: function (round) {
            if (round.get('status') == 'loose') {
                this.$el.pauseKeyframe();
                this.duck_away();
            }
            $('html').off('click touchstart');
            this.over_round = true;

        },
        events: {
            'click #duck_img': 'shoot'
        },

        shoot: function (evt) {
            evt.stopPropagation();
            if (!this.over_round) {
                this.current_round.setHit();
                this.duck_down();
                $('#scoreboard').html(this.collection.getScore());
            }
        },

        duck_down: function () {
            var self = this;
            var pos = this.$el.position();
            var top = Math.round(pos.top);
            var left = Math.round(pos.left);
            this.$el.pauseKeyframe();
            $.keyframe.define([
                {
                    name: 'drop',
                    from: {top: top, left: left},
                    to: {top: this.wind_height - 70, left: left}
                }
            ]);
            this.$el.playKeyframe({
                name: 'drop',
                duration: 300,
                timingFunction: 'linear',
                delay: 0,
                complete: function () {
                    self.$el.resetKeyframe();
                    self.hideDuck();
                    self.animateProccess();
                }
            });
        },
        duck_away: function () {
            this.changeDuckDirection('r');
            var self = this;
            var pos = this.$el.position();
            var top = Math.round(pos.top);
            var left = Math.round(pos.left);
            this.$el.pauseKeyframe();
            $.keyframe.define([
                {
                    name: 'away',
                    from: {top: top, left: left},
                    to: {top: 0, left: this.wind_width}
                }
            ]);
            this.$el.playKeyframe({
                name: 'away',
                duration: 800,
                timingFunction: 'linear',
                delay: 0,
                complete: function () {
                    self.$el.resetKeyframe();
                    if (self.current_round != undefined)
                        self.current_round.setLoose();
                    self.hideDuck();
                    self.animateProccess();
                }
            });

        },
        animateProccess: function () {

            if (this.setRoundBind()) {
                this.current_round.set('status', 'play')
                $('#ammo').children().show();
                this.over_round = false;
                var frame = {};
                frame.name = 'an';
                var pos = this.$el.position();


                var steps = _.random(4, 5);
                var step = Math.round(100 / steps);

                var left = pos.left;
                var percent = step;

                var modifier = (pos.left < 0) ? 1 : -1;
                var direction = (pos.left > 0) ? 'l' : 'r';

                this.changeDuckDirection(direction);
                frame['0%'] = {left: pos.left, top: pos.top};
                for (var i = 1; i <= steps; i++) {
                    left = left + (modifier * _.random(0, 200));
                    frame[percent + '%'] = {left: left, top: _.random(0, this.wind_height)};
                    percent += step;
                }
                $.keyframe.define([
                    frame
                ]);
                var self = this;
                this.$el.playKeyframe({
                    name: 'an',
                    duration: +time_round * 1000,
                    delay: 0,
                    complete: function () {
                        self.duck_away();
                    }
                });
            } else {
                $('#scoreboard').html(this.collection.getScore());
                this.$el.hide();
                $('.action').show();
            }
        },
        changeDuckDirection: function (direction) {
            $('#duck_img').attr('src', '/img/duck_' + direction + '.gif');
        },
        hideDuck: function () {
            var rand = _.random(0, 1);
            var side = (rand) ? this.wind_width : -68;
            var direction = (rand) ? 'l' : 'r';
            this.changeDuckDirection(direction);
            var top = _.random(0, this.wind_height);
            this.$el.css({'left': side, top: top});


        },
        render: function () {
            return this.$el.html(this.template());
        }
    });

    function start() {
//        var widget = new Widget();

        var rounds = new Rounds();
        for (var i = 0; round_count > i; i++) {
            rounds.add({});
        }
        var shoots = new Shoots({'collection': rounds});
        var duck = new Duck({'collection': rounds});
        duck.animateProccess();
    }

    $('.action').on('click touchstart', function (evt) {
        evt.stopPropagation();
        start();
        $('.action').hide();
    });


});