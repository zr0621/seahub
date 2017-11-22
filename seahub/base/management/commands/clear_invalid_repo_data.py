from django.core.management.base import BaseCommand, CommandError

from seaserv import seafile_api
from seahub.revision_tag.models import RevisionTags
from seahub.tags.models import FileUUIDMap

class Command(BaseCommand):
    help = "Clear invalid data when repo deleted"

    def handle(self, *args, **kwargs):
        all_repo= [repo.repo_id for repo in seafile_api.get_repo_list(-1, -1)]
        trash_repo = [repo.repo_id for repo in seafile_api.get_trash_repo_list(-1, -1)]
        all_repo.extend(trash_repo)
        #on_delete is  CASCADE, so FileTag will be deleted
        FileUUIDMap.objects.exclude(repo_id__in=all_repo).delete()
        RevisionTags.objects.exclude(repo_id__in=all_repo).delete()


        self.stdout.write('Invalid repo data deleted')
