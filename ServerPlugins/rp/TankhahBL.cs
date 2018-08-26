using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class TankhahBL : FinancialOpBaseBL
    {
        public TankhahBL() : base("Tankhah") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add))
            {
                if (dbHelper.EntityExists("rp.Tankhah",
                    string.Format("TankhahNo = {0} and FinancialYear = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<int>("TankhahNo"),
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<Guid>("ID"))))
                    throw new AfwException("شماره تنخواه تکراری است.");
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                var oldTankhah = dbHelper.FetchSingleByID("rp.Tankhah", entity.GetFieldValue<Guid>("ID"), null);

                if (oldTankhah.GetFieldValue<Guid?>("AccDoc") != null
                    && entity.GetFieldValue<Guid?>("AccDoc") != null/*except when deleting Doc that sets AccDoc field to null*/)
                    throw new AfwException("امکان تغییر یا حذف این آیتم بدلیل صدور سند حسابداری وجود ندارد.");
            }
        }

        public Entity TankhahAccDocGenerate(bool repeatTotal, string tankhahID, string operationType, DateTime issueDate, string description)
        {
            Entity result = new Entity();
            result.FieldValues.Add("MaxDocNo", 0);
            result.FieldValues.Add("AccDocID", null);

            Int64 maxDocNo = 0;
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var tankhahEntity = dbHelper.FetchSingle("rp.Tankhah", string.Format("ID = '{0}'", tankhahID), null);

                    var accDocID = tankhahEntity.GetFieldValue<Guid?>("AccDoc");
                    var financialYear = tankhahEntity.GetFieldValue<Guid>("FinancialYear");
                    var financialDocType = tankhahEntity.GetFieldValue<Guid>("FinancialDocType");
                    var organizationUnit = tankhahEntity.GetFieldValue<Guid>("OrganizationUnit");

                    acc.Instance.InsertAccDocMaster(ref accDocID, "Tankhah", issueDate, financialYear, financialDocType, organizationUnit, description, true);

                    if (tankhahEntity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        tankhahEntity.SetFieldValue("AccDoc", accDocID);
                        tankhahEntity.ChangeStatus = "Modify";
                        dbHelper.UpdateEntity(tankhahEntity);
                    }

                    CreateTankhahAccDocItems(tankhahEntity, (Guid)accDocID, repeatTotal);
                    acc.Instance.UpdateAccDocMasterBalanceStatus((Guid)accDocID);

                    maxDocNo = dbHelper.FetchSingle("acc.AccDoc", string.Format("ID = '{0}'", accDocID), null).GetFieldValue<Int64>("DocNo");

                    result.SetFieldValue("MaxDocNo", maxDocNo);
                    result.SetFieldValue("AccDocID", accDocID);

                    tranManager.Commit();

                    return result;
                }
                catch (Exception ex)
                {
                    throw new AfwException("خطا در عملیات ثبت سند تنخواه.\r\n" + ex.Message);
                }
            }
        }

        private void CreateTankhahAccDocItems(Entity tankhahEntity, Guid accDocID, bool repeatTotal)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var opFieldNameInItemEntity = "RefOp_Tankhah";

            var tankhahID = tankhahEntity.GetFieldValue<Guid>("ID");
            var financialYearID = tankhahEntity.GetFieldValue<Guid>("FinancialYear");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, tankhahID);
                    List<Entity> accDocItemList = new List<Entity>();

                    string queryString = "";

                    if (repeatTotal)
                    {
                        queryString = string.Format(@"
                            select Tankhah.ID, Tankhah.FinancialGroup, TankhahGardanAccSetting.Account TankhahGardanAccount, TankhahItem.Amount, 
                                TankhahItem.TankhahDefAccount, TankhahItem.Description ItemDes, TankhahItem.TankhahTypeName, Tankhah.Person, 
                                TankhahItem.ItemPerson, TankhahItem.ItemCostCenter, TankhahItem.ItemProject, Tankhah.Description KolDes
                            from rp_Tankhahha Tankhah
                                inner join rp_TankhahGardanha TankhahGardan on TankhahGardan.ID = Tankhah.TankhahGardan
	                            left join rp_TankhahGardanAccSettings TankhahGardanAccSetting 
		                            on TankhahGardanAccSetting.TankhahGardan = TankhahGardan.ID
                                inner join (
                                    select TankhahItem.Tankhah, TankhahItem.Amount, TarafHesabeTankhahAccSetting.Account TankhahDefAccount, 
                                        TankhahType.Name TankhahTypeName, FloatPriority.Account FloatPriorityAccount, TankhahItem.Description,
                                        TankhahItem.Person ItemPerson, TankhahItem.CostCenter ItemCostCenter, TankhahItem.Project ItemProject 
                                    from rp_TankhahItems TankhahItem
                                        inner join rp_TankhahDefs TankhahDef on TankhahDef.ID = TankhahItem.TankhahDef
			                            left join rp_TarafHesabeTankhahAccSettings TarafHesabeTankhahAccSetting 
				                            on TarafHesabeTankhahAccSetting.TarafHesabeTankhah = TankhahDef.ID
                                        inner join afw_OptionSetItems TankhahType on TankhahType.ID = TankhahItem.TankhahType
                                        left join cmn_FloatPriorities FloatPriority on FloatPriority.Account = TarafHesabeTankhahAccSetting.Account
                                    where FloatPriority.Account is not null 
                                    union 
                                    select TankhahItem.Tankhah, sum(TankhahItem.Amount) Amount, TarafHesabeTankhahAccSetting.Account TankhahDefAccount,
                                        TankhahType.Name TankhahTypeName, FloatPriority.Account FloatPriorityAccount, TankhahItem.Description,
                                        null ItemPerson, null ItemCostCenter, null ItemProject 
                                    from rp_TankhahItems TankhahItem
                                        inner join rp_TankhahDefs TankhahDef on TankhahDef.ID = TankhahItem.TankhahDef
			                            left join rp_TarafHesabeTankhahAccSettings TarafHesabeTankhahAccSetting 
				                            on TarafHesabeTankhahAccSetting.TarafHesabeTankhah = TankhahDef.ID
                                        inner join afw_OptionSetItems TankhahType on TankhahType.ID = TankhahItem.TankhahType
                                        left join cmn_FloatPriorities FloatPriority on FloatPriority.Account = TarafHesabeTankhahAccSetting.Account
                                    where FloatPriority.Account is null 
                                    group by TankhahItem.Tankhah, TarafHesabeTankhahAccSetting.Account, TankhahType.Name, FloatPriority.Account, TankhahItem.Description
                                    ) TankhahItem on TankhahItem.Tankhah = Tankhah.ID
                            where Tankhah.ID = '{0}' 
                                and Tankhah.FinancialYear = '{1}' 
                                and TarafHesabeTankhahAccSetting.FinancialYear = '{1}'
                                and TankhahGardanAccSetting.FinancialYear = '{1}'",
                            tankhahID, financialYearID);
                    }
                    else
                    {
                        queryString = string.Format(@"
                            select  Tankhah.ID, Tankhah.FinancialGroup, TankhahGardanAccSetting.Account TankhahGardanAccount, isnull(TankhahItem.Amount, 0) Amount, 
	                            TarafHesabeTankhahAccSetting.Account TankhahDefAccount, TankhahItem.Description ItemDes, TankhahType.Name TankhahTypeName, Tankhah.Person, 
	                            TankhahItem.Person ItemPerson, TankhahItem.CostCenter ItemCostCenter, TankhahItem.Project ItemProject, Tankhah.Description KolDes
                            from rp_Tankhahha Tankhah
	                            left join rp_TankhahItems TankhahItem on TankhahItem.Tankhah = Tankhah.ID
	                            left join rp_TankhahGardanha TankhahGardan on TankhahGardan.ID = Tankhah.TankhahGardan
	                            left join rp_TankhahGardanAccSettings TankhahGardanAccSetting 
		                            on TankhahGardanAccSetting.TankhahGardan = TankhahGardan.ID
	                            inner join rp_TankhahDefs TankhahDef on TankhahDef.ID = TankhahItem.TankhahDef
	                            left join rp_TarafHesabeTankhahAccSettings TarafHesabeTankhahAccSetting 
		                            on TarafHesabeTankhahAccSetting.TarafHesabeTankhah = TankhahDef.ID
	                            left join afw_OptionSetItems TankhahType on TankhahType.ID = TankhahItem.TankhahType 
						    where Tankhah.ID = '{0}' 
                                and Tankhah.FinancialYear = '{1}' 
                                and TarafHesabeTankhahAccSetting.FinancialYear = '{1}'
                                and TankhahGardanAccSetting.FinancialYear = '{1}'",
                            tankhahID, financialYearID);
                    }

                    var entityItemsList = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;

                    if (entityItemsList.Count < 1)
                        throw new AfwException("برای تنخواه انتخاب شده سطری یافت نشد.");

                    Guid? accountMasterSide = null;
                    decimal debtorAmountMasterSide = 0;
                    decimal creditorAmountMasterSide = 0;
                    accountMasterSide = entityItemsList[0].GetFieldValue<Guid>("TankhahGardanAccount");
                    var personID = entityItemsList[0].GetFieldValue<Guid>("Person");
                    var kolDes = entityItemsList[0].GetFieldValue<string>("KolDes");

                    foreach (var entityItem in entityItemsList)
                    {
                        var itemPersonID = entityItem.GetFieldValue<Guid?>("ItemPerson");
                        var itemCostCenterID = entityItem.GetFieldValue<Guid?>("ItemCostCenter");
                        var itemProjectID = entityItem.GetFieldValue<Guid?>("ItemProject");
                        var amount = entityItem.GetFieldValue<decimal>("Amount");
                        var itemDes = entityItem.GetFieldValue<string>("ItemDes");

                        var accountDetailSide = entityItem.GetFieldValue<Guid>("TankhahDefAccount");

                        /*آیتم های بدهکار************************/
                        if (entityItem.GetFieldValue<string>("TankhahTypeName") == "Paid")
                        {
                            creditorAmountMasterSide += entityItem.GetFieldValue<decimal>("Amount");

                            var entity = new Entity();
                            entity.AddField("accountID", (Guid)accountDetailSide);
                            entity.AddField("personID", itemPersonID);
                            entity.AddField("costCenterID", itemCostCenterID);
                            entity.AddField("projectID", itemProjectID);
                            entity.AddField("foreignCurrencyID", null);
                            entity.AddField("note", itemDes);
                            entity.AddField("creditorAmount", 0);
                            entity.AddField("debtorAmount", amount);
                            entity.AddField("isActive", true);

                            accDocItemList.Add(entity);
                        }

                        /*آیتم های بستانکار*******************************/
                        if (entityItem.GetFieldValue<string>("TankhahTypeName") == "Received")
                        {
                            debtorAmountMasterSide += entityItem.GetFieldValue<decimal>("Amount");

                            var entity = new Entity();
                            entity.AddField("accountID", (Guid)accountDetailSide);
                            entity.AddField("personID", itemPersonID);
                            entity.AddField("costCenterID", itemCostCenterID);
                            entity.AddField("projectID", itemProjectID);
                            entity.AddField("foreignCurrencyID", null);
                            entity.AddField("note", itemDes);
                            entity.AddField("creditorAmount", amount);
                            entity.AddField("debtorAmount", 0);
                            entity.AddField("isActive", true);

                            accDocItemList.Add(entity);
                        }
                    }

                    /*مجموع بدهکار************************/
                    if (debtorAmountMasterSide > 0)
                    {
                        var entity = new Entity();
                        entity.AddField("accountID", (Guid)accountMasterSide);
                        entity.AddField("personID", personID);
                        entity.AddField("costCenterID", null);
                        entity.AddField("projectID", null);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", kolDes);
                        entity.AddField("creditorAmount", 0);
                        entity.AddField("debtorAmount", debtorAmountMasterSide);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);
                    }
                    /*مجموع بستانکار*******************************/
                    if (creditorAmountMasterSide > 0)
                    {
                        var entity = new Entity();
                        entity.AddField("accountID", (Guid)accountMasterSide);
                        entity.AddField("personID", personID);
                        entity.AddField("costCenterID", null);
                        entity.AddField("projectID", null);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", kolDes);
                        entity.AddField("creditorAmount", creditorAmountMasterSide);
                        entity.AddField("debtorAmount", 0);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);
                    }

                    acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, tankhahID, accDocItemList);
                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw new AfwException(ex.Message);
                }
            }
        }
    }
}
