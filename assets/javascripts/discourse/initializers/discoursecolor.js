import { withPluginApi } from "discourse/lib/plugin-api";
import { ajax } from "discourse/lib/ajax";

function initializeDiscoursecolor(api) {
  const siteSettings = api.container.lookup("site-settings:main");
  
  if (!siteSettings.discoursecolor_enabled) {
    return;
  }

  // Cache for user data to avoid repeated API calls
  const userCache = new Map();

  // Function to fetch user data
  async function fetchUserData(username) {
    if (userCache.has(username)) {
      return userCache.get(username);
    }

    try {
      const response = await ajax(`/u/${username}.json`);
      const userData = {
        groups: response.user.user_groups || [],
        highestGroup: response.user.highest_ranked_group,
        color: response.user.group_color
      };
      userCache.set(username, userData);
      return userData;
    } catch (error) {
      console.error(`Failed to fetch user data for ${username}:`, error);
      return null;
    }
  }

  // Function to apply styling to elements
  function applyStyling(element, userData) {
    if (!userData) return;

    // Add group classes
    userData.groups.forEach(group => {
      const normalizedGroup = group.replace(/\s+/g, '-').toLowerCase();
      element.classList.add(`is-${normalizedGroup}`);
    });

    // Apply color styling based on highest group
    if (userData.highestGroup && userData.color) {
      const normalizedGroup = userData.highestGroup.replace(/\s+/g, '-').toLowerCase();
      element.classList.add(`highest-group-${normalizedGroup}`);
      
      // Apply color to text
      element.style.color = userData.color;
      
      // For avatars, apply border color
      if (element.classList.contains('avatar') || element.querySelector('.avatar')) {
        const avatar = element.classList.contains('avatar') ? element : element.querySelector('.avatar');
        if (avatar) {
          avatar.style.borderColor = userData.color;
          avatar.style.boxShadow = `0 0 0 2px ${userData.color}`;
        }
      }
    }
  }

  // Function to process a single element
  async function processElement(element) {
    let username = null;

    // Different ways to extract username based on element type
    if (element.classList.contains('chat-message')) {
      const usernameEl = element.querySelector('.chat-message-info__username');
      if (usernameEl) {
        username = usernameEl.textContent.trim().replace('@', '');
      }
    } else if (element.hasAttribute('data-user-card')) {
      username = element.getAttribute('data-user-card');
    } else if (element.classList.contains('user-link')) {
      const href = element.getAttribute('href');
      const match = href.match(/\/u\/([^\/]+)/);
      if (match) {
        username = match[1];
      }
    } else if (element.classList.contains('avatar')) {
      const parent = element.closest('[data-user-card]') || element.closest('.user-link');
      if (parent) {
        username = parent.getAttribute('data-user-card') || 
                   parent.getAttribute('href')?.match(/\/u\/([^\/]+)/)?.[1];
      }
    }

    if (username) {
      const userData = await fetchUserData(username);
      applyStyling(element, userData);
    }
  }

  // Mutation observer to handle dynamically added content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this is a relevant element
          if (node.matches && (
            node.matches('.chat-message') ||
            node.matches('[data-user-card]') ||
            node.matches('.user-link') ||
            node.matches('.avatar') ||
            node.querySelector('.chat-message, [data-user-card], .user-link, .avatar')
          )) {
            const elements = node.matches ? [node] : node.querySelectorAll('.chat-message, [data-user-card], .user-link, .avatar');
            elements.forEach(el => processElement(el));
          }
        }
      });
    });
  });

  // Process existing elements immediately and start observing
  const existingElements = document.querySelectorAll('.chat-message, [data-user-card], .user-link, .avatar');
  existingElements.forEach(el => processElement(el));

  // Start observing for new elements
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cleanup when the app is destroyed (if onDestroy exists)
  if (api.onDestroy) {
    api.onDestroy(() => {
      observer.disconnect();
      userCache.clear();
    });
  }
}

export default {
  name: "discoursecolor",
  initialize() {
    withPluginApi("0.8.7", initializeDiscoursecolor);
  }
};
