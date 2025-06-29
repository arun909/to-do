class ModernTodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.currentFilter = 'all';
    this.isFloating = false;
    this.isMinimized = false;
    this.isDarkTheme = localStorage.getItem('theme') === 'light' ? false : true;
    
    // Timer states
    this.timerInterval = null;
    this.timerTime = 0;
    this.timerRunning = false;
    this.timerTotalTime = 0;
    
    // Stopwatch states
    this.stopwatchInterval = null;
    this.stopwatchTime = 0;
    this.stopwatchRunning = false;
    this.lapTimes = [];
    
    // Break timer states
    this.breakInterval = null;
    this.breakTimer = null;
    
    // Fullscreen states
    this.isFullscreen = false;
    this.currentFullscreen = null;
    
    // Dragging states
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.motivationalQuotes = [
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
      { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
      { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" }
    ];
    
    this.init();
  }
  
  init() {
    this.applyTheme();
    this.bindEvents();
    this.renderTasks();
    this.updateProgress();
    this.startClock();
    this.makeDraggable();
    this.loadBreakTimer();
    this.bindFullscreenEvents();
  }
  
  applyTheme() {
    const body = document.body;
    if (this.isDarkTheme) {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      document.querySelector('#theme-toggle i').className = 'fas fa-sun';
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      document.querySelector('#theme-toggle i').className = 'fas fa-moon';
    }
  }
  
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
    
    // Add theme transition animation
    document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 500);
  }
  
  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Todo events
    document.getElementById('add-btn').addEventListener('click', () => this.addTask());
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    
    // Filter events
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });
    
    // Window controls
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    document.getElementById('float-btn').addEventListener('click', () => this.toggleFloating());
    document.getElementById('minimize-btn').addEventListener('click', () => this.toggleMinimize());
    
    // Timer events
    document.getElementById('timer-start').addEventListener('click', () => this.startTimer());
    document.getElementById('timer-pause').addEventListener('click', () => this.pauseTimer());
    document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
    
    // Timer input events
    ['timer-hours', 'timer-minutes', 'timer-seconds'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.updateTimerDisplay());
    });
    
    // Stopwatch events
    document.getElementById('stopwatch-start').addEventListener('click', () => this.startStopwatch());
    document.getElementById('stopwatch-pause').addEventListener('click', () => this.pauseStopwatch());
    document.getElementById('stopwatch-reset').addEventListener('click', () => this.resetStopwatch());
    document.getElementById('stopwatch-lap').addEventListener('click', () => this.addLap());
    
    // Break timer events
    document.getElementById('break-interval').addEventListener('change', (e) => this.setBreakTimer(e.target.value));
    
    // Modal events
    document.getElementById('close-quote').addEventListener('click', () => this.closeQuoteModal());
    document.getElementById('dismiss-quote').addEventListener('click', () => this.closeQuoteModal());
  }
  
  bindFullscreenEvents() {
    // Fullscreen buttons
    document.getElementById('clock-fullscreen').addEventListener('click', () => this.openFullscreen('clock'));
    document.getElementById('timer-fullscreen').addEventListener('click', () => this.openFullscreen('timer'));
    document.getElementById('stopwatch-fullscreen').addEventListener('click', () => this.openFullscreen('stopwatch'));
    
    // Fullscreen close buttons
    document.getElementById('clock-fullscreen-close').addEventListener('click', () => this.closeFullscreen());
    document.getElementById('timer-fullscreen-close').addEventListener('click', () => this.closeFullscreen());
    document.getElementById('stopwatch-fullscreen-close').addEventListener('click', () => this.closeFullscreen());
    
    // Fullscreen timer controls
    document.getElementById('fullscreen-timer-start').addEventListener('click', () => this.startTimer());
    document.getElementById('fullscreen-timer-pause').addEventListener('click', () => this.pauseTimer());
    document.getElementById('fullscreen-timer-reset').addEventListener('click', () => this.resetTimer());
    
    // Fullscreen stopwatch controls
    document.getElementById('fullscreen-stopwatch-start').addEventListener('click', () => this.startStopwatch());
    document.getElementById('fullscreen-stopwatch-pause').addEventListener('click', () => this.pauseStopwatch());
    document.getElementById('fullscreen-stopwatch-reset').addEventListener('click', () => this.resetStopwatch());
    document.getElementById('fullscreen-stopwatch-lap').addEventListener('click', () => this.addLap());
    
    // ESC key to close fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.closeFullscreen();
      }
    });
  }
  
  // Fullscreen Management
  openFullscreen(type) {
    this.isFullscreen = true;
    this.currentFullscreen = type;
    
    const overlay = document.getElementById(`${type}-fullscreen-overlay`);
    overlay.classList.add('show');
    
    // Update fullscreen displays
    if (type === 'clock') {
      this.updateFullscreenClock();
    } else if (type === 'timer') {
      this.updateFullscreenTimer();
    } else if (type === 'stopwatch') {
      this.updateFullscreenStopwatch();
    }
    
    // Add animation class
    overlay.querySelector('.fullscreen-content').classList.add('fade-in-scale');
  }
  
  closeFullscreen() {
    if (!this.isFullscreen) return;
    
    const overlay = document.getElementById(`${this.currentFullscreen}-fullscreen-overlay`);
    overlay.classList.remove('show');
    
    this.isFullscreen = false;
    this.currentFullscreen = null;
  }
  
  updateFullscreenClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    document.getElementById('fullscreen-time').textContent = timeString;
    document.getElementById('fullscreen-date').textContent = dateString;
  }
  
  updateFullscreenTimer() {
    const hours = Math.floor(this.timerTime / 3600);
    const minutes = Math.floor((this.timerTime % 3600) / 60);
    const seconds = this.timerTime % 60;
    
    const display = hours > 0 
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('fullscreen-timer').textContent = display;
    
    // Update progress ring
    if (this.timerTotalTime > 0) {
      const progress = ((this.timerTotalTime - this.timerTime) / this.timerTotalTime) * 1130.97;
      const progressCircle = document.querySelector('.progress-ring-progress');
      progressCircle.style.strokeDashoffset = 1130.97 - progress;
    }
  }
  
  updateFullscreenStopwatch() {
    const totalMs = this.stopwatchTime * 10;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor((totalMs % 1000) / 10);
    
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    document.getElementById('fullscreen-stopwatch').textContent = display;
  }
  
  // Tab Management
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add bounce animation to active tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bounce');
    setTimeout(() => {
      document.querySelector(`[data-tab="${tabName}"]`).classList.remove('bounce');
    }, 1000);
  }
  
  // Window Controls
  toggleFloating() {
    this.isFloating = !this.isFloating;
    const container = document.getElementById('app-container');
    container.classList.toggle('floating', this.isFloating);
    
    const icon = document.querySelector('#float-btn i');
    icon.className = this.isFloating ? 'fas fa-compress-arrows-alt' : 'fas fa-expand-arrows-alt';
    
    // Reset position when toggling floating mode
    if (!this.isFloating) {
      container.style.transform = '';
      this.dragOffset = { x: 0, y: 0 };
    }
  }
  
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const container = document.getElementById('app-container');
    container.classList.toggle('minimized', this.isMinimized);
    
    const icon = document.querySelector('#minimize-btn i');
    icon.className = this.isMinimized ? 'fas fa-plus' : 'fas fa-minus';
  }
  
  makeDraggable() {
    const header = document.querySelector('.header');
    const container = document.getElementById('app-container');
    
    header.addEventListener('mousedown', (e) => this.startDrag(e, container));
    header.addEventListener('touchstart', (e) => this.startDrag(e.touches[0], container));
    
    document.addEventListener('mousemove', (e) => this.drag(e, container));
    document.addEventListener('touchmove', (e) => this.drag(e.touches[0], container));
    
    document.addEventListener('mouseup', () => this.endDrag());
    document.addEventListener('touchend', () => this.endDrag());
  }
  
  startDrag(e, container) {
    if (!this.isFloating) return;
    
    this.isDragging = true;
    const rect = container.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    container.style.cursor = 'grabbing';
    container.style.transition = 'none';
  }
  
  drag(e, container) {
    if (!this.isDragging || !this.isFloating) return;
    
    e.preventDefault();
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - container.offsetWidth;
    const maxY = window.innerHeight - container.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));
    
    container.style.left = `${constrainedX}px`;
    container.style.top = `${constrainedY}px`;
    container.style.right = 'auto';
    container.style.transform = 'none';
  }
  
  endDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const container = document.getElementById('app-container');
    container.style.cursor = 'move';
    container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  }
  
  // Todo Management
  addTask() {
    const input = document.getElementById('todo-input');
    const taskText = input.value.trim();
    
    if (taskText) {
      const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      this.tasks.unshift(task);
      this.saveTasks();
      this.renderTasks();
      this.updateProgress();
      input.value = '';
      
      // Add bounce animation to add button
      document.getElementById('add-btn').classList.add('bounce');
      setTimeout(() => {
        document.getElementById('add-btn').classList.remove('bounce');
      }, 1000);
    }
  }
  
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateProgress();
    }
  }
  
  editTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      const newText = prompt('Edit task:', task.text);
      if (newText && newText.trim()) {
        task.text = newText.trim();
        this.saveTasks();
        this.renderTasks();
      }
    }
  }
  
  deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveTasks();
      this.renderTasks();
      this.updateProgress();
    }
  }
  
  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    this.renderTasks();
  }
  
  getFilteredTasks() {
    switch (this.currentFilter) {
      case 'completed':
        return this.tasks.filter(task => task.completed);
      case 'pending':
        return this.tasks.filter(task => !task.completed);
      default:
        return this.tasks;
    }
  }
  
  renderTasks() {
    const todoList = document.getElementById('todo-list');
    const filteredTasks = this.getFilteredTasks();
    
    todoList.innerHTML = '';
    
    filteredTasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = `todo-item ${task.completed ? 'completed' : ''}`;
      li.style.animationDelay = `${index * 0.1}s`;
      
      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} 
               onchange="app.toggleTask(${task.id})">
        <span class="todo-text">${task.text}</span>
        <div class="todo-actions">
          <button class="action-btn edit-btn" onclick="app.editTask(${task.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="app.deleteTask(${task.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      todoList.appendChild(li);
    });
  }
  
  updateProgress() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.completed).length;
    const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
    
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${Math.round(progress)}% Complete (${completedTasks}/${totalTasks})`;
  }
  
  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
  
  // Clock
  startClock() {
    this.updateClock();
    setInterval(() => {
      this.updateClock();
      if (this.isFullscreen && this.currentFullscreen === 'clock') {
        this.updateFullscreenClock();
      }
    }, 1000);
  }
  
  updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('current-date').textContent = dateString;
  }
  
  // Timer
  updateTimerDisplay() {
    const hours = parseInt(document.getElementById('timer-hours').value) || 0;
    const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
    
    this.timerTime = (hours * 3600) + (minutes * 60) + seconds;
    this.timerTotalTime = this.timerTime;
    this.displayTimer();
  }
  
  displayTimer() {
    const hours = Math.floor(this.timerTime / 3600);
    const minutes = Math.floor((this.timerTime % 3600) / 60);
    const seconds = this.timerTime % 60;
    
    const display = hours > 0 
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer-display').textContent = display;
    
    if (this.isFullscreen && this.currentFullscreen === 'timer') {
      this.updateFullscreenTimer();
    }
  }
  
  startTimer() {
    if (!this.timerRunning) {
      if (this.timerTime === 0) {
        this.updateTimerDisplay();
      }
      
      if (this.timerTime > 0) {
        this.timerRunning = true;
        this.timerInterval = setInterval(() => {
          this.timerTime--;
          this.displayTimer();
          
          if (this.timerTime <= 0) {
            this.timerComplete();
          }
        }, 1000);
      }
    }
  }
  
  pauseTimer() {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  resetTimer() {
    this.pauseTimer();
    this.timerTime = 0;
    this.timerTotalTime = 0;
    this.updateTimerDisplay();
  }
  
  timerComplete() {
    this.pauseTimer();
    this.showNotification('Timer Complete!', 'Your timer has finished.');
    this.playAlarmSound();
    
    // Add completion animation
    if (this.isFullscreen && this.currentFullscreen === 'timer') {
      document.getElementById('fullscreen-timer').classList.add('bounce');
      setTimeout(() => {
        document.getElementById('fullscreen-timer').classList.remove('bounce');
      }, 1000);
    }
  }
  
  // Stopwatch
  startStopwatch() {
    if (!this.stopwatchRunning) {
      this.stopwatchRunning = true;
      this.stopwatchInterval = setInterval(() => {
        this.stopwatchTime++;
        this.displayStopwatch();
      }, 10);
    }
  }
  
  pauseStopwatch() {
    this.stopwatchRunning = false;
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
      this.stopwatchInterval = null;
    }
  }
  
  resetStopwatch() {
    this.pauseStopwatch();
    this.stopwatchTime = 0;
    this.lapTimes = [];
    this.displayStopwatch();
    this.renderLaps();
  }
  
  displayStopwatch() {
    const totalMs = this.stopwatchTime * 10;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor((totalMs % 1000) / 10);
    
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    document.getElementById('stopwatch-display').textContent = display;
    
    if (this.isFullscreen && this.currentFullscreen === 'stopwatch') {
      this.updateFullscreenStopwatch();
    }
  }
  
  addLap() {
    if (this.stopwatchRunning) {
      const lapTime = this.stopwatchTime * 10;
      this.lapTimes.push(lapTime);
      this.renderLaps();
    }
  }
  
  renderLaps() {
    const lapsList = document.getElementById('laps-list');
    lapsList.innerHTML = '';
    
    this.lapTimes.forEach((lapTime, index) => {
      const minutes = Math.floor(lapTime / 60000);
      const seconds = Math.floor((lapTime % 60000) / 1000);
      const milliseconds = Math.floor((lapTime % 1000) / 10);
      
      const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
      
      const li = document.createElement('li');
      li.className = 'lap-item fade-in-scale';
      li.innerHTML = `
        <span>Lap ${index + 1}</span>
        <span>${display}</span>
      `;
      lapsList.appendChild(li);
    });
  }
  
  // Break Timer
  setBreakTimer(minutes) {
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
      this.breakTimer = null;
    }
    
    if (minutes > 0) {
      const intervalMs = minutes * 60 * 1000;
      this.breakTimer = setInterval(() => {
        this.showMotivationalQuote();
      }, intervalMs);
      
      localStorage.setItem('breakInterval', minutes);
    } else {
      localStorage.removeItem('breakInterval');
    }
  }
  
  loadBreakTimer() {
    const savedInterval = localStorage.getItem('breakInterval');
    if (savedInterval) {
      document.getElementById('break-interval').value = savedInterval;
      this.setBreakTimer(parseInt(savedInterval));
    }
  }
  
  showMotivationalQuote() {
    const randomQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
    
    document.getElementById('quote-text').textContent = randomQuote.text;
    document.getElementById('quote-author').textContent = `— ${randomQuote.author}`;
    document.getElementById('quote-modal').classList.add('show');
  }
  
  closeQuoteModal() {
    document.getElementById('quote-modal').classList.remove('show');
  }
  
  // Utility functions
  showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      });
    }
  }
  
  playAlarmSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }
}

// Initialize the app
const app = new ModernTodoApp();

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}