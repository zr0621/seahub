# Copyright (c) 2012-2016 Seafile Ltd.
from django.conf.urls import patterns, url

from seahub.oauth.views import oauth_login, oauth_callback, weixin_qr_login

urlpatterns = patterns('',
    url(r'^(?P<provider>[^/]+)/login/$', oauth_login, name='oauth_login'),
    url(r'^(?P<provider>[^/]+)/callback/$', oauth_callback, name='oauth_callback'),
    url(r'^weixin-qr-login/$', weixin_qr_login, name='weixin_qr_login'),
)
