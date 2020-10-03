
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Tesseract = require('tesseract.js');



const app = express() // create express app
app.use(cors())
app.use(bodyParser.urlencoded( {extended: true }))
app.use(bodyParser.json())


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, __dirname + '/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
  
  const upload = multer({ storage: storage }).single('scan')

  app.post('/upload', upload, (req, res) => {
    Tesseract.recognize(
      req.file.path,
      'eng'
    ).then(({ data: { text } }) => {
      console.log(text);
      res.send(text)
      setTimeout(() => {
        fs.unlinkSync(req.file.path)
      }, 1000);
    })
  })

app.use('/css', express.static(__dirname + '/client/src/style/css/'))
app.use('/assets', express.static(__dirname + '/client/assets'))
app.use('/js', express.static(__dirname + '/client/src/js/'))
app.use('/manifest', express.static(__dirname + '/client/manifest.json'))
app.use('/sw', express.static(__dirname + '/service-worker.js'))
app.use('/uploads', express.static(__dirname + '/uploads/'))
app.use('/favicon', express.static(__dirname + '/favicon.ico'))


// sign up page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/src/view/sign-up.html'));
})

app.listen(process.env.PORT || 7000, () => {
    console.log('Server listening on 7000')
})
