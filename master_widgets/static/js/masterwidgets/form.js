const IGNORED_TYPES = ['blank', 'button'];
const FIELD_TYPES = [
    'text', 'option', 'blank', 'button', 'color', 
    'boolean', 'password', 'label', 'time', 'date', 'datetime'
];
const FIELD_PROPS = {
    'textarea':[
        "width", "height", "disabled", "value", 
        "placeHolder", "minLength", "maxLength", 
        "theme", "rtl", "scrollBarSize",
    ],
    'list':['source', 'selectedIndex', 'selectedIndexes', 'width', 'height',
        'disabled', 'enableSelection', 'checkboxes', 'multiple', 'filterable',
        'displayMember', 'valueMember', 'itemHeight', 'theme', 'rtl',
        'allowDrag', 'allowDrop', 'scrollBarSize', 'renderer'
    ],
    'text':["placeHolder", "minLength", "maxLength"]
};

const BASE_VALIDATORS = {
    'required': (info)=>{
        return {
            'message': 'Заполните поле', 
            'action': 'keyup, blur', 
            'rule': 'required'
        };
    },
    'maxLength': (info)=>{
        return {
            'message': `Поле должно содержать меньше ${info.maxLength} символов`, 
            'action': 'keyup, blur', 
            'rule': `maxLength=${info.maxLength}`
        }
    },
    'minLength': (info)=>{
        return {
            'message': `Поле должно содержать минимум ${info.minLength} символов`, 
            'action': 'keyup, blur', 
            'rule': `minLength=${info.minLength}`
        }
    }
};

const CUSTOM_VALIDATORS = {
    'field': (field, info, validators) => {
        if(info.required){
            validators.push({
                'input': field[0],
                'message': 'Выбирите объект', 
                'action': 'keyup, blur', 
                'rule': function(input, commit){
                    var widget = (input).data('masterWidget');
                    if(!widget) return true;
                    return widget.value !== null;
                }
            });
        }
    }
};

class MasterForm extends MasterWidget{
    static isCustomType(type){
        return FIELD_TYPES.indexOf(type) === -1;
    }

    static getDefaultDateTime(){
        return new Date();
    }

    /**
     * 
     * @param {Date} datetime 
     * @param {string} type 
     */
    static dateTimeToStr(datetime, type='datetime'){
        if(!datetime) return null;
        var iso_str = datetime.toISOString();
        switch(type){
            case 'date':
                return iso_str.split(/\T|\./)[0];
            case 'time':
                return iso_str.split(/\T|\./)[1];
        }
        return iso_str;
    }

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
        this.__form_errors = {};
        super.init(options);
    }

    render(){
        this.attrs.backgroundColor = 'inital';
        this.attrs.borderColor = 'inital';
        super.render();
        this.updateFields();
        this.clear();
        var submit = this.jqx('getComponentByName', 'submit');
        if(submit){
            submit.click(()=>{
                this.validate();
            });
        }

        this.notification = $('<div/>', {'class':'form-notification'})
            .appendTo(this.target)
            .jqxNotification({ 
                'width': "auto", 
                'position': "top-right", 
                'opacity': 0.9,
                'closeOnClick': true, 
                'autoClose': false, 
                'showCloseButton': true, 
                'template': "mail", 
                'blink': true
            });
    }
    updateFields(){
        var validators = [];
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];
            var field = this.jqx('getComponentByName', info.name);
            this.createValidators(field, info, validators);
            this.initField(field, info);
        }
        this.target.jqxValidator({
            'rules':validators,
            'theme': this.theme,
            'hintType': "label"
        });
    };

    validate(){
        return this.target.jqxValidator('validate');
    }

    save(){
        this.jqx('submit');
    }

    submit(){
        if(this.validate())
            this.save();
    }

    initField(field, info){
        if(info.type === 'textarea'){
            defaults(info, {'height': 120, 'theme': this.theme});
            field.jqxTextArea(copyKeys(info, FIELD_PROPS.textarea));
        }

        var widget_info = field.data('jqxWidget');
        var widget_name = widget_info? widget_info.widgetName: null;

        switch(widget_name){
            case 'jqxInput':
                field.jqxInput(copyKeys(info, FIELD_PROPS.text));
                break;
            case 'jqxNumberInput':
                field.jqxNumberInput({
                    'decimalSeparator': ',',
                    'allowNull': true,
                    'decimalDigits': info.decimal_places,
                    'digits': info.max_digits,
                });
                break;
        }
    }

    createValidators(field, info, field_validators = []){
        //Server form errors
        field_validators.push({
            'input': field[0],
            'message':()=>{
                if(this.__form_errors[info.name]){
                    var mes = this.__form_errors[info.name].join('; ');
                    delete this.__form_errors[info.name];
                    return mes;
                }
                return 'Неправильно заполнено поле';
            }, 
            'action': 'keyup, blur', 
            'rule':(input, commit)=>{
                return this.__form_errors[info.name] === undefined;
            }
        });
        
        //Base form errors
        if(!MasterForm.isCustomType(info.type)){
            for(var f_name in BASE_VALIDATORS){
                if(info[f_name]){
                    var validator = BASE_VALIDATORS[f_name](info);
                    validator.input = field[0];
                    field_validators.push(validator);
                }
            }
        }
        if(CUSTOM_VALIDATORS[info.type])
                CUSTOM_VALIDATORS[info.type](field, info, field_validators);
        return field_validators;
    }


    /**
     * 
     * @param {Array} template 
     * @returns 
     */
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
        if(IGNORED_TYPES.indexOf(item.type)===-1)
            this.__fields_info.push(item);

        //Init default values
        if(item.default === undefined){
            switch(item.type){
                case 'time':
                case 'date': 
                case 'datetime':
                    item.default = MasterForm.getDefaultDateTime;
                    break;
                case 'checkbox':
                    item.default = true;
                    break;
                default:
                    item.default = null;
                    break;
            }
        }
        return item;
    }
    message(text, options = null){
        this.target.masterMessage(text, options);
        return this;
    }

    clear(){
        this.__form_errors = {};
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];
            var field = this.jqx('getComponentByName', info.name);
            var default_val = (typeof info.default === 'function')? info.default(): info.default;
            field.val(default_val);
        }
    }

    formatValues(values){
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];

            if(!values[info.name]) continue;

            var field = this.jqx('getComponentByName', info.name);
            var widget_info = field.data('jqxWidget');
            var widget_name = widget_info? widget_info.widgetName: null;
            
            switch(widget_name){
                case 'jqxDateTimeInput':
                    values[info.name] = MasterForm.dateTimeToStr(field.jqxDateTimeInput('getDate'), info.type);
                    break;
            }
        }
        return values;
    }

    set template(template){
        if(this.target.data('masterWidget'))
            throw new Error('Form is initialized');
        
        this.__fields_info = [];
        this.__template = this.iniTemplate(template);
    }

    /**
     * @returns {Array}
     */
    get template(){
        return this.__template || null;
    }

    set value(value){
        this.jqx_target.val(value);
    }

    get value(){
        return this.formatValues(this.jqx_target.val());

    }

    get fields(){
        var fields = {};
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];
            fields[info.name] = this.jqx('getComponentByName', info.name);
        }
        return fields;
    }
}

class MasterModelForm extends MasterForm{
    static detectStringType(fieldInfo) {
        if (fieldInfo.write_only) return 'password';
        if (fieldInfo.format === 'email') return 'email';
        if (fieldInfo.format === 'url') return 'url';
        return 'text';
    }

    static getTemplateItem(name, opts){
        var element = {
            labelWidth: '80px',
            width: '250px',
            ...Object.assign({},opts),
            'bind': name,
            'name': name
        };
        switch (element.type) {
            case 'string':
                element.type = MasterModelForm.detectStringType(element);
                break;
            case 'integer':
            case 'decimal':
                element.type = 'number';
                break;
            case 'boolean':
                element.type = 'checkbox';
                break;
            case 'choice':
                element.type = 'dropdown';
                element.options = element.choices?.map(c => ({
                    value: c.value,
                    label: c.display_name
                })) || [];
                delete element.choices;
                break;
            case 'date':
                element.formatString = 'dd.MM.yyyy';
                break;
            case 'datetime':
                element.formatString = 'dd.MM.yyyy HH:mm:ss';
                break;
            case 'time':
                element.formatString = 'HH:mm:ss';
                break;
            case 'field':
                break;
            default:
                element.type = 'text';
                break;
        }
        return element;
    }

    init(attrs={}){
        defaults(attrs, {'template': []});
        new MasterModelLoader(this);
        super.init(attrs);
    }

    load(){
        var template = this.getModelTemplate(this.model.getModelOptions());
        this.__template = this.iniTemplate(template).concat(this.__template);
    }

    getModelTemplate(options){
        var template = [];
        for(var i in options){
            if(i !== this.model.id)
                template.push(MasterModelForm.getTemplateItem(i, options[i]));
        }
        return template;
    }

    render(){
        super.render();
        if(this.id)  this.id = this.id;
    }

    initField(field, info){
        super.initField(field, info);
        var relation = this.model.getRelation(info.bind);
        if(info.type === 'field' && relation){
            var opts = copyKeys(info, FIELD_PROPS.list);
            opts.model = relation.related_object.toLowerCase();
            opts.type = 'dropdown';
            if(relation.type === 'ManyToManyField') opts.checkboxes = true;
            new MasterListInput(field, opts);
        }
    }

    set id(id){
        this.__id = id;
        if(!this.target.data('masterWidget')) return;
        this.clear();
        if(id===null||id===undefined||id==='') return;
        this.loader(this.model.retrieve(id)).then(value => {
            this.jqx_target.val(value);
        });
    }

    get id(){
        return this.__id || null;
    }
    save(){
        if(!this.validate()) return;
        var form_data = this.value;
        var savePrm = this.__id? this.model.update(this.__id, form_data):
            this.model.create(form_data);

        return this.loader(savePrm)
            .then((data=>{this.onSave(data, true);}))
            .catch((e=>{
                this.message(`Ошибка: ${e.statusText}`, {'template':'error',});
                if(e.responseJSON){
                    this.__form_errors = e.responseJSON;
                    this.validate();
                }
            }));
    }

    onSave(data, create=false){
        data = this.model.formatData(data);
        this.message('Данные сохранены', {'template':'success',});
        if(create){
            this.__id = data[this.model.id];
            this.trigger('create', [data]);
        }else this.trigger('update', [data]);
        this.trigger('save',[data, create]);
    }
};

class MasterFormDialog extends MasterDialog{
    init(attrs = {}){
        if(attrs.model)
            attrs.widgetClass = MasterModelForm;
        else attrs.widgetClass = MasterForm;
        super.init(attrs);
    }
    renderContent(){
        super.renderContent();
        this.on({
            'close': ()=>{this.__closeDrodDowns()},
            'click': (e)=>{
                //this.__closeDrodDowns($(e.target));
            }
        });
    }

    confirm(){
        this.widget.submit();
    }

    __closeDrodDowns(target=null){
        var fields = this.widget.fields;
        for(var i in fields){
            var fld = fields[i];
            var data = fld.data('jqxWidget');            
            if(!data) continue;
            if(data.widgetName === 'jqxDropDownButton'){
                fld.jqxDropDownButton('close');
            }
        }
    }
}