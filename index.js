const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsConfig = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Toy Utopia Server is running')
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqcwecn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

async function run() {
  try {

    // client.connect((error)=>{
    //   if(error){
    //     console.log(error)
    //     return;
    //   }
    // })

    const toysCollection = client.db('toyUtopia').collection('toyData');
    const checkToysCollection = client.db('toyUtopia').collection('check');
    const addedToysCollection = client.db('toyUtopia').collection('sellerAddedToys');
    const indexKeys = { toyName: 1 };
    const indexOptions = { name: 'nameCategory' };
    const result = await addedToysCollection.createIndex(indexKeys, indexOptions);

    // Seller Added Toy Route
    app.post('/sellerAddedToys', async (req, res) => {
      const addedToys = req.body;
      console.log(addedToys);

      const result = await addedToysCollection.insertOne(addedToys);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again later",
          status: false,
        });
      }
    })

    app.get('/allToys', async (req, res) => {
      // console.log(req.query.toyName)
      const searchToy = req.query.toyName;
      let query = {};
      if (req.query.toyName) {
        query = {
          toyName: { $regex: searchToy, $options: "i" },
        }
      }

      const result = await addedToysCollection.find(query).limit(20).toArray();
      // console.log(result)
      res.send(result);
    })

    app.get('/allToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addedToysCollection.findOne(query);
      res.send(result);
    })

    app.get('/myToys', async (req, res) => {
      // console.log(req.query)
      let query = {};
      if (req.query.sellerEmail) {
        query = { sellerEmail: req.query.sellerEmail };
      }

      let sort = {};
      if(req.query.order){
        const order = req.query.order;
        sort = { price: order === 'ascending' ? 1 : 'descending' ? -1 : 0 }
      }

      const result = await addedToysCollection.find(query).sort(sort).toArray();
      // console.log(result)
      res.send(result);
    })

    // sorting

    // descending
    // app.get('/myToys/:order', async (req, res) => {
      
    //   console.log(req.params.order);
      
    //   const result = await addedToysCollection.find().sort(sort).toArray();
    //   res.send(result);
    // })

    app.get('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addedToysCollection.findOne(query);
      res.send(result);
    })

    // category and individual routes
    app.get('/toys', async (req, res) => {
      const projection = { toyPicture: 1 };
      const result = await toysCollection.find().project(projection).limit(12).toArray();
      res.send(result);
    })

    app.get('/toyDetail/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    })

    app.get('/indoorToys', async (req, res) => {
      const query = { subcategory: { $eq: "Indoor" } };

      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/outdoorToys', async (req, res) => {
      const query = { subcategory: { $eq: "Outdoor" } };

      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/waterToys', async (req, res) => {
      const query = { subcategory: { $eq: "Water" } };

      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/check', async (req, res) => {
      const cursor = checkToysCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // PUT
    app.put('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedMyToy = req.body
      const myToy = {
        $set: {
          price: updatedMyToy.price,
          quantity: updatedMyToy.quantity,
          details: updatedMyToy.details,
        }
      }
      console.log(myToy);
      const result = addedToysCollection.updateOne(filter, myToy, options);
      console.log(result)
      res.send(result);
    })

    // DELETE
    app.delete('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addedToysCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Toy Utopia server is running on port: ${port}`)
})