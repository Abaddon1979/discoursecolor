import DiscourseRoute from "discourse/routes/discourse";
import { ajax } from "discourse/lib/ajax";

export default DiscourseRoute.extend({
  model() {
    return ajax("/admin/plugins/discoursecolor/groups").then((result) => {
      const allGroups = result.groups.map(group => group.name);
      
      return this.store.find("site-setting", "discoursecolor_group_rankings").then((setting) => {
        let groupRankings = setting.value || "";
        
        return this.store.find("site-setting", "discoursecolor_group_colors").then((colorSetting) => {
          let groupColors;
          try {
            groupColors = JSON.parse(colorSetting.value || '{}');
          } catch (e) {
            groupColors = {};
          }

          // If no rankings exist, use all groups in their current order
          let rankedGroups = groupRankings ? groupRankings.split(',') : [...allGroups];
          
          // Ensure we have colors for all groups
          allGroups.forEach(group => {
            if (!groupColors[group]) {
              groupColors[group] = this.getDefaultColor(group);
            }
          });

          return {
            allGroups,
            rankedGroups,
            groupColors,
            originalRankedGroups: [...rankedGroups],
            originalGroupColors: JSON.parse(JSON.stringify(groupColors))
          };
        });
      });
    });
  },

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
  },

  setupController(controller, model) {
    controller.setProperties({
      allGroups: model.allGroups,
      rankedGroups: model.rankedGroups,
      groupColors: model.groupColors,
      originalRankedGroups: model.originalRankedGroups,
      originalGroupColors: model.originalGroupColors
    });
  }
});
