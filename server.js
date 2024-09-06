const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const port = 3019;
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/users', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => {
    console.log("MongoDB connection successful");
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup.html', async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(409).send('Username already exists');
    }

    const newUser = new User({
        username,
        password 
    });

    await newUser.save();
    console.log('User registered:', newUser);
    res.status(201).send('User registered successfully');
});

app.post('/login.html', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });

    if (!user) {
        return res.status(401).send('Invalid username or password');
    }

    // Successful login
    //res.status(200).send('Login successful');
    //res.sendFile(path.join(__dirname, 'index.html'));
    res.redirect('http://localhost:2001');
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
