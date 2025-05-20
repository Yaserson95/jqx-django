function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
}

function check_option_type(option, type){
	//If option must be a many types
	if(Array.isArray(type)){
		for(var i in type){
			try{
				check_option_type(option, type[i]);
				return;
			}catch(e){}
		}
		throw new Error(`Option types must be a ${type.join(', ')}`);
	}

	//If option must be a array
	else if(type === 'array'){
		if(!Array.isArray(option)) 
			throw new Error(`Option type must be a "array"`);
		else return;
	}
	//If option must be a JS type
	else if(typeof type === 'string' && typeof option !== type)
		throw new Error(`Option type must be a "${type}"`);

	//If option must be a class object
	else if(typeof type === 'function' && !option instanceof type)
		throw new Error(`Option type must be a "${type.constructor.name}"`);
}

function check_option(option, pattern){
	
	var required = pattern.required!==undefined? pattern.required: true;

	//Default value
	if(option === null || option === undefined)
		option = pattern.default!==undefined? pattern.default: null;

	//Check is required
	if(option === null){
		if(required)
			throw new Error(`Option is required`);
		else return null;
	}

	//Check option type
	if(pattern.type !== undefined)
		check_option_type(option, pattern.type);

	return option;

}
function check_options(options, patterns){
	var new_options = {};
	for(var i in patterns){
		try{
			var name = (patterns[i].name !== undefined)? patterns[i].name: i;
			new_options[name] = check_option(pop_attr(options, i, null), patterns[i]);
		}catch(e){
			e.message = i + ' - ' + e.message.toLowerCase();
			throw e;
		}
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

function copyKeys(obj, keys){
	var newObj = {};
	for(var i in keys){
		if(obj[keys[i]] !== undefined)
			newObj[keys[i]] = obj[keys[i]];
	}
	return newObj;
}

/**
 * Creating random string
 * @param {number} len length of string
 * @param {string} template symbols
 * @returns {string}
 */
function make_str(len=16, template='0123456789ABCDEF'){
	var str = "";
	for(var i=0; i<len; i++){
		var s = Math.ceil(Math.random()*(template.length - 1));
		str+=template[s];
	}
	return str;
}

/**
 * Get Font Awesome icon element
 * @param {string} icon 
 * @returns {jQuery}
 */
function faicon(icon){
    return $('<i/>', {'class': `fa fa-${icon}`});
}

function getСookie(name){
	var keyvals = document.cookie.split('; ');
	var cookie = {};
	for(var i in keyvals){
		var k = keyvals[i].split('=');
		cookie[k[0]] = k[1];
	}
	if(name !== undefined)
		return cookie[name];
	return cookie;
}

function empty(value){
	if(Array.isArray(value))
		return value.length === 0;
	return (value === "") || (value === null);
}

function camelToKebab(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Добавляем дефис между строчной и заглавной буквой
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Обрабатываем аббревиатуры (например, XML → X-M-L)
        .toLowerCase(); // Преобразуем все в нижний регистр
}

/**
 * 
 * @param {object} obj 
 * @param {string} template
 * @returns {string}
 */
function renderStrTemplate(obj, template){
	var str = "";
	var items = template.split(STR_TEMPLATE_REGEX);
	for(var i in items)
		str += (i%2!==0)? obj[items[i]]: items[i];
	
	return str;
}

function buildTree(items) {
    // Создаем хэш-таблицу для быстрого доступа и корневой массив
    const map = {};
    const roots = [];

    // Первый проход: создаем все узлы
    items.forEach(item => {
        map[item.id] = { ...item, Items: [] };
    });

    // Второй проход: связываем узлы между собой
    items.forEach(item => {
        const node = map[item.id];
        
        if (item.parent !== null && item.parent !== undefined) {
            // Если родитель существует, добавляем к нему потомка
            if (map[item.parent]) {
                map[item.parent].Items.push(node);
            } 
            // Опционально: обработка случая с "битым" parent
            // else {
            //     console.warn(`Parent ${item.parent} not found for item ${item.id}`);
            // }
        } else {
            // Добавляем корневые элементы
            roots.push(node);
        }
    });

    return roots;
}