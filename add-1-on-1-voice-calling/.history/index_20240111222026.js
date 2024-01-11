import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let call;
let incomingCall;
let callAgent;
let deviceManager;
let tokenCredential;
const userToken = document.getElementById("token-input"); 
const calleeInput = document.getElementById("callee-id-input");
const submitToken = document.getElementById("token-submit");
const callButton = document.getElementById("call-button");
const hangUpButton = document.getElementById("hang-up-button");
const acceptCallButton = document.getElementById('accept-call-button');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
let speechConfig;
let audioConfig;
let speechRecognizer;





submitToken.addEventListener("click", async () => {
  const callClient = new CallClient();
  const userTokenCredential = userToken.value;
    try {
      tokenCredential = new AzureCommunicationTokenCredential(userTokenCredential);
      callAgent = await callClient.createCallAgent(tokenCredential);
      deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ audio: true });
      callButton.disabled = false;
      submitToken.disabled = true;
      // Listen for an incoming call to accept.
      callAgent.on('incomingCall', async (args) => {
        try {
          incomingCall = args.incomingCall;
          acceptCallButton.disabled = false;
          callButton.disabled = true;
        } catch (error) {
          console.error(error);
        }
      });
    } catch(error) {
      window.alert("Please submit a valid token!");
    }
})

callButton.addEventListener("click", () => {
  // start a call
  const userToCall = calleeInput.value;
  call = callAgent.startCall([{ id: userToCall }], {});
  // toggle button states
  hangUpButton.disabled = false;
  callButton.disabled = true;
  // Start listening to the call stream for real-time transcription
  startCallStreamTranscription(callAgent.calls);
});

hangUpButton.addEventListener("click", () => {
  // end the current call
  call.hangUp({ forEveryone: true });

  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = false;
  submitToken.disabled = false;
  acceptCallButton.disabled = true;
});

acceptCallButton.onclick = async () => {
  try {
    call = await incomingCall.accept();
    acceptCallButton.disabled = true;
    hangUpButton.disabled = false;
    // Start listening to the call stream for real-time transcription
    startCallStreamTranscription(callAgent.calls);
  } catch (error) {
    console.error(error);
  }
}

function startCallStreamTranscription(calls) {



  console.log(calls);
   if(call.streams && call.streams.length > 0) {
    let callStream = call.streams[0]; // Assuming there is only one stream
    audioConfig = sdk.AudioConfig.fromStreamInput(callStream);

    speechConfig = sdk.SpeechConfig.fromSubscription(
      "077629f65bc04d028d6224de660db13b",
      "eastus"
    );

    speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    speechRecognizer.startContinuousRecognitionAsync();

    speechRecognizer.recognizing = (s, e) => {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
    };

    speechRecognizer.recognized = (s, e) => {
      if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED: Text=${e.result.text}`);
      } else if (e.result.reason == sdk.ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    speechRecognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);

      if (e.reason == sdk.CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log(
          "CANCELED: Did you set the speech resource key and region values?"
        );
      }

      speechRecognizer.stopContinuousRecognitionAsync();
    };

    speechRecognizer.sessionStopped = (s, e) => {
      console.log("\n    Session stopped event.");
      speechRecognizer.stopContinuousRecognitionAsync();
    };

    } else{
    console.error("No call stream found.");

    }

  
  // Pass the call stream to your transcription service for real-time transcription
  // Your code to handle the call stream and send it to the transcription service goes here
}