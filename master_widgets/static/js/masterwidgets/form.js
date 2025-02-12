class MasterForm extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
            'rowDefault': {'type': 'object', 'name': 'row_default', 'default':{
                'all':{'labelWidth': '40%', 'width': '100%'},
                'date':{'labelWidth': '40%', 'width': '98%'}
            }}
        }});
	}

    initTarget(target){
        target = super.initTarget(target);
        if(target.prop('tagName')!=='FORM'){
            target.addClass('master-form-panel');
            target = $('<form/>').appendTo(target);
        }
        return target;
    }
    updateTemplate(template){
        for(var i in template){
            if(Array.isArray(template[i].columns)){
                this.updateTemplate(template[i].columns);
            }else{
                if(this.row_default[template[i].type] !== undefined){
                    template[i] = defaults(template[i], this.row_default[template[i].type]);
                }else{
                    template[i] = defaults(template[i], this.row_default.all);
                }
                
            }
        }
    }

    init(opts){
        this.jqx_type = 'jqxForm';
        super.init(opts);
    }

    render(){
        this.target.addClass('master-form');
        this.updateTemplate(this.attrs.template);
        super.render();
    }

    value(...args){
        return this.target.val(...args);
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

        if(this.value_args !== undefined){
            widget.val(...this.value_args);
            delete(this.value_args);
        }

        return widget;
    }

    value(...args){
        if(this.widget === undefined){
            this.value_args = args;
            return null;
        }
        return this.widget.val(...args);
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