const express = require('express')
const bodyparser = require('body-parser')
const fs = require('fs');
const path = require('path')
// const Pool = require("pg").Pool;
const { Pool } = require('pg');
const multer = require('multer')
const csv = require('fast-csv');
const sql = require('mssql');
const app = express()

 
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))
 
// Database connection
const pool = new Pool({
    // host: "192.168.2.126",
    // user: "sa",
    // password: "Admin@123",
    // database: "CSVUpload",
    // port:1433
    "server": "SANYOGITA",
		"database": "CSVUpload",
		"user": "sa",
		"password": "Admin@123",
		// "port": 1433,
		"connectionTimeout": 6000000,
		"requestTimeout": 6000000,
		"options": {
			"encrypt": false
		}
    
});
 
pool.connect(function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to database.');
  
})
 
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});
 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
 
app.post('/import-csv', upload.single("import-csv"), (req, res) =>{
    uploadCsv(__dirname + '/uploads/' + req.file.filename);
    
    console.log('File has imported :' + err);
});
 
// function uploadCsv(uriFile){
    
//     let stream = fs.createReadStream(uriFile);
//     let csvDataColl = [];
//     let fileStream = csv
//         .parse()
//         .on("data", function (data) {
          
//             csvDataColl.push(data);

//         })
//         .on("end", function () {
//             csvDataColl.shift();
  
//             pool.connect((error) => {
//                 if (error) {
//                     console.error(error);
//                 } else {
//                     let query = "Insert into \"cronjob\"(\"DateTime\",\"T1\",\"T2\",\"T3\") VALUES($1, $2, $3, $4) ";
//                     pool.query(query, [csvDataColl], (error, res) => {
//                         console.log(error || res);
//                     }).then(...)
//                     // pool.query({ 
//                     //     text: 'INSERT INTO goods (id, name) VALUES ($1, $2)', 
//                     //     values: [1, 'milk']
//                     //  }).then(...)
//                 }
//             });
             
//             fs.unlinkSync(uriFile)
//         });
  
//     stream.pipe(fileStream);
// }

// A function that uploads CSV data to the database
async function uploadCsv(uriFile) {
    const stream = fs.createReadStream(path.resolve(__dirname, uriFile));
    const csvDataColl = [];
  
    const fileStream = stream.pipe(csv.parse());
  
    fileStream.on('data', (data) => {
      csvDataColl.push(data);
    });
  
    fileStream.on('end', async () => {
      csvDataColl.shift();
  
      try {
        await pool.connect();
        const query =
          'INSERT INTO "cronjob"("DateTime", "T1","T2", "T3") VALUES($1, $2, $3, $4)';
          const insertPromises = csvDataColl.map((rowData) => pool.query(query, rowData));
           await Promise.all(insertPromises);
        // await pool.query(query,...csvDataColl);
  
        console.log('Successfully inserted data');
      } catch (error) {
        console.error('Failed to insert data: ', error);
      } finally {
        fs.unlink(path.resolve(__dirname, uriFile), (err) => {
          if (err) throw err;
          console.log('File deletion complete.');
        });
      }
    });
  }
  
//   uploadCsv('./path/to/your/file.csv');
 
const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`));