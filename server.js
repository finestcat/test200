//Define constant for the application
const express = require("express");
const app = express();
const assert = require('assert');
const session = require('cookie-session');
const bodyParser = require('body-parser')
const MongoClient =require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const ejs = require('ejs');
const fs = require('fs');
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://admin:123@cluster0.nndk5cp.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'Project';

app.set('view engine', 'ejs');
app.set('views','./views');

//Authenication
const SECRETKEY = '381F-Project';

const users = new Array(
	{name: 'Issac', password: 'Issac'},
	{name: 'Sam', password:'Sam'},
	{name: 'guest', password: 'guest'}
);

var document = {}


app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// View Part

app.get('/',(req,res) => {
  if (!req.session.authenticated) {    
		res.redirect('/login');
  }
  else{
    res.redirect('/main');
  }
});

// Redirect to Login Page (Not Logging in)/ Main Page (Logging in)
app.get('/main', async (req,res) => {
	console.log(req.session);
    if (!req.session.authenticated) {    
		res.redirect('/login');
	} else {
        const client = new MongoClient(mongourl);
        await client.connect();
        const db = client.db(dbName);
        var dataSet = new Array();
        //res.render('main',{name:req.session.username});
        //read data
        const data = db.collection("Inventory").find().sort({"quantity" : 1});
        await data.forEach((element) =>{
            dataSet.push(element);
        });

        //Check the whole array
        //console.log({dataSet:dataSet});
        res.status(200).render('main',{dataSet,name:req.session.username});
        //res.status(200).render('main',{name:req.session.username},);
        client.close();
	}
});


// Load Login page
app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});

//login function
app.post('/login', (req,res) => {
	var username = req.body.username;
	var password = req.body.password;
	users.forEach((user) => {
    console.log(user.username)
		if (user.name == username && user.password == password) {
			req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.username;
		}
	});
	res.redirect('/main');
});

// Load Main Page
app.get('/main',(req, res) => {
	console.log("Enter Main Page Successfully")
});

// Logout function
app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie
	res.redirect('/login');
});

// Render to Create Page
app.get('/create',(req, res) =>{
        res.status(200).render("create");

}); 

// Create 
// Create Function
const createDocument = (db, createDoc, callback) => {
    db.collection('Inventory').insertOne(createDoc, (error, results) => {
        if (error) throw error;
        console.log(results);
        callback();
    });
};

app.post('/create', (req, res) => {
    console.log("User entered create page");
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to MongoDB.");
        const db = client.db(dbName);
        const document = {	
            inv_id: req.body.id,
            inv_name: req.body.inv_name,
            inv_type: req.body.type,
            quantity: parseInt(req.body.quantity)
        };

        // Check all the fields of the form are filled in
            console.log("OK for creating a new document");
            createDocument(db, document, () => {
            console.log("Created new document successfully");
            client.close();
            console.log("Closed DB connection");
            res.redirect('/main');
    });
    client.close();
});

});

//Delete
app.get('/delete?:id', (req,res) => {
    console.log("User entered delete page");
    const client = new MongoClient(mongourl);
    const deletedID = req.query._id;
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to MongoDB.");
        const db = client.db(dbName);
        
        db.collection("Inventory").deleteOne({_id: ObjectID(deletedID)},(err,result) =>{
            if(err)
            throw err;
            client.close();
            console.log("Data has been deleted");
            });
        });
        res.redirect('/main');
    });

//Delete
app.get('/delete?:id', (req,res) => {
  console.log("User entered delete page");
  //Create new client to fetch the data
  const client = new MongoClient(mongourl);
  //Catch the specific id and used as a conditional parameter
  const deletedID = req.query._id;
  client.connect((err) => {
      assert.equal(null, err);
      const db = client.db(dbName);
      db.collection("Inventory").deleteOne({_id: ObjectID(deletedID)},(err,result) =>{
          if(err)
          throw err;
          client.close();
          console.log("Data has been deleted");
          });
      });
      res.redirect('/main');
  });


