
exports.handler = async function(context, event, callback) {
  const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID || 'default';
  const syncListName = context.SYNC_LIST_NAME || 'optout-list';
  // You can quickly access a Twilio Sync client via Runtime.getSync()
  const syncClient = Runtime.getSync({ serviceName: syncServiceSid });

  
    const twilioClient = context.getTwilioClient();
    
    const response = new Twilio.Response();
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Content-Type', 'application/json');
  
    sentSuccess = 0;
    sentErrors = 0;
    optout = 0;
  
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
  
        try {
          // Ensure that the Sync List exists before we try to add a new message to it
          await getOrCreateResource(syncClient.lists, syncListName);
          // Append the incoming message to the list
          var optOutNumbers = [];
          
             await syncClient.lists(syncListName).syncListItems.list().then(
               syncListItems => syncListItems.forEach(s => optOutNumbers.push(s.data.num))
              );
      
      
          console.log("fetching optout list done");
       
        } catch (error) {
          console.error(error);
        }

        results.forEach((msg) => {
  

          if(optOutNumbers.includes(msg.Number)){
            optout++;
            console.log("optout++ for " + msg.Number)
          }
          else{
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
                body: body + " STOP: " + context.DOMAIN_NAME + "/o?" + base10_to_base64(msg.Number.substring(1)),
              })
            );
    
            console.log("SENDING --- TO : " + msg.Number + " -- BODY : " + body);
          }


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
              optout: optout
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

  //number encoding
function base10_to_base64(num) {
  var order = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
  var base = order.length;
  var str = "", r;
  while (num) {
      r = num % base
      num -= r;
      num /= base;
      str = order.charAt(r) + str;
  }
  return str;
}

  // Helper method to simplify getting a Sync resource (Document, List, or Map)
  // that handles the case where it may not exist yet.
  const getOrCreateResource = async (resource, name, options = {}) => {
    try {
      // Does this resource (Sync Document, List, or Map) exist already? Return it
      return await resource(name).fetch();
    } catch (err) {
      // It doesn't exist, create a new one with the given name and return it
      options.uniqueName = name;
      return resource.create(options);
    }
  };