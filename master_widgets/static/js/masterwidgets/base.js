function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
}

function set_default(obj, name, def=null){
	if(obj[name] === undefined)
		obj[name] = def;
}

class MasterWidget{
	constructor(target, options){
		this.target = $(target);
		this.init(options);
		this.render();
	}

	init(options = {}){
		this.attrs = options;
	}

	render(){
		this.jqx(this.attrs);
	}

	jqx(...args){
		if(typeof this.jqx_type !== 'string')
			return;
		return this.target[this.jqx_type](...args);
	}
};

class MasterLoadedWidget extends MasterWidget{
	init(options){
		if(typeof options.url !== 'string')
			throw new Error('URL type is not correct');
		if(typeof options.widget !== 'function')
			throw new Error('Widget class type is not correct');
		super.init(options);
	}

	render(){
		var autoload = this.attrs.autoload || false;
		var request_opts = typeof this.attrs.request === 'object'?
			this.attrs.request: {'method': 'GET'};
		
		request_opts.success = (data)=>{
			this.showSpinner(false);
			this.widget = this.afterLoading(data);
		}

		request_opts.error = (err)=>{
			console.error(err);
			this.showSpinner(false);
		}

		this.attrs.request = request_opts;
		if(autoload)
			this.load();

		super.render();
	}

	load(){
		this.showSpinner(true);
		$.ajax(this.attrs.url, this.attrs.request);
	}

	afterLoading(config){
		if(typeof this.attrs.config === 'object')
			config = {...config, ...this.attrs.config};
		return new this.attrs.widget(this.target, config);
	}
	showSpinner(show=true){}
}

(jQuery)(function($){
	$.fn.inParents = function(elem){
		var parents = this.parents().toArray();
		for(var i in parents){
			if(elem === parents[i]){
				return true;
			}
		}
		return false;
	}
});