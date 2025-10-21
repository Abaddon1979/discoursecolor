# Discoursecord Plugin Specification

## Overview
Discoursecord is a Discourse plugin that injects user group information and custom colors into various UI elements throughout the site, including chat messages, user links, and avatars.

## Core Functionality

### 1. Data Sources (Input)
- **User Groups**: Pulls from Discourse's built-in group system
- **Trust Levels**: Automatically includes trust levels as groups (trust_level_1, trust_level_2, etc.)
- **Custom Settings**: 
  - Group rankings (priority order)
  - Group colors (hex color codes)

### 2. Data Processing
- **Group Normalization**: Converts plural group names to singular (admins → admin, moderators → moderator)
- **Highest Ranked Group**: Determines which group takes precedence based on admin-defined rankings
- **Color Assignment**: Maps the highest ranked group to its configured color

### 3. Output Locations (Where data is injected)
- **Chat Messages**: Usernames in chat get group classes and colored text
- **User Links**: Any `a[data-user-card]` elements get group classes and colored text  
- **Avatars**: User avatars get group classes and colored borders
- **User Cards**: User profile cards display group information

## Plugin Components

### Backend (Ruby)
**File: `plugin.rb`**
- Adds user groups to user serializers (`basic_user` and `user`)
- Adds highest ranked group calculation
- Adds group color assignment
- Admin route registration

### Frontend (JavaScript/Ember)
**Files:**
- `assets/javascripts/discourse/initializers/discoursecord.js` - Main injection logic
- `assets/javascripts/discourse/routes/admin-plugins-discoursecord.js` - Admin route
- `assets/javascripts/discourse/controllers/admin-plugins-discoursecord.js` - Admin controller
- `assets/javascripts/discourse/templates/admin/plugins/discoursecord.hbs` - Admin template

### Styling
**File: `assets/stylesheets/user-groups-injector.scss`**
- Admin interface styling
- Group-specific CSS classes
- Color application styles
- Responsive design

### Configuration
**File: `config/settings.yml`**
- `discoursecord_enabled` - Toggle plugin on/off
- `discoursecord_group_rankings` - Comma-separated group priority list
- `discoursecord_group_colors` - JSON object mapping groups to colors

**File: `config/locales/client.en.yml`**
- All text labels and translations for the admin interface

## Key Features

### Admin Interface
- **Group Ranking**: Drag-and-drop or up/down arrows to reorder group priority
- **Color Selection**: Color picker for each group with hex code display
- **Group Management**: Add new groups, remove existing groups
- **Live Preview**: Real-time preview of how groups will appear
- **Save/Revert**: Settings persistence with success/error feedback

### Frontend Injection
- **Dynamic Loading**: Fetches user data on-demand via API
- **Caching**: User data caching for performance
- **DOM Observation**: Watches for new elements and applies styling automatically
- **Theme Support**: Dark mode and high contrast compatibility

## Technical Implementation Details

### Serializer Additions
```ruby
# Added to basic_user and user serializers:
- user_groups: Array of group names user belongs to
- highest_ranked_group: Single group name (highest priority)
- group_color: Hex color code for the highest ranked group
```

### JavaScript Injection Logic
1. **Element Selection**: Targets specific CSS selectors in the DOM
2. **User Data Fetching**: Calls `/u/{username}.json` API endpoint
3. **Class Injection**: Adds `is-{groupname}` classes to elements
4. **Color Application**: Applies color styles based on group settings
5. **Mutation Observer**: Watches for DOM changes to handle dynamic content

### Admin Interface Components
- **Ember Route**: Handles model setup and controller initialization
- **Ember Controller**: Manages group rankings, colors, and save operations
- **Handlebars Template**: Renders the admin UI with interactive controls
- **SCSS Styling**: Provides responsive, theme-aware interface design

## Settings Structure

### Group Rankings
Default: `"admin,staff,moderator,trust_level_4,trust_level_3,trust_level_2,trust_level_1"`

### Group Colors  
Default: JSON object with hex colors for each group

## Integration Points
- **Discourse Serializers**: Extends user data with group information
- **Discourse Settings**: Uses site settings for configuration
- **Discourse Admin**: Integrates with plugin admin system
- **Discourse Styling**: Uses CSS variables for theme compatibility

## Expected Behavior
1. Users see colored usernames in chat based on their highest group
2. User links and avatars reflect group membership visually
3. Admins can configure group priorities and colors through a visual interface
4. Changes take effect immediately after saving settings
5. Plugin works across all Discourse themes and responsive breakpoints

This specification provides all the information needed to recreate the plugin from scratch while maintaining the same functionality and user experience.
