class ModernTodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.currentFilter = 'all';
    this.isFloating = false;
    this.isMinimized = false;
    
    // Timer states
    this.timerInterval = null;
    this.timerTime = 0;
    this.timerRunning = false;
    
    // Stopwatch states
    this.stopwatchInterval = null;
    this.stopwatchTime = 0;
    this.stopwatchRunning = false;
    this.lapTimes = [];
    
    // Alarm states
    this.alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    this.alarmCheckInterval = null;
    
    // Break timer states
    this.breakInterval = null;
    this.breakTimer = null;
    
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
    this.bindEvents();
    this.renderTasks();
    this.updateProgress();
    this.startClock();
    this.startAlarmChecker();
    this.makeDraggable();
    this.loadBreakTimer();
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
    
    // Alarm events
    document.getElementById('alarm-set').addEventListener('click', () => this.setAlarm());
    document.getElementById('alarm-cancel').addEventListener('click', () => this.cancelAlarms());
    
    // Break timer events
    document.getElementById('break-interval').addEventListener('change', (e) => this.setBreakTimer(e.target.value));
    
    // Modal events
    document.getElementById('close-quote').addEventListener('click', () => this.closeQuoteModal());
    document.getElementById('dismiss-quote').addEventListener('click', () => this.closeQuoteModal());
    document.getElementById('dismiss-alarm').addEventListener('click', () => this.dismissAlarm());
    document.getElementById('snooze-alarm').addEventListener('click', () => this.snoozeAlarm());
  }
  
  // Tab Management
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }
  
  // Window Controls
  toggleFloating() {
    this.isFloating = !this.isFloating;
    const container = document.getElementById('app-container');
    container.classList.toggle('floating', this.isFloating);
    
    const icon = document.querySelector('#float-btn i');
    icon.className = this.isFloating ? 'fas fa-compress-arrows-alt' : 'fas fa-expand-arrows-alt';
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
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    header.addEventListener('mousedown', (e) => {
      if (!this.isFloating) return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging && this.isFloating) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        container.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
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
    
    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `todo-item ${task.completed ? 'completed' : ''}`;
      
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
    setInterval(() => this.updateClock(), 1000);
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
    this.updateTimerDisplay();
  }
  
  timerComplete() {
    this.pauseTimer();
    this.showNotification('Timer Complete!', 'Your timer has finished.');
    this.playAlarmSound();
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
      li.className = 'lap-item';
      li.innerHTML = `
        <span>Lap ${index + 1}</span>
        <span>${display}</span>
      `;
      lapsList.appendChild(li);
    });
  }
  
  // Alarm
  setAlarm() {
    const hour = parseInt(document.getElementById('alarm-hour').value);
    const minute = parseInt(document.getElementById('alarm-minute').value);
    
    const alarm = {
      id: Date.now(),
      hour,
      minute,
      active: true
    };
    
    this.alarms.push(alarm);
    this.saveAlarms();
    this.renderAlarms();
    this.updateAlarmStatus();
  }
  
  cancelAlarms() {
    this.alarms = [];
    this.saveAlarms();
    this.renderAlarms();
    this.updateAlarmStatus();
  }
  
  removeAlarm(id) {
    this.alarms = this.alarms.filter(alarm => alarm.id !== id);
    this.saveAlarms();
    this.renderAlarms();
    this.updateAlarmStatus();
  }
  
  renderAlarms() {
    const alarmsList = document.getElementById('alarms-list');
    alarmsList.innerHTML = '';
    
    this.alarms.forEach(alarm => {
      const li = document.createElement('li');
      li.className = 'alarm-item';
      
      const timeString = `${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')}`;
      
      li.innerHTML = `
        <div class="alarm-time">${timeString}</div>
        <button class="alarm-remove" onclick="app.removeAlarm(${alarm.id})">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      alarmsList.appendChild(li);
    });
  }
  
  updateAlarmStatus() {
    const statusDiv = document.getElementById('alarm-status');
    
    if (this.alarms.length > 0) {
      statusDiv.textContent = `${this.alarms.length} alarm(s) set`;
      statusDiv.className = 'alarm-status active';
    } else {
      statusDiv.textContent = 'No alarms set';
      statusDiv.className = 'alarm-status inactive';
    }
  }
  
  startAlarmChecker() {
    this.alarmCheckInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      if (currentSecond === 0) { // Check only at the start of each minute
        this.alarms.forEach(alarm => {
          if (alarm.active && alarm.hour === currentHour && alarm.minute === currentMinute) {
            this.triggerAlarm(alarm);
          }
        });
      }
    }, 1000);
  }
  
  triggerAlarm(alarm) {
    const timeString = `${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')}`;
    document.getElementById('alarm-time-display').textContent = timeString;
    document.getElementById('alarm-modal').classList.add('show');
    this.playAlarmSound();
  }
  
  dismissAlarm() {
    document.getElementById('alarm-modal').classList.remove('show');
  }
  
  snoozeAlarm() {
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + 5 * 60000); // 5 minutes
    
    const snoozeAlarm = {
      id: Date.now(),
      hour: snoozeTime.getHours(),
      minute: snoozeTime.getMinutes(),
      active: true
    };
    
    this.alarms.push(snoozeAlarm);
    this.saveAlarms();
    this.renderAlarms();
    this.updateAlarmStatus();
    this.dismissAlarm();
  }
  
  saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(this.alarms));
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