// Вставлено власний endpoint ресурсу tasks з MockAPI.
const API_URL = 'https://6b041ca59e7cafb37dbfe87d.mockapi.io/tasks';

// Отримуємо елементи сторінки, з якими будемо працювати.
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const addButton = document.querySelector('#add-button');
const refreshButton = document.querySelector('#refresh-button');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const statusMessage = document.querySelector('#status-message');
const emptyState = document.querySelector('#empty-state');

// Показуємо повідомлення користувачу.
function showMessage(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Блокуємо кнопки, поки виконується запит до сервера.
function setLoading(isLoading) {
    addButton.disabled = isLoading;
    refreshButton.disabled = isLoading;
    taskInput.disabled = isLoading;
}

// Перевіряємо відповідь сервера. Якщо запит невдалий — створюємо помилку.
async function checkResponse(response) {
    if (!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`);
    }

    return response;
}

// GET: отримуємо всі завдання з MockAPI.
async function loadTasks() {
    setLoading(true);
    showMessage('Завантаження завдань...');

    try {
        const response = await fetch(API_URL);
        await checkResponse(response);

        const tasks = await response.json();
        renderTasks(tasks);
        showMessage('');
    } catch (error) {
        showMessage('Не вдалося завантажити завдання. Перевір підключення до інтернету та API URL.', 'error');
        console.error('GET error:', error);
    } finally {
        setLoading(false);
    }
}

// Виводимо отримані завдання на сторінку.
function renderTasks(tasks) {
    taskList.innerHTML = '';

    tasks.forEach((task) => {
        // У цьому ресурсі MockAPI ідентифікатор запису повертається в полі Type.
        // Запасний варіант task.id залишено для сумісності зі звичайним форматом API.
        const taskId = task.Type ?? task.id;

        const item = document.createElement('li');
        item.className = task.completed ? 'task-item completed' : 'task-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-check';
        checkbox.checked = Boolean(task.completed);
        checkbox.setAttribute('aria-label', 'Позначити завдання виконаним');
        checkbox.addEventListener('change', () => updateTask(taskId, checkbox.checked, task.name));

        const name = document.createElement('span');
        name.className = 'task-name';
        // textContent безпечно вставляє текст, не сприймаючи його як HTML.
        name.textContent = task.name;

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Видалити';
        deleteButton.addEventListener('click', () => deleteTask(taskId, deleteButton));

        item.append(checkbox, name, deleteButton);
        taskList.append(item);
    });

    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    taskCount.textContent = `Усього: ${total} · Виконано: ${completed}`;
    emptyState.hidden = total !== 0;
}

// POST: додаємо нове завдання на сервер.
async function addTask(name) {
    setLoading(true);
    showMessage('Додаємо завдання...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                completed: false
            })
        });

        await checkResponse(response);
        await response.json();

        taskInput.value = '';
        await loadTasks();
        showMessage('Завдання успішно додано.', 'success');
    } catch (error) {
        showMessage('Не вдалося додати завдання. Спробуй ще раз.', 'error');
        console.error('POST error:', error);
    } finally {
        setLoading(false);
    }
}

// DELETE: видаляємо завдання за його ID.
async function deleteTask(id, button) {
    if (id === undefined || id === null || id === '') {
        showMessage('Не знайдено ID завдання. Перевір поле Type у MockAPI.', 'error');
        return;
    }

    button.disabled = true;
    showMessage('Видаляємо завдання...');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        await checkResponse(response);
        await loadTasks();
        showMessage('Завдання видалено.', 'success');
    } catch (error) {
        showMessage('Не вдалося видалити завдання.', 'error');
        console.error('DELETE error:', error);
        button.disabled = false;
    }
}

// PUT: оновлюємо запис завдання на сервері (назву та стан виконання).
// Для цього API використовуємо PUT, оскільки PATCH відхиляється CORS-перевіркою.
async function updateTask(id, completed, name) {
    if (id === undefined || id === null || id === '') {
        showMessage('Не знайдено ID завдання. Перевір поле Type у MockAPI.', 'error');
        await loadTasks();
        return;
    }

    showMessage('Оновлюємо стан завдання...');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                completed: completed
            })
        });

        await checkResponse(response);
        await loadTasks();
        showMessage('Стан завдання оновлено.', 'success');
    } catch (error) {
        showMessage('Не вдалося змінити стан завдання.', 'error');
        console.error('PATCH error:', error);
        await loadTasks();
    }
}

// Обробляємо відправлення форми та перевіряємо введений текст.
taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = taskInput.value.trim();

    if (name.length === 0) {
        showMessage('Спочатку введи текст завдання.', 'error');
        taskInput.focus();
        return;
    }

    addTask(name);
});

// Кнопка ручного оновлення списку.
refreshButton.addEventListener('click', loadTasks);

// GET-запит запускається одразу після відкриття сторінки.
loadTasks();
