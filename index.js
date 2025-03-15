import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import cors from 'cors';
import { Queue } from "bullmq";
import { error } from 'console';
import { twilioSetup } from './routes/twilio.js';


const app = express();
const port = 4000;

// Initialize Prisma client
const prismaClient = new PrismaClient();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Enable CORS
app.use(cors());
app.use(express.json())

// CSV file upload route


app.use('/api/twilio',twilioSetup)
app.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  if (!req.body.userId) {
    return res.status(400).send('User ID not found.');
  }

  const leads = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (row) => {
      const emailArray = [];
      const phoneArray = [];
      
      // Iterate through each key to find emails and phone numbers
      for (const key in row) {
        if (key.toLowerCase().includes('email')) {
          emailArray.push(row[key]);
        }
        if (key.toLowerCase().includes('phone') && (row[key].match(/\d/g) || []).length >= 3) { 
          // Check if the value contains at least 3 digits before adding
          phoneArray.push(row[key]);
        }
      }
      

      const lead = {
        data: row,
        name: row.Name || row.name || row.NAME,
        email: emailArray,
        phone: phoneArray,
        status: row.Status || row.status || row.STATUS,
        source: 'MANUAL',
        userId: req.body.userId,
      };

      leads.push(lead);
    })
    .on('end', async () => {
      try {
        if (leads.length === 0) {
          throw new Error('No valid leads found in the CSV file.');
        }

        // Insert into database
        const createdLeads = await prismaClient.lead.createMany({
          data: leads,
          skipDuplicates: true, // Prevent duplicate inserts
        });

        // Delete file after successful upload
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });

        res.status(200).json({ message: `${createdLeads.count} leads uploaded successfully.` });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading leads.' });
      }
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error parsing CSV file.' });

      // Ensure file is deleted even if parsing fails
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});














const redisConnection = { host: "localhost", port: 6379 };



const queue = new Queue('init', {
  connection:redisConnection

})




app.post('/initiate', async function (req, res) {
  try {
    const leadids= await req.body.leadsids;

    if(!Array.isArray(leadids)){
      res.status(500).json({error:'mus the a array'})
    }

    const leads = await prismaClient.lead.findMany({where:{id:{in:leadids}}})
    
    console.log(leads)
    
    await queue.add("initiate",leads);
    const count=await queue.count()
    console.log(count)
    console.log('r')

      return res.json({ success: true, message: "AI initiated for selected leads" });

  } catch (error) {
      console.error("Error initiating AI:", error);
      return res.status(500).json({ error: "Internal Server Error" });
  }
});



