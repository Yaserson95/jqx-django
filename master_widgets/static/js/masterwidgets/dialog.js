class MasterDialog extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'buttons': {'type': 'array', 'default':[
                {'label':'OK', 'name':'confirm'},
                {'label':'Отмена', 'name':'cancel'}
            ]},
            'showButtons': {'type': 'boolean', 'name':'show_buttons', 'default': true},
            'title': {'type': 'string'}
        }});
	}

    init(options){
        this.jqx_type = 'jqxWindow';
        super.init(defaults(options, {
            'autoOpen': false,
            'isModal': true,
            'resizable': false,
            'maxWidth': '80%',
            'maxHeight': '80%',
            'width': '60%',
            'height': '40%',
            'minWidth': '10%',
            'minHeight': '10%',
        }));
    }

    renderHeader(){
        this.header = {
            'label': $('<span/>', {'class': 'header-label'}),
            'base': $('<div/>', {'class': 'master-dialog-header'})
        };
        this.header.label.text(this.title);
        return this.header.base.append(this.header.label);
    }
    renderLayout(){
        this.layout = {
            'base': $('<div/>', {'class': 'master-dialog-layout'}),
            'content': $('<div/>', {'class': 'master-dialog-content'})
        };
        this.layout.base.append(this.layout.content);
        if(this.show_buttons){
            this.layout.buttons = $('<div/>', {'class': 'master-dialog-buttons'});
            this.layout.base.append(this.layout.buttons);
        }
        return this.layout.base;
    }
    renderContent(content){
        /*content.jqxPanel({
            'width': '100%',
            'height': '100%',
        });*/
        return this;
    }

    renderButtons(panel){
        this.layout.buttons = new MasterToolbar(panel, {
            'parent': this,
            'buttons': this.buttons,
            'rtl': true
        });

        $(this.layout.buttons.getTool('confirm')).click((e)=>this.confirm(e));
        $(this.layout.buttons.getTool('cancel')).click((e)=>this.cancel(e));

        return this;
    }

    render(){
        this.target.append(
            this.renderHeader(),
            this.renderLayout()
        ).addClass('master-dialog');
        super.render();
        this.renderContent(this.layout.content);
        if(this.layout.buttons){
            this.renderButtons(this.layout.buttons);
        }
    }

    open(){
        this.jqx('open');
    }

    setTitle(text){
        this.title = text;
        this.header.label.text(text);
        return this;
    }

    getTitle(){
        return this.title;
    }

    getMaxSize(){
        var w = this.jqx('maxWidth');
        var h = this.jqx('maxHeight');
        return [w,h];
    }
    confirm(e){

    }
    cancel(e){
        this.jqx('close');
    }
};