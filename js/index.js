$(document).on('ready', function() {

    var round_count = 5;
    var Round = Backbone.Model.extend({
        defaults : {
            'status' : 'not_play',
            'used': false
        },
        initialize: function() {
            var model = this;
            this.on("change:status", function() {
                model.set('used', true);
            });
        },
        setWin: function(){
            this.set('status', 'win');
        },
        setLoose: function(){
            this.set('status', 'loose');
        }
    });
    
    var Rounds = Backbone.Collection.extend({
        model: Round,
        initialize: function(){
            this.bind('add', this.onAdd, this)
        },
        setStatus: function(status){
            var first = status.charAt(0).toUpperCase();
            var func_name = first + status.substr(1);
            var not_played_round = this.find(function(round){
                return round.get('used') == false;
            });
            if(not_played_round != undefined){
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
            rounds.setStatus('win');
        },
        loose: function(){
            rounds.setStatus('loose');
        }
    });

    var widget = new Widget();

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