class MasterWidgetInput extends MasterWidget{
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'contentWidth': {'type': ['number', 'string'], 'name':'content_width', 'default': 300},
            'contentHeight': {'type': ['number', 'string'], 'name':'content_height', 'default': 200},
            'type': {'type': 'string', 'default': 'none'},
            'widgetClass': {'type': 'function', 'name':'widget_class'},
            ...patterns
        });
    }

    initTarget(target){
        return super.initTarget(target, false);
    }

    init(attrs = {}){
        defaults(attrs, {
            'width': 150,
            'height': 30
        });
        super.init(attrs);
    }

    renderDropDown(){
        this.widget_target.jqxDropDownButton({
            'theme': this.theme,
            'width':this.width,
            'height': this.height,
            'dropDownWidth': this.content_width,
            'dropDownHeight': this.content_height
        });
    }

    renderDialog(){
        var title = $('<div/>', {'class': 'master-dialog'}).insertBefore(this.target);
        this.widget_target.jqxWindow({
            'theme': this.theme,
            'width': this.content_width,
            'height': this.content_height
        });
    }

    render(){
        this.widget_target = this.target;
        this.target = $('<div/>').appendTo(this.widget_target);

        switch(this.type){
            case 'dropdown':
                this.renderDropDown();
                break;
            case 'dialog':
                this.renderDialog();
                break;
        }
        super.render();

        this.widget_target.data('masterWidget', this.target.data('masterWidget'));

        if(this.label)
            this.__setLabel(this.label);
    }

    set label(label){
        this.__label = label;
        this.__setLabel(label);
    }

    get label(){
        return this.__label || null;
    }

    set value(value){
        this.widget.value = value;
    }

    get value(){
        return this.widget.value;
    }

    get jqx_width(){
        return this.content_width;
    }

    get jqx_height(){
        return this.content_height;
    }


    jqx(...args){
        if(!this.widget){
            this.widget = new this.widget_class(this.target, args[0]);
        }
        else this.widget.jqx(...args);
    }

    __setLabel(label){
        if(!this.target.data('masterWidget'))
            return;

        switch(this.type){
            case 'dropdown':
                this.widget_target.jqxDropDownButton('setContent', 
                    `<div style="margin-left: 3px;line-height:${this.widget_target.height()}px" class="dropdown-input">${label}</div>`);
                break;
            case 'dialog':
                break;

        }
    }
}