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
    public class ReceivedCallBL : EntityBL
    {
        public void DetectUndetectedCalls(string filterExpression, string sortExpression, int? startRecordNumber, int? pageSize)
        {
            //DebugHelper.Break();
              
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var receivedCallsEntityList = dbHelper.FetchMultiple("cmn.ReceivedCall", filterExpression.Replace("Gregorian", ""), sortExpression, startRecordNumber, pageSize, null);

                    foreach (Entity receivedCall in receivedCallsEntityList.Entities)
                    {
                        if (receivedCall.GetFieldValue<Guid?>("CallPerson") == null)
                        {
                            DetectCallPerson(receivedCall);
                        }
                    }

                    tranManager.Commit();
                }
            }
        }

        public void DetectCallPerson(Entity receivedCall)
        {
            //DebugHelper.Break();           
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var callNumber = receivedCall.GetFieldValue<string>("CallNumber");

            Guid? foundPersonID = null;

            if (callNumber.Substring(0, 2) == "00")
            {
                callNumber = callNumber.Substring(2, callNumber.Length - 2);
                if (callNumber.Substring(0, 3) == "989")
                    callNumber = callNumber.Substring(2, callNumber.Length - 2);
                else if (callNumber.Substring(0, 2) == "98")
                    callNumber = callNumber.Substring(4, callNumber.Length - 4);
                else if (callNumber.Substring(0, 1) != "9")
                    callNumber = callNumber.Substring(2, callNumber.Length - 2);
            }
            else if (callNumber.Substring(0, 1) == "0")
            {
                callNumber = callNumber.Substring(1, callNumber.Length - 1);
                if (callNumber.Substring(0, 3) == "989")
                    callNumber = callNumber.Substring(2, callNumber.Length - 2);
                else if (callNumber.Substring(0, 2) == "98")
                    callNumber = callNumber.Substring(4, callNumber.Length - 4);
                else if (callNumber.Substring(0, 1) != "9")
                    callNumber = callNumber.Substring(2, callNumber.Length - 2);
            }

            foundPersonID = dbHelper.AdoDbHelper.ExecuteScalar<Guid?>(string.Format(@"
                select P.ID 
                from cmn_Persons P
        	        left join cmn_PhoneNumbers Phones on Phones.Person = P.ID
                where P.TelNumber1 like '%{0}%' 
                    or P.WorkPhoneNumber like '%{0}%' 
                    or P.MobilePhoneNumber1 like '%{0}%'
                    or Phones.Phone like '%{0}%'", callNumber));

            if (foundPersonID != null)
            {
                receivedCall.ChangeStatus = "Modify";
                receivedCall.SetFieldValue("CallPerson", foundPersonID);

                var person_CustomerInfoEntity = dbHelper.FetchSingle("cmn.Person_CustomerInfo", string.Format("Person = '{0}'", foundPersonID), null);
                if (person_CustomerInfoEntity == null)
                {
                    var salesCasesConnectedPerson = dbHelper.FetchMultipleBySqlQuery(@"
                        select SC.ID, SC.Customer, SCCP.ConnectedPerson 
        	            from crm_SalesCases SC
        	                inner join crm_SalesCaseConnectedPersons SCCP on SCCP.SalesCase = SC.ID
        	            order by SC.LastActionTime Desc").Entities.FirstOrDefault();

                    if (salesCasesConnectedPerson != null)
                    {
                        if (receivedCall.GetFieldValue<Guid?>("SalesCase") == null)
                            receivedCall.SetFieldValue("SalesCase", salesCasesConnectedPerson.GetFieldValue<Guid>("ID"));
                        if (receivedCall.GetFieldValue<Guid?>("DetectedCustomer") == null)
                            receivedCall.SetFieldValue("DetectedCustomer", salesCasesConnectedPerson.GetFieldValue<Guid>("Customer"));
                    }
                }
                else
                {
                    var salesCase = dbHelper.FetchMultiple("crm.SalesCase", string.Format("Customer = '{0}'", foundPersonID), "LastActionTime Desc", null, null, null).Entities.FirstOrDefault();
                    
                    if (salesCase != null)
                    {
                        if (receivedCall.GetFieldValue<Guid?>("SalesCase") == null)
                            receivedCall.SetFieldValue("SalesCase", salesCase.GetFieldValue<Guid>("ID"));
                        if (receivedCall.GetFieldValue<Guid?>("DetectedCustomer") == null)
                            receivedCall.SetFieldValue("DetectedCustomer", salesCase.GetFieldValue<Guid>("Customer"));
                    }
                }
                if (receivedCall.FieldExists("_PagingRowNumber"))
                {
                    receivedCall.FieldValues.Remove("_PagingRowNumber");
                    dbHelper.ApplyChanges(receivedCall);
                }
            }
        }

        public void SetSalesCaseActivity(Guid receivedCallID, Guid activityID)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    //DebugHelper.Break();

                    var receivedCall = dbHelper.FetchSingle("cmn.ReceivedCall", string.Format("ID = '{0}'", receivedCallID), null);

                    if (receivedCall.GetFieldValue<Guid?>("CallPerson") == null)
                        throw new AfwException("امکان ست کردن فعالیت برای تماس دریافتی که شخص تماس گیرنده آن تعیین نشده وجود ندارد.");

                    var activity = dbHelper.FetchSingle("cmn.Activity", string.Format("ID = '{0}'", activityID), null);

                    var callPersonID = receivedCall.GetFieldValue<Guid>("CallPerson");
                    var salesCaseID = activity.GetFieldValue<Guid>("SalesCase");

                    var salesCase = dbHelper.FetchSingle("crm.SalesCase", string.Format("ID = '{0}'", salesCaseID), null);

                    if (receivedCall.GetFieldValue<Guid?>("Contract") != null)
                    {
                        var contractCustomerId = receivedCall.GetFieldValue<Guid>("DetectedCustomer");
                        if (salesCase.GetFieldValue<Guid>("Customer") != contractCustomerId)
                            throw new AfwException("مشتری پرونده فروش با مشتری قرارداد متفاوت است.");
                    }

                    receivedCall.SetFieldValue("SalesCase", salesCaseID);
                    receivedCall.SetFieldValue("DetectedCustomer", salesCase.GetFieldValue<Guid>("Customer"));

                    receivedCall.SetFieldValue("CreatedActivity", activityID);
                    receivedCall.ChangeStatus = "Modify";
                    dbHelper.ApplyChanges(receivedCall);

                    if (callPersonID != salesCase.GetFieldValue<Guid>("Customer"))
                    {
                        if (!dbHelper.EntityExists("crm.SalesCaseConnectedPerson",
                                string.Format("SalesCase = '{0}' and ConnectedPerson = '{1}'", salesCaseID, callPersonID)))
                        {
                            var salesCaseConnectedPerson = dbHelper.CreateNewEntity("crm.SalesCaseConnectedPerson");
                            salesCaseConnectedPerson.SetFieldValue("SalesCase", salesCaseID);
                            salesCaseConnectedPerson.SetFieldValue("ConnectedPerson", callPersonID);

                            dbHelper.ApplyChanges(salesCaseConnectedPerson);
                        }
                    }

                    tranManager.Commit();
                }
            }
        }
 
        public EntityList GetPersonRelatedContracts(Guid personId)
        {
            //DebugHelper.Break(); 
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            { 
                string sqlStr = string.Format(@"
                    select Cntrct.ID, Cntrct.Customer 
                    from cmn_Contracts Cntrct
                    	inner join afw_OptionSetItems ContractStatus on ContractStatus.ID = Cntrct.Status 
                    where ContractStatus.Name = 'Active' and (Cntrct.Customer = '{0}' or 
                    	exists (select 1 from cmn_PersonMembers where MemberPerson = '{0}' and ParentPerson = Cntrct.Customer))", personId);

                var contractEntityList = dbHelper.FetchMultipleBySqlQuery(sqlStr);

                return contractEntityList;
            }
        }

        public void SetRelatedContract(Guid receivedCallID, Guid contractId)
        {
            //DebugHelper.Break(); 

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var receivedCallEntity = dbHelper.FetchSingle("cmn.ReceivedCall", string.Format("ID = '{0}'", receivedCallID), null);
                    var contractEntity = dbHelper.FetchSingle("cmn.Contract", string.Format("ID = '{0}'", contractId), null);

                    if (receivedCallEntity.GetFieldValue<Guid?>("SalesCase") != null)
                    {
                        var salesCaseCustomerId = receivedCallEntity.GetFieldValue<Guid>("DetectedCustomer");
                        if (contractEntity.GetFieldValue<Guid>("Customer") != salesCaseCustomerId)
                            throw new AfwException("مشتری قرارداد با مشتری پرونده فروش متفاوت است.");
                    }
                    else
                    {
                        receivedCallEntity.SetFieldValue("DetectedCustomer", contractEntity.GetFieldValue<Guid>("Customer"));
                        receivedCallEntity.SetFieldValue("Contract", contractId);
                        dbHelper.ApplyChanges(receivedCallEntity);
                        receivedCallEntity.ChangeStatus = "Modify";
                        tranManager.Commit();
                    }
                }
            }
        }

        public EntityList GetPersonRelatedSalesCases(Guid callPersonId)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            { 
                string strSQL = string.Format(@"
                    select SalesCase.ID, SalesCase.Customer   
                    from dbo.crm_SalesCases SalesCase     
                    where Customer = '{0}' 
                    	or exists (select 1 from crm_SalesCaseConnectedPersons where ConnectedPerson = '{0}' and SalesCase = SalesCase.ID)", callPersonId);

                var salesCaseEntityList = dbHelper.FetchMultipleBySqlQuery(strSQL);
 
                return salesCaseEntityList; 
            }
        }

        public void DeleteCreatedActivity(string callID)
        {
            //DebugHelper.Break(); 
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var receivedCallEntity = dbHelper.FetchSingle("cmn.ReceivedCall", string.Format("ID = '{0}'", callID), null);

                    if (receivedCallEntity.GetFieldValue<Guid?>("CreatedActivity") != null)
                    {
                        Guid activityID = receivedCallEntity.GetFieldValue<Guid>("CreatedActivity");

                        receivedCallEntity.SetFieldValue("SalesCase", null);
                        receivedCallEntity.SetFieldValue("DetectedCustomer", null);
                        receivedCallEntity.SetFieldValue("CreatedActivity", null);
                        receivedCallEntity.ChangeStatus = "Modify";

                        dbHelper.ApplyChanges(receivedCallEntity);

                        var activityEntity = dbHelper.FetchSingle("cmn.Activity", string.Format("ID = '{0}'", activityID), null);
                        if (activityEntity != null)
                        {
                            activityEntity.ChangeStatus = "Delete";
                            dbHelper.ApplyChanges(activityEntity);
                        }
                    }

                    tranManager.Commit();
                }
            }
        }
    }
}
 

