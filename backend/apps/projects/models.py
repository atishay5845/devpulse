from django.conf import settings
from django.db import models
from django.utils.text import slugify

class Project(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["owner", "name"], name="unique_project_name_per_owner")]

    def __str__(self):
        return self.name

class StatusPage(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="status_page")
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