// Update 
app.get('/update', async (req, res) => {
  const client = new MongoClient(mongourl);
  const id = req.query._id; // Get the _id from the query parameter
  console.log("_id:",id);
  // Connect to MongoDB
  await client.connect();
  const db = client.db(dbName);    
  // Fetch the document to be updated
  const item = await db.collection("Inventory").findOne({ _id: ObjectID(id) });

  // Render the update.ejs template with the item data
  res.render('update', { item });
});

app.post('/update', (req, res) => {
  const client = new MongoClient(mongourl);
  const id = req.body._id; // Get the id from the request body
  console.log("_id:",id);

  // Connect to MongoDB
  client.connect((err) => {
    assert.equal(null, err);
    console.log("Connected successfully to MongoDB.");
    const db = client.db(dbName);

    // Construct the update query
    const updateDoc = {
      $set: { // Auto fill in the form with existing info
      	inv_id: req.body.id,
        inv_name: req.body.inv_name,
        inv_type: req.body.type,
        quantity: parseInt(req.body.quantity)
      }
    };

    // Perform the update operation
    db.collection('Inventory').updateOne({ _id: ObjectID(id) }, updateDoc, (error, result) => {
      if (error) throw error;
      console.log('Document updated successfully');
      client.close();
      console.log("Closed DB connection");
      res.redirect('/main');
    });
  });
});

// Restful API

// Create API
app.post('/api/inventory', (req,res) => {
    console.log("Create with API");
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to MongoDB.");
        const db = client.db(dbName);
        const document = {	
            inv_id: req.body.inv_id,
            inv_name: req.body.inv_name,
            inv_type: req.body.inv_type,
            quantity: parseInt(req.body.quantity)
        };

        // Check all the fields of the form are filled in
            console.log("OK for creating a new document");
            createDocument(db, document, () => {
            console.log("Created new document successfully");
            client.close();
            console.log("Closed DB connection");
    });
    client.close();
});


});


// Read API
app.get('/api/inventory/:inv_id', (req, res) => {
  console.log("Read with API");
	if (req.params.inv_id) {
    		let inventory = {};
    		inventory['inv_id'] = req.params.inv_id;
    		const client = new MongoClient(mongourl);
    		client.connect((err) => {
      			assert.equal(null, err);
      			const db = client.db(dbName);
      			let cursor = db.collection('Inventory').find(inventory);
      			console.log(`findDocument: ${JSON.stringify(inventory)}`);
      			cursor.toArray((err, docs) => {
        		assert.equal(err, null);
        		console.log(`findDocument: ${docs.length}`);
        		client.close();
        		console.log("Closed DB connection");
        		res.status(200).json(docs);
      		});
    	});
  } else {
    res.status(500).json({ "error": "missing inv_id" }).end();
  }
});

// Update API
app.put('/api/inventory/:inv_id', async (req,res) => {
  console.log("Update with API");
  const client = new MongoClient(mongourl);
  await client.connect();
  const db = client.db(dbName);
  const updateDoc = {
    $set: {
      inv_id: req.body.inv_id,
      inv_name: req.body.inv_name,
      inv_type: req.body.inv_type,
      quantity: parseInt(req.body.quantity)
    }
  };
  const data = await db.collection('Inventory').findOne({inv_id: req.params.inv_id});
  if(data){
  await db.collection('Inventory').updateOne({_id: data._id}, updateDoc, (error, result) => {
  if (error) throw error;
  console.log('Document updated successfully from inv_id ' + req.params.inv_id + ' to ' + req.body.inv_id);
  client.close();
  console.log("Closed DB connection");
});
}else{
  res.status(404).json({ message: 'Invalid inventory_id' });
}
  client.close();
});


// Delete API
app.delete('/api/inventory/:inv_id', (req, res) => {
  console.log("Delete with API");
	if (req.params.inv_id) {
    		let inventory = {};
    		inventory['inv_id'] = req.params.inv_id;
    		const client = new MongoClient(mongourl);
    		client.connect((err) => {
      			assert.equal(null, err);
      			const db = client.db(dbName);
      			db.collection('Inventory').deleteMany(inventory,(err, results) =>{
      			                assert.equal(err,null);
                			client.close();
                			res.status(200).json(results).end();
      			});
      		});
    	}else {
        res.status(500).json({"error": "missing Inv_id"});       
    }
});    		
    		
    		
  
//Create the server with port 8099
app.listen(8099);
