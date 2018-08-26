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
    public class SiteTransactionBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

        }

        public void SavePurchaseRequestInfo(string purchaseRequestInfoJson)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var siteTransactionEntity = dbHelper.CreateNewEntity("cmn.SiteTransaction");

            var purchaseRequestInfo = Entity.DeserializeFromJson(purchaseRequestInfoJson);
            purchaseRequestInfo.AddField("SiteTransaction", siteTransactionEntity.GetFieldValue<Guid>("ID"));

            purchaseRequestInfoJson = purchaseRequestInfo.SerializeToJson();

            siteTransactionEntity.SetFieldValue("PurchaseRequestInfoJson", purchaseRequestInfoJson);
            siteTransactionEntity.SetFieldValue("IsSync", false);
            dbHelper.ApplyChanges(siteTransactionEntity);
        }

        public List<int> NextStepPurchaseRequestInfo()
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            decimal payedAmounts = 0;
            Entity beforeAccDocEntity = null;

            List<int> createdAccDocsList = new List<int>();

            var siteTransactionEntityList = dbHelper.FetchMultiple("cmn.SiteTransaction", "IsSync = 0 and AccDoc is null", null, null, null, null);

            EntityList purchaseRequestInfoList = new EntityList();
            foreach (var siteTransactionEntity in siteTransactionEntityList.Entities)
            {
                var purchaseRequestInfo = Entity.DeserializeFromJson(siteTransactionEntity.GetFieldValue<string>("PurchaseRequestInfoJson"));
                if (!purchaseRequestInfo.FieldExists("SiteTransaction"))
                {
                    purchaseRequestInfo.AddField("SiteTransaction", siteTransactionEntity.GetFieldValue<Guid>("ID"));
                    var purchaseRequestInfoJson = purchaseRequestInfo.SerializeToJson();
                    siteTransactionEntity.SetFieldValue("PurchaseRequestInfoJson", purchaseRequestInfoJson);
                    siteTransactionEntity.ChangeStatus = "Modify";
                    dbHelper.ApplyChanges(siteTransactionEntity);
                }
                purchaseRequestInfoList.Entities.Add(purchaseRequestInfo);
            }

            purchaseRequestInfoList.Entities.Sort(
                delegate(Entity a, Entity b)
                {
                    return a.GetFieldValue<DateTime>("IssueDate").CompareTo(b.GetFieldValue<DateTime>("IssueDate"));
                });

            foreach (var purchaseRequestInfo in purchaseRequestInfoList.Entities)
            {
                var stuff = dbHelper.CreateNewEntity("cmn.Stuff");
                var stuffMainCategory = dbHelper.CreateNewEntity("cmn.StuffMainCategory");
                var customer = dbHelper.CreateNewEntity("cmn.Person");
                var marketer = dbHelper.CreateNewEntity("cmn.Person");

                // بررسی وجود کالا : اگر کالا وجود داشت ، کالا واکشی شده در غیر اینصورت کالای مورد نظر ایجاد میشود
                if (!string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("StuffID")) &&
                    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("StuffName")))
                {
                    var stuffCode = purchaseRequestInfo.GetFieldValue<string>("StuffID");
                    var stuffName = purchaseRequestInfo.GetFieldValue<string>("StuffName");

                    stuff = FetchOrCreateStuff(ref stuffMainCategory, stuffCode, stuffName, dbHelper);
                }
                else
                {
                    break;
                    throw new AfwException("وجود خطا در اطلاعات کد یا نام کالا.");
                }

                // بررسی وجود مشتری : اگر مشتری وجود داشت ، مشتری واکشی شده در غیر اینصورت مشتری مورد نظر ایجاد میشود 
                if (!string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("CustomerID")) &&
                    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("CustomerFirstName")) &&
                    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("CustomerLastName")) &&
                    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("CustomerMobile")))
                {
                    var customerCode = purchaseRequestInfo.GetFieldValue<string>("CustomerID");
                    var customerFirstName = purchaseRequestInfo.GetFieldValue<string>("CustomerFirstName");
                    var customerLastName = purchaseRequestInfo.GetFieldValue<string>("CustomerLastName");
                    var mobilePhoneNumber1 = purchaseRequestInfo.GetFieldValue<string>("CustomerMobile");

                    customer = FetchOrCreatePerson(customerCode, customerFirstName, customerLastName, mobilePhoneNumber1, "Customer", dbHelper);
                }
                else
                {
                    break;
                    throw new AfwException("وجود خطا در اطلاعات کد یا نام و یا موبایل مشتری.");
                }

                // بررسی وجود بازاریاب : اگر بازاریاب وجود داشت ، بازاریاب واکشی شده در غیر اینصورت بازاریاب مورد نظر ایجاد میشود 
                //if (!string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("MarketerID")) &&
                //    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("MarketerFirstName")) &&
                //    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("MarketerLastName")) &&
                //    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("MarketerCommission")))
                //{
                //    var marketerCode = purchaseRequestInfo.GetFieldValue<string>("MarketerID");
                //    var marketerFirstName = purchaseRequestInfo.GetFieldValue<string>("MarketerFirstName");
                //    var marketerLastName = purchaseRequestInfo.GetFieldValue<string>("MarketerLastName");
                //    var marketerCommission = purchaseRequestInfo.GetFieldValue<string>("MarketerCommission");

                //    marketer = FetchOrCreatePerson(marketerCode, marketerFirstName, marketerLastName, marketerCommission, "Marketer", dbHelper);
                //}
                //else
                //{
                //    break;
                //    throw new AfwException("وجود خطا در اطلاعات کد یا نام و یا درصد بازاریاب.");
                //}

                // بررسی وجود مشخصات مبلغ پرداختی : اگر این مشخصات وجود داشتن ، سند حسابداری آن ثبت میشود 
                if (!string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("PayedAmount")) &&
                    /*purchaseRequestInfo.GetFieldValue<Guid>("PayType") != null &&*/
                    !string.IsNullOrEmpty(purchaseRequestInfo.GetFieldValue<string>("IssueDate")) &&
                    purchaseRequestInfo.GetFieldValue<Guid>("BankName") != null)
                {
                    var payedAmount = purchaseRequestInfo.GetFieldValue<decimal>("PayedAmount");
                    var payType = purchaseRequestInfo.GetFieldValue<Guid?>("PayType");
                    var issueDate = purchaseRequestInfo.GetFieldValue<string>("IssueDate");
                    var bankID = purchaseRequestInfo.GetFieldValue<Guid>("BankName");

                    var customerID = customer.GetFieldValue<Guid>("ID");
                    //CreateReceiveReceipt(payedAmount, payType, issueDate, bankName, customerID, dbHelper);

                    var bankAccount = dbHelper.FetchSingle("cmn.BankAccount", string.Format("ID = '{0}'", bankID), null);

                    if (bankAccount != null)
                    {
                        var bankAccountAccSetting = dbHelper.FetchSingle("cmn.BankAccountAccSetting",
                            string.Format("BankAccount = '{0}' and FinancialYear = '{1}'", 
                                bankAccount.GetFieldValue<Guid>("ID"), 
                                new FinancialYearBL().GetUserActiveFinancialYearID()), null);

                        if (bankAccountAccSetting.GetFieldValue<Guid>("AccountInCoding") != null && stuffMainCategory.GetFieldValue<Guid>("Account") != null)
                        {
                            Entity accDocEntity = dbHelper.CreateNewEntity("acc.AccDoc");
                            var accDocID = accDocEntity.GetFieldValue<Guid>("ID");

                            if (beforeAccDocEntity != null)
                            {
                                if (issueDate == beforeAccDocEntity.GetFieldValue<string>("IssueDate"))
                                {
                                    accDocEntity = beforeAccDocEntity;
                                    accDocID = beforeAccDocEntity.GetFieldValue<Guid>("ID");
                                    payedAmounts += payedAmount;

                                    accDocEntity.SetFieldValue("RemainingAmount", payedAmounts);
                                    accDocEntity.ChangeStatus = "Modify";
                                    dbHelper.ApplyChanges(accDocEntity);
                                }
                                else
                                    CreateAccDoc(accDocEntity, payedAmount, issueDate, dbHelper);
                            }
                            else
                                CreateAccDoc(accDocEntity, payedAmount, issueDate, dbHelper);

                            Guid debtorCustomerAccount = new Guid("62EBEA82-3952-472F-9CB1-FABB1DC9838E");
                            //Guid creditRevenueAccount = new Guid("2E297719-E3CD-43BF-8937-81A97972CD24");
                            Guid creditRevenueAccount = new Guid("1190DA12-9BE2-4B2D-ADC0-0CB496BA05EE");


                            //CreateAccDocDebtorItem  
                            var debtorAccountID = bankAccount.GetFieldValue<Guid>("AccountInCoding");
                            CreateAccDocItem(accDocID, debtorAccountID, customerID, null, null, null, payedAmount, 0, dbHelper);

                            //CreateAccDocCreditorItem
                            var creditorAccountID = stuffMainCategory.GetFieldValue<Guid>("Account");
                            CreateAccDocItem(accDocID, debtorCustomerAccount/*creditorAccountID*/, customerID, null, null, null, 0, payedAmount, dbHelper);

                            CreateAccDocItem(accDocID, debtorCustomerAccount, customerID, null, null, null, payedAmount, 0, dbHelper);
                            CreateAccDocItem(accDocID, creditRevenueAccount, customerID, null, null, null, 0, payedAmount, dbHelper);

                            var siteTransactionID = purchaseRequestInfo.GetFieldValue<Guid>("SiteTransaction");
                            var siteTransactionEntity = dbHelper.FetchSingle("cmn.SiteTransaction", string.Format("ID = '{0}'", siteTransactionID), null);
                            siteTransactionEntity.SetFieldValue("IsSync", true);
                            siteTransactionEntity.SetFieldValue("AccDoc", accDocID);
                            siteTransactionEntity.ChangeStatus = "Modify";
                            dbHelper.ApplyChanges(siteTransactionEntity);

                            createdAccDocsList.Add(accDocEntity.GetFieldValue<int>("DocNo"));

                            beforeAccDocEntity = accDocEntity;
                        }
                    }
                }
                else
                {
                    break;
                    throw new AfwException("وجود خطا در اطلاعات نام بانک یا تاریخ ثبت و یا مبلغ پرداختی.");
                }
            }

            return createdAccDocsList;
        }

        public Entity FetchOrCreateStuff(ref Entity stuffMainCategory, string stuffCode, string stuffName, EntityDbHelper dbHelper)
        {
            var stuffEntity = dbHelper.CreateNewEntity("cmn.Stuff");

            var stuffDefEntity = dbHelper.FetchSingle("cmn.StuffDef", string.Format("Code = '{0}' and Name = N'{1}'", stuffCode, stuffName), null);
            if (stuffDefEntity == null)
            {
                // دریافت گروه های اصلی کالا که کدینگ حسابداری برای آنها ثبت شده است
                var stuffMainCategoryEntityList = dbHelper.FetchMultiple("cmn.StuffMainCategory", "Account is not null", null, null, null, null);
                if (stuffMainCategoryEntityList.Entities.Count > 0)
                {
                    // اولین گروه اصلی کالا که کدینگ حسابداری برای آن ثبت شده است
                    stuffMainCategory = stuffMainCategoryEntityList.Entities[0];
                    var stuffMainCategoryFirstID = stuffMainCategory.GetFieldValue<Guid>("ID");

                    // دریافت گروه های فرعی کالا که کدینگ حسابداری دارند
                    var stuffSubCategoryEntityList = dbHelper.FetchMultiple("cmn.StuffSubCategory",
                        string.Format("MainCategory = '{0}'", stuffMainCategoryFirstID), null, null, null, null);

                    var mainMeasurementUnitEntityList = dbHelper.FetchMultiple("cmn.MeasurementUnit", null, null, null, null, null);

                    if (stuffSubCategoryEntityList.Entities.Count > 0 && mainMeasurementUnitEntityList.Entities.Count > 0)
                    {
                        // شناسه اولین گروه فرعی کالا
                        var subCategoryID = stuffSubCategoryEntityList.Entities[0].GetFieldValue<Guid>("ID");
                        // شناسه اولین واحد کالا
                        var mainMeasurementUnitID = mainMeasurementUnitEntityList.Entities[0].GetFieldValue<Guid>("ID");

                        var newStuffDef = dbHelper.CreateNewEntity("cmn.StuffDef");
                        newStuffDef.SetFieldValue("Code", stuffCode);
                        newStuffDef.SetFieldValue("Name", stuffName);
                        newStuffDef.SetFieldValue("HideInProforma", 0);
                        newStuffDef.SetFieldValue("HideInInvoice", 0);
                        newStuffDef.SetFieldValue("HideInStockTransfer", 0);
                        newStuffDef.SetFieldValue("DarayeMaliatBarArzesheAfzudeh", 0);
                        newStuffDef.SetFieldValue("SetUnitPriceOnlyFromPricesList", 0);
                        newStuffDef.SetFieldValue("SubCategory", subCategoryID);
                        newStuffDef.SetFieldValue("MainMeasurementUnit", mainMeasurementUnitID);
                        dbHelper.ApplyChanges(newStuffDef);

                        // فعلا در نرم افزار به ازای یک تعریف کالا یک کالا نیز وجود دارد که ما اولین آیتم آن را برمیگردانیم که بعدا قرار است یک لیست برگردانده شود
                        var stuffList = dbHelper.FetchMultiple("cmn.Stuff", string.Format("StuffDef = '{0}'", stuffDefEntity.GetFieldValue<Guid>("ID")), null, null, null, null);
                        stuffEntity = stuffList.Entities[0];
                    }
                }
            }
            else
            {
                // فعلا در نرم افزار به ازای یک تعریف کالا یک کالا نیز وجود دارد که ما اولین آیتم آن را برمیگردانیم که بعدا قرار است یک لیست برگردانده شود
                var stuffList = dbHelper.FetchMultiple("cmn.Stuff", string.Format("StuffDef = '{0}'", stuffDefEntity.GetFieldValue<Guid>("ID")), null, null, null, null);
                stuffEntity = stuffList.Entities[0];

                var subCategoryID = stuffDefEntity.GetFieldValue<Guid>("SubCategory");
                var stuffSubCategory = dbHelper.FetchSingle("cmn.StuffSubCategory", string.Format("ID = '{0}'", subCategoryID), null);
                stuffMainCategory = dbHelper.FetchSingle("cmn.StuffMainCategory",
                    string.Format("ID = '{0}'", stuffSubCategory.GetFieldValue<Guid>("MainCategory")), null);
            }

            return stuffEntity;
        }

        public Entity FetchOrCreatePerson(string personCode, string name, string lastName, string mobilePhoneNumber1OrCommission, string roleName, EntityDbHelper dbHelper)
        {
            var personExists = false;
            if (roleName == "Customer")
                personExists = dbHelper.EntityExists("cmn.Person", string.Format("Name = N'{0}' and LastName = N'{1}' and MobilePhoneNumber1 = '{2}'", name, lastName, mobilePhoneNumber1OrCommission));
            else if (roleName == "Marketer")
                personExists = dbHelper.EntityExists("cmn.Person", string.Format("Name = N'{0}' and LastName = N'{1}'", name, lastName));

            if (personExists == false)
            {
                var personEntity = dbHelper.CreateNewEntity("cmn.Person");
                personEntity.SetFieldValue("Name", name);
                personEntity.SetFieldValue("LastName", lastName);
                if (roleName == "Customer")
                    personEntity.SetFieldValue("MobilePhoneNumber1", mobilePhoneNumber1OrCommission);

                var haghighiID = OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi");
                personEntity.SetFieldValue("PersonType", haghighiID);

                var person_CustomerInfoEntity = dbHelper.CreateNewEntity("cmn.Person_CustomerInfo");
                var person_MarketerInfoEntity = dbHelper.CreateNewEntity("cmn.Person_MarketerInfo");

                if (roleName == "Customer")
                {
                    person_CustomerInfoEntity.SetFieldValue("PersonCode", personCode);
                    person_CustomerInfoEntity.SetFieldValue("Person", personEntity.GetFieldValue<Guid>("ID"));

                    personEntity.AddField("CustomerInfo", person_CustomerInfoEntity);
                }
                else if (roleName == "Marketer")
                {
                    person_MarketerInfoEntity.SetFieldValue("PersonCode", personCode);
                    person_MarketerInfoEntity.SetFieldValue("Person", personEntity.GetFieldValue<Guid>("ID"));
                    person_MarketerInfoEntity.SetFieldValue("Commission", mobilePhoneNumber1OrCommission);

                    personEntity.AddField("MarketerInfo", person_MarketerInfoEntity);
                }

                var personRoleRelationEntityList = new EntityList();
                var personRoleRelationEntity = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
                personRoleRelationEntityList.EntityDefID = personRoleRelationEntity.EntityDefID;
                var personRoleEntity = dbHelper.FetchSingle("cmn.PersonRole", string.Format("Name = '{0}'", roleName), null);
                personRoleRelationEntity.SetFieldValue("PersonRole", personRoleEntity.GetFieldValue<Guid>("ID"));
                personRoleRelationEntity.SetFieldValue("Person", personEntity.GetFieldValue<Guid>("ID"));
                personRoleRelationEntityList.Entities.Add(personRoleRelationEntity);

                personEntity.SetFieldValue("PersonRoleRelations", personRoleRelationEntityList);

                new PersonBL().SavePerson(personEntity);
                return personEntity;
            }
            else
            {
                var personEntity = dbHelper.CreateNewEntity("cmn.Person");
                if (roleName == "Customer")
                    personEntity = dbHelper.FetchSingle("cmn.Person", string.Format("Name = N'{0}' and LastName = N'{1}' and MobilePhoneNumber1 = '{2}'", name, lastName, mobilePhoneNumber1OrCommission), null);
                else if (roleName == "Marketer")
                    personEntity = dbHelper.FetchSingle("cmn.Person", string.Format("Name = N'{0}' and LastName = N'{1}'", name, lastName), null);

                return personEntity;
            }

        }

        //public void CreateReceiveReceipt(string payedAmount, string payType, string issueDate, string bankName, Guid customerID, EntityDbHelper dbHelper)
        //{
        //    // Create ReceiveReceipt
        //    var financialYearID = new FinancialYearBL().GetUserActiveFinancialYearID();
        //    var financialGroupID = dbHelper.FetchMultiple("cmn.FinancialGroup", "IsDefault = 1", null, null, null, null).Entities[0].GetFieldValue<Guid>("ID");
        //    var lastReceiptNumber = cmn.Instance.GetFieldMaxIntValue("ReceiptNumber", "rp_ReceiveReceipts", string.Format("FinancialYear = '{0}'", financialYearID));

        //    var receiveReceipt = dbHelper.CreateNewEntity("rp.ReceiveReceipt");
        //    receiveReceipt.SetFieldValue("FinancialYear", financialYearID);
        //    receiveReceipt.SetFieldValue("FinancialGroup", financialGroupID);
        //    receiveReceipt.SetFieldValue("Payer", customerID);
        //    receiveReceipt.SetFieldValue("ReceiptDate", issueDate);
        //    receiveReceipt.SetFieldValue("TotalAmount", payedAmount);
        //    receiveReceipt.SetFieldValue("Description", "رسید دریافت از طریق وب سرویس ترازنگار");
        //    receiveReceipt.SetFieldValue("ReceiptNumber", lastReceiptNumber + 1);

        //    dbHelper.ApplyChanges(receiveReceipt);

        //    // Create ReceiveReceiptItems

        //    var receiveReceiptItem = dbHelper.CreateNewEntity("rp.ReceiveReceiptItem");
        //    receiveReceiptItem.SetFieldValue("ReceiveReceipt", receiveReceipt.GetFieldValue<Guid>("ID"));

        //    var receiveType = dbHelper.FetchSingle("rp.ReceiveType", string.Format("Name = '{0}'", payType), null);

        //    if (payType == "Havale")
        //    {
        //        if (receiveType != null)
        //        {
        //            var receiveTypeID = receiveType.GetFieldValue<Guid>("ID");
        //            receiveReceiptItem.SetFieldValue("ReceiveType", receiveTypeID);

        //            var financialOpKind = dbHelper.FetchSingle("sacc.FinancialOpKind", "Name = 'VarizBeSaderat'", null);
        //            if (financialOpKind != null)
        //            {
        //                var financialOpKindID = financialOpKind.GetFieldValue<Guid>("ID");
        //                receiveReceiptItem.SetFieldValue("FinancialOpKind", financialOpKindID);

        //                var naghdeDaryafti = dbHelper.CreateNewEntity("rp.NaghdeDaryafti");
        //                receiveReceiptItem.SetFieldValue("FinancialItem_Naghd", naghdeDaryafti.GetFieldValue<Guid>("ID"));

        //                var cash = dbHelper.FetchMultiple("sacc.Cash", null, null, null, null, null);
        //                naghdeDaryafti.SetFieldValue("Payer", customerID);
        //                naghdeDaryafti.SetFieldValue("Amount", payedAmount);
        //                naghdeDaryafti.SetFieldValue("Cash", cash.Entities[0].GetFieldValue<Guid>("ID"));

        //                naghdeDaryafti.SetFieldValue("Description", "دریافت نقدی از طریق وب سرویس");

        //                dbHelper.ApplyChanges(naghdeDaryafti);
        //                dbHelper.ApplyChanges(receiveReceiptItem);
        //            }
        //        }
        //    }
        //    else if (payType == "Naghd")
        //    { 
        //        if (receiveType != null)
        //        {
        //            var receiveTypeID = receiveType.GetFieldValue<Guid>("ID"); 
        //            receiveReceiptItem.SetFieldValue("ReceiveType", receiveTypeID);

        //            var financialOpKind = dbHelper.FetchSingle("sacc.FinancialOpKind", "Name = 'DaryaftNaghdi'", null);
        //            if (financialOpKind != null)
        //            {
        //                var financialOpKindID = financialOpKind.GetFieldValue<Guid>("ID");
        //                receiveReceiptItem.SetFieldValue("FinancialOpKind", financialOpKindID);

        //                var naghdeDaryafti = dbHelper.CreateNewEntity("rp.NaghdeDaryafti");
        //                receiveReceiptItem.SetFieldValue("FinancialItem_Naghd", naghdeDaryafti.GetFieldValue<Guid>("ID"));

        //                var cash = dbHelper.FetchMultiple("sacc.Cash", null, null, null, null, null);
        //                naghdeDaryafti.SetFieldValue("Payer", customerID);
        //                naghdeDaryafti.SetFieldValue("Amount", payedAmount);
        //                naghdeDaryafti.SetFieldValue("Cash", cash.Entities[0].GetFieldValue<Guid>("ID"));

        //                naghdeDaryafti.SetFieldValue("Description", "دریافت نقدی از طریق وب سرویس");

        //                dbHelper.ApplyChanges(naghdeDaryafti);
        //                dbHelper.ApplyChanges(receiveReceiptItem);
        //            } 
        //        }
        //    }



        //}

        public void CreateAccDoc(Entity accDocEntity, decimal payedAmount, string issueDate, EntityDbHelper dbHelper)
        {
            var balanceStatusID = OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Balance");
            var docStatusID = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked");

            var docKindID = new DocKindBL().GetDocKindID("ComposeDoc");
            var financialYearID = new FinancialYearBL().GetUserActiveFinancialYearID();
            var financialGroupID = dbHelper.FetchMultiple("cmn.FinancialGroup", "IsDefault = 1", null, null, null, null).Entities[0].GetFieldValue<Guid>("ID");

            accDocEntity.SetFieldValue("IssueDate", issueDate);
            accDocEntity.SetFieldValue("FinancialYear", financialYearID);
            accDocEntity.SetFieldValue("FinancialGroup", financialGroupID);
            accDocEntity.SetFieldValue("DocKind", docKindID);
            accDocEntity.SetFieldValue("IsAutoGenerated", false);
            accDocEntity.SetFieldValue("BalanceStatus", balanceStatusID);
            accDocEntity.SetFieldValue("DocStatus", docStatusID);
            accDocEntity.SetFieldValue("RemainingAmount", payedAmount);
            accDocEntity.SetFieldValue("IsActive", 1);
            accDocEntity.SetFieldValue("Description", "سند تولید شده از طریق وب سرویس");
            dbHelper.ApplyChanges(accDocEntity);
        }

        public void CreateAccDocItem(Guid accDocID, Guid accountID, Guid? personID, Guid? costCenterID, Guid? projectID,
            Guid? foreignCurrencyID, decimal debtorAmount, decimal creditorAmount, EntityDbHelper dbHelper)
        {
            var maxRowNo = cmn.Instance.GetFieldMaxIntValue("RowNo", "acc_AccDocItems", string.Format("AccDoc = '{0}'", accDocID));

            var accDocItemEntity = dbHelper.CreateNewEntity("acc.AccDocItem");
            accDocItemEntity.SetFieldValue("AccDoc", accDocID);
            accDocItemEntity.SetFieldValue("RowNo", maxRowNo + 1);
            accDocItemEntity.SetFieldValue("Account", accountID);
            accDocItemEntity.SetFieldValue("Person", personID);
            accDocItemEntity.SetFieldValue("CostCenter", costCenterID);
            accDocItemEntity.SetFieldValue("Project", projectID);
            accDocItemEntity.SetFieldValue("ForeignCurrency", foreignCurrencyID);
            accDocItemEntity.SetFieldValue("Note", "");
            accDocItemEntity.SetFieldValue("DebtorAmount", debtorAmount);
            accDocItemEntity.SetFieldValue("CreditorAmount", creditorAmount);
            accDocItemEntity.SetFieldValue("IsActive", true);
            dbHelper.ApplyChanges(accDocItemEntity);
        }
    }
}
