class MasterWidgetInput extends MasterWidget{
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'contentWidth': {'type': ['number', 'string'], 'name':'content_width', 'default': 300},
            'contentHeight': {'type': ['number', 'string'], 'name':'content_height', 'default': 200},
            'type': {'type': 'string', 'default': 'none'},
            ...patterns
        });
    }

    init(attrs = {}){
        defaults(attrs, {
            'width': 150,
            'height': 30
        });
        super.init(attrs);
    }

    renderDropDown(){
        this.widget_target = this.target;
        this.target = $('<div/>').appendTo(this.widget_target);
        this.widget_target.jqxDropDownButton({
            'theme': this.theme,
            'width':this.width,
            'height': this.height,
            'dropDownWidth': this.content_width,
            'dropDownHeight': this.content_height
        });
    }

    renderDialog(){

    }

    render(){
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
        this.__value = value;
    }

    get value(){
        return this.__value || null;
    }

    __setLabel(label){
        if(!this.target.data('masterWidget'))
            return;

        switch(this.type){
            case 'dropdown':
                this.widget_target.jqxDropDownButton('setContent', 
                    `<div style="margin-left: 3px;" class="dropdown-input">${label}</div>`);
                break;
            case 'dialog':
                break;

        }
    }
}