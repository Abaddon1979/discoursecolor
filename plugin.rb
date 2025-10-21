# name: discoursecolor
# about: Inject user group information and custom colors into Discourse UI elements
# version: 1.0
# authors: Discourse Team
# url: https://github.com/discourse/discoursecolor

enabled_site_setting :discoursecolor_enabled

register_asset 'stylesheets/user-groups-injector.scss'

add_admin_route "discoursecolor.title", "discoursecolor"

module ::Discoursecolor
  PLUGIN_NAME = "discoursecolor"

  class Engine < ::Rails::Engine
    engine_name PLUGIN_NAME
    isolate_namespace Discoursecolor
  end
end

after_initialize do
  # Add group information to user serializers
  add_to_serializer(:basic_user, :user_groups) do
    object.groups.pluck(:name)
  end

  add_to_serializer(:basic_user, :highest_ranked_group) do
    group_names = object.groups.pluck(:name)
    rankings = SiteSetting.discoursecolor_group_rankings.split(',')
    
    # Normalize group names (plural to singular)
    normalized_groups = group_names.map { |name| name.singularize }
    
    # Find the highest ranked group
    highest_group = rankings.find { |rank| normalized_groups.include?(rank.singularize) }
    highest_group || group_names.first
  end

  add_to_serializer(:basic_user, :group_color) do
    group_colors = JSON.parse(SiteSetting.discoursecolor_group_colors)
    highest_group = self.highest_ranked_group
    group_colors[highest_group] || '#000000'
  end

  # Add same methods to user serializer
  add_to_serializer(:user, :user_groups) do
    object.groups.pluck(:name)
  end

  add_to_serializer(:user, :highest_ranked_group) do
    group_names = object.groups.pluck(:name)
    rankings = SiteSetting.discoursecolor_group_rankings.split(',')
    
    normalized_groups = group_names.map { |name| name.singularize }
    highest_group = rankings.find { |rank| normalized_groups.include?(rank.singularize) }
    highest_group || group_names.first
  end

  add_to_serializer(:user, :group_color) do
    group_colors = JSON.parse(SiteSetting.discoursecolor_group_colors)
    highest_group = self.highest_ranked_group
    group_colors[highest_group] || '#000000'
  end

  # API endpoint to get all groups
  class DiscoursecolorController < ::Admin::AdminController
    requires_plugin Discoursecolor::PLUGIN_NAME

    def groups
      groups = Group.all.map do |group|
        {
          id: group.id,
          name: group.name,
          user_count: group.users.count
        }
      end

      render json: { groups: groups }
    end
  end

  Discoursecolor::Engine.routes.draw do
    get "/groups" => "discoursecolor#groups"
  end
end
