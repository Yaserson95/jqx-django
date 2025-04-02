class MasterForm extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
            'template': {'type':'array'}
        });
    }
    getWidgetOptions(){
        var opts = super.getWidgetOptions();
        var w = pop_attr(opts, 'width');
        var h = pop_attr(opts, 'height');
        opts.template = this.template;
        return opts;
    }

    init(options = {}){
        this.jqx_type = 'jqxForm';
        super.init(options);
    }

    render(){
        super.render();
        this.renderValidators();
        var submit = this.jqx('getComponentByName', 'submit');
        if(submit){
            submit.click(()=>{
                this.validate();
            });
        }

    }

    renderValidators(){
        var validators = [];
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];
            var field = this.jqx('getComponentByName', info.name);
            this.createValidators(field, info, validators);
        }
        this.target.jqxValidator({'rules':validators, 'theme': this.theme});
    };

    validate(){
        return this.target.jqxValidator('validate');
    }

    createValidators(field, info, field_validators = []){
        if(info.required)
            field_validators.push({
                'input': field[0], 
                'message': 'Заполните поле', 
                'action': 'keyup, blur', 
                'rule': 'required'
        });
        if(info.maxLength)
            field_validators.push({
                'input': field[0], 
                'message': `Поле должно содержать меньше ${info.maxLength} символов`, 
                'action': 'keyup, blur', 
                'rule': `maxLength=${info.maxLength}`
            });

        if(info.minLength)
            field_validators.push({
                'input': field[0], 
                'message': `Поле должно содержать минимум ${info.minLength} символов`, 
                'action': 'keyup, blur', 
                'rule': `minLength=${info.minLength}`
            });
        return field_validators;
    }



    iniTemplate(template){
        for(var i in template){
            if(template[i].columns){
                template[i].columns = this.iniTemplate(template[i].columns);
                continue;
            }
            template[i] = this.iniTemplateItem(template[i]);
        }
        return template;
    }
    iniTemplateItem(item){
        if(!item.name) item.name = item.bind;
        if(item.type !== 'button')
            this.__fields_info.push(item);
        return item;
    }

    set template(template){
        if(this.target.data('masterWidget'))
            throw new Error('Form is initialized');
        
        this.__fields_info = [];
        this.__template = this.iniTemplate(template);
    }
    get template(){
        return this.__template || null;
    }
}