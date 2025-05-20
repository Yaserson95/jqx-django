
$.include(['toolbar']).then(()=>{
    class MasterPaginator extends MasterToolbar{
        widgetOptionsPatterns(patterns = {}) {
            return super.widgetOptionsPatterns({
                'page': {'type': 'number', 'default': 1},
                'pageSize': {'type': 'number', 'name':'page_size', 'default': 10},
                'count': {'type': 'number'},
                ...patterns
            });
        }
        init(attrs = {}){
            attrs.buttons = [
                {'label':'<<', 'name':'firstPage', 'width': '30px', 'height': '100%'},
                {'label':'<', 'name':'prevPage', 'width': '30px', 'height': '100%'},
                {'name':'currentPage', 'type':'input', 'width': '40px', 'height': '100%'},
                {'name':'totalPages', 'type':'custom', 'height': '100%'},
                {'label':'>', 'name':'nextPage', 'width': '30px', 'height': '100%'},
                {'label':'>>', 'name':'lastPage', 'width': '30px', 'height': '100%'},
            ];

            defaults(attrs, {
                'width': '100%',
                'minWidth': 250,
                'height': 40
            });

            super.init(attrs);

            if(this.page > this.total_pages)
                this.page = this.total_pages;
        }

        render(){
            super.render();
            $(this.getTool('totalPages'))
                .addClass('total-pages')
                .text(`/${this.total_pages}`);
            
            $(this.getTool('currentPage'))
                .css('text-align','center')
                .val(this.page);

            this._bindEvents();
            this._updateButtons();
        }

        _bindEvents() {
            // Навигация
            $(this.getTool('firstPage')).on('click', () => this.page = 1);
            $(this.getTool('prevPage')).on('click', () => this.page--);
            $(this.getTool('nextPage')).on('click', () => this.page++);
            $(this.getTool('lastPage')).on('click', () => this.page = this.total_pages);


            // Обработка ручного ввода
            var page_input = $(this.getTool('currentPage'));
            page_input.on('blur keypress', (e) => {
                if(e.type === 'keypress' && e.which !== 13) return;
                
                const value = parseInt(page_input.val());
                if(!isNaN(value) && value !== this.page) {
                    this.page = value;
                } else {
                    page_input.val(this.page); // Восстановление значения
                }
            });
        }

        _updateButtons() {
            $(this.getTool('firstPage')).jqxButton('disabled', this.page <= 1);
            $(this.getTool('prevPage')).jqxButton('disabled', this.page <= 1);
            $(this.getTool('nextPage')).jqxButton('disabled', this.page >= this.total_pages);
            $(this.getTool('lastPage')).jqxButton('disabled', this.page >= this.total_pages);
        }

        set page(page){
            if(page === this.__page) return;

            if(this.target.data('masterWidget')){
                page = Math.max(1, Math.min(page, this.total_pages));
                this.__page = page;
                $(this.getTool('currentPage')).val(page);
                this._updateButtons();
                this.trigger('changePage');
            }else{
                if(page <= 0)
                    throw new Error(`Page number must be a positive number`);
                this.__page = page;
            }
        }
        get page(){
            return this.__page;
        }

        set page_size(page_size){
            if(page_size === this.__page_size) return;
            if(page_size < 10)
                throw new Error('Page size must be > 10');

            this.__page_size = page_size;
            this.__update();
        }

        get page_size(){
            return this.__page_size;
        }

        set count(count){
            if(count === this.__count) return;
            if(count < 0)
                throw new Error('Count must be a positive number');
            this.__count = count;
            this.__update();
        }
        
        get count(){
            return this.__count;
        }

        get total_pages(){
            if(this.count === 0)
                return 1;
            return Math.ceil(this.count / this.page_size);
        }

        __update(){
            if(this.target.data('masterWidget')){
                $(this.getTool('totalPages')).text(`/${this.total_pages}`);
                if(this.page > this.total_pages)
                    this.page = this.total_pages;

                this._updateButtons();
            }
        }
    }
    
    MasterWidget.register(MasterPaginator);
});