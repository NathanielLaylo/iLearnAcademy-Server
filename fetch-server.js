const express = require("express");
const cors = require("cors");
var path = require("path");
var morgan = require("morgan");


let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;



const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

let app = express();
app.set('json spaces', 3);
app.use(cors());
//middleware logger
app.use(morgan("short"));
var staticPath = path.join(__dirname, "static");
//middleware authenticator
app.use(express.static(staticPath));

app.use(express.json());

app.get("/", function(req, res){
    res.send("select collection1");
    
}); 

app.param('collectionName', function (req, res, next, collectionName) {
        req.collection = db.collection(collectionName);
        return next();
    });

app.get('/collections/:collectionName', function (req, res, next) {
    req.collection.find({}).toArray().then(function (results, error) {
        if(error){
            return next(error);
        }
        res.send(results);
    });
});

app.get('/collections/:collectionName/:query', function (req, res, next) {
    let re = new RegExp(`/${query}/i`);
    let test = ' ${query} ';

    req.collection.find({subject:  new RegExp("a")}).toArray().then(function (results, error) {
        if(error){
            return next(error);
        }
        res.send(results);
    });
});

 
 


//-1 descending 1 ascending
/* app.get('/collections/:collectionName', function (req, res, next) {
    req.collection.find({}, {sort: [["price", 1]]}).toArray().then(function (results, error) {
        if(error){
            return next(error);
        }
        res.send(results);
    });
});
 */


app.post('/collections/:collectionName', function (req, res, next){
    req.collection.insertOne(req.body).then(function (results, error) {
        if(error){
            return next(error);
        }
        res.send(results);
    });
});


app.delete('/collections/:collectionName/:id', function (req, res, next){
    req.collection.deleteOne({_id: new ObjectId(req.params.id)}).then(function(result, err)
     {
        if(err){
            return next(err);
        }
        res.send((result.deletedCount === 1) ? {msg: "success"} : {msg: "error"});
    });
});



app.put('/collections/:collectionName/:id', function (req, res, next) {
        // TODO: Validate req.body
        req.collection.updateOne({ _id: new ObjectId(req.params.id) },
            { $set: req.body },
            { safe: true, multi: false }).then(function (result, err) {
                if (err) {
                    return next(err);
                } else {
                    res.send((result.matchedCount === 1) ? { msg: "success" } : { msg: "error" });
                }
            }
        );
    });







app.use(function(req, res){
    res.status(404).send("Resource not found");
});

const port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log("app started on port " + port);
});