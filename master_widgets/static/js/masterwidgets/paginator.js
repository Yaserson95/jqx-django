class MasterPaginator extends MasterToolbar{
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'currentPage': {'type': 'number', 'default': 1},
            'totalPages': {'type': 'number', 'default': 1},
            'onPageChange': {'type': 'function'}
        });
    }
    init(attrs = {}){
        attrs.buttons = [
            {'label':'<<', 'name':'firstPage', 'width': '30px', 'height': '100%'},
            {'label':'<', 'name':'prevPage', 'width': '30px', 'height': '100%'},
            {'name':'currentPage', 'type':'input', 'width': '50px', 'height': '100%'},
            {'name':'totalPages', 'type':'custom', 'width': '50px', 'height': '100%'},
            {'label':'>', 'name':'nextPage', 'width': '30px', 'height': '100%'},
            {'label':'>>', 'name':'lastPage', 'width': '30px', 'height': '100%'},
        ];

        defaults(attrs, {
            'width': '100%',
            'minWidth': 250,
            'height': 40
        });

        super.init(attrs);
    }
}

/*
class MasterPaginator extends MasterWidget {
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'currentPage': {'type': 'number', 'default': 1},
            'totalPages': {'type': 'number', 'default': 1},
            'onPageChange': {'type': 'function'}
        });
    }

    init(options = {}) {
        super.init(options);
        this._firstButton = null;
        this._prevButton = null;
        this._pageInput = null;
        this._totalPagesSpan = null;
        this._nextButton = null;
        this._lastButton = null;
    }

    render() {
        super.render();
        this.target.empty().addClass('master-paginator');
        
        // Создание элементов управления
        this._firstButton = this._createNavButton('<<', this.currentPage <= 1);
        this._prevButton = this._createNavButton('<', this.currentPage <= 1);
        
        // Поле ввода и отображение общего количества
        const pageContainer = $('<div/>', {'class': 'page-container'}).appendTo(this.target);
        this._pageInput = $('<input/>', {
            'type': 'text',
            'class': 'page-input',
            'value': this.currentPage
        }).appendTo(pageContainer);

        this._totalPagesSpan = $('<span/>', {
            'class': 'total-pages',
            text: ` / ${this.totalPages}`
        }).appendTo(pageContainer);

        this._nextButton = this._createNavButton('>', this.currentPage >= this.totalPages);
        this._lastButton = this._createNavButton('>>', this.currentPage >= this.totalPages);

        
        this._bindEvents();
    }

    _createNavButton(symbol, disabled) {
        return $('<button/>', {
            'class': 'page-nav',
            html: symbol,
            disabled: disabled
        }).appendTo(this.target);
    }

    _bindEvents() {
        // Навигация
        this._firstButton.on('click', () => this.setPage(1));
        this._prevButton.on('click', () => this.setPage(this.currentPage - 1));
        this._nextButton.on('click', () => this.setPage(this.currentPage + 1));
        this._lastButton.on('click', () => this.setPage(this.totalPages));

        // Обработка ручного ввода
        this._pageInput.on('blur keypress', (e) => {
            if(e.type === 'keypress' && e.which !== 13) return;
            
            const value = parseInt(this._pageInput.val());
            if(!isNaN(value) && value !== this.currentPage) {
                this.setPage(value);
            } else {
                this._pageInput.val(this.currentPage); // Восстановление значения
            }
        });
    }

    _updateButtons() {
        this._firstButton.prop('disabled', this.currentPage <= 1);
        this._prevButton.prop('disabled', this.currentPage <= 1);
        this._nextButton.prop('disabled', this.currentPage >= this.totalPages);
        this._lastButton.prop('disabled', this.currentPage >= this.totalPages);
    }

    setPage(page) {
        page = Math.max(1, Math.min(page, this.totalPages));
        if(page === this.currentPage) return;

        this.currentPage = page;
        this._pageInput.val(page);
        this._totalPagesSpan.text(` / ${this.totalPages}`);
        this._updateButtons();
        
        if(this.onPageChange) this.onPageChange(page);
    }

    update(totalPages, currentPage = 1) {
        this.totalPages = Math.max(1, totalPages);
        this.setPage(currentPage);
    }
}
*/