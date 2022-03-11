
exports.handler = function(context, event, callback) {
    const twilioClient = context.getTwilioClient();
    
    const response = new Twilio.Response();
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Content-Type', 'application/json');
  
    sentSuccess = 0;
    sentErrors = 0;
  
    try {
      
      if (typeof event.textmsg === 'undefined' || event.textmsg === null || event.textmsg.length === 0) {
          throw("Message can not be empty");
      } else if (typeof event.sender === 'undefined' || event.sender === null || event.sender.length === 0) {
          throw("Sender can not be empty");
      } else if (typeof event.csvData === 'undefined' || event.csvData === null || event.csvData.length === 0) {
          throw("csvData can not be empty");
      } else {
        let msgTemplate = event.textmsg;
        let senderId = event.sender;
        let results = event.csvData;
  
        let myPromises = [];
  
        results.forEach((msg) => {
  
          let body = msgTemplate;
          Object.keys(msg).forEach((k) => {
            //remplacement des variables [xxx] par la valeur de xxx associée
            body = body.replace("[" + k + "]", msg[k]);
          });
  
          myPromises.push(
            twilioClient.messages.create({
             // messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
              from: senderId,
              to: msg.Number,
              body: body,
            })
          );
  
          console.log("SENDING --- TO : " + msg.Number + " -- BODY : " + body);
        });
  
        Promise.allSettled(myPromises).then((result) => {
          result.forEach((r) => {
            if (r.status == "fulfilled") sentSuccess++;
            else sentErrors++;
          });
  
          response.setBody({
            status: true,
            message: "SMS Sent",
            data: {
              sentSuccess: sentSuccess,
              sentErrors: sentErrors,
            },
          })
          callback(null, response);
  
        });
  
      } //fin else
    } catch (err) {
      console.log("error:" + err);
      response.setStatusCode(500);
      response.setBody(err);
      callback(null, response);
    }
    
   
  };