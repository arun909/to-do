class RoboFlowApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.currentFilter = 'all';
    this.isFloating = false;
    this.isMinimized = false;
    this.isDarkTheme = localStorage.getItem('theme') === 'light' ? false : true;
    this.currentSection = 'main';
    
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
    
    // Clock states
    this.clockInterval = null;
    this.quoteInterval = null;
    
    this.motivationalQuotes = [
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
      { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
      { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
      { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
      { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
      { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" }
    ];
    
    this.init();
  }
  
  init() {
    this.applyTheme();
    this.bindEvents();
    this.renderTasks();
    this.updateProgress();
    this.startClock();
    this.startAnalogClock();
    this.makeDraggable();
    this.showRandomQuote();
    this.startQuoteRotation();
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
    // Navigation events
    document.querySelectorAll('.nav-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.showSection(section);
      });
    });
    
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const backTo = e.currentTarget.dataset.back;
        this.showSection(backTo);
      });
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
    
    // Modal events
    document.getElementById('close-quote').addEventListener('click', () => this.closeQuoteModal());
    document.getElementById('dismiss-quote').addEventListener('click', () => this.closeQuoteModal());
  }
  
  // Navigation Management
  showSection(sectionName) {
    // Hide all sections
    document.getElementById('main-clock').style.display = 'none';
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show requested section
    if (sectionName === 'main') {
      document.getElementById('main-clock').style.display = 'block';
    } else {
      document.getElementById(`${sectionName}-section`).classList.add('active');
    }
    
    this.currentSection = sectionName;
  }
  
  // Window Controls
  toggleFloating() {
    this.isFloating = !this.isFloating;
    const container = document.getElementById('app-container');
    
    if (this.isFloating) {
      container.classList.remove('fullscreen');
      container.classList.add('floating');
    } else {
      container.classList.remove('floating');
      container.classList.add('fullscreen');
    }
    
    const icon = document.querySelector('#float-btn i');
    icon.className = this.isFloating ? 'fas fa-expand-arrows-alt' : 'fas fa-compress-arrows-alt';
    
    // Reset position when toggling floating mode
    if (!this.isFloating) {
      container.style.transform = '';
      container.style.left = '';
      container.style.top = '';
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
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => this.startDrag(e, container));
    header.addEventListener('touchstart', (e) => this.startDrag(e.touches[0], container));
    
    document.addEventListener('mousemove', (e) => this.drag(e, container));
    document.addEventListener('touchmove', (e) => this.drag(e.touches[0], container));
    
    document.addEventListener('mouseup', () => this.endDrag(container));
    document.addEventListener('touchend', () => this.endDrag(container));
  }
  
  startDrag(e, container) {
    if (!this.isFloating) return;
    
    this.isDragging = true;
    const rect = container.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
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
  
  endDrag(container) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    container.style.cursor = 'move';
    container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  }
  
  // Clock Functions
  startClock() {
    this.updateDigitalClock();
    this.clockInterval = setInterval(() => {
      this.updateDigitalClock();
    }, 1000);
  }
  
  updateDigitalClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    document.getElementById('digital-time').textContent = timeString;
    document.getElementById('digital-date').textContent = dateString;
  }
  
  startAnalogClock() {
    this.updateAnalogClock();
    setInterval(() => {
      this.updateAnalogClock();
    }, 1000);
  }
  
  updateAnalogClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;
    
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    
    if (hourHand) hourHand.style.transform = `rotate(${hourAngle}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondAngle}deg)`;
  }
  
  // Quote Management
  showRandomQuote() {
    const randomQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
    document.getElementById('main-quote-text').textContent = randomQuote.text;
    document.getElementById('main-quote-author').textContent = `— ${randomQuote.author}`;
  }
  
  startQuoteRotation() {
    this.quoteInterval = setInterval(() => {
      this.showRandomQuote();
    }, 30000); // Change quote every 30 seconds
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
    
    document.getElementById('progress-text').textContent = `${completedTasks} of ${totalTasks} tasks completed`;
  }
  
  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
  
  // Timer Functions
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
    
    // Update progress bar
    if (this.timerTotalTime > 0) {
      const progress = ((this.timerTotalTime - this.timerTime) / this.timerTotalTime) * 100;
      const progressBar = document.querySelector('.timer-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
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
    const progressBar = document.querySelector('.timer-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }
  
  timerComplete() {
    this.pauseTimer();
    this.showNotification('Timer Complete!', 'Your timer has finished.');
    this.playAlarmSound();
    this.showMotivationalQuote();
  }
  
  // Stopwatch Functions
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
    try {
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
    } catch (error) {
      console.log('Audio not supported');
    }
  }
}

// Initialize the app
const app = new RoboFlowApp();

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}