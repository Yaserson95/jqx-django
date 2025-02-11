TOOL_PATTERNS = {
    'icon': {'type': 'string', 'required': false}, 
    'type': {'type': 'string', 'default': 'button'}, 
    'separator': {'type': 'boolean', 'default': true}, 
    'label': {'type': 'string'},
    'name': {'type': 'string'}
};

class MasterToolbar extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'buttons': {'type': 'array'},
        }});
	}
    init(attrs){
        this.jqx_type = 'jqxToolBar';
        super.init(defaults(attrs, {'height': 'auto'}));
    }

    render(){
        this.target.addClass('master-toolbar');
        this.attrs.tools = MasterToolbar.getTemplate(this.buttons);
        this.attrs.initTools = (...args) => {
            return this.renderTool(...args);
        };
        
        super.render();

        //Update tools
        var tools = this.jqx('getTools');
        var margin = this.target.css('padding-bottom');
        for(var i = 0; i < tools.length; i++){
            $(tools[i].tool).css('margin-bottom', margin);
        }
    }

    renderTool(type, index, tool, menuToolIninitialization){
        var options = Object.assign({}, this.buttons[index]);
        var item = check_options(options, TOOL_PATTERNS);

        switch(type){
            case 'button':
                MasterToolbar.initButton(tool, item).jqxButton(options);
                break;
            case 'toggleButton':
                MasterToolbar.initButton(tool, item).jqxToggleButton(options);
                break;
            case 'dropdownlist':
                tool.jqxDropDownList(options);
                break;
            case 'combobox':
                tool.jqxComboBox(options);
                break;
            case 'input':
                tool.jqxInput(options);
                break;
        }

        tool.attr('title', item.label || '');
        //this.option('buttons')[index].tool = tool;
        return tool;
    }

    static getTemplate(buttons){
        var template = '';
        for(var i in buttons){
            var type = buttons[i].type || 'button';
            var separator = buttons[i].separator === undefined? true: buttons[i].separator;
            if(template !== '')
                template += separator? ' | ': ' ';
            template += type;
        }
        return template;
    }

    static initButton(tool, item){
        if(item.icon !== null){
            tool.append(faicon(item.icon));
        }else{
            tool.text(item.label || '');
        }
        tool.attr('type', 'action');
        return tool;
    }
};