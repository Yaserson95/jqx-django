class MasterForm extends MasterWidget{
    initTarget(target){
        target = super.initTarget(target);
        if(target.prop('tagName')!=='FORM'){
            target.addClass('master-form-panel');
            target = $('<form/>').appendTo(target);
        }
        return target;
    }

    init(opts){
        this.jqx_type = 'jqxForm';
        super.init(opts);
    }

    render(){
        this.target.addClass('master-form');
        super.render();
    }
}

class MasterModelForm extends MasterLoadedWidget{
    init(options = {}){
		options.widgetClass = MasterForm;
		super.init(options);
		this.config = this.attrs;
	}
    afterLoading(config){
        var widget = super.afterLoading(config);
        if(this.parent.is_opened_after)
            this.parent.open();

        return widget;
    }
}

class MasterModelFormDialog extends MasterDialog{
    init(options = {}){
        this.is_opened_after = false;
        super.init(options);
    }
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'buttons': {'type': 'array'},
            'source': {'type': 'string'},
            'formOptions': {'type': 'object', 'default': {}, 'name': 'form_options'}
        }});
	}
    renderContent(panel){
        this.form_options.url = this.source;
        this.form_options.parent = this;
        this.form = new MasterModelForm(panel, this.form_options);
        return super.renderContent(panel);
    }

    open(){
        this.is_opened_after = true;
        if(!this.form.in_process)
            super.open();
    }
}