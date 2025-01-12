document.getElementById("add-btn").addEventListener("click", function() {
    const input = document.getElementById("todo-input");
    const taskText = input.value.trim();
  
    if (taskText) {
      addTask(taskText);
      input.value = "";
      updateProgress();
    }
  });
  
  function addTask(taskText) {
    const li = document.createElement("li");
    li.textContent = taskText;
  
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.addEventListener("click", function() {
      li.remove();
      updateProgress();
    });
  
    li.appendChild(deleteBtn);
    document.getElementById("todo-list").appendChild(li);
  }
  
  function updateProgress() {
    const totalTasks = document.querySelectorAll("#todo-list li").length;
    const completedTasks = document.querySelectorAll("#todo-list li").length; // Will update later for completion logic
    
    const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
    document.getElementById("progress").style.width = `${progress}%`;
    document.getElementById("progress-bar-label").textContent = `${Math.round(progress)}%`;
  }
  