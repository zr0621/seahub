define([
    'jquery',
    'underscore',
    'backbone',
    'common',
    'app/collections/group-repos',
    'app/views/group-repo',
    'app/views/add-group-repo',
    'app/views/group-members',
    'app/views/group-discussions',
    'app/views/group-settings'
], function($, _, Backbone, Common, GroupRepos, GroupRepoView,
    AddGroupRepoView, GroupMembersView, GroupDiscussionsView, GroupSettingsView) {
    'use strict';

    var GroupView = Backbone.View.extend({
        el: '.main-panel',

        template: _.template($('#group-tmpl').html()),
        toolbarTemplate: _.template($('#group-toolbar-tmpl').html()),
        theadTemplate: _.template($('#shared-repos-hd-tmpl').html()),
        theadMobileTemplate: _.template($('#shared-repos-hd-mobile-tmpl').html()),

        events: {
            'click #group-settings-icon': 'toggleSettingsPanel',
            'click #group-members-icon': 'toggleMembersPanel',
            'click #group-discussions-icon': 'toggleDiscussionsPanel',
            'click #group-toolbar .repo-create': 'createRepo',
            'click #group-repos .by-name': 'sortByName',
            'click #group-repos .by-time': 'sortByTime'
        },

        initialize: function(options) {
            this.group = {}; // will be fetched when rendering the top bar

            this.repos = new GroupRepos();
            this.listenTo(this.repos, 'add', this.addOne);
            this.listenTo(this.repos, 'reset', this.reset);

            this.settingsView = new GroupSettingsView({groupView: this});
            this.membersView = new GroupMembersView({groupView: this});
            this.discussionsView = new GroupDiscussionsView({groupView: this});
        },

        addOne: function(repo, collection, options) {
            var view = new GroupRepoView({
                model: repo,
                group_id: this.group_id,
                show_repo_owner: true,
                is_staff: this.repos.is_staff
            });
            if (options.prepend) {
                this.$tableBody.prepend(view.render().el);
            } else {
                this.$tableBody.append(view.render().el);
            }
        },

        renderThead: function() {
            var tmpl = $(window).width() >= 768 ? this.theadTemplate : this.theadMobileTemplate;
            this.$tableHead.html(tmpl());
        },

        reset: function() {
            this.$('.error').hide();
            this.$loadingTip.hide();
            if (this.repos.length) {
                this.$emptyTip.hide();
                this.renderThead();
                this.$tableBody.empty();

                // sort
                Common.updateSortIconByMode({'context': this.$el});
                Common.sortLibs({'libs': this.repos});

                this.repos.each(this.addOne, this);
                this.$table.show();
            } else {
                this.$emptyTip.show();
                this.$table.hide();
            }

        },

        showGroup: function(options) {
            var _this = this;
            $.ajax({
                url: Common.getUrl({
                    'name': 'group',
                    'group_id': this.group_id
                }),
                cache: false,
                dataType: 'json',
                success: function(data) {
                    _this.group = data;
                    _this.renderToolbar();
                    _this.renderMainCon({
                        'name': data.name,
                        'wiki_enabled': data.wiki_enabled
                    });
                    _this.showRepoList();
                    if (options) {
                        if (options.showDiscussions) {
                            _this.showDiscussions();
                        }
                    }
                },
                error: function(xhr) {
                    var err_msg;
                    if (xhr.responseText) {
                        err_msg = $.parseJSON(xhr.responseText).error_msg;
                    } else {
                        err_msg = gettext("Please check the network.");
                    }
                    _this.renderMainCon({
                        'name': '',
                        'wiki_enabled': ''
                    });
                    _this.$('.cur-view-path').hide();
                    _this.$loadingTip.hide();
                    _this.$('.cur-view-main-con .error').html(err_msg).show();
                }
            });
        },

        showRepoList: function() {
            var _this = this;
            var $loadingTip = this.$loadingTip;
            $loadingTip.show();
            this.repos.setGroupID(this.group_id);
            this.repos.fetch({
                cache: false,
                reset: true,
                data: {from: 'web'},
                success: function (collection, response, opts) {
                },
                error: function (collection, response, opts) {
                    $loadingTip.hide();
                    var $error = _this.$('.error');
                    var err_msg;
                    if (response.responseText) {
                        if (response['status'] == 401 || response['status'] == 403) {
                            err_msg = gettext("Permission error");
                        } else {
                            err_msg = gettext("Error");
                        }
                    } else {
                        err_msg = gettext('Please check the network.');
                    }
                    $error.html(err_msg).show();
                }
            });
        },

        renderToolbar: function(data) {
            this.$toolbar = $('<div class="cur-view-toolbar" id="group-toolbar"></div>').html(this.toolbarTemplate(data));
            this.$('.common-toolbar').before(this.$toolbar);
        },

        renderMainCon: function(data) {
            this.$mainCon = $('<div class="main-panel-main main-panel-main-with-side" id="group"></div>').html(this.template(data));
            this.$el.append(this.$mainCon);

            this.$table = this.$('table');
            this.$tableHead = this.$('thead');
            this.$tableBody = this.$('tbody');
            this.$loadingTip = this.$('#group-repos .loading-tip');
            this.$emptyTip = this.$('#group-repos .empty-tips');
        },

        show: function(group_id, options) {
            this.group_id = group_id;
            this.showGroup(options);
        },

        hide: function() {
            this.$toolbar.detach();
            this.$mainCon.detach();
        },

        createRepo: function() {
            new AddGroupRepoView(this.repos);
        },

        sortByName: function() {
            Common.toggleSortByNameMode();
            Common.updateSortIconByMode({'context': this.$el});
            Common.sortLibs({'libs': this.repos});

            this.$tableBody.empty();
            this.repos.each(this.addOne, this);
            this.repos.comparator = null;

            return false;
        },

        sortByTime: function() {
            Common.toggleSortByTimeMode();
            Common.updateSortIconByMode({'context': this.$el});
            Common.sortLibs({'libs': this.repos});

            this.$tableBody.empty();
            this.repos.each(this.addOne, this);
            this.repos.comparator = null;

            return false;
        },

        toggleSettingsPanel: function() {
            return this.settingsView.toggle();
        },

        toggleMembersPanel: function() {
            return this.membersView.toggle();
        },

        showDiscussions: function() {
            return this.discussionsView.show();
        },

        toggleDiscussionsPanel: function() {
            return this.discussionsView.toggle();
        }

    });

    return GroupView;
});
