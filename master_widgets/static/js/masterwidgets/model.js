class MasterModel {
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
        this.dataAdapter = null; // Адаптер данных
        this.datafields = []; // Поля данных
        this.page = 1; // Текущая страница
        this.pageSize = 10; // Размер страницы
    }

    /**
     * Инициализация адаптера данных.
     * @returns {Promise} - Промис, который разрешается после инициализации адаптера.
     */
    async initDataAdapter() {
        try {
            // Запрашиваем метаданные модели через OPTIONS
            const optionsResponse = await $.ajax({
                url: this.endpoint,
                method: 'OPTIONS',
                headers: this.options.headers
            });

            // Определяем datafields на основе метаданных
            this.datafields = this._parseDataFields(optionsResponse.actions.POST);

            // Создаем адаптер данных
            this.dataAdapter = new $.jqx.dataAdapter({
                datatype: 'json',
                datafields: this.datafields,
                url: this.endpoint,
                id: 'id', // Поле ID по умолчанию
                root: 'results',
                autoBind: false,
                loadError: (jqXHR, status, error) => {
                    console.error('Ошибка при загрузке данных:', error);
                },
                // Добавляем параметры пагинации
                beforeLoadComplete: (records) => {
                    console.log(records);
                    return {
                        results: records.results, // Данные
                        totalRecords: records.count // Общее количество записей
                    };
                }
            });

            return this.dataAdapter;
        } catch (error) {
            console.error('Ошибка при инициализации адаптера данных:', error);
            throw error;
        }
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
        this._updateAdapterUrl();
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
        this._updateAdapterUrl();
    }

    /**
     * Обновить URL адаптера данных с учетом текущих параметров пагинации.
     */
    _updateAdapterUrl() {
        if (this.dataAdapter) {
            const url = `${this.endpoint}?page=${this.page}&page_size=${this.pageSize}`;
            this.dataAdapter.source._source.url = url;
            this.dataAdapter.dataBind(); // Перезагрузить данные
        }
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
     * Получить адаптер данных.
     * @returns {object} - Адаптер данных.
     */
    getDataAdapter() {
        if (!this.dataAdapter) {
            throw new Error('Адаптер данных не инициализирован. Вызовите initDataAdapter().');
        }
        return this.dataAdapter;
    }


    async _getDA(){
        if(!this.dataAdapter)
            await this.initDataAdapter();
        return this.getDataAdapter();
    }

    /**
     * Получить список объектов.
     * @param {object} params - Параметры запроса (например, фильтры, пагинация).
     * @returns {Promise} - Промис с результатом запроса.
     */
    async list() {
        var adapter = await this._getDA();

        const data = await new Promise((resolve, reject) => {
            adapter.dataBind((data) => {
                resolve(data);
            }, (error) => {
                reject(error);
            });
        });

        return data;
        /*try {
            const response = await $.ajax({
                url: this.endpoint,
                method: 'GET',
                data: { ...params, page: this.page, page_size: this.pageSize },
                headers: this.options.headers
            });
            return response;
        } catch (error) {
            console.error('Ошибка при получении списка объектов:', error);
            throw error;
        }*/
    }

    /**
     * Получить один объект по ID.
     * @param {number|string} id - ID объекта.
     * @returns {Promise} - Промис с результатом запроса.
     */
    async retrieve(id) {
        try {
            const response = await $.ajax({
                url: `${this.endpoint}${id}/`,
                method: 'GET',
                headers: this.options.headers
            });
            return response;
        } catch (error) {
            console.error('Ошибка при получении объекта:', error);
            throw error;
        }
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