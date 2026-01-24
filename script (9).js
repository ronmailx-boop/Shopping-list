const input = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('shoppingList');


function addItem() {
    const text = input.value.trim();
    if (text === '') return;


    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        <button class="delete-btn">מחק</button>
    `;


    li.querySelector('.delete-btn').onclick = () => li.remove();


    list.appendChild(li);
    input.value = '';
    input.focus();
}


addBtn.onclick = addItem;
input.onkeypress = (e) => { if (e.key === 'Enter') addItem(); };