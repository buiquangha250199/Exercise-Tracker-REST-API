const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var userSchema = mongoose.Schema({
  username: {
    type: String,
    required : true
  }
});

var exerciseSchema = mongoose.Schema({
  userId: { type: String, required: true },
  description:String,
  duration:{ type: Number, min: 1},
  date: { type: Date, default: Date.now }
  
});

var User = mongoose.model('User', userSchema);
var Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  var find = User.findOne({username: req.body.username}, (err, data) => {
    if(data != null) res.send("username already taken");
    else {
      let newUser = new User({username: req.body.username});
      newUser.save();
      res.json({username: newUser.username, _id: newUser._id });
    }
  });
  
});

app.get('/api/exercise/users', function(req, res) {
  User.find({}, function(err, users) {
    var userMap = [];

    users.forEach(function(user) {
      userMap.push(user);
    });

    res.send(userMap);  
  });
});

app.post('/api/exercise/add', (req, res) => {
  var find = User.findOne({_id: req.body.userId}, (err, data) => {
    let username = data.username;
    if(data == null) res.send("unknown _id");
    else {
      let newExercise = new Exercise({userId: req.body.userId,
                                      description:req.body.description,
                                      duration:req.body.duration,
                                      date: req.body.date 
                                     });
      if(newExercise.date == null) newExercise.date = Date.now();
      newExercise.save();
      res.json({username: username, 
                description: newExercise.description,
                duration: newExercise.duration,
                _id: newExercise.userId,
                date: newExercise.date
               });
    }
  });
  
});


app.get('/api/exercise/:log', function(req, res) {
  var username;
  
  var findName = User.findOne({_id: req.query.userId}, (err, data) => {
    username = data.username;
  });
  var find = Exercise.find({userId: req.query.userId}, (err, data) => {
    if(data != null) {
      var log = [];
      for(let i=0; i<data.length; i++) log.push({description:data[i].description,
                                             duration:data[i].duration,
                                             date: data[i].date});
      //console.log(new Date(req.query.from) < data[0].date);
      if(req.query.from != null) {
        var temp = [];
        temp = log.filter(function(value, index, arr){
            return (new Date(req.query.from) < data[index].date);
        });       
        
        log = temp;
                
      }
      
      if(req.query.to != null) {
        
        var temp = [];
        
        temp = log.filter(function(value, index, arr){
            return (new Date(req.query.to) > data[index].date);
        });   
        
        log = temp;
               
      }
      
      if(req.query.limit != null) {
        var temp = [];
        if(req.query.limit < log.length) 
          for(let i=0; i<req.query.limit; i++) temp.push(log[i]);
        
        log = temp;
      }
      //console.log(log);
      //console.log(temp2);
     
      res.json({_id:req.query.userId, username: username,count: log.length, log: log});
    }
    else res.send('unknown userId');
  });
  
});



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
