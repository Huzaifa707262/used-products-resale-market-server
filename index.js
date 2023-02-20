const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;
require("dotenv").config();
require('colors');


// -----middleware -------
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nakjhup.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// ------database collection-------
const categoryCollection = client.db("resaleDbUser").collection("category");
const bikeCollection = client.db("resaleDbUser").collection("bikes");
const ordersCollection = client.db("resaleDbUser").collection("orders");
const paymentsCollection = client.db("resaleDbUser").collection("payments");
const usersCollection = client.db("resaleDbUser").collection("users");


app.get('/category', async (req, res) => {
    try {
        const query = {};
        const result = await categoryCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        console.log(error);
    }
})

app.get('/category/:brand', async (req, res) => {
    try {
        const brand = req.params.brand;
        const query = { brand: brand }
        const result = await bikeCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        console.log(error);
    }
})
//------------- order data start here -----------------

app.post('/orders', async (req, res) => {
    try {
        const orders = req.body;
        const result = await ordersCollection.insertOne(orders);
        res.send(result)
    } catch (error) {
        console.log(error)

    }
})

app.get('/orders', verifyJWT, async (req, res) => {
    try {
        const email = req.query.email;
        const decodedEmail = req.decoded?.email;
        if (email !== decodedEmail) {
            return res.status(403).send({ message: "forbidden access" });
        }
        const query = { email: email }
        const result = await ordersCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await ordersCollection.findOne(query);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})

app.get('/specialty', async (req, res) => {
    try {
        const query = {};
        const result = await categoryCollection.find(query).project({ brand: 1 }).toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})

app.delete('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const result = await ordersCollection.deleteOne(filter);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
});

// /------------- order data ends here -----------------

//-------------- add products data --------------

app.post('/addProduct', async (req, res) => {
    try {
        const product = req.body;
        const result = await bikeCollection.insertOne(product);
        res.send(result)
    } catch (error) {
        console.log(error)

    }
})
// /-------------- add products data --------------

//----------------- seller info -------------

app.get('/seller', async (req, res) => {
    try {
        const query = {};
        const result = await bikeCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
});

app.delete('/seller/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bikeCollection.deleteOne(query);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
});
// /----------------- seller info -------------

//---------------- Buyer info ---------------------
app.get('/buyer', async (req, res) => {
    try {
        const query = {};
        const result = await ordersCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
});

app.delete('/buyer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
//---------------- Buyer info ---------------------

//--------------- payment data ------------
app.get('/booking', async (req, res) => {
    try {
        const query = {};
        const result = await ordersCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
});

app.post("/create-payment-intent", async (req, res) => {
    try {
        const booking = req.body;
        const price = booking.price;
        const amount = price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: amount,
            "payment_method_types": [
                "card"
            ]
        });
        res.send({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.log(error.message)
    }
})

app.post('/payments', async (req, res) => {
    try {
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId;
        const query = { _id: ObjectId(id) }
        const updateDoc = {
            paid: true,
            transactionId: payment.transactionId,
        }
        const updateResult = await ordersCollection.updateOne(query, updateDoc,)
        res.send(result, updateResult);
    } catch (error) {
        console.log(error.message);
    }
})
//--------------- payment data ------------

//---------- user data ----------
app.get("/users", async (req, res) => {
    try {
        const query = {};
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    } catch (error) {
        console.log(error)
    }
});
app.post('/users', async (req, res) => {
    try {
        const user = req.body;
        const result = await usersCollection.insertOne(user)
        res.send(result);
    } catch (error) {
        console.log(error)
    }
});

app.get("/users/admin/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const query = { email }
        const user = await usersCollection.findOne(query);

        res.send({ isAdmin: user?.role === 'admin' })
    } catch (error) {
        console.log(error);
    }
});

app.put("/users/admin/:id", verifyJWT, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                role: 'admin'
            }
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
});
//---------- user data ----------

// ---------------json web token -----------------
app.get('/jwt', async (req, res) => {
    try {
        const email = req.query.email;
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
        return res.send({ accessToken: token });
    } catch (error) {
        console.log(error);
    }
});

function verifyJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send('unauthorized access')
        }

        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: "forbidden access" })
            }
            req.decoded = decoded;
            next();
        })
    } catch (error) {
        console.log(error);
    }
}
// ---------------json web token -----------------

//---------- my products --------
app.get('/products', async (req, res) => {
    try {
        const query = {};
        const product = await bikeCollection.find(query).toArray();
        res.send(product)
    } catch (error) {
        console.log(error);
    }
})





//---------- my products --------

app.get("/", (req, res) => {
    res.send("resale server is running...")
})

app.listen(port, () => console.log(`resale server running ${port}`.cyan.bold))