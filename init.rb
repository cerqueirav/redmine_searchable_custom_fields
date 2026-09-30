# Redmine Searchable Custom Fields
# Copyright (C) 2026 Victor Cerqueira <dev.cerqueirav@gmail.com>
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any later
# version. See the LICENSE file for details.

require_relative 'lib/redmine_searchable_custom_fields/hooks'

Redmine::Plugin.register :redmine_searchable_custom_fields do
  name 'Redmine Searchable Custom Fields'
  author 'Victor Cerqueira'
  author_url 'mailto:dev.cerqueirav@gmail.com'
  description 'Adds an accent-insensitive search box to long list custom fields ' \
              '(selects and checkbox groups), compatible with depending/cascading fields.'
  version '0.1.0'
  url 'https://github.com/cerqueirav/redmine_searchable_custom_fields'
  requires_redmine version_or_higher: '4.2'

  settings default: { 'min_options' => '10', 'click_to_toggle' => '1', 'keep_selection' => '1' },
           partial: 'settings/searchable_custom_fields'
end
