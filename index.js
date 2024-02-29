const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sql = require('mssql'); // Import the mssql library for SQL Server
const fs = require('fs');
const csv = require('csv-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const exportToCSV = require('./exportToCSV'); // Replace './exportToCSV' with the correct path to your exportToCSV.js file

app.get('/export-csv', (req, res) => {
    exportToCSV(); // Call the function to export data to CSV
    res.status(200).send('Data export to CSV initiated.');
  });
  
// Database connection configuration
const dbConfig = {
    user: 'sa',
    password: 'Admin@123',
    server: 'SANYOGITA',
    database: 'CSVUpload',
    // port: 1433,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    options: {
        encrypt: false,
    },
};

const pool = new sql.ConnectionPool(dbConfig);

pool.connect()
    .then(() => {
        console.log('Connected to SQL Server database.');
    })
    .catch((err) => {
        console.error('Database connection error: ', err);
    });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads/');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/import-csv', upload.single('import-csv'), (req, res) => {
    const filePath = __dirname + '/uploads/' + req.file.filename;
    uploadCsv(filePath)
        .then(() => {
            console.log('File has been imported successfully.');
            res.status(200).send('File has been imported successfully.');
        })
        .catch((err) => {
            console.error('Error importing file:', err);
            res.status(500).send('Error importing file: ' + err.message);
        });
});

// Example function to validate and format a date string
function validateAndFormatDate(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        // The date is valid, format it as 'YYYY-MM-DD HH:mm:ss'
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } else {
        // Invalid date, handle the error or return a default value
        return null;
    }
}

async function uploadCsv(filePath) {
    try {
        const csvDataColl = []; // This will hold your CSV data

        // Read and parse the CSV file
        const fileStream = fs.createReadStream(filePath).pipe(csv());
        fileStream.on('error', (err) => {
            console.error('Error reading the CSV file:', err);
          });

          

          fileStream.on('data', (data) => {
            // Assuming your CSV file has columns DateTime, T1, T2, T3
            // Adjust these property names according to your CSV file structure
            const rowData = {
              DateTime: validateAndFormatDate(data.DateTime),
              T1: data.T1,
              T2: data.T2,
              T3: data.T3,
            };

            csvDataColl.push(rowData);
          });

          fileStream.on('end', async () => {
            // const query =
            //   'INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (@DateTime, @T1, @T2, @T3)';
            const request = pool.request();

            for (const rowData of csvDataColl) {
            //   await request
            //     .input('DateTime', sql.VarChar, rowData.DateTime)
            //     .input('T1', sql.VarChar, rowData.T1)
            //     .input('T2', sql.VarChar, rowData.T2)
            //     .input('T3', sql.VarChar, rowData.T3)
            //     .query(query);

            await request.query(`INSERT INTO CSV (DateTime, T1, T2, T3) VALUES ('${rowData.DateTime}', '${rowData.T1}', '${rowData.T2}', '${rowData.T3}')`);

            }

            console.log('Data from CSV file inserted successfully.');
          });

       


        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});





