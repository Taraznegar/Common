using AppFramework.Helpers;
using Stimulsoft.Base.Json;
using Stimulsoft.Base.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AppFramework.AppServer
{
    public class SmsServiceHelper : ISmsServiceHelper
    {
        void ISmsServiceHelper.SendAutenticationSms(string mobilePhoneNumber, string message)
        {
            var settingEntity = krf.Instance.GetSettings();
            var smsWebServiceUrl = settingEntity.GetFieldValue<string>("MobileAppWebServiceUrl");
              
            var httpWebRequest = (HttpWebRequest)WebRequest.Create(smsWebServiceUrl + "/send_activation_code_sms");
            httpWebRequest.ContentType = "application/json";
            httpWebRequest.Method = "POST";
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

            var requestJsonString = string.Format("{{ phone: '{0}', code: '{1}' }}",
                mobilePhoneNumber, message);

            using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
            {
                var requestJson = (JsonConvert.DeserializeObject(requestJsonString) as JObject);

                streamWriter.Write(requestJson);
                streamWriter.Flush();
                streamWriter.Close();
            }

            var httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
            using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
            {
                var result = streamReader.ReadToEnd();
                var resultJsonObject = (JsonConvert.DeserializeObject(result) as JObject);

                if ((bool)resultJsonObject["status"] == false)
                    throw new AfwException((string)resultJsonObject["errmessage"]);
            }
        }
    }
}
