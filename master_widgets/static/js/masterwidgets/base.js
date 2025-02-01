function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
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

	render(){}

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

		super.render();
		
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