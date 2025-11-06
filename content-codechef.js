// Content script for CodeChef

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractCodeChefProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

function extractCodeChefProblemInfo() {
  try {
    // Get problem name
    const problemTitleElement = document.querySelector('.problem-title') || 
                                document.querySelector('h1') ||
                                document.querySelector('.title');
    const problemName = problemTitleElement ? problemTitleElement.textContent.trim() : '';

    // Get problem difficulty/rating
    let rating = '';
    const difficultyElement = document.querySelector('.difficulty-label') ||
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
    const tagElements = document.querySelectorAll('.tags a') ||
                       document.querySelectorAll('[class*="tag"]');
    
    tagElements.forEach(tagEl => {
      const tagText = tagEl.textContent.trim().toLowerCase();
      if (tagText) {
        tags.push(tagText);
      }
    });

    // Get problem URL
    const url = window.location.href;

    // Extract problem code if available
    const problemCodeMatch = url.match(/problems\/([A-Z0-9]+)/);
    const problemCode = problemCodeMatch ? problemCodeMatch[1] : '';
    const displayName = problemCode ? `${problemCode} - ${problemName}` : problemName;

    return {
      name: displayName,
      url: url,
      judge: 'CodeChef',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting CodeChef problem info:', error);
    return {
      name: document.title.replace(' - CodeChef', ''),
      url: window.location.href,
      judge: 'CodeChef',
      rating: '',
      tags: []
    };
  }
}

function showProblemIndicator() {
  const isProblemPage = /problems\/[A-Z0-9]+/.test(window.location.href);
  
  if (isProblemPage) {
    const button = document.createElement('button');
    button.innerHTML = '📌 Add to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
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
        data: extractCodeChefProblemInfo() 
      });
    };
    
    document.body.appendChild(button);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showProblemIndicator);
} else {
  showProblemIndicator();
}