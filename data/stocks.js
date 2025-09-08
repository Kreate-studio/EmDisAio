const stocks = {
    "GME": { name: "GameStop", price: 150 },
    "AMC": { name: "AMC Entertainment", price: 40 },
    "TSLA": { name: "Tesla", price: 700 },
    "AAPL": { name: "Apple", price: 150 },
    "MSFT": { name: "Microsoft", price: 300 },
    "AMZN": { name: "Amazon", price: 3400 },
    "GOOGL": { name: "Google", price: 2800 },
    "FB": { name: "Facebook", price: 350 },
    "NVDA": { name: "NVIDIA", price: 200 },
    "NFLX": { name: "Netflix", price: 500 },
};

function updateStockPrices() {
    for (const stock in stocks) {
        const change = (Math.random() - 0.5) * 0.2; // -10% to +10% change
        stocks[stock].price *= (1 + change);
        if (stocks[stock].price < 1) {
            stocks[stock].price = 1;
        }
    }
}

// Update prices every 5 minutes
setInterval(updateStockPrices, 5 * 60 * 1000);

module.exports = { stocks, updateStockPrices };