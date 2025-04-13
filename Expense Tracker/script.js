
const form = document.getElementById('transaction-form');
const list = document.getElementById('transaction-list');
const totalIncome = document.getElementById('total-income');
const totalExpense = document.getElementById('total-expense');
const netBalance = document.getElementById('net-balance');
const chartCanvas = document.getElementById('expense-chart');
const importFile = document.getElementById('import-file');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editIndex = -1;
let filteredTransactions = [...transactions];

form.addEventListener('submit', e => {
    e.preventDefault();

    const date = form.date.value;
    const description = form.description.value.trim();
    const category = form.category.value;
    const amount = parseFloat(form.amount.value);
    const type = form.type.value;

    if (!date || !description || !category || isNaN(amount) || amount <= 0) {
        alert('Please fill all fields with valid data.');
        return;
    }

    if (editIndex >= 0) {
        
        transactions[editIndex] = { date, description, category, amount, type };
        editIndex = -1;
        form.querySelector("button[type='submit']").textContent = "Add Transaction";
    } else {
        // Add new transaction
        transactions.push({ date, description, category, amount, type });
    }
    
    localStorage.setItem('transactions', JSON.stringify(transactions));
    form.reset();
    filterTransactions();
});

// Import/Export function
function exportTransactions() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `transactions-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

importFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTransactions = JSON.parse(e.target.result);
            if (Array.isArray(importedTransactions) && importedTransactions.length > 0) {
                if (confirm(`Import ${importedTransactions.length} transactions? This will replace your current transactions.`)) {
                    transactions = importedTransactions;
                    localStorage.setItem('transactions', JSON.stringify(transactions));
                    filterTransactions();
                }
            } else {
                alert('The file does not contain valid transaction data.');
            }
        } catch (error) {
            alert('Error reading file. Please make sure it is a valid JSON file.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// Filter function
function filterTransactions() {
    const selectedCategory = filterCategory.value;
    const selectedType = filterType.value;

    filteredTransactions = transactions.filter(tx => {
        const categoryMatch = selectedCategory === 'all' || tx.category === selectedCategory;
        const typeMatch = selectedType === 'all' || tx.type === selectedType;
        return categoryMatch && typeMatch;
    });

    renderTransactions();
}

// Chart code
function updateChart() {
    const categories = {};
    filteredTransactions.forEach(tx => {
        if (tx.type === 'expense') {
            categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
        }
    });
    const labels = Object.keys(categories);
    const data = Object.values(categories);

    if (window.expenseChart) {
        window.expenseChart.destroy();
    }

    if (labels.length > 0) {
        window.expenseChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data,
                    backgroundColor: ['#f94144','#f3722c','#f9c74f','#90be6d','#577590','#43aa8b']
                }]
            }
        });
    }
}

function renderTransactions() {
    list.innerHTML = '';
    let income = 0, expense = 0;
    
    filteredTransactions.forEach((tx, index) => {
        const li = document.createElement('li');
        li.className = `transaction-item ${tx.type}`;
        li.innerHTML = `
            <span>${tx.date}</span>
            <span>${tx.description}</span>
            <span>${tx.category}</span>
            <span>${tx.type === 'income' ? '+' : '-'}₹${tx.amount.toFixed(2)}</span>
            <div>
                <button id="edit-btn" class="edit-btn" onclick="editTransaction(${index})">Edit</button>
                <button  id="delete-btn" class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
            </div>
        `;
        list.appendChild(li);

        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
    });

    totalIncome.textContent = `₹${income.toFixed(2)}`;
    totalExpense.textContent = `₹${expense.toFixed(2)}`;
    netBalance.textContent = `₹${(income - expense).toFixed(2)}`;
    updateChart();
}

function deleteTransaction(index) {
    const txId = filteredTransactions[index].description + filteredTransactions[index].amount + filteredTransactions[index].date;
    const actualIndex = transactions.findIndex(t => 
        t.description + t.amount + t.date === txId
    );

    if (actualIndex !== -1 && confirm('Are you sure you want to delete this transaction?')) {
        transactions.splice(actualIndex, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        filterTransactions();
    }
}

function editTransaction(index) {
    const txId = filteredTransactions[index].description + filteredTransactions[index].amount + filteredTransactions[index].date;
    const actualIndex = transactions.findIndex(t => 
        t.description + t.amount + t.date === txId
    );

    if (actualIndex !== -1) {
        const tx = transactions[actualIndex];
        form.date.value = tx.date;
        form.description.value = tx.description;
        form.amount.value = tx.amount;
        form.type.value = tx.type;
        form.category.value = tx.category;

        editIndex = actualIndex;
        form.querySelector("button[type='submit']").textContent = "Update Transaction";
    }
}

function init() {
    filterTransactions();
}

init();