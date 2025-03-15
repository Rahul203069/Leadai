import { Worker } from "bullmq";
import twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()
const redisConnection = { host: "localhost", port: 6379 };



// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
console.log(accountSid,authToken)
const client =   twilio(accountSid, authToken);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function createMessage(message) {
  try{

    await client.messages.create({
      body: message,
      from: "+12602172672",
      to: "+917006414367",
    });
  }catch(e){

    console.log(e)
  }


}




const worker = new Worker(
  "init",
  async (job) => {
  console.log(job.data)
  if(!job){
    return
  }

  job.data.map(async(lead)=>{


    await createMessage(`hi ${lead.name} i hope you are doing well`)
await delay(2000)
  })



  },
  { connection: redisConnection }
);


worker.on("error", (err) => {
  console.error("Worker error:", err);
});
worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});
console.log("Worker is listening for jobs...");