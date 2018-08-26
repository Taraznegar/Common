(function () {
    window.acc = {
        Init: function () {
            var that = this;
            
            that._AccountReviewForm = null;
            that._AccConfigEntity = null;
            that.ShenavarhaReportFormInstance = null;
            that._DafaterForm = null;
        },

        OpenAccDocsCheckingForm: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.AccDocsCheckingForm", "بررسی اسناد حسابداری");
        },

        ShowAccountReviewForm: function () {
            var that = this;

            afw.uiApi.ShowProgress(afw.App.AppContainer);
            setTimeout(function () { }, 100);

            if (cmn.OpenWindowExists()) {
               var accountReviewWindow = new afw.Window({
                    Name: "AccountReviewWindow",
                    Title: "مرور حساب",
                    Modal: false,
                    Width: 1200,
                    Height: 800
                });

                that._AccountReviewForm = afw.uiApi.CreateSavedControl(
                    "acc.AccountReviewForm",
                    {
                        Name: "AccountReviewForm",
                        ParentControl: accountReviewWindow,
                        FillParent: true
                    });

                accountReviewWindow.Center();
                accountReviewWindow.Open();
            }
            else {
                if (that._AccountReviewForm != null) {
                    var accountReviewFormParent = that._AccountReviewForm.ParentControl;

                    if (!accountReviewFormParent.IsDestroying)
                        accountReviewFormParent.Destroy();
                }

                that._AccountReviewForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.AccountReviewForm", "مرور حساب");
            }

            afw.uiApi.HideProgress(afw.App.AppContainer);
        },

        ShowAccDocsList: function () {
            var that = this;

            afw.uiApi.ShowProgress(afw.App.AppContainer);
            setTimeout(function () { }, 100);

            if (cmn.OpenWindowExists()) {
                var accDocsListWindow = new afw.Window({
                    Name: "AccDocs",
                    Title: "اسناد حسابداری",
                    Modal: false,
                    Width: 1200,
                    Height: 800
                });

                that._AccountReviewForm = afw.uiApi.CreateDataListControl(
                    "acc.AccDocs",
                    {
                        Name: "AccountReviewForm",
                        ParentControl: accDocsListWindow,
                        FillParent: true
                    });

                accDocsListWindow.Center();
                accDocsListWindow.Open();
            }
            else
                afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "اسناد حسابداری", { Mode: "DocsList" });

            afw.uiApi.HideProgress(afw.App.AppContainer);
        },

        OpenDafaterForm: function () {
            var that = this;

            if (that._DafaterForm != null) {
                var daftarFormParent = that._DafaterForm.ParentControl;

                if (!daftarFormParent.IsDestroying)
                    daftarFormParent.Destroy();
            }

            that._DafaterForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.DafaterForm", "دفاتر");
        },

        OpenYearCodingAccountFrom: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.AccountForm", "درخت کدینگ حساب ها");
        },

        OpeningDoc: function () {
            afw.MessageDialog.Show("شما دسترسی لازم برای صدور سند افتتاحیه را ندارید.");
        },

        CostAndBenefitDoc: function () {
            afw.MessageDialog.Show("شما دسترسی لازم برای صدور سند سود و زیان را ندارید.");
        },

        CreateAllLevelReport: function(){
            var that = this;

            afw.uiApi.OpenSavedFormWindow("acc.AccountAllLevelReportForm", {
                Name: "AccountAllLevelReportForm",
                Modal: true,
                Title: "گزارش کلیه سطوح"
            }).Center();
        },

        ClosingDoc: function () {
            afw.MessageDialog.Show("شما دسترسی لازم برای صدور سند اختتامیه را ندارید.");
        },

        OpenDaftarRoznameReportForm: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.DaftarRoznameReportForm", "گزارش دفتر روزنامه");
        },

        OpenCostAndBenefitReportForm: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.CostAndBenefitReportForm", "گزارش سود و زیان");
        },

        ShowShenavarhaReportForm: function () {
            var that = this;

            afw.uiApi.ShowProgress(afw.App.AppContainer);
            that.DestroyShenavarhaForm();

            that.ShenavarhaReportFormInstance = afw.uiApi.OpenSavedFormInMdiContainer("acc.ShenavarhaReportForm", "گزارش شناورها");
            afw.uiApi.HideProgress(afw.App.AppContainer);
        },

        DestroyShenavarhaForm: function () {
            var that = this;

            if (that.ShenavarhaReportFormInstance != null) {
                var accountReviewFormParent = that.ShenavarhaReportFormInstance.ParentControl;

                if (!accountReviewFormParent.IsDestroying)
                    accountReviewFormParent.Destroy();
            }
        },

        ShowTarazAzmayeshiReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("acc.TarazAzmayeshiForm", "گزارش تراز آزمایشی");
        },

        ShowConfigEditForm: function () {
            var that = this;

            var newConfigEntity = null;
            var formMode = null;
            var configEntity = null;

            configEntity = afw.uiApi.FetchEntity("acc.Config");

            if (configEntity != null)
                formMode = "Edit";
            else {
                formMode = "New";
                configEntity = afw.uiApi.CreateNewEntity("acc.Config");
            }

            var configEditForm = afw.uiApi.OpenSavedFormWindow("acc.ConfigEditForm", {
                Name: "ConfigEditForm",
                FormMode: formMode,
                Modal: true,
                Title: "تنظیمات",
                Entity: configEntity,
            });
        },

        CreateNewAccDocEditForm: function () {
            var that = this;
            try{
                afw.uiApi.ShowProgress(afw.App.AppContainer);
                setTimeout(function () { }, 100);

                var accDocEntity = afw.uiApi.CreateNewEntity("acc.AccDoc");
                if (cmn.OpenWindowExists())
                    afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "New");                
                else
                    afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "New");
                
                afw.uiApi.HideProgress(afw.App.AppContainer);
            }
            catch (ex) {
                afw.uiApi.HideProgress(afw.App.AppContainer);
            }
        },

        ShowCyclicalCostAndBenefitCoding: function () {
            var that = this;

            var newConfigEntity = null;
            var formMode = null;
            var configEntity = null;

            cyclicalCostAndBenefitCoding = afw.uiApi.FetchEntity("acc.CyclicalCostAndBenefitCoding");

            if (configEntity != null)
                formMode = "Edit";
            else {
                formMode = "New";
                configEntity = afw.uiApi.CreateNewEntity("acc.CyclicalCostAndBenefitCoding");
            }

            var cyclicalCostAndBenefitCodingEditForm = afw.uiApi.OpenSavedFormWindow("acc.CyclicalCostAndBenefitCodingEditForm", {
                Name: "CyclicalCostAndBenefitCodingEditForm",
                FormMode: formMode,
                Modal: true,
                Title: "کدینگ سود و زیان ادواری",
                Entity: cyclicalCostAndBenefitCoding,
            });

            cyclicalCostAndBenefitCodingEditForm.Center();
        },

        GetAccConfigValue: function (filedName) {
            var that = this;

            if (that._AccConfigEntity == null) {
                that._AccConfigEntity = afw.uiApi.CallServerMethodSync("acc.GetAccConfig", []);
                if (that._AccConfigEntity == null)
                    throw "تنظیمات حسابداری وجود ندارد";
            }

            return that._AccConfigEntity.GetFieldValue(filedName);
        },

        OpenAccDocManagmentDashboardForm: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.AccDocManagmentDashboardForm", "داشبورد مدیریت اسناد");
        },

        ShowAccDocItemForm: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.AccDocSearchFrom", "جستجو در اسناد حسابداری");
        },

        WebServiceSync: function () {
            var that = this;
            try {
                var createdAccDocsList = afw.uiApi.CallServerMethodSync("cmn.NextStepPurchaseRequestInfo");
                if (createdAccDocsList.length > 0) {
                    var message = "اسناد از شماره سند " + createdAccDocsList[0] + " تا  "
                        + createdAccDocsList[createdAccDocsList.length - 1] + " با موفقیت ثبت شدند.";
                    afw.MessageDialog.Show(message);
                }
                else
                    afw.ErrorDialog.Show("هیچ اطلاعاتی برای ثبت وجود ندارد.");
            }
            catch (e) {
                afw.ErrorDialog.Show("وجود خطا در ثبت اسناد از طریق وب سرویس." + "\n\r" + e.message);
            }
        },

        OpenFinalizeMainDocsForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "قطعی نمودن اسناد اصلی", { Mode: "GhateiNemodaneAsnadeAsli" });
        },

        OpenFinalizeDraftDocsForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "قطعی نمودن اسناد پیش نویس", { Mode: "GhateiNemodaneAsnadePishnevis" });
        },

        OpenMakeMainDocsTemporaryForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "موقت سازی اسناد اصلی", { Mode: "MovaghatNemodaneAsnadeAsli" });
        },

        OpenMakeDraftDocsTemporaryForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "موقت سازی اسناد پیش نویس", { Mode: "MovaghatNemodaneAsnadePishnevis" });
        },

        OpenAccDocsTransferForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("acc.AccDocs", "انتقال اسناد حسابداری", { Mode: "AccDocsTransfer" });
        },

        GetGhabzOrHavaleOfOneAccDoc: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("acc.GhabzOrHavaleOfOneAccDocForm", "اسناد انبار ضمیمه سند حسابداری");
        },

        GetAccountRelatedFloatsFilterExpression: function (accountID, floatName) {
            var that = this;

            var floatQuery = null;

            if (floatName == "Person") {
                floatQuery =
                    "exists (" +
                        "select 1 " +
                        "from acc_[FloatName]GroupAccounts FloatGroupAccount " +
                        "   inner join cmn_[FloatName]GroupRelations FloatGroupRelation on FloatGroupRelation.[FloatName]Group = FloatGroupAccount.[FloatName]Group " +
                        "       and FloatGroupRelation.[FloatName] = InnerQuery.ID " +
                        "where FloatGroupAccount.Account = '[AccountID]')";
            }
            else
                floatQuery =
                    "exists (" +
                        "select 1 " +
                        "from acc_[FloatName]GroupAccounts " +
                        "where Account = '[AccountID]' and [FloatName]Group = InnerQuery.[FloatName]Group)";

            floatQuery = floatQuery.Replace("[AccountID]", accountID);
            floatQuery = floatQuery.Replace("[FloatName]", floatName);

            return floatQuery;
        },

        AccountHasFloat: function (accountID, floatName) {
            var that = this;

            if (ValueIsEmpty(accountID))
                throw "invalid accountID";

            var filterExpression = "";

            var floatQueryTemplate = String.Format("exists (" +
                "select 1 " +
                "from cmn_[FloatName]Groups FloatGroup " +
                "    inner join acc_[FloatName]GroupAccounts FloatGroupAccount on FloatGroupAccount.[FloatName]Group = FloatGroup.ID " +
                "where FloatGroupAccount.Account = '{0}')", accountID);

            if (ValueIsEmpty(floatName)) {
                filterExpression = "("
                    + floatQueryTemplate.Replace("[FloatName]", "Person")
                    + "or " + floatQueryTemplate.Replace("[FloatName]", "CostCenter")
                    + "or " + floatQueryTemplate.Replace("[FloatName]", "Project")
                    + "or " + floatQueryTemplate.Replace("[FloatName]", "ForeignCurrency")
                + ")";
            }
            else
                filterExpression = floatQueryTemplate.Replace("[FloatName]", floatName);

            var hasFloat = afw.uiApi.EntityExists("acc.Account", String.Format("ID = '{0}' and {1}", accountID, filterExpression));

            return hasFloat;
        },

        GetAccountFloatNames: function (accountID) {
            var that = this;

            var floatAccounts = [];

            if (acc.AccountHasFloat(accountID, "Person"))
                floatAccounts.push("Person");

            if (acc.AccountHasFloat(accountID, "CostCenter"))
                floatAccounts.push("CostCenter");

            if (acc.AccountHasFloat(accountID, "Project"))
                floatAccounts.push("Project");

            if (acc.AccountHasFloat(accountID, "ForeignCurrency"))
                floatAccounts.push("ForeignCurrency");

            return floatAccounts;
        },

        GetAccountAllParentsFullCode: function (accountID) {
            var that = this;

            var accountFullCode, kolFullCode, moinFullCode, tafsiliFullCode, groupCode, accountCodeText;
            var level = 0;

            if (!ValueIsEmpty(accountID)) {
                accountFullCode = afw.DataListHelper.FetchEntityListOfDataList("acc.AccountsHierarchy", null, null,
                    String.Format("ID = '{0}'", accountID), "FullCodeWithGroupCode desc", 1, 1)
                    .Entities[0].GetFieldValue("FullCodeWithGroupCode");
                level = accountFullCode.split("-").length;
            }

            if (!ValueIsEmpty(accountFullCode)) {
                if (level > 0) {
                    groupCode = accountFullCode.substr(0, cmn.GetIndexOfChar(accountFullCode, '-', 0) - 1);

                    if (level > 1) {
                        kolFullCode = accountFullCode.substr(0, cmn.GetIndexOfChar(accountFullCode, '-', 1) - 1);

                        if (level > 2) {
                            moinFullCode = accountFullCode.substr(0, cmn.GetIndexOfChar(accountFullCode, '-', 2) - 1);

                            if (level > 3)
                                tafsiliFullCode = accountFullCode;
                            else
                                moinFullCode = accountFullCode;
                        }
                        else
                            kolFullCode = accountFullCode;
                    }
                }
            }

            return {
                GroupCode: groupCode,
                KolFullCode: kolFullCode,
                MoinFullCode: moinFullCode,
                TafsiliFullCode: tafsiliFullCode
            };
        }
    }
})();