// Content script for Codeforces

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractCodeforcesProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

// Extract problem information from Codeforces page
function extractCodeforcesProblemInfo() {
  try {
    // Get problem name
    const problemTitleElement = document.querySelector('.problem-statement .title');
    const problemName = problemTitleElement ? problemTitleElement.textContent.trim() : '';

    // Get problem rating
    let rating = '';
    const sidebarElement = document.querySelector('.sidebar');
    if (sidebarElement) {
      const ratingMatch = sidebarElement.textContent.match(/\*(\d+)/);
      if (ratingMatch) {
        rating = ratingMatch[1];
      }
    }

    // Get problem tags
    const tags = [];
    const tagElements = document.querySelectorAll('.tag-box');
    tagElements.forEach(tagEl => {
      const tagText = tagEl.textContent.trim();
      if (tagText && !tagText.includes('Click')) {
        tags.push(tagText.toLowerCase());
      }
    });

    // Get problem URL
    const url = window.location.href;

    // Extract contest ID and problem index for the name
    let displayName = problemName;
    const urlMatch = url.match(/problemset\/problem\/(\d+)\/([A-Z]\d?)|contest\/(\d+)\/problem\/([A-Z]\d?)/);
    if (urlMatch) {
      const contestId = urlMatch[1] || urlMatch[3];
      const problemIndex = urlMatch[2] || urlMatch[4];
      displayName = `${contestId}${problemIndex} - ${problemName}`;
    }

    return {
      name: displayName,
      url: url,
      judge: 'Codeforces',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting Codeforces problem info:', error);
    return {
      name: document.title,
      url: window.location.href,
      judge: 'Codeforces',
      rating: '',
      tags: []
    };
  }
}

// Auto-detect if user is on a problem page and show indicator
function showProblemIndicator() {
  const isProblemPage = /problemset\/problem\/|contest\/\d+\/problem\//.test(window.location.href);
  
  if (isProblemPage) {
    // Create a floating button to quickly add problem
    const button = document.createElement('button');
    button.innerHTML = '📌 Add to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      // Send message to open popup with problem info
      chrome.runtime.sendMessage({ 
        action: 'openPopupWithProblem', 
        data: extractCodeforcesProblemInfo() 
      });
    };
    
    document.body.appendChild(button);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showProblemIndicator);
} else {
  showProblemIndicator();
}