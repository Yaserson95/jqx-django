function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
}

function check_options(options, patterns){
	var new_options = {};
	for(var i in patterns){
		var def = patterns[i].default!==undefined? patterns[i].default: null;
		var required = patterns[i].required!==undefined? patterns[i].required: true;
		var option = pop_attr(options, i, def);
		if(option === null){
			if(required){
				throw new Error(`Option "${i}" is required`);
			}else{
				
				new_options[i] = option;
				continue;
			}
		}

		if(patterns[i].type !== undefined){
			if(typeof patterns[i].type === 'string'){
				switch(patterns[i].type){
					case 'array':
						if(!Array.isArray(option))
							throw new Error(`Option "${i}" type must be a "array"`);
						break;
					default:
						if(typeof option !== patterns[i].type)
							throw new Error(`Option "${i}" type must be a "${patterns[i].type}"`);
						break;
				}
			}else if(typeof patterns[i].type === 'function' && !option instanceof patterns[i].type){
				throw new Error(`Option "${i}" type must be a "${patterns[i].type.constructor.name}"`);
			}
		}
		if(patterns[i].name !== undefined)
			new_options[patterns[i].name] = option;
		else new_options[i] = option;
	}
	return new_options;
}

function apply_options(cls_object, obj){
	for(var i in obj)
		cls_object[i] = obj[i];
}

function set_default(obj, name, def=null){
	if(obj[name] === undefined)
		obj[name] = def;
}

/**
 * 
 * @param {object} obj 
 * @param {object} defaults 
 * @returns 
 */
function defaults(obj, defaults){
	for(var i in defaults){
		if(obj[i] === undefined)
			obj[i] = defaults[i];
	}
	return obj;
}

/**
 * 
 * @param {object} obj 
 * @param {Array} keys 
 */
function splitObject(obj, keys){
	var new_obj = {};
	for(var i in keys){
		if(obj[keys[i]] === undefined)
			continue;
		new_obj[keys[i]] = obj[keys[i]];
		delete(obj[keys[i]]);
	}
	return new_obj;
}


/**
 * Get Font Awesome icon element
 * @param {string} icon 
 * @returns {jQuery}
 */
function faicon(icon){
    return $('<i/>', {'class': `fa fa-${icon}`});
}

class MasterWidget{
	constructor(target, options){
		this.target = this.initTarget($(target));
		this.init(options);
		this.render();
	}
	widgetOptionsPatterns(patterns = {}){
		return {...patterns, ...{
			'parent':{'required': false, 'type': MasterWidget}
		}};
	}

	init(options = {}){
		apply_options(this, check_options(options, this.widgetOptionsPatterns()));
		this.attrs = options;
	}
	initTarget(target){
		return target;
	}

	render(){
		this.jqx(this.attrs);
	}

	jqx(...args){
		if(typeof this.jqx_type !== 'string')
			return;
		return this.target[this.jqx_type](...args);
	}
	id(){
		return this.target.attr('id');
	}
};

class MasterLoadedWidget extends MasterWidget{
	widgetOptionsPatterns(){
		return super.widgetOptionsPatterns({
			'url': {'type': 'string'},
			'request': {'type': 'object', 'default':{'method': 'GET'}},
			'widgetClass': {'type': 'function', 'name':'widget_class'},
			'autoload': {'type': 'boolean', 'default': true},
			'config': {'type': 'object', 'default': {}}
		});
	}

	init(opts){
		this.in_process = false;
		this.has_errors = false;
		this.is_load = false;
		super.init(opts);
	}

	render(){		
		this.request.success = (data)=>{
			this.showSpinner(false);
			this.in_process = false;
			this.is_load = true;
			this.widget = this.afterLoading(data);
		}

		this.request.error = (err)=>{
			this.in_process = false;
			this.has_errors = true;
			console.error(err);
			this.showSpinner(false);
		}
		if(this.autoload) this.load();
		super.render();
	}

	load(){
		this.showSpinner(true);
		this.in_process = true;
		$.ajax(this.url, this.request);
	}

	afterLoading(config){
		return new this.widget_class(this.target, {...config, ...this.config});
	}
	showSpinner(show=true){}
}

(jQuery)(function($){
	$.fn.inParents = function(elem){
		/**
		 * @type {Array}
		 */
		var parents = $(elem).parents().toArray();
		var elements = $(this).toArray();

		parents.unshift($(elem)[0]);

		for(var i in parents){
			for(var j in elements){
				if(elements[j]===parents[i])
					return parents[i];
			}
		}
		return false;
	}
});