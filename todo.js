document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const remainingSpan = document.getElementById('remaining');
    
    // 从localStorage加载任务
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStats();
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${index})">
                <span>${task.text}</span>
                <span class="delete-btn" onclick="deleteTask(${index})">✕</span>
            `;
            taskList.appendChild(li);
        });
    }
    
    window.addTask = function() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text, completed: false });
            taskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }
    
    window.toggleTask = function(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }
    
    window.deleteTask = function(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
    
    window.clearCompleted = function() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
    
    function updateStats() {
        const remaining = tasks.filter(task => !task.completed).length;
        remainingSpan.textContent = remaining;
    }
    
    // 初始化
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    renderTasks();
    updateStats();
});