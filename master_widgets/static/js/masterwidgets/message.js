class MasterMessage extends MasterWidget{
    init(attrs = {}){
        this.jqx_type = 'jqxNotification';
        defaults(attrs, {
            'width': 250, 
            'height': 'auto',
            'position': "top-right", 
            'opacity': 0.9,
            'autoOpen': false, 
            'animationOpenDelay': 800, 
            'autoClose': true, 
            'autoCloseDelay': 3000, 
            'template': "info"
        });
        super.init(attrs);
    }
    render(){
        var id = MasterWidget.autoID(this) + 'text';
        $('<div/>', {'class':'message-box', 'id': id}).appendTo(this.jqx_target);
        this.attrs.appendContainer = this.target;
        super.render();
    }
    show(message){
        $(`#${this.id()}text`).text(message);
        this.jqx('open');
    }
}

(jQuery)(function($){
    $.fn.masterMessage = function(message, options=null){
        var msg_box = this.data('masterMessage');
        if(!msg_box){
            var target = $('<div/>').appendTo(this);
            if(this.attr('id'))
                target.attr('id', this.attr('id') + 'Message');
            var msg_box = new MasterMessage(target,{});
            this.data('masterMessage', msg_box);
        }
        if(options) msg_box.jqx(options);
        msg_box.show(message);
        return this;
    };
});