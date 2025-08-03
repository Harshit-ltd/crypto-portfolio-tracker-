
const API_BASE = 'http://127.0.0.1:5000';

function toggleRegister(show) {
    document.getElementById('register').style.display = show ? 'block' : 'none';
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    alert((await res.json()).message);
}

function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("auth").style.display = "none";
            document.getElementById("dashboard").style.display = "block";
        } else {
            alert("Login failed: " + data.message);
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        alert("Login request failed.");
    });
}


async function logout() {
    location.reload();
}

async function addCoin() {
    const symbol = document.getElementById('coinSymbol').value.toLowerCase();
    const amount = parseFloat(document.getElementById('coinAmount').value);

    const res = await fetch(`${API_BASE}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol, amount })
    });
    const data = await res.json();
    alert(data.message);
    loadPortfolio();
    loadChart(symbol);
}

async function loadPortfolio() {
    const res = await fetch(`${API_BASE}/portfolio`, {
        credentials: 'include'
    });
    const coins = await res.json();

    const portfolioDiv = document.getElementById('portfolio');
    portfolioDiv.innerHTML = '<h3>Your Coins</h3>' + coins.map(c => `<p>${c.symbol.toUpperCase()}: ${c.amount}</p>`).join('');
}

async function loadChart(symbol) {
    const currency = document.getElementById('currencySelect').value;
    const res = await fetch(`${API_BASE}/coin_history/${symbol}?currency=${currency}`);
    const data = await res.json();

    const prices = data.prices || [];
    const labels = prices.map(p => new Date(p[0]).toLocaleDateString());
    const values = prices.map(p => p[1]);

    const ctx = document.getElementById('coinChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `${symbol.toUpperCase()} Price (30 days)`,
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }]
        }
    });

    if (Notification.permission === 'granted') {
        new Notification(`${symbol.toUpperCase()} chart updated!`);
    } else {
        Notification.requestPermission();
    }
}
