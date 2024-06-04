const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override'); 
const Product = require('./models/product');

const app = express();

mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB', err);
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(bodyParser.json());

app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.render('index', { products });
});

// Dodawanie nowego produktu
app.post('/products', async (req, res) => {
    try {
        const { name, price, description, quantity, unit } = req.body;

        // Sprawdzenie, czy produkt o podanej nazwie już istnieje
        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({ error: 'Product with this name already exists' });
        }

        const product = new Product({ name, price, description, quantity, unit });
        await product.save();
        res.redirect('/products');
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.redirect('/products');
});

// Edytowanie istniejącego produktu
app.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, quantity, unit } = req.body;
        const product = await Product.findByIdAndUpdate(id, { name, price, description, quantity, unit }, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.redirect('/products');
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Usuwanie produktu
app.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.redirect('/products');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//sortowanie
app.post('/sortP', async (req, res) => {
    const sortBy = req.body.sortBy;
    let sortedProducts = await Product.find();
    if (sortBy === 'name') {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'quantity') {
        sortedProducts.sort((a, b) => a.quantity - b.quantity);
    }
    res.render('index', { products: sortedProducts });
  });

//filtrowanie
  app.post('/filterByPrice', async (req, res) => {
    const maxPrice = parseInt(req.body.maxPrice);
    let productsData = await Product.find();
    const filteredProducts = productsData.filter(
      (product) => product.price <= maxPrice
    );
    res.render('index', { products: filteredProducts });
  });
  

// Generowanie raportu
app.get('/report', async (req, res) => {
    try {
        const report = await Product.aggregate([
            {
                $project: {
                    _id: 0,
                    name: 1,
                    quantity: 1,
                    totalValue: { $multiply: ["$price", "$quantity"] }
                }
            }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
