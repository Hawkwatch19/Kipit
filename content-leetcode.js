// Content script for LeetCode

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractLeetCodeProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

// Extract problem information from LeetCode page
function extractLeetCodeProblemInfo() {
  try {
    // Wait for React to render (LeetCode is a SPA)
    const problemTitle = document.querySelector('[data-cy="question-title"]') ||
      document.querySelector('div[class*="text-title"]') ||
      document.querySelector('.css-v3d350');

    const problemName = problemTitle ? problemTitle.textContent.trim() : '';

    // Get difficulty/rating
    let rating = '';
    const difficultyElement = document.querySelector('div[diff]') ||
      document.querySelector('[class*="difficulty"]');

    if (difficultyElement) {
      const difficulty = difficultyElement.textContent.trim().toLowerCase();
      // Convert difficulty to approximate rating
      if (difficulty.includes('easy')) rating = '1200';
      else if (difficulty.includes('medium')) rating = '1600';
      else if (difficulty.includes('hard')) rating = '2000';
    }

    // Get problem tags
    const tags = [];
    const tagElements = document.querySelectorAll('a[class*="topic-tag"]') ||
      document.querySelectorAll('.tag');

    tagElements.forEach(tagEl => {
      const tagText = tagEl.textContent.trim().toLowerCase();
      if (tagText) {
        tags.push(tagText);
      }
    });

    // Get problem URL
    const url = window.location.href;

    // Extract problem number if available
    const problemNumberMatch = problemName.match(/^(\d+)\.\s*/);
    const displayName = problemName;

    return {
      name: displayName,
      url: url,
      judge: 'LeetCode',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting LeetCode problem info:', error);
    return {
      name: document.title.replace(' - LeetCode', ''),
      url: window.location.href,
      judge: 'LeetCode',
      rating: '',
      tags: []
    };
  }
}

// Auto-detect if user is on a problem page and show indicator
function showProblemIndicator() {
  const isProblemPage = /problems\/[^\/]+/.test(window.location.href);
}

// Initialize when page loads (with delay for SPA)
function init() {
  setTimeout(showProblemIndicator, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Remove old button if exists
    const oldButton = document.querySelector('[style*="Add to Tracker"]');
    if (oldButton) oldButton.remove();
    init();
  }
}).observe(document, { subtree: true, childList: true });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSaveUI") {
    // Show your save option UI here
    console.log("Trigger save UI");
  }
});