from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_teacher_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursegroup',
            name='is_enrollment_open',
            field=models.BooleanField(default=True, verbose_name='Набор открыт'),
        ),
    ]
