class MasterDataSet{
    constructor(manager){
        this.manager = manager;
        this.page = manager.page;
        this.pageSize = manager.pageSize;
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
                    request_data.page = this.page;
                    request_data.pagesize = this.pageSize;
                    console.log(request_data);
                    return request_data;
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
            });
        }
    }
}

class MasterModel{
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
            ...options
        };
        this.datafields = []; // Поля данных
        this.page = 1; // Текущая страница
        this.pageSize = 10; // Размер страницы
    }

    async getModelOptions(){
        try {
            // Запрашиваем метаданные модели через OPTIONS
            return await $.ajax({
                url: this.endpoint,
                method: 'OPTIONS',
                headers: this.options.headers
            });
        }catch (error) {
            console.error('Ошибка при инициализации адаптера данных:', error);
            throw error;
        }
    }

    async initAdapterOptions(){
        if(!this.__model_options)
            this.__model_options = await this.getModelOptions();


        return {
            'datatype': 'json',
            'datafields': this._parseDataFields(this.__model_options.actions.POST),
            'url': this.endpoint,
            'id': 'id', // Поле ID по умолчанию
            'root': 'results',
            'autoBind': false,
            'loadError': (jqXHR, status, error) => {
                console.error('Ошибка при загрузке данных:', error);
            }
        }
    }

    async getAdapter(adapfer_options = {}){
        if(!this.__adapter_options)
            this.__adapter_options = await this.initAdapterOptions();

        return new $.jqx.dataAdapter({...this.__adapter_options, ...adapfer_options});
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

    /**
     * Получить список объектов.
     * @param {object} params - Параметры запроса (например, фильтры, пагинация).
     * @returns {MasterDataSet} - Промис с результатом запроса.
     */
    list(){
        return new MasterDataSet(this)
    }

    /**
     * Получить один объект по ID.
     * @param {number|string} id - ID объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async retrieve(id) {
        var adapter = await this._getDA();
        adapter._source.url = `${this.endpoint}${id}/`;
        const data = await new Promise((resolve, reject) => {
            //this._load_promises = {'resolve':resolve, 'reject':reject, 'details':true};
            adapter.dataBind();
        });
        delete(this._load_promises);
        return data;
    }

    /**
     * Создать новый объект.
     * @param {object} data - Данные для создания объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async create(data) {
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
    async update(id, data) {
        try {
            const response = await $.ajax({
                url: `${this.endpoint}${id}/`,
                method: 'PUT',
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
}