from rest_framework.pagination import CursorPagination


class FacturaCursorPagination(CursorPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 200
    ordering = '-id'