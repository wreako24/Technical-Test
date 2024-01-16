import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "21m00Tcm4TlvDq8ikWAM";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3001;

//Initialize temp message
let tempmsg="";


app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});



const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};


//New post method to receive message from python interface

app.post("/transmitmessage", async (req, res) =>{
  let message=req.body.message
  console.log(message)
  //Assign message from python code to temp variable
  tempmsg=message
  res.send({
    messages: [
     
    ],
  });
  return
}


)
let pflag=false
app.post("/chat", async (req, res) => {
  // const userMessage = req.body.message;
  //Wait for tempmsg to be sent from external system, if none receive return nothing
  if (tempmsg=="" || pflag){
    res.send({
      messages: [
       
      ],
    });
    return;

  }else{

    pflag=true;
  //Replace new message with temp msg data from python
  let newmessage=tempmsg
  const fileName = `audios/message_${0}.mp3`; // The name of your audio file
  // const textInput = newmessage; // The text you wish to convert to speech
  await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, newmessage);
  // generate lipsync
  await lipSyncMessage(0);
  // message.audio = await audioFileToBase64(fileName);
  // message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);


  // }
  //Clear temp message to await for next message
  tempmsg="";
  pflag=false;
  //Respond to avatar application
  res.send({
    messages: [
      {
        text: newmessage,
        audio: await audioFileToBase64(fileName),
        lipsync: await readJsonTranscript("audios/message_0.json"),
        facialExpression: "smile",
        animation: "Talking_1",
      },
    ],
  });
  return;
  }
  // if (!userMessage) {
  //   res.send({
  //     messages: [
  //       {
  //         text: "Hey dear... How was your day?",
  //         audio: await audioFileToBase64("audios/intro_0.wav"),
  //         lipsync: await readJsonTranscript("audios/intro_0.json"),
  //         facialExpression: "smile",
  //         animation: "Talking_1",
  //       },
  //       {
  //         text: "I missed you so much... Please don't go for so long!",
  //         audio: await audioFileToBase64("audios/intro_1.wav"),
  //         lipsync: await readJsonTranscript("audios/intro_1.json"),
  //         facialExpression: "sad",
  //         animation: "Crying",
  //       },
  //     ],
  //   });
  //   return;
  // }
  // if (!elevenLabsApiKey || openai.apiKey === "-") {
  //   res.send({
  //     messages: [
  //       {
  //         text: "Please my dear, don't forget to add your API keys!",
  //         audio: await audioFileToBase64("audios/api_0.wav"),
  //         lipsync: await readJsonTranscript("audios/api_0.json"),
  //         facialExpression: "angry",
  //         animation: "Angry",
  //       },
  //       {
  //         text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
  //         audio: await audioFileToBase64("audios/api_1.wav"),
  //         lipsync: await readJsonTranscript("audios/api_1.json"),
  //         facialExpression: "smile",
  //         animation: "Laughing",
  //       },
  //     ],
  //   });
  //   return;
  // }

  // const completion = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   max_tokens: 1000,
  //   temperature: 0.6,
  //   messages: [
  //     {
  //       role: "system",
  //       content: `
  //       You are a virtual girlfriend.
  //       You will always reply with a JSON array of messages. With a maximum of 3 messages.
  //       Each message has a text, facialExpression, and animation property.
  //       The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
  //       The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
  //       `,
  //     },
  //     {
  //       role: "user",
  //       content: userMessage || "Hello",
  //     },
  //   ],
  // });
  // let messages = JSON.parse(completion.choices[0].message.content);
  // let message= userMessage;
  // console.log(userMessage)
  // if (messages.messages) {
  //   messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
  // }
  // for (let i = 0; i < messages.length; i++) {
  // const message = messages[i];
  // generate audio file
  
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});
