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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showProblemIndicator);
} else {
  showProblemIndicator();
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSaveUI") {
    // Show your save option UI here
    console.log("Trigger save UI");
  }
});