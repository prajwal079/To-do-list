const BASE_URL = 'http://localhost:3000';
document.addEventListener('DOMContentLoaded', () => {
    const itemsList = document.getElementById('items-list');
    const addItemForm = document.getElementById('add-item-form');
    const newItemInput = document.getElementById('new-item');
    let currentCategory = 'all';

    async function fetchTasks() {
        try {
            const response = await fetch(`${BASE_URL}/tasks`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const tasks = await response.json();
            return tasks.filter(task => currentCategory === 'all' || task.category === currentCategory);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }

    async function renderTasks() {
        try {
            const tasks = await fetchTasks();
            itemsList.innerHTML = '';
            tasks.forEach(task => {
                const itemClass = task.checked ? 'item strike-through checked' : 'item';
                itemsList.innerHTML += `
                    <div class="${itemClass}" id="task-${task._id}">
                        <input type="checkbox" ${task.checked ? 'checked' : ''} onclick="toggleCheck('${task._id}')">
                        <p>${task.name}</p>
                        ${task.checked ? '' : `<button onclick="deleteTask('${task._id}')">Delete</button>`}
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error rendering tasks:', error);
        }
    }

    async function filterItems(category) {
        currentCategory = category;
        document.querySelectorAll('.category').forEach(cat => cat.classList.remove('active'));
        document.querySelector(`.category[data-category="${category}"]`).classList.add('active');
        await renderTasks();
    }

    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentCategory === 'all') return alert('Cannot add tasks in "All" category.');

        const newItem = newItemInput.value.trim();
        if (newItem) {
            try {
                const response = await fetch(`${BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newItem, category: currentCategory, checked: false })
                });
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                newItemInput.value = '';
                await renderTasks();
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    });

    window.filterItems = filterItems;

    window.deleteTask = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            await renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    window.toggleCheck = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/tasks/${id}`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const task = await response.json();
            const updatedTask = { checked: !task.checked };
            const updateResponse = await fetch(`${BASE_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask)
            });
            if (!updateResponse.ok) throw new Error(`Network response was not ok: ${updateResponse.statusText}`);
            await renderTasks();
        } catch (error) {
            console.error('Error toggling task check:', error);
        }
    };
    renderTasks();
});
