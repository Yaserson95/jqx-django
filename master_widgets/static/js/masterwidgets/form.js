class MasterForm extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
            'rowDefault': {'type': 'object', 'name': 'row_default', 'default':{
                'all':{'labelWidth': '40%', 'width': '100%'},
                'date':{'labelWidth': '40%', 'width': '98%'}
            }},
            'action':{'type': 'string', 'default':'/'},
            'saveRequest': {'type': 'object', 'name': 'save_request', 'default':{'method': 'POST'}}
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
                set_default(template[i], 'name', template[i].bind);
            }

            if(template[i].bind){
                this.fields_data.push(template[i]);
            }
        }
    }

    getValidatorRules(){
        var rules = [];
        for(var i in this.fields_data){
            var field_data = this.fields_data[i];
            var field = this.jqx('getComponentByName', field_data.name);
            if(field_data.required){
                rules.push({
                    'input': field, 
                    'message': `Поле ${field_data.label} должно быть заполнено`,
                    'action': 'keyup, blur', 
                    'rule': 'required'
                });
            }
        }
        return rules;        
    }

    init(opts){
        this.jqx_type = 'jqxForm';
        this.fields_data = [];
        super.init(opts);
    }

    render(){
        this.target.addClass('master-form');
        this.updateTemplate(this.attrs.template);
        super.render();

        this.target.jqxValidator({
            'hintType': "label",
            'rules': this.getValidatorRules(),
        });
    }

    clear(){
        var value = {};
        for(var i in this.fields_data){
            value[this.fields_data[i].bind] = '';
        }

        this.target.val(value);
        this.target.find('.jqx-widget').each(function() {
            const widgetInfo = $(this).data('jqxWidget');
            switch (widgetInfo.widgetName) {
                case 'jqxDropDownList':
                    $(this).jqxDropDownList('selectIndex', 0);
                    break;
                case 'jqxDateTimeInput':
                    $(this).jqxDateTimeInput('val', null);
                    break;
                case 'jqxCheckBox':
                    $(this).jqxCheckBox('uncheck');
                    break;
                case 'jqxRadioButton':
                    $(this).jqxRadioButton('uncheck');
                    break;
                default:
                    $(this).val('');
            }
        });
    }

    value(values){
        if(values !== undefined){
            for(var i in this.fields_data){
                var bind = this.fields_data[i].bind;
                //console.log(bind);
                if(values[bind] === null || values[bind] === undefined)
                    continue;


                switch(this.fields_data[i].type){
                    case 'date':
                    case 'datetime':
                        values[bind] = new Date(Date.parse(values[bind]));
                        break;
                }
            }
        }
        return this.target.val(values);
    }

    getFields(){
        
    }

    save(){
        this.validate();
        
    }

    validate(){
        return this.target.jqxValidator('validate');
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
            widget.value(...this.value_args);
            delete(this.value_args);
        }

        return widget;
    }

    value(...args){
        if(this.widget === undefined){
            this.value_args = args;
            return null;
        }
        return this.widget.value(...args);
    }
    clear(){
        if(this.widget !== undefined)
            this.widget.clear();
    }

    validate(){
        if(this.widget !== undefined)
            this.widget.validate();
    }

    save(){
        if(this.widget !== undefined)
            this.widget.save();
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

    open(value){
        this.is_opened_after = true;
        if(value !== undefined) this.value(value);
        if(!this.form.in_process) super.open();
    }
    value(...args){
        this.form.value(...args);
    }

    confirm(){
        this.form.save();
    }
}