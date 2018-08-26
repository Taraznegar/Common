using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class PhoneNumberBL : EntityBL
    {
        public void SavePhoneNumberForPerson(string callID, string callNumber, string PersonID)
        {
            //DebugHelper.Break();
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    if (PersonID != null)
                    {
                        var phoneNumberEntity = dbHelper.CreateNewEntity("cmn.PhoneNumber");
                        var telTypeID = OptionSetHelper.GetOptionSetItemID("cmn.PhoneType", "Unknown");

                        phoneNumberEntity.SetFieldValue("Person", PersonID);
                        phoneNumberEntity.SetFieldValue("Phone", callNumber);
                        phoneNumberEntity.SetFieldValue("Note", "تماس دریافتی");
                        phoneNumberEntity.SetFieldValue("TelType", telTypeID);

                        dbHelper.ApplyChanges(phoneNumberEntity);
                    }

                    var receivedCallEntity = dbHelper.FetchSingle("cmn.ReceivedCall", string.Format("ID = '{0}'", callID), null);
                    receivedCallEntity.SetFieldValue("CallPerson", PersonID);
                    receivedCallEntity.ChangeStatus = "Modify";

                    dbHelper.ApplyChanges(receivedCallEntity);

                    tranManager.Commit();
                }
            }
        }
    }
}
