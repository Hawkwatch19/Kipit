// Kipit Extension App
(function() {
  'use strict';

  const JUDGES = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef', 'CSES', 'Other'];
  const COMMON_TAGS = ['greedy', 'dp', 'graph', 'binary search', 'trees', 'math', 'implementation', 'sorting', 'strings', 'dfs', 'bfs', 'two pointers'];

  class ProblemTracker {
    constructor() {
      this.state = {
        problems: [],
        lists: ['Default'],
        activeList: 'Default',
        todoList: [],
        profiles: {},
        view: 'problems',
        searchQuery: '',
        filters: { tags: [], rating: '', judge: '', solved: '' },
        showFilters: false,
        showAddProblem: false,
        editingProblem: null,
        newList: '',
        newProblem: {
          name: '',
          url: '',
          judge: '',
          rating: '',
          tags: [],
          notes: '',
          list: 'Default',
          solved: false
        }
      };
      
      this.init();
    }

    init() {
      this.loadData();
      this.detectCurrentProblem();
      this.render();
    }

    loadData() {
      chrome.storage.local.get(['problems', 'lists', 'todoList', 'profiles'], (result) => {
        if (result.problems) this.state.problems = result.problems;
        if (result.lists) this.state.lists = result.lists;
        if (result.todoList) this.state.todoList = result.todoList;
        if (result.profiles) this.state.profiles = result.profiles;
        this.render();
      });
    }

    saveData(data) {
      chrome.storage.local.set(data);
    }

    detectCurrentProblem() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          const url = tabs[0].url;
          let judge = '';
          
          if (url.includes('codeforces.com')) judge = 'Codeforces';
          else if (url.includes('leetcode.com')) judge = 'LeetCode';
          else if (url.includes('atcoder.jp')) judge = 'AtCoder';
          else if (url.includes('codechef.com')) judge = 'CodeChef';
          else if (url.includes('cses.fi')) judge = 'CSES';

          chrome.tabs.sendMessage(tabs[0].id, { action: 'extractProblemInfo' }, (response) => {
            if (chrome.runtime.lastError) {
              this.state.newProblem = { ...this.state.newProblem, url, judge };
            } else if (response && response.success) {
              this.state.newProblem = {
                ...this.state.newProblem,
                ...response.data,
                list: this.state.activeList
              };
            }
            this.render();
          });
        }
      });
    }

    setState(updates) {
      this.state = { ...this.state, ...updates };
      this.render();
    }

    addProblem() {
      if (!this.state.newProblem.name || !this.state.newProblem.url) return;

      const problem = {
        ...this.state.newProblem,
        id: Date.now(),
        addedDate: new Date().toISOString()
      };

      const updatedProblems = [...this.state.problems, problem];
      this.setState({ 
        problems: updatedProblems,
        showAddProblem: false,
        newProblem: {
          name: '',
          url: '',
          judge: '',
          rating: '',
          tags: [],
          notes: '',
          list: this.state.activeList,
          solved: false
        }
      });
      this.saveData({ problems: updatedProblems });
    }

    updateProblem(id, updates) {
      const updatedProblems = this.state.problems.map(p => p.id === id ? { ...p, ...updates } : p);
      this.setState({ problems: updatedProblems, editingProblem: null });
      this.saveData({ problems: updatedProblems });
    }

    deleteProblem(id) {
      const updatedProblems = this.state.problems.filter(p => p.id !== id);
      const updatedTodo = this.state.todoList.filter(tid => tid !== id);
      this.setState({ problems: updatedProblems, todoList: updatedTodo });
      this.saveData({ problems: updatedProblems, todoList: updatedTodo });
    }

    addToTodo(problemId) {
      if (!this.state.todoList.includes(problemId)) {
        const updatedTodo = [...this.state.todoList, problemId];
        this.setState({ todoList: updatedTodo });
        this.saveData({ todoList: updatedTodo });
      }
    }

    removeFromTodo(problemId) {
      const updatedTodo = this.state.todoList.filter(id => id !== problemId);
      this.setState({ todoList: updatedTodo });
      this.saveData({ todoList: updatedTodo });
    }

    createList() {
      if (this.state.newList && !this.state.lists.includes(this.state.newList)) {
        const updatedLists = [...this.state.lists, this.state.newList];
        this.setState({ lists: updatedLists, newList: '' });
        this.saveData({ lists: updatedLists });
      }
    }

    deleteList(listName) {
      if (listName === 'Default') return;
      
      const updatedLists = this.state.lists.filter(l => l !== listName);
      const updatedProblems = this.state.problems.map(p => 
        p.list === listName ? { ...p, list: 'Default' } : p
      );
      
      this.setState({ 
        lists: updatedLists,
        problems: updatedProblems,
        activeList: this.state.activeList === listName ? 'Default' : this.state.activeList
      });
      this.saveData({ lists: updatedLists, problems: updatedProblems });
    }

    exportData() {
      const data = { 
        problems: this.state.problems, 
        lists: this.state.lists, 
        todoList: this.state.todoList, 
        profiles: this.state.profiles 
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `problem-tracker-${Date.now()}.json`;
      a.click();
    }

    importData(file) {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.problems) this.state.problems = data.problems;
          if (data.lists) this.state.lists = data.lists;
          if (data.todoList) this.state.todoList = data.todoList;
          if (data.profiles) this.state.profiles = data.profiles;
          this.saveData(data);
          this.render();
        } catch (err) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }

    getFilteredProblems() {
      return this.state.problems.filter(p => {
        if (this.state.view === 'problems' && p.list !== this.state.activeList) return false;
        if (this.state.view === 'todo' && !this.state.todoList.includes(p.id)) return false;
        
        if (this.state.searchQuery && !p.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())) return false;
        if (this.state.filters.judge && p.judge !== this.state.filters.judge) return false;
        if (this.state.filters.rating && p.rating !== this.state.filters.rating) return false;
        if (this.state.filters.solved === 'solved' && !p.solved) return false;
        if (this.state.filters.solved === 'unsolved' && p.solved) return false;
        if (this.state.filters.tags.length > 0 && !this.state.filters.tags.some(tag => p.tags && p.tags.includes(tag))) return false;
        
        return true;
      });
    }

    render() {
      const root = document.getElementById('root');
      if (!root) return;

      root.innerHTML = `
        <div class="w-full h-full bg-white overflow-y-auto">
          ${this.renderHeader()}
          ${this.state.view === 'problems' ? this.renderProblemsView() : ''}
          ${this.state.view === 'todo' ? this.renderTodoView() : ''}
          ${this.state.view === 'settings' ? this.renderSettingsView() : ''}
          ${this.state.showAddProblem ? this.renderAddProblemModal() : ''}
        </div>
      `;

      this.attachEventListeners();
    }

    renderHeader() {
      return `
        <div class="bg-gradient text-white p-4 sticky top-0 z-10 shadow-lg">
          <h1 class="text-xl font-bold mb-3">Kipit</h1>
          <div class="flex gap-2">
            <button data-action="setView" data-view="problems" class="px-3 py-2 rounded-lg text-sm ${this.state.view === 'problems' ? 'bg-white text-blue-600' : 'bg-blue-500'}">
              📋 Lists
            </button>
            <button data-action="setView" data-view="todo" class="px-3 py-2 rounded-lg text-sm ${this.state.view === 'todo' ? 'bg-white text-blue-600' : 'bg-blue-500'}">
              ✓ Todo (${this.state.todoList.length})
            </button>
            <button data-action="setView" data-view="settings" class="px-3 py-2 rounded-lg text-sm ${this.state.view === 'settings' ? 'bg-white text-blue-600' : 'bg-blue-500'}">
              ⚙️ Settings
            </button>
          </div>
        </div>
      `;
    }

    renderProblemsView() {
      const filteredProblems = this.getFilteredProblems();
      
      return `
        <div class="p-3">
          <div class="flex gap-2 mb-3 flex-wrap text-sm">
            ${this.state.lists.map(list => `
              <div class="flex items-center gap-1">
                <button data-action="setActiveList" data-list="${list}" class="px-3 py-1 rounded-lg ${this.state.activeList === list ? 'bg-blue-600 text-white' : 'bg-gray-100'}">
                  ${list} (${this.state.problems.filter(p => p.list === list).length})
                </button>
                ${list !== 'Default' ? `<button data-action="deleteList" data-list="${list}" class="p-1 hover:bg-red-100 rounded text-red-500">×</button>` : ''}
              </div>
            `).join('')}
            <input type="text" id="newListInput" placeholder="New list..." class="px-2 py-1 border rounded-lg text-sm" />
            <button data-action="createList" class="px-3 py-1 bg-green-500 text-white rounded-lg">+</button>
          </div>

          <div class="flex gap-2 mb-3">
            <input type="text" id="searchInput" placeholder="Search..." value="${this.state.searchQuery}" class="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button data-action="toggleFilters" class="px-3 py-2 rounded-lg ${this.state.showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100'}">🔍</button>
            <button data-action="showAddProblem" class="px-3 py-2 bg-blue-600 text-white rounded-lg">+ Add</button>
          </div>

          ${this.state.showFilters ? this.renderFilters() : ''}

          <div class="space-y-3">
            ${filteredProblems.length > 0 ? filteredProblems.map(p => this.renderProblemCard(p)).join('') : 
              '<div class="text-center py-12 text-gray-400">No problems found. Click + to add!</div>'}
          </div>
        </div>
      `;
    }

    renderTodoView() {
      const filteredProblems = this.getFilteredProblems();
      
      return `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Todo List (${this.state.todoList.length} problems)</h2>
          <div class="space-y-3">
            ${filteredProblems.length > 0 ? filteredProblems.map(p => this.renderProblemCard(p, true)).join('') : 
              '<div class="text-center py-12 text-gray-400">No problems in todo list</div>'}
          </div>
        </div>
      `;
    }

    renderSettingsView() {
      const solvedCount = this.state.problems.filter(p => p.solved).length;
      
      return `
        <div class="p-4 space-y-6">
          <div>
            <h2 class="text-xl font-bold mb-4">Online Judge Profiles</h2>
            <p class="text-sm text-gray-600 mb-3">Connect your OJ handles (API integration coming soon)</p>
            ${JUDGES.filter(j => j !== 'Other').map(judge => `
              <div class="flex items-center gap-3 mb-3">
                <label class="w-32 font-medium">${judge}:</label>
                <input type="text" placeholder="Handle" value="${this.state.profiles[judge] || ''}" 
                  data-action="updateProfile" data-judge="${judge}" class="flex-1 px-3 py-2 border rounded-lg" />
              </div>
            `).join('')}
          </div>

          <div>
            <h2 class="text-xl font-bold mb-4">Backup & Restore</h2>
            <div class="flex gap-3">
              <button data-action="exportData" class="px-4 py-2 bg-green-500 text-white rounded-lg">📥 Export Data</button>
              <label class="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
                📤 Import Data
                <input type="file" accept=".json" id="importInput" class="hidden" />
              </label>
            </div>
          </div>

          <div>
            <h2 class="text-xl font-bold mb-2">Statistics</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">${this.state.problems.length}</div>
                <div class="text-gray-600">Total Problems</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-green-600">${solvedCount}</div>
                <div class="text-gray-600">Solved</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderFilters() {
      return `
        <div class="bg-gray-50 p-4 rounded-lg mb-3">
          <div class="grid grid-cols-3 gap-3 mb-3">
            <select id="filterJudge" class="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Judges</option>
              ${JUDGES.map(j => `<option value="${j}" ${this.state.filters.judge === j ? 'selected' : ''}>${j}</option>`).join('')}
            </select>
            <select id="filterSolved" class="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="solved" ${this.state.filters.solved === 'solved' ? 'selected' : ''}>Solved</option>
              <option value="unsolved" ${this.state.filters.solved === 'unsolved' ? 'selected' : ''}>Unsolved</option>
            </select>
            <input type="text" id="filterRating" placeholder="Rating..." value="${this.state.filters.rating}" class="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div class="flex flex-wrap gap-2">
            ${COMMON_TAGS.map(tag => `
              <button data-action="toggleFilterTag" data-tag="${tag}" class="px-3 py-1 rounded-full text-sm ${
                this.state.filters.tags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }">${tag}</button>
            `).join('')}
          </div>
        </div>
      `;
    }

    renderProblemCard(problem, isTodoView = false) {
      return `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-lg">${this.escapeHtml(problem.name)}</h3>
                ${problem.solved ? 
                  '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Solved</span>' :
                  '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⏱ Unsolved</span>'
                }
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-600 mb-2">
                ${problem.judge ? `<span>🔗 ${problem.judge}</span>` : ''}
                ${problem.rating ? `<span>📊 ${problem.rating}</span>` : ''}
              </div>
              ${problem.tags && problem.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-2">
                  ${problem.tags.map(tag => `<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"># ${tag}</span>`).join('')}
                </div>
              ` : ''}
              ${problem.notes ? `<p class="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">${this.escapeHtml(problem.notes)}</p>` : ''}
            </div>
            <div class="flex gap-1 ml-2">
              <a href="${problem.url}" target="_blank" class="p-2 hover:bg-blue-100 rounded text-blue-600">Link</a>
              <button data-action="toggleSolved" data-id="${problem.id}" class="p-2 hover:bg-gray-100 rounded">✅</button>
              ${!isTodoView ? 
                `<button data-action="addToTodo" data-id="${problem.id}" class="p-2 hover:bg-green-100 rounded text-green-600">+</button>` :
                `<button data-action="removeFromTodo" data-id="${problem.id}" class="p-2 hover:bg-yellow-100 rounded text-yellow-600">-</button>`
              }
              <button data-action="deleteProblem" data-id="${problem.id}" class="p-2 hover:bg-red-100 rounded text-red-500">🗑</button>
            </div>
          </div>
        </div>
      `;
    }

    renderAddProblemModal() {
      return `
        <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4" style="background-color: rgba(0,0,0,0.5);">
          <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">Add Problem</h2>
              <button data-action="closeAddProblem" class="text-2xl">×</button>
            </div>
            <div class="space-y-3">
              <input type="text" id="problemName" placeholder="Problem Name" value="${this.state.newProblem.name}" class="w-full px-3 py-2 border rounded-lg" />
              <input type="text" id="problemUrl" placeholder="Problem URL" value="${this.state.newProblem.url}" class="w-full px-3 py-2 border rounded-lg" />
              <div class="grid grid-cols-2 gap-3">
                <select id="problemJudge" class="px-3 py-2 border rounded-lg">
                  <option value="">Select Judge</option>
                  ${JUDGES.map(j => `<option value="${j}" ${this.state.newProblem.judge === j ? 'selected' : ''}>${j}</option>`).join('')}
                </select>
                <input type="text" id="problemRating" placeholder="Rating" value="${this.state.newProblem.rating}" class="px-3 py-2 border rounded-lg" />
              </div>
              <select id="problemList" class="w-full px-3 py-2 border rounded-lg">
                ${this.state.lists.map(l => `<option value="${l}" ${this.state.newProblem.list === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
              <input type="text" id="problemTags" placeholder="Tags (comma separated)" value="${this.state.newProblem.tags.join(', ')}" class="w-full px-3 py-2 border rounded-lg" />
              <textarea id="problemNotes" placeholder="Notes..." class="w-full px-3 py-2 border rounded-lg h-24">${this.state.newProblem.notes}</textarea>
              <label class="flex items-center gap-2">
                <input type="checkbox" id="problemSolved" ${this.state.newProblem.solved ? 'checked' : ''} />
                <span>Mark as solved</span>
              </label>
              <button data-action="submitProblem" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Problem</button>
            </div>
          </div>
        </div>
      `;
    }

    attachEventListeners() {
      document.querySelectorAll('[data-action]').forEach(el => {
        const action = el.dataset.action;
        el.addEventListener('click', (e) => this.handleAction(action, el, e));
      });

      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.state.searchQuery = e.target.value;
          this.render();
        });
      }

      const newListInput = document.getElementById('newListInput');
      if (newListInput) {
        newListInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.state.newList = e.target.value;
            this.createList();
          }
        });
        newListInput.addEventListener('input', (e) => {
          this.state.newList = e.target.value;
        });
      }

      const filterJudge = document.getElementById('filterJudge');
      if (filterJudge) filterJudge.addEventListener('change', (e) => {
        this.state.filters.judge = e.target.value;
        this.render();
      });

      const filterSolved = document.getElementById('filterSolved');
      if (filterSolved) filterSolved.addEventListener('change', (e) => {
        this.state.filters.solved = e.target.value;
        this.render();
      });

      const filterRating = document.getElementById('filterRating');
      if (filterRating) filterRating.addEventListener('input', (e) => {
        this.state.filters.rating = e.target.value;
        this.render();
      });

      const importInput = document.getElementById('importInput');
      if (importInput) {
        importInput.addEventListener('change', (e) => {
          if (e.target.files[0]) this.importData(e.target.files[0]);
        });
      }

      document.querySelectorAll('[data-action="updateProfile"]').forEach(input => {
        input.addEventListener('input', (e) => {
          const judge = e.target.dataset.judge;
          this.state.profiles[judge] = e.target.value;
          this.saveData({ profiles: this.state.profiles });
        });
      });
    }

    handleAction(action, el, event) {
      switch (action) {
        case 'setView':
          this.setState({ view: el.dataset.view });
          break;
        case 'setActiveList':
          this.setState({ activeList: el.dataset.list });
          break;
        case 'deleteList':
          if (confirm(`Delete list "${el.dataset.list}"?`)) {
            this.deleteList(el.dataset.list);
          }
          break;
        case 'createList':
          this.createList();
          break;
        case 'toggleFilters':
          this.setState({ showFilters: !this.state.showFilters });
          break;
        case 'showAddProblem':
          this.setState({ showAddProblem: true });
          break;
        case 'closeAddProblem':
          this.setState({ showAddProblem: false });
          break;
        case 'submitProblem':
          this.collectProblemData();
          this.addProblem();
          break;
        case 'toggleSolved':
          const problem = this.state.problems.find(p => p.id == el.dataset.id);
          if (problem) {
            this.updateProblem(problem.id, { solved: !problem.solved });
          }
          break;
        case 'deleteProblem':
          if (confirm('Delete this problem?')) {
            this.deleteProblem(parseInt(el.dataset.id));
          }
          break;
        case 'addToTodo':
          this.addToTodo(parseInt(el.dataset.id));
          break;
        case 'removeFromTodo':
          this.removeFromTodo(parseInt(el.dataset.id));
          break;
        case 'toggleFilterTag':
          const tag = el.dataset.tag;
          if (this.state.filters.tags.includes(tag)) {
            this.state.filters.tags = this.state.filters.tags.filter(t => t !== tag);
          } else {
            this.state.filters.tags.push(tag);
          }
          this.render();
          break;
        case 'exportData':
          this.exportData();
          break;
      }
    }

    collectProblemData() {
      const name = document.getElementById('problemName')?.value || '';
      const url = document.getElementById('problemUrl')?.value || '';
      const judge = document.getElementById('problemJudge')?.value || '';
      const rating = document.getElementById('problemRating')?.value || '';
      const list = document.getElementById('problemList')?.value || 'Default';
      const tagsInput = document.getElementById('problemTags')?.value || '';
      const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
      const notes = document.getElementById('problemNotes')?.value || '';
      const solved = document.getElementById('problemSolved')?.checked || false;

      this.state.newProblem = { name, url, judge, rating, list, tags, notes, solved };
    }

    escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }
  }

  // Initialize the app
  const app = new ProblemTracker();
})();