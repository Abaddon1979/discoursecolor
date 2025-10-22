# name: discoursecolor
# about: Inject user group information and custom colors into Discourse UI elements
# version: 1.0
# authors: Discourse Team
# url: https://github.com/discourse/discoursecolor

enabled_site_setting :discoursecolor_enabled

register_asset 'stylesheets/user-groups-injector.scss'

# Register admin plugin route
add_admin_route 'discoursecolor.title', 'discoursecolor'

after_initialize do
  # Add group information to user serializers
  add_to_serializer(:basic_user, :user_groups) do
    object.groups.pluck(:name) rescue []
  end

  add_to_serializer(:basic_user, :highest_ranked_group) do
    begin
      group_names = object.groups.pluck(:name)
      return nil if group_names.blank?
      
      rankings = SiteSetting.discoursecolor_group_rankings.presence || "admin,staff,moderator,trust_level_4,trust_level_3,trust_level_2,trust_level_1"
      rankings = rankings.split(',')
      
      # Normalize group names (plural to singular)
      normalized_groups = group_names.map { |name| name.singularize }
      
      # Find the highest ranked group
      highest_group = rankings.find { |rank| normalized_groups.include?(rank.singularize) }
      highest_group || group_names.first
    rescue => e
      Rails.logger.warn "Discoursecolor: Error calculating highest_ranked_group: #{e.message}"
      nil
    end
  end

  add_to_serializer(:basic_user, :group_color) do
    begin
      group_colors = JSON.parse(SiteSetting.discoursecolor_group_colors.presence || '{"admin":"#ff0000","staff":"#00ff00","moderator":"#0000ff","trust_level_4":"#ffa500","trust_level_3":"#800080","trust_level_2":"#008080","trust_level_1":"#808080"}')
      highest_group = self.highest_ranked_group
      group_colors[highest_group] || '#000000'
    rescue => e
      Rails.logger.warn "Discoursecolor: Error calculating group_color: #{e.message}"
      '#000000'
    end
  end

  # Add same methods to user serializer
  add_to_serializer(:user, :user_groups) do
    object.groups.pluck(:name) rescue []
  end

  add_to_serializer(:user, :highest_ranked_group) do
    begin
      group_names = object.groups.pluck(:name)
      return nil if group_names.blank?
      
      rankings = SiteSetting.discoursecolor_group_rankings.presence || "admin,staff,moderator,trust_level_4,trust_level_3,trust_level_2,trust_level_1"
      rankings = rankings.split(',')
      
      normalized_groups = group_names.map { |name| name.singularize }
      highest_group = rankings.find { |rank| normalized_groups.include?(rank.singularize) }
      highest_group || group_names.first
    rescue => e
      Rails.logger.warn "Discoursecolor: Error calculating highest_ranked_group: #{e.message}"
      nil
    end
  end

  add_to_serializer(:user, :group_color) do
    begin
      group_colors = JSON.parse(SiteSetting.discoursecolor_group_colors.presence || '{"admin":"#ff0000","staff":"#00ff00","moderator":"#0000ff","trust_level_4":"#ffa500","trust_level_3":"#800080","trust_level_2":"#008080","trust_level_1":"#808080"}')
      highest_group = self.highest_ranked_group
      group_colors[highest_group] || '#000000'
    rescue => e
      Rails.logger.warn "Discoursecolor: Error calculating group_color: #{e.message}"
      '#000000'
    end
  end

  # Add admin route for plugin
  add_admin_route "discoursecolor.title", "discoursecolor"

  # Simple API endpoint using standard Discourse routing
  module ::Discoursecolor
    class AdminController < ::Admin::AdminController
      def index
        # This empty action allows the admin route to work
      end

      def groups
        begin
          groups = Group.all.map do |group|
            {
              id: group.id,
              name: group.name,
              user_count: group.users.count
            }
          end

          render json: { groups: groups }
        rescue => e
          Rails.logger.error "Discoursecolor: Error fetching groups: #{e.message}"
          render json: { groups: [] }
        end
      end
    end
  end

  # Add routes without using an engine
  Discourse::Application.routes.append do
    get "/admin/plugins/discoursecolor" => "discoursecolor/admin#index"
    get "/admin/plugins/discoursecolor/groups" => "discoursecolor/admin#groups"
  end
end
