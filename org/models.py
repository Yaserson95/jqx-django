from django.db import models
from master_widgets.models import TreeForeignKey

class Department(models.Model):
    name = models.CharField('Название', max_length=100)
    description = models.TextField(
        verbose_name='Описание',
        max_length=512,
        null=True,
        blank=True,
    )
    parent = TreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True,
        verbose_name='Родительское подразделение'
    )

    created_at = models.DateTimeField('Дата создания', auto_now_add=True)

    class Meta:
        verbose_name = 'Подразделение'
        verbose_name_plural = 'Подразделения'
        ordering = ['name']

    def __str__(self):
        return self.name

class WorkGroup(models.Model):
    name = models.CharField(
        verbose_name='Название',
        max_length=100
    )
    description = models.TextField(
        verbose_name='Описание',
        max_length=255
    )

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Рабочая группа'
        verbose_name_plural = 'Рабочие группы'
        ordering = ('name',)

class Employee(models.Model):
    last_name = models.CharField(
        verbose_name='Фамилия', 
        max_length=100
    )
    first_name = models.CharField(
        verbose_name='Имя', 
        max_length=100
    )
    middle_name = models.CharField(
        verbose_name='Отчество',
        max_length=100,
        null=True,
        blank=True
    )
    email = models.EmailField(
        verbose_name='Эл. почта',
        max_length=50,
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='employees',
        verbose_name='Подразделение'
    )
    position = models.CharField('Должность', max_length=150)
    hire_date = models.DateField('Дата приема')

    groups = models.ManyToManyField(WorkGroup,
        blank=True, 
        related_name='users',
        verbose_name='Рабочие группы'
    )

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'
        ordering = ['last_name']

    def __str__(self):
        return f"{self.last_name} {self.first_name}, {self.position}"