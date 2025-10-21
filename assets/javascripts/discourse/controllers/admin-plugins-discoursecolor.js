import Controller from "@ember/controller";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

export default class AdminPluginsDiscoursecolorController extends Controller {
  @service siteSettings;

  @tracked rankedGroups = [];
  @tracked groupColors = {};
  @tracked isSaving = false;
  @tracked saveMessage = "";
  @tracked saveMessageType = "";

  get hasChanges() {
    return JSON.stringify(this.rankedGroups) !== JSON.stringify(this.model.originalRankedGroups) ||
           JSON.stringify(this.groupColors) !== JSON.stringify(this.model.originalGroupColors);
  }

  @action
  updateGroupColor(group, color) {
    this.groupColors = {
      ...this.groupColors,
      [group]: color
    };
  }

  @action
  moveGroupUp(index) {
    if (index <= 0) return;
    
    const groups = [...this.rankedGroups];
    [groups[index - 1], groups[index]] = [groups[index], groups[index - 1]];
    this.rankedGroups = groups;
  }

  @action
  moveGroupDown(index) {
    if (index >= this.rankedGroups.length - 1) return;
    
    const groups = [...this.rankedGroups];
    [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]];
    this.rankedGroups = groups;
  }

  @action
  addGroup() {
    const newGroup = prompt("Enter new group name:");
    if (newGroup && newGroup.trim() && !this.rankedGroups.includes(newGroup.trim())) {
      this.rankedGroups = [...this.rankedGroups, newGroup.trim()];
      // Ensure we have a color for the new group
      if (!this.groupColors[newGroup.trim()]) {
        this.groupColors[newGroup.trim()] = this.getDefaultColor(newGroup.trim());
      }
    }
  }

  @action
  removeGroup(index) {
    if (confirm("Are you sure you want to remove this group?")) {
      const groups = [...this.rankedGroups];
      groups.splice(index, 1);
      this.rankedGroups = groups;
    }
  }

  @action
  async saveChanges() {
    this.isSaving = true;
    this.saveMessage = "";
    
    try {
      // Save group rankings as comma-separated string
      const groupRankingsString = this.rankedGroups.join(',');
      await this.saveSetting('discoursecolor_group_rankings', groupRankingsString);
      
      // Save group colors
      await this.saveSetting('discoursecolor_group_colors', JSON.stringify(this.groupColors));
      
      this.saveMessage = I18n.t('discoursecolor.changes_saved');
      this.saveMessageType = 'success';
      
      // Update original values
      this.model.originalRankedGroups = [...this.rankedGroups];
      this.model.originalGroupColors = JSON.parse(JSON.stringify(this.groupColors));
    } catch (error) {
      this.saveMessage = I18n.t('discoursecolor.error_saving');
      this.saveMessageType = 'error';
      console.error('Failed to save settings:', error);
    } finally {
      this.isSaving = false;
    }
  }

  @action
  resetToDefaults() {
    if (confirm("Are you sure you want to reset to default settings?")) {
      // Reset to all available groups in their original order
      this.rankedGroups = [...this.model.allGroups];
      
      // Reset colors to defaults
      const defaultColors = {
        admin: "#ff0000",
        staff: "#00ff00",
        moderator: "#0000ff",
        trust_level_4: "#ffa500",
        trust_level_3: "#800080",
        trust_level_2: "#008080",
        trust_level_1: "#808080"
      };
      
      // Apply default colors where available, keep existing for others
      this.model.allGroups.forEach(group => {
        if (defaultColors[group]) {
          this.groupColors[group] = defaultColors[group];
        } else if (!this.groupColors[group]) {
          this.groupColors[group] = this.getDefaultColor(group);
        }
      });
    }
  }

  async saveSetting(name, value) {
    const response = await fetch('/admin/site_settings/' + name, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.session.get('csrfToken')
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      throw new Error('Failed to save setting');
    }
  }

  getDefaultColor(group) {
    const defaultColors = {
      admin: "#ff0000",
      staff: "#00ff00",
      moderator: "#0000ff",
      trust_level_4: "#ffa500",
      trust_level_3: "#800080",
      trust_level_2: "#008080",
      trust_level_1: "#808080"
    };
    return defaultColors[group] || "#666666";
  }
}
