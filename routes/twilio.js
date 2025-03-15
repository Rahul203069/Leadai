import twilio from 'twilio'
import Router from 'express'
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'
dotenv.config()
const prisma =  new PrismaClient()

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to provision a new number for a user



const router=Router();   



router.post('/webhooksetup',async function(req,res){


  const {userId}= await req.body
  const user =  await prisma.twilio.findUnique({where:{userId}})
  const purchasedNumber= user.metadata

  const webhooksetup=   await client.incomingPhoneNumbers(purchasedNumber.sid)
  .update({
    smsUrl: `https://localhost.com/webhooks/sms/${userId}`
  });
  console.log(webhooksetup,'webhooksetup');

  res.status(400).json({success:true,message:'webhook setup for incoming messages'})


})

async function assignNumberToUser(userId, areaCode) {
  try {
    // 1. Search for available phone numbers
    await releaseUserNumber()
    
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local.list({
     
        limit: 1
      });
      console.log(availableNumbers,'available numbers');

    if (availableNumbers.length === 0) {
      throw new Error('No available phone numbers found');
    }

    // 2. Purchase the first available number
    const purchasedNumber = await client.incomingPhoneNumbers
      .create({
        phoneNumber: availableNumbers[0].phoneNumber,

        friendlyName: `User ${userId} SMS Number`
      });


      console.log(purchasedNumber,'purchasednumber');
    // 3. Store the number in your database
    // await storeUserPhoneNumber(userId, purchasedNumber.phoneNumber, purchasedNumber.sid);

    // 4. Configure webhooks for incoming messages (optional)


    return purchasedNumber;
  } catch (error) {
    console.error('Error assigning number:', error);
    throw error;
  }
}





  router.post('/generate', async function (req, res) {


    try {

      await releaseUserNumber();
      
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
  
      // Assign a Twilio number to the user
      const purchasedNumber = await assignNumberToUser(userId, 212);
  
      if (!purchasedNumber) {
        return res.status(500).json({ success: false, message: "Failed to assign phone number" });
      }
  
      console.log(purchasedNumber, "purchasedNumber");
  
      // Store number details in the database
      const twilioRecord = await prisma.twilio.create({
        data: {
          userId,
          phone: purchasedNumber.phoneNumber,
          sid: purchasedNumber.sid,
          metadata: purchasedNumber,
        },
      });
  
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: twilioRecord,
      });
    } catch (error) {
      console.error("Error generating Twilio number:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });






// Function to store the mapping in your database


// Function to release a number when no longer needed
async function releaseUserNumber() {
  try {

    const phoneNumbers = await client.incomingPhoneNumbers.list();
const phoneNumberToRemove = phoneNumbers[0]; 
console.log(phoneNumberToRemove,'phoneNumberto remove')
    // 1. Get the user's phone number from your database
    // const userPhone = await db.userPhoneNumbers.findOne({ userId });
    
    // if (!userPhone) {
    //   throw new Error('No phone number found for this user');
    // }

    // 2. Release the number in Twilio

   const he= await client.incomingPhoneNumbers( phoneNumberToRemove.sid).remove();

console.log(he,'removed number');
    // 3. Update your database
    // await db.userPhoneNumbers.delete({ userId });

    return { success: true };
  } catch (error) {
    console.error('Error releasing number:', error);
    throw error;
  }
}



export const twilioSetup=router