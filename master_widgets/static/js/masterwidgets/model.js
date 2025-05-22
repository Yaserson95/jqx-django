class MasterDataSet{
    constructor(manager){
        this.manager = manager;
        this.page = manager.page;
        this.pageSize = manager.pageSize;
        this.filters = {};
        this.ordering = [];
    }

    set page(page){
        if(page < 1)
            throw new Error('Номер страницы должен быть больше или равен 1.');

        if(page !== this.__page){
            this.__page = page;
            this.process = null;
            this.__data = null;
        }
    }

    get page(){
        return this.__page;
    }

    set pageSize(page_size){
        if (page_size < 1) {
            throw new Error('Размер страницы должен быть больше или равен 1.');
        }

        if(this.__page_size !== page_size){
            this.__page_size = page_size;
            this.process = null;
            this.__data = null;
            this.__count = null;
        }
    }

    get pageSize(){
        return this.__page_size;
    }

    async data(){
        if(this.process)
            return this.process;

        this.process = new Promise(async (resolve, reject)=>{
            this.in_process = true;
            this.__resolve = resolve;
            this.__reject = reject;
            await this.initAdapter();
            this.adapter.dataBind();
        });
        return this.process;
    }

    async count(){
        if(!this.__count){
            this.page = 1;
            await this.data();
        }
        return this.__count;
    }

    async pagesCount(){
        return Math.floor(await this.count() / this.pageSize);
    }

    async initAdapter(){
        if(!this.adapter){
            this.adapter = await this.manager.getAdapter({
                'formatData': (request_data)=>{
                    return {
                        ...request_data,
                        ...this.filters,
                        'page': this.page,
                        'pagesize': this.pageSize,
                        'ordering': this.ordering.join(',')
                    }
                },

                'beforeLoadComplete': (records)=>{
                    this.__data = records;
                    this.__resolve(records);
                    return records;
                },
                'loadComplete':(data)=>{
                    this.__count = data.count;
                },
                'loadError': (err)=>{
                    this.__reject(null);
                    this.manager.__adapter_options.loadError(err);
                }
            }, true);
        }
    }
    /**
     * Установить фильтры
     * @param {object} filters - Объект фильтров { field: value }
     */
    filter(filters) {
        this.filters = { ...filters };
        this.process = null;
        this.__data = null;
        return this;
    }

    /**
     * Установить сортировку
     * @param {string[]} ordering - Массив полей сортировки ['field', '-field']
     */
    order_by(ordering) {
        this.ordering = [...ordering];
        this.process = null;
        this.__data = null;
        return this;
    }
}

class MasterModel{
    static set(models){
        this.__models = models
    }

    static get(name){
        var model_info = this.models[name];
        if(!this.base_url)
            throw new Error('Models base url is not defined');

        if(model_info === undefined) return null;
        if(!model_info.manager)
            model_info.manager = new MasterModel(`${this.base_url}${name}/`, model_info);
        return model_info.manager;
    }

    static getByName(class_name){
        for(var i in this.models){
            if(this.models[i].class_name === class_name)
                return this.get(i);
        }
        return null;
    }
    static get models(){
        return this.__models || {};
    }

    /**
     * Конструктор класса MasterModel.
     * @param {string} endpoint - URL API для работы с моделью.
     * @param {object} options - Дополнительные параметры (например, заголовки, CSRF-токен и т.д.).
     */
    constructor(endpoint, options = {}) {
        this.endpoint = endpoint;
        this.options = {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getСookie('csrftoken') // Получаем CSRF-токен из куки
            },
            'id': 'id',
            ...options
        };
        this.datafields = []; // Поля данных
        this.page = 1; // Текущая страница
        this.pageSize = 10; // Размер страницы
    }

    /**
     * Запрашивает методанные модели через OPTIONS
     * @returns {Promise}
     */
    initModelOptions(){
        const prm = new Promise((resolve, reject)=>{
            if(this.__model_options){
                resolve(this.__model_options);
            }else{
                $.ajax({
                    'url': this.endpoint,
                    'method': 'OPTIONS',
                    'headers': this.options.headers,
                    'success': (options)=>{resolve(options)},
                    'error': (e)=>{reject(e)}
                });
            }
        });
        prm.then((options)=>{
            if(!this.__model_options)
                this.__model_options = options.actions.POST;
        }).catch((e)=>{
            console.error('Ошибка при инициализации модели данных:', e);
            throw e;
        })
        return prm;
    }

    /**
     * Возвращает параметры модели данных
     * @returns {object}
     */
    getAdapterOptions(options){
        return {
            'datatype': 'json',
            'datafields': this._parseDataFields(options),
            'url': this.endpoint,
            'id': this.options.id,
            'root': 'results',
            'autoBind': false,
            'loadError': (jqXHR, status, error) => {
                console.error('Ошибка при загрузке данных:', error);
            },
            'beforeSend': (xhr) => {
                for(var i in this.options.headers)
                    xhr.setRequestHeader(i, this.options.headers[i]);
            }
        }
    }

    /**
     * Возвращает адаптер данных или промис, если указано свойство autoinit=true
     * @param {object} [adapter_options={}] дополнительные (переопределённые) параметры адаптера
     * @param {boolean} [autoinit=false] флаг автоматической инициализации параметров модели
     * @returns {Promise|object}
     */
    getAdapter(adapter_options = {}, autoinit = false){
        //Если переметры адаптера уже проинициализированы
        if(this.__adapter_options)
            return new $.jqx.dataAdapter({...this.__adapter_options, ...adapter_options});

        //Если не указана автоматическая инициализация параметров
        if(!autoinit){
            const options = this.getModelOptions();
            if(options === null)
                throw new Error('Модель данных не инициализирована');
            
            this.__adapter_options = this.getAdapterOptions(options);
            return this.getAdapter(adapter_options);
        }

        //В остальных случаях модель будет загружаться автоматически и возвращаться промис
        return (async()=>{
            await this.initModelOptions();
            return this.getAdapter(adapter_options);
        })();
    }

    getChoicesAdapter(options={}){
        return new $.jqx.dataAdapter({
            ...options,
            'url': `${this.endpoint}choices/`,
            'datatype': 'json',
            'id': 'value',
            'root': 'results',
            'autoBind': false,
            'datafields': [
                {'name': 'label', 'type': 'string'},
                {'name': 'value', }
            ]
        });
    }

    /**
     * Возвращает параметры модели данных
     * @returns {object|null}
     */
    getModelOptions(){
        if(!this.__model_options)
            return null;
        return this.__model_options;
    }

    /**
     * Установить текущую страницу.
     * @param {number} page - Номер страницы.
     */
    setPage(page) {
        if (page < 1) {
            throw new Error('Номер страницы должен быть больше или равен 1.');
        }
        this.page = page;
    }

    /**
     * Установить размер страницы.
     * @param {number} pageSize - Размер страницы (количество записей на странице).
     */
    setPageSize(pageSize) {
        if (pageSize < 1) {
            throw new Error('Размер страницы должен быть больше или равен 1.');
        }
        this.pageSize = pageSize;
    }

    formatData(data){
        var is_many = Array.isArray(data);
        var adapter = this.getAdapter({
            'datatype': 'array',
            'localdata': is_many? data: [data],
            'url': null
        });
        adapter.dataBind();
        if(!is_many)
            return adapter.records[0];
        return adapter.records;
    }

    /**
     * Парсинг полей данных из метаданных.
     * @param {object} postActions - Метод POST из ответа OPTIONS.
     * @returns {Array} - Массив объектов datafields.
     */
    _parseDataFields(postActions) {
        const datafields = [];
        for (const fieldName in postActions) {
            const field = postActions[fieldName];
            datafields.push({
                name: fieldName,
                type: this._getFieldType(field.type)
            });
        }
        return datafields;
    }

    /**
     * Определение типа поля на основе данных из OPTIONS.
     * @param {string} fieldType - Тип поля из метаданных.
     * @returns {string} - Тип поля для jqxDataAdapter.
     */
    _getFieldType(fieldType) {
        switch (fieldType) {
            case 'integer':
            case 'number':
            case 'decimal':
            case 'float':
                return 'number';
            case 'boolean':
                return 'bool';
            case 'date':
            case 'datetime':
                return 'date';
            default:
                return 'string';
        }
    }

    getRelation(name){
        return this.options.relations[name] || null;
    }

    /**
     * Получить список объектов.
     * @param {object} params - Параметры запроса (например, фильтры, пагинация).
     * @returns {MasterDataSet} - Промис с результатом запроса.
     */
    list(){
        return new MasterDataSet(this);
    }

    /**
     * Получить один объект по ID.
     * @param {number|string} id - ID объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async retrieve(id) {
        const data = await new Promise(async (resolve, reject) => {
            const adapter = await this.getAdapter({
                "url": this.endpoint + id + '/',
                'beforeLoadComplete': (records)=>{
                    resolve(records);
                },
                'loadError': (err)=>{
                    reject(null);
                }
            }, true);
            adapter.dataBind();
        });
        if(data.length > 0) return data[0];
        return null;
    }

    async getChoiceItem(id){
        const data = await new Promise(async (resolve, reject) => {
            const adapter = await this.getChoicesAdapter({
                'beforeLoadComplete': (records)=>{
                    resolve(records);
                },
                'loadError': (err)=>{
                    reject(null);
                }
            }, true);
            adapter._source.url += `${id}/`;
            adapter.dataBind();
        });
        if(data.length > 0) return data[0];
        return null;
    }

    /**
     * Создать новый объект.
     * @param {object} data - Данные для создания объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async create(data){
        try {
            const response = await $.ajax({
                url: this.endpoint,
                method: 'POST',
                data: JSON.stringify(data),
                headers: this.options.headers
            });
            return response;
        } catch (error) {
            console.error('Ошибка при создании объекта:', error);
            throw error;
        }
    }

    /**
     * Обновить объект.
     * @param {number|string} id - ID объекта.
     * @param {object} data - Данные для обновления объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async update(id, data, partial=false) {
        try {
            const response = await $.ajax({
                url: `${this.endpoint}${id}/`,
                method: partial? 'PATCH': 'PUT',
                data: JSON.stringify(data),
                headers: this.options.headers
            });
            return response;
        } catch (error) {
            console.error('Ошибка при обновлении объекта:', error);
            throw error;
        }
    }

    /**
     * Удалить объект.
     * @param {number|string} id - ID объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async destroy(id){
        try {
            const response = await $.ajax({
                url: `${this.endpoint}${id}/`,
                method: 'DELETE',
                headers: this.options.headers
            });
            return response;
        } catch (error) {
            console.error('Ошибка при удалении объекта:', error);
            throw error;
        }
    }

    get verbose_name(){
        return this.options.verbose_name || null;
    }

    get verbose_name_plural(){
        return this.options.verbose_name_plural || null;
    }

    get class_name(){
        return this.options.class_name || null;
    }

    get id(){
        return this.options.id || 'id';
    }
}

(jQuery)(function($){
    MasterModel.base_url = $.masterWidget.option('models_url');
    MasterModel.set($.masterWidget.option('models'));
    $.masterModel = MasterModel;
});