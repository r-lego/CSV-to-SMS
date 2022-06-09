exports.handler = async function(context, event, callback) {
    // Make sure the necessary Sync names are defined.
      const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID || 'default';
      const syncListName = context.SYNC_LIST_NAME || 'optout-list';
      // You can quickly access a Twilio Sync client via Runtime.getSync()
      const syncClient = Runtime.getSync({ serviceName: syncServiceSid });
    
        const twilioClient = context.getTwilioClient();
        let body = "";
    
        if(Object.keys(event).length != 2){
            body = "Missing parameters";
        }
        else{
            let num = "+" + base64_to_base10(Object.keys(event)[1]);
    
    
    
    
       try {
        const fulfilledValue = await validNumber(twilioClient, num);
                     try {

                // SYNC LIST IMPLEM
                /*
                await getOrCreateResource(syncClient.lists, syncListName);
            
                await syncClient.lists(syncListName).syncListItems.create({
                data: {
                    num,
                }
                });*/

                //SYNC MAPS IMPLEM
            await getOrCreateResource(syncClient.maps, syncListName);
            await syncClient.maps(syncListName).syncMapItems.create({
              key: num, data: {}
            });

                body = "Number <b>" + num + "</b> has been opt-out.";
            } catch (error) {
                body = "Error : " + error;
            }
      } catch (rejectedValue) {
         body = "Invalid parameter";
      }
    
        }
    
        const response = new Twilio.Response();
     
        response.setBody(body);
        response.appendHeader('Content-Type', 'text/html');
      
        return callback(null, response);
    
    };
    
    
    async function validNumber (client, num) {
      await twilioClient.lookups.v1.phoneNumbers(num)
                     .fetch()
                     .then(result => {
                         console.log(result);
                        }
                     );
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
    
    //number decoding
    function base64_to_base10(str) {
        var order = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
        var base = order.length;
        var num = 0, r;
        while (str.length) {
            r = order.indexOf(str.charAt(0));
            str = str.substr(1);
            num *= base;
            num += r;
        }
        return num;
    }
    
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
    