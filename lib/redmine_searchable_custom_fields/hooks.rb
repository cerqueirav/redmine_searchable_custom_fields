# Redmine Searchable Custom Fields
# Copyright (C) 2026 Victor Cerqueira <dev.cerqueirav@gmail.com>
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any later
# version. See the LICENSE file for details.

module RedmineSearchableCustomFields
  class Hooks < Redmine::Hook::ViewListener
    MIN_OPTIONS_RANGE = (2..1000).freeze
    DEFAULT_MIN_OPTIONS = 10

    # Config is passed in a <meta> tag (not an inline <script>), so the plugin
    # keeps working under a Content Security Policy that blocks inline scripts.
    def view_layouts_base_html_head(_context = {})
      tag(:meta, name: 'searchable-custom-fields', content: client_config.to_json) +
        stylesheet_link_tag('searchable_custom_fields', plugin: 'redmine_searchable_custom_fields') +
        javascript_include_tag('searchable_custom_fields', plugin: 'redmine_searchable_custom_fields')
    end

    private

    def client_config
      settings = Setting.plugin_redmine_searchable_custom_fields || {}
      {
        minOptions: min_options(settings['min_options']),
        clickToToggle: settings['click_to_toggle'].to_s == '1',
        keepSelection: settings.fetch('keep_selection', '1').to_s == '1',
        i18n: {
          search: l(:scf_search),
          waiting: l(:scf_waiting_parent),
          noOptions: l(:scf_no_options),
          noMatch: l(:scf_no_match),
          remove: l(:scf_remove)
        }
      }
    end

    def min_options(value)
      number = Integer(value.to_s, 10)
      number.clamp(MIN_OPTIONS_RANGE.min, MIN_OPTIONS_RANGE.max)
    rescue ArgumentError
      DEFAULT_MIN_OPTIONS
    end
  end
end
