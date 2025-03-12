from rest_framework.pagination import PageNumberPagination
from rest_framework.utils.urls import replace_query_param



class MasterPagination(PageNumberPagination):
    page_size_query_param = 'pagesize'
    max_page_size = 50
    
    
class MasterGridPagination(MasterPagination):
    page_query_param = 'pagenum'
    
    def get_page_number(self, request, paginator):
        return int(super().get_page_number(request, paginator)) + 1
    
    def get_next_link(self):
        return self.update_link(
            super().get_next_link(),
            self.page.next_page_number
        )
    
    def get_previous_link(self):
        return self.update_link(
            super().get_previous_link(),
            self.page.previous_page_number
        )

    def update_link(self, link:str|None, page_num_method) -> str|None:
        if link is None:
            return None        
        return replace_query_param(link, self.page_query_param, page_num_method() - 1)