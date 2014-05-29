$(document).on('ready', function() {

    var round_count = 5;
    var scores = {1: 3, 2: 2, 3:1};
    var max_count = 3;

    var Round = Backbone.Model.extend({
        defaults : {
            'status' : 'not_play',
            'used': false,
            'score': 0,
            'shoot': 0
        },
        initialize: function() {
            var model = this;
            this.on("change:status", function() {
                model.set('used', true);
            });
            this.setScore(scores);
            this.setMaxCount(max_count);
        },
        setScore: function(scores){
             this.scores = scores;
        },
        setMaxCount: function(max_count){
            this.max_count = max_count;
        },
        setWin: function(){
            this.set('status', 'win');
            console.log(this.scores, 'scores')
        },
        setLoose: function(){
            this.set('status', 'loose');
        },
        _isMaxShoot: function(){
            return this.get('shoot') >= this.max_count;
        },
        _addScore: function(){
            this.set('score', +this.get('score') + this.scores[+this.get('shoot')+1]);
        },
        _addShoot: function(){
            this.set('shoot', +this.get('shoot')+1);
        },
        setHit: function(){
            if(!this._isMaxShoot()){
                this._addScore();
                this.set('status', 'win');
            } else {
                console.warn('Max shoots!')
            }
        },
        setMiss: function(){
            if(!this._isMaxShoot()) {
                this._addShoot();
            } else {
                this.set('status', 'loose');
            }
        }

    });
    
    var Rounds = Backbone.Collection.extend({
        model: Round,
        initialize: function(){
            this.bind('add', this.onAdd, this)
        },
        setOnModel: function(name){
            var first = name.charAt(0).toUpperCase();
            var func_name = first + name.substr(1);
            var not_played_round = this.find(function(round){
                return round.get('used') == false;
            });
            if(not_played_round != undefined){
                console.log('hooo');
                not_played_round['set'+func_name]();
            } else {
                alert('end of game!');
            }
        },
        onAdd: function(model){
            var view = new Status_bar({
                'model': model
            });
            $('#bar').append(view.render());
        }
    });

    var Widget = Backbone.View.extend({

        el: $('#widget'),

        events: {
            'click #win:button': 'win',
            'click #loose:button': 'loose'
        },

        win: function(){
            rounds.setOnModel('win');
        },
        loose: function(){
            rounds.setOnModel('loose');
        }
    });

    var Shoots = Backbone.View.extend({

        el: $('#shoots'),

        events: {
            'click #hit:button': 'hit',
            'click #miss:button': 'miss'
        },

        hit: function(){
            rounds.setOnModel('hit');
        },
        miss: function(){
            rounds.setOnModel('miss');
        }
    });

    var widget = new Widget();
    var shoots = new Shoots();

    var Status_bar = Backbone.View.extend({
        
        template: _.template($('#status_bar').html()),

        initialize: function(){
            this.model.bind('change', this.render, this);
            this.render();
        },
        render: function(){
            return this.$el.html(this.template(this.model.toJSON()));
        }
    });

   

    var rounds = new Rounds();


    for(var i = 0; round_count > i; i++){
        rounds.add({});
    }
});