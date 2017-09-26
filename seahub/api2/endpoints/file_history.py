# Copyright (c) 2012-2016 Seafile Ltd.
import logging

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from seahub.api2.throttling import UserRateThrottle
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.utils import api_error

from seahub.utils.timeutils import timestamp_to_isoformat_timestr
from seahub.views import check_folder_permission


from seaserv import seafile_api

logger = logging.getLogger(__name__)


class FileHistory(APIView):
    """ Get file history
    """

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, repo_id, format=None):

        # argument check
        path = request.GET.get('path', None)
        if not path:
            error_msg = 'path invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            current_page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '100'))
        except ValueError:
            current_page = 1
            per_page = 100

        start = (current_page - 1) * per_page
        limit = per_page + 1

        # recourse check
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if not seafile_api.get_file_id_by_path(repo_id, path):
            error_msg = 'File %s not found.' % path
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if check_folder_permission(request, repo_id, path) != 'rw':
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # get file revision
        seafile_api.get_file_revisions
        try:
            commits = seafile_api.get_file_revisions(repo_id, path, start, limit, days)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        for commit in commits:
            creator_name = commit.creator_name
            url, is_default, date_uploaded = api_avatar_url(creator_name, 16)

            user_info = {}
            user_info['email'] = creator_name
            user_info['name'] = email2nickname(creator_name)
            user_info['contact_email'] = Profile.objects.get_contact_email_by_user(creator_name)
            user_info['avatar_url'] = request.build_absolute_uri(url)

            commit._dict['user_info'] = user_info

        return Response({"commits": commits})

