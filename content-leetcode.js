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
  
  if (isProblemPage) {
    // Create a floating button to quickly add problem
    const button = document.createElement('button');
    button.innerHTML = '📌 Add to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #FFA116 0%, #FF6B00 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    };
    
    button.onclick = () => {
      chrome.runtime.sendMessage({ 
        action: 'openPopupWithProblem', 
        data: extractLeetCodeProblemInfo() 
      });
    };
    
    document.body.appendChild(button);
  }
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