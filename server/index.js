const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Transaction = require('./models/Transaction');
const SavingsPlan = require('./models/SavingsPlan');
console.log('SavingsPlan model loaded:', !!SavingsPlan); // Should print "SavingsPlan model loaded: true"
const SpendingLimit = require('./models/SpendingLimit');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mernstack';

// Connect to MongoDB
mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/FinanceVisualizer')
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  // Exit process with failure
  process.exit(1);
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add these routes to your Express app

// Get all savings plans
app.get('/api/savings-plans', async (req, res) => {
  try {
    const savingsPlans = await SavingsPlan.find().sort({ createdAt: -1 });
    res.json(savingsPlans);
  } catch (error) {
    console.error('Error fetching savings plans:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new savings plan
app.post('/api/savings-plans', async (req, res) => {
  try {
    // Debug request body
    console.log("Received request body:", req.body);
    
    // Extract fields
    const { name, targetAmount, currentAmount = 0, icon, iconBg } = req.body;
    
    console.log("Extracted fields:", { name, targetAmount, currentAmount, icon, iconBg });
    
    // Enhanced validation with better error messages
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    if (targetAmount === undefined || targetAmount === null) {
      return res.status(400).json({ message: 'Target amount is required' });
    }
    
    // Convert to Number explicitly and check if valid
    const targetNum = Number(targetAmount);
    if (isNaN(targetNum) || targetNum <= 0) {
      return res.status(400).json({ message: 'Target amount must be a positive number' });
    }
    
    const currentNum = Number(currentAmount || 0);
    if (isNaN(currentNum)) {
      return res.status(400).json({ message: 'Current amount must be a number' });
    }
    
    // Create new savings plan
    const newSavingsPlan = new SavingsPlan({
      name,
      targetAmount: targetNum,
      currentAmount: currentNum,
      icon: icon || 'ti-piggy-bank',
      iconBg: iconBg || 'bg-indigo-500'
    });
    
    console.log("Created savings plan model:", newSavingsPlan);
    
    const savedPlan = await newSavingsPlan.save();
    console.log("Saved plan:", savedPlan);
    
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error('Error adding savings plan:', error);
    
    // Detailed error response
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(400).json({ message: error.message });
  }
});

// Update savings plan
app.put('/api/savings-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, icon, iconBg } = req.body;
    
    const updatedPlan = await SavingsPlan.findByIdAndUpdate(
      id,
      { name, targetAmount, currentAmount, icon, iconBg },
      { new: true }
    );
    
    if (!updatedPlan) {
      return res.status(404).json({ message: 'Savings plan not found' });
    }
    
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating savings plan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete savings plan
app.delete('/api/savings-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPlan = await SavingsPlan.findByIdAndDelete(id);
    
    if (!deletedPlan) {
      return res.status(404).json({ message: 'Savings plan not found' });
    }
    
    res.json({ message: 'Savings plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting savings plan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all spending limits
app.get('/api/spending-limits', async (req, res) => {
  try {
    const limits = await SpendingLimit.find().sort({ category: 1 });
    res.json(limits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get spending limit by period
app.get('/api/spending-limits/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const spendingLimit = await SpendingLimit.findOne({ 
      category: "Total", 
      period: period 
    });
    
    if (!spendingLimit) {
      // Return a default limit if none is set
      return res.json({ 
        category: "Total", 
        limit: period === "daily" ? 1000 : period === "weekly" ? 5000 : 20000, 
        period 
      });
    }
    
    res.json(spendingLimit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update spending limit
app.post('/api/spending-limits', async (req, res) => {
  try {
    const { category, limit, period } = req.body;
    
    // Validate inputs
    if (!category || !limit || !period) {
      return res.status(400).json({ message: 'Category, limit, and period are required' });
    }
    
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Period must be daily, weekly, or monthly' });
    }
    
    // Check if limit already exists
    let spendingLimit = await SpendingLimit.findOne({ category, period });
    
    if (spendingLimit) {
      // Update existing limit
      spendingLimit.limit = limit;
      await spendingLimit.save();
    } else {
      // Create new limit
      spendingLimit = new SpendingLimit({
        category,
        limit,
        period
      });
      await spendingLimit.save();
    }
    
    res.status(201).json(spendingLimit);
  } catch (error) {
    console.error('Error setting spending limit:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update spending limit
app.put('/api/spending-limits/:id', async (req, res) => {
  try {
    const limit = await SpendingLimit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(limit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete spending limit
app.delete('/api/spending-limits/:id', async (req, res) => {
  try {
    await SpendingLimit.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Adjust balance (creates an adjustment transaction)
app.post('/api/balance/adjust', async (req, res) => {
  try {
    const { newBalance } = req.body;
    
    if (isNaN(parseFloat(newBalance))) {
      return res.status(400).json({ message: 'Invalid balance amount' });
    }
    
    // First, calculate current balance
    const transactions = await Transaction.find();
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentBalance = totalIncome - totalExpenses;
    
    // Determine if we need to add income or expense to achieve the new balance
    const difference = parseFloat(newBalance) - currentBalance;
    
    if (difference === 0) {
      return res.status(200).json({ message: 'Balance already at requested value' });
    }
    
    // Create adjustment transaction
    const transaction = new Transaction({
      description: 'Balance Adjustment',
      amount: Math.abs(difference),
      type: difference > 0 ? 'income' : 'expense',
      category: 'Adjustment',
      date: new Date()
    });
    
    await transaction.save();
    
    res.status(201).json({ 
      message: 'Balance adjusted successfully',
      transaction
    });
  } catch (error) {
    console.error('Error adjusting balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files from the React app for production
if (process.env.NODE_ENV === 'production') {
  // Check multiple possible build paths
  const buildPaths = [
    path.join(__dirname, '../client/dist'),
    path.join(__dirname, '../client/build'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../client/build')
  ];
  
  let foundBuildPath = null;
  for (const buildPath of buildPaths) {
    try {
      if (require('fs').existsSync(path.join(buildPath, 'index.html'))) {
        foundBuildPath = buildPath;
        console.log(`Found React build at: ${buildPath}`);
        break;
      }
    } catch (err) {
      console.log(`Build path ${buildPath} not found`);
    }
  }
  
  if (foundBuildPath) {
    // Serve static files from React frontend
    app.use(express.static(foundBuildPath));
    
    // Handle any requests that don't match the ones above
    app.get('*', (req, res) => {
      res.sendFile(path.join(foundBuildPath, 'index.html'));
    });
  } else {
    console.error('Could not find React build directory');
    app.get('*', (req, res) => {
      res.status(500).send('Server configuration error: React build not found');
    });
  }
} else {
  // Simple route for development
 app.get('/', (req, res) => {
    const routes = [
      '- GET    /api/transactions',
      '- POST   /api/transactions',
      '- PUT    /api/transactions/:id',
      '- DELETE /api/transactions/:id',
      '- GET    /api/savings-plans',
      '- POST   /api/savings-plans',
      '- PUT    /api/savings-plans/:id',
      '- DELETE /api/savings-plans/:id',
      '- GET    /api/spending-limits',
      '- GET    /api/spending-limits/:period',
      '- POST   /api/spending-limits',
      '- PUT    /api/spending-limits/:id',
      '- DELETE /api/spending-limits/:id',
      '- POST   /api/balance/adjust'
    ];

    const htmlResponse = `
      <html>
        <head>
          <title>Personal Finance Visualizer API</title>
          <style>
            body { 
              font-family: monospace; 
              padding: 20px; 
              line-height: 1.6;
            }
            h1 { color: #333; }
            pre { 
              background: #f4f4f4; 
              padding: 15px; 
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <h1>Personal Finance Visualizer API</h1>
          <p>Server is running on port ${port}</p>
          <h2>Available Routes:</h2>
          <pre>${routes.join('\n')}</pre>
        </body>
      </html>
    `;

    res.send(htmlResponse);
  });
}

// Use PORT environment variable for Render.com deployment
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Available routes:`);
  console.log(`- GET    /api/transactions`);
  console.log(`- POST   /api/transactions`);
  console.log(`- PUT    /api/transactions/:id`);
  console.log(`- DELETE /api/transactions/:id`);
  console.log(`- GET    /api/savings-plans`);
  console.log(`- POST   /api/savings-plans`);
  console.log(`- PUT    /api/savings-plans/:id`);
  console.log(`- DELETE /api/savings-plans/:id`);
  console.log(`- GET    /api/spending-limits`);
  console.log(`- GET    /api/spending-limits/:period`);
  console.log(`- POST   /api/spending-limits`);
  console.log(`- PUT    /api/spending-limits/:id`);
  console.log(`- DELETE /api/spending-limits/:id`);
  console.log(`- POST   /api/balance/adjust`);
});