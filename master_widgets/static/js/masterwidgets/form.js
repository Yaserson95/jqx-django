class MasterForm extends MasterWidget{
    static getValidator(field, validator){
        var val = {
            'input': field,
            'action': 'keyup, blur',
        };
        
        switch(validator.rule){
            case 'required':
                val.rule = 'required';
                val.message = 'Поле должно быть заполнено';
                break;
            case 'notnull':
                val.message = 'Поле должно быть заполнено';
                val.rule = function(input, commit){
                    var val = $(input).val();
                    return val !== "" && val !==null;
                }
                break;
            case 'minValue':
                val.rule = function(input, commit){
                    var val = parseFloat($(input).val()||0);
                    return val >= validator.limit_value;
                }
                break;
            case 'maxValue':
                val.rule = function(input, commit){
                    var val = parseFloat($(input).val()||0);
                    return val <= validator.limit_value;
                }
                break;
            default:
                val = {...val, ...validator};
                break;
        }
        return val;
    }

    static parseVal(val, type){
        if(val === '' || val === null) return null;
        switch(type){
            case 'date':
            case 'datetime':
                return new Date(Date.parse(val));
            case 'number':
                return parseInt(val);
        }
        return val;
    }

    static formatVal(val, type){
        if(val === '' || val === null) return null;
        switch(type){
            case 'date':
                return new Date(val).toISOString().slice(0, 10);
            case 'datetime':
                return new Date(val).toISOString();
        }
        return val.toString();
    }

    
    static setValue(field_data, value){
        value =  MasterForm.parseVal(value, field_data.type);
        if(field_data.type === 'label')
            $(field_data.field).text(value);
        else $(field_data.field).val(value);
    }

    static getValue(field_data){
        var field = $(field_data.field);
        var widgetData = field.data('jqxWidget');
        var widget = (widgetData!==undefined)? widgetData.widgetName: null;
        var value;
        switch(widget){
            case 'jqxDropDownList':
                value = field.jqxDropDownList('getSelectedItem').value;
                break;
            default:
                value = (field_data.type === 'label')? field.text(): field.val();
                break;
        }
        return MasterForm.formatVal(value, field_data.type);
    }

    static clearField(field_data){
        switch(field_data.type){
            case 'option':
                $(field_data.field).jqxDropDownList('selectIndex', 0);
                break;
            case 'label':
                $(field_data.field).text('');
                break;
            default:
                $(field_data.field).val('');
                break;
        }
    }

    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
            'rowDefault': {'type': 'object', 'name': 'row_default', 'default':{
                'all':{'labelWidth': '40%', 'width': '100%'},
                'date':{'labelWidth': '40%', 'width': '98%'}
            }},
            'action':{'type': 'string', 'default':'/'},
            'saveRequest': {'type': 'object', 'name': 'save_request', 'default':{'method': 'POST'}},
            'id': {'type':'string', 'default': 'id'}
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

    /**
     * 
     * @param {Array} template 
     */
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
        template.unshift({
            'name':'errorLabel',
            'type':'label'
        });
    }

    updateValidators(field_data){
        //Add required field validation rule
        if(field_data.required){
            var required_rule = (field_data.type === 'option')? 'notnull': 'required';
            this.validators.push(MasterForm.getValidator(field_data.field, {'rule': required_rule}));
        }

        //Add other validation rules
        for(var i in field_data.validators)
            this.validators.push(MasterForm.getValidator(field_data.field, field_data.validators[i]));

        //Add form errors validation
        this.validators.push({
            'message':'Неправильные данные',
            'input': field_data.field,
            'action': 'keyup, blur',
            'rule': (input, commit)=>{
                if(this.form_errors[field_data.name] !== undefined)
                    return false;
                return true;
            },
            hintRender:(message, input)=>{
                var server_messages = this.form_errors[field_data.name];
                var input_data = input.data('jqxWidget');
                input.addClass('jqx-validator-error-element');
                if(typeof input_data === 'object'){
                    console.log(input_data);
                    input_data.label.insertBefore(input_data.bar);
                    return input_data.label.html(server_messages.join('<br/>'));
                }
                return $('<label/>', {'class':'jqx-validator-error-label'})
                    .insertAfter(input)
                    .html(server_messages.join('<br/>'));
            }
        })
    }

    updateFields(){
        for(var i in this.fields_data){
            var field_data = this.fields_data[i];
            field_data.field =  this.jqx('getComponentByName', field_data.name);
            if(field_data.hidden)
                this.jqx('hideComponent', field_data.name);
            this.renderField(field_data);
        }
    }
    renderField(field_data){
        switch(field_data.type){
            case 'textarea':
                $(field_data.field).jqxTextArea({
                    'width': field_data.width,
                    'height': field_data.height || 100,
                    'theme': this.attrs.theme,
                });
                break;
        }
        this.updateValidators(field_data);
        return this;
    }

    init(opts){
        this.jqx_type = 'jqxForm';
        this.fields_data = [];
        this.validators = [];
        this.form_errors = {};
        super.init(opts);
    }

    render(){
        this.target.addClass('master-form');
        this.updateTemplate(this.attrs.template);
        this.jqx('hideComponent', 'errorLabel');
        super.render();
        this.updateFields();

        this.target.jqxValidator({
            'hintType': "label",
            'rules': this.validators,
        });
    }

    clear(){
        this.formError('');
        this.form_errors = {};
        for(var i in this.fields_data){
            MasterForm.clearField(this.fields_data[i]);
        }
    }

    value(val){
        if(val === undefined){
            var values = {};
            for(var i in this.fields_data){
                if(this.fields_data[i].bind === undefined) continue;
                var value = MasterForm.getValue(this.fields_data[i]);
                if(this.fields_data[i].bind === this.id && value === null)
                    continue;
                values[this.fields_data[i].bind] = value;
            }
            return values;
        }

        for(var i in this.fields_data){
            var value = val[this.fields_data[i].bind];

            if(value === undefined) continue;
            MasterForm.setValue(this.fields_data[i], value);
        }

        this.jqx((val[this.id] === undefined || val[this.id]===null)? 'hideComponent': 'showComponent', this.id);
    }

    async save(){
        var request = Object.assign({}, this.save_request);

        this.form_errors = {};
        this.formError('');

        if(!this.validate()) return false;

        request.data = this.value();
        request.data.csrfmiddlewaretoken = getСookie('csrftoken');

        try{
            var data = await $.ajax(this.action, request);
            this.trigger({'type': 'save', 'response': data});
        }catch(e){
            console.error(e);
            switch(e.status){
                case 400:
                    this.formError('Исправте следующие ошибки:');
                    this.__validationErrors(e.responseJSON);
                    this.validate();
                    break;
                default:
                    this.formError(`${e.status}: ${e.statusText}`);
                    break;
            }
        }
        return true;
    }

    validate(){
        return this.target.jqxValidator('validate');
    }
    __validationErrors(errors){
        if(typeof errors === 'object')
            this.form_errors = errors;
        else this.form_errors = {}
    }

    formError(text){
        var field = this.jqx('getComponentByName', 'errorLabel');
        $(field).text(text);
        if(text === ''){
            this.jqx('hideComponent', 'errorLabel');
        }else{
            this.jqx('showComponent', 'errorLabel');
        }
        return this;
    }

    formAction(url, request=null){
        this.action = url;
        if(request !== null)
            this.save_request = request;
        return this;
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

    formAction(url, request=null){
        if(this.widget !== undefined)
            this.widget.formAction(url, request);
        else{
            this.config.action = url;
            if(request !== null)
                this.config.saveRequest = request;
        }
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
            'formOptions': {'type': 'object', 'default': {}, 'name': 'form_options'},
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