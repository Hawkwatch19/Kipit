// Content script for AtCoder

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractAtCoderProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

function extractAtCoderProblemInfo() {
  try {
    // Get problem name
    const problemTitleElement = document.querySelector('.h2') || 
                                document.querySelector('span.h2');
    const problemName = problemTitleElement ? problemTitleElement.textContent.trim() : '';

    // Get contest and problem ID from URL
    const urlMatch = window.location.href.match(/contests\/([^\/]+)\/tasks\/([^\/\?]+)/);
    const contestId = urlMatch ? urlMatch[1] : '';
    const taskId = urlMatch ? urlMatch[2] : '';

    // Get time and memory limits (can be used as difficulty indicator)
    let rating = '';
    const limitsText = document.querySelector('.col-sm-12')?.textContent || '';
    
    // AtCoder uses contest difficulty, approximate rating
    if (contestId.includes('abc')) rating = '1200';
    else if (contestId.includes('arc')) rating = '1800';
    else if (contestId.includes('agc')) rating = '2400';

    // Get problem tags (AtCoder doesn't always show tags)
    const tags = [];
    
    // Determine tags based on problem characteristics
    if (problemName.toLowerCase().includes('graph')) tags.push('graph');
    if (problemName.toLowerCase().includes('tree')) tags.push('trees');
    if (problemName.toLowerCase().includes('dp')) tags.push('dp');

    const url = window.location.href;
    const displayName = `${contestId.toUpperCase()} ${taskId.split('_').pop().toUpperCase()} - ${problemName}`;

    return {
      name: displayName,
      url: url,
      judge: 'AtCoder',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting AtCoder problem info:', error);
    return {
      name: document.title,
      url: window.location.href,
      judge: 'AtCoder',
      rating: '',
      tags: []
    };
  }
}

function showProblemIndicator() {
  const isProblemPage = /contests\/[^\/]+\/tasks\//.test(window.location.href);
  
  if (isProblemPage) {
    const button = document.createElement('button');
    button.innerHTML = '📌 Add to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
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
        data: extractAtCoderProblemInfo() 
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