//$.use(JQX_JS_URL);
const allowedWindowOptions = [
    'width', 'height', 'title', 'position', 'draggable', 'resizable',
    'modal', 'autoOpen', 'showCloseButton', 'initContent', 'theme',
    'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'zIndex',
    'cancelButton', 'closeButton', 'isModal',
    'keyboardCloseKey', 'animationType', 'rtl', 'content',
    'scrollBarSize', 'showCollapseButton', 'collapsed',
    'enableSizeAnimation', 'animationDuration', 'showAnimationDuration',
    'closeAnimationDuration', 'focus', 'disabled', 'selectionMode'
];

class MasterDialog extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'buttons': {'type': 'array', 'name':'buttons_template', 'default':[
                {'label':'OK', 'name':'confirm', 'width': 70, 'height':30},
                {'label':'Отмена', 'name':'cancel', 'width': 70, 'height':30}
            ]},
            'showButtons': {'type': 'boolean', 'name':'show_buttons', 'default': true},
            'title': {'type': 'string'},
            'icon': {'type':'string', 'required': false},
            'widgetClass': {'type': 'function', 'name':'widget_class'},
        }});
	}

    initTarget(target){
        target = super.initTarget(target, false);
        this.header = this.initHeader(target);
        this.content = this.initContent(target);
        return target;
    }

    initHeader(target){
        var element = $('<p/>', {'class': 'dialog-header'}).appendTo(target);
        var icon = $('<span/>', {'class': 'dialog-header-icon'}).hide().appendTo(element);
        var title = $('<span/>', {'class': 'dialog-header-title'}).appendTo(element);
        return {'element': element, 'icon':icon, 'title':title};
    }

    initContent(target){
        var layout = $('<div/>', {'class': 'dialog-layout'}).appendTo(target);
        var element = $('<div/>', {'class': 'dialog-content'}).appendTo(layout);
        var footer = $('<div/>', {'class': 'dialog-footer'}).hide().appendTo(layout);
        return {'element': element, 'layout':layout, 'footer':footer};
    }

    init(options){
        this.jqx_type = 'jqxWindow';
        super.init(defaults(options, {
            'autoOpen': false,
            'isModal': true,
            'maxWidth': '90%',
            'maxHeight': '90%',
            'width': '70%',
            'height': '70%',
            'minWidth': '10%',
            'minHeight': '10%',
        }));
    }

    renderIcon(name){
        return faicon(name).addClass('master-dialog-icon');
    }

    renderContent(){
        this.widget = new this.widget_class(this.content.element, {
            ...this.attrs,
            'width': '100%',
            'height': '100%'
        });
        return this;
    }

    renderButtons(panel){
        var btns = new MasterToolbar(panel, {
            'parent': this,
            'buttons': this.buttons_template,
            'rtl': true
        });
        
        $(btns.getTool('confirm')).click((e)=>this.confirm(e));
        $(btns.getTool('cancel')).click((e)=>this.cancel(e));
        return btns;
    }

    render(){
        var wondows_opts = splitObject(this.attrs, allowedWindowOptions);
        this.renderContent();

        if(this.show_buttons){
            this.content.footer.show();
            this.buttons = this.renderButtons(this.content.footer);
        }

        this.attrs = wondows_opts;
        this.inital_position = this.target.position();
        super.render();
        
        this.header.title = this.header.element.find('.dialog-header-title');
        this.header.icon = this.header.element.find('.dialog-header-icon');
    }

    open(){
        this.jqx('open');
        //$(document.body).css('overflow', 'hidden');
    }
    close(){
        this.jqx('close');
        //$(document.body).css('overflow', '');
    }

    set title(text){
        this.header.title.text(text);
    }

    get title(){
        return this.header.title.text() || null;
    }

    set icon(icon){
        this.header.icon.html('');
        if(!icon){
            this.header.icon.hide();
            return;
        }
        this.header.icon.append(this.renderIcon(icon)).show();

    }
    confirm(e){}
    cancel(e){
        this.jqx('close');
    }
};

MasterWidget.register(MasterDialog);