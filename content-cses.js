// Content script for CSES

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractCSESProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

function extractCSESProblemInfo() {
  try {
    // Get problem name
    const problemTitleElement = document.querySelector('.title-block h1') || 
                                document.querySelector('h1');
    const problemName = problemTitleElement ? problemTitleElement.textContent.trim() : '';

    // CSES doesn't show ratings publicly, approximate based on section
    let rating = '1500'; // Default

    // Get problem tags/category
    const tags = [];
    const breadcrumbs = document.querySelectorAll('.nav-link');
    breadcrumbs.forEach(bc => {
      const text = bc.textContent.trim().toLowerCase();
      if (text && text !== 'cses' && text !== 'problem set') {
        tags.push(text);
      }
    });

    // Get problem URL
    const url = window.location.href;

    // Extract problem ID if available
    const problemIdMatch = url.match(/task\/(\d+)/);
    const problemId = problemIdMatch ? problemIdMatch[1] : '';
    const displayName = problemId ? `CSES ${problemId} - ${problemName}` : problemName;

    return {
      name: displayName,
      url: url,
      judge: 'CSES',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting CSES problem info:', error);
    return {
      name: document.title.replace(' - CSES', ''),
      url: window.location.href,
      judge: 'CSES',
      rating: '',
      tags: []
    };
  }
}

function showProblemIndicator() {
  const isProblemPage = /problemset\/task\/\d+/.test(window.location.href);
  
  if (isProblemPage) {
    const button = document.createElement('button');
    button.innerHTML = '📌 Add to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #00838f 0%, #006064 100%);
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
        data: extractCSESProblemInfo() 
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