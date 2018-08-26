(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccountForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._TreeView = that.FindControl("TreeView");

            that._NewButton = that.FindControl("NewButton");
            that._EditButton = that.FindControl("EditButton");
            that._DeleteButton = that.FindControl("DeleteButton");
            that._ReloadButton = that.FindControl("ReloadButton");
            that._PrintButton = that.FindControl("PrintButton");
            that._AccountFloatGroupsButton = that.FindControl("AccountFloatGroupsButton");

            that._TreeView.bind("SelectedNodeChanged", function (e) { that._TreeView_SelectedNodeChanged(e); });

            that._NewButton.bind("Click", function (e) { that._NewButton_Click(e); });
            that._EditButton.bind("Click", function (e) { that._EditButton_Click(e); });
            that._DeleteButton.bind("Click", function (e) { that._DeleteButton_Click(e); });
            that._ReloadButton.bind("Click", function (e) { that._ReloadButton_Click(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._AccountFloatGroupsButton.bind("Click", function (e) { that._AccountFloatGroupsButton_Click(e); });
            that._AccountFloatGroupsButton.SetEnabled(false);

            that._KolLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Kol");
            that._MoinLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Moin");
            that._TafsiliLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Tafsili");

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            that._FinancialYear = cmn.GetUserActiveFinancialYearEntity();

            that._CreateNodes();
        },

        _CreateNodes: function () {
            var that = this;

            that._AccountGroupEntityList = afw.uiApi.FetchEntityList("acc.AccountGroup", null, "GroupCode");
            that._AccountEntityList = afw.uiApi.CallServerMethodSync("acc.GetAccountsBef", [that._FinancialYearID]);

            for (var g = 0; g < that._AccountGroupEntityList.Entities.length; g++) {
                var groupID = that._AccountGroupEntityList.Entities[g].GetFieldValue("ID");
                var groupTitle = that._AccountGroupEntityList.Entities[g].GetFieldValue("Title");

                that._TreeView.AppendNode({ id: groupID, text: groupTitle });

                var kol_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                    return o.GetFieldValue("AccountLevel_Name") === "Kol" && o.GetFieldValue("GroupID") === groupID;
                });

                for (var i = 0; i < kol_Accounts.length; i++) {
                    var kolID = kol_Accounts[i].GetFieldValue("ID");
                    var kolCodeAndName = "                            " +
                        kol_Accounts[i].GetFieldValue("CodeAndName");

                    that._TreeView.AppendNode({ id: kolID, text: kolCodeAndName }, groupID);

                    var moin_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                        return o.GetFieldValue("AccountLevel_Name") === "Moin" && o.GetFieldValue("KolID") === kolID;
                    });

                    for (var j = 0; j < moin_Accounts.length; j++) {
                        var moinID = moin_Accounts[j].GetFieldValue("ID");
                        var moinCodeAndName = "                                                        " +
                            moin_Accounts[j].GetFieldValue("CodeAndName");

                        that._TreeView.AppendNode({ id: moinID, text: moinCodeAndName }, kolID);

                        var tafsil_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                            return o.GetFieldValue("AccountLevel_Name") === "Tafsili" && o.GetFieldValue("MoinID") === moinID;
                        });

                        for (var k = 0; k < tafsil_Accounts.length; k++) {
                            var tafsiliID = tafsil_Accounts[k].GetFieldValue("ID");
                            var tafsiliCodeAndName = "                                                                                    " +
                                tafsil_Accounts[k].GetFieldValue("CodeAndName");

                            that._TreeView.AppendNode({ id: tafsiliID, text: tafsiliCodeAndName }, moinID);
                            that._TreeView.CollapseNode(tafsiliID);
                        }

                        that._TreeView.CollapseNode(moinID);
                    }

                    that._TreeView.CollapseNode(kolID);
                }

                that._TreeView.CollapseNode(groupID);
            }
        },

        _DestoryNodes: function () {
            var that = this;

            that._AccountGroupEntityList = afw.uiApi.FetchEntityList("acc.AccountGroup", null, "cast(GroupCode as int)");
            for (var i = 0; i < that._AccountGroupEntityList.Entities.length; i++) {
                that._TreeView.RemoveNodeById(that._AccountGroupEntityList.Entities[i].GetFieldValue("ID"));
            }
        },

        _Reload: function (e) {
            var that = this;

            that._DestoryNodes();
            that._CreateNodes();

            that._AccountFloatGroupsButton.SetEnabled(false);
        },

        _TreeView_SelectedNodeChanged: function (e) {
            var that = this;

            var selectedAccountGroup = $.grep(that._AccountGroupEntityList.Entities, function (o) {
                return o.GetFieldValue("ID") === e.SelectedNodeDataItem.id;
            });

            if (selectedAccountGroup.length != 0)
                that._AccountFloatGroupsButton.SetEnabled(false);
            else {
                var accountID = afw.uiApi.CallServerMethodSync("acc.GetFirstLeafOfAccountTree",
                            [e.SelectedNodeDataItem.id]);

                if (accountID != e.SelectedNodeDataItem.id)
                    that._AccountFloatGroupsButton.SetEnabled(false);
                else
                    that._AccountFloatGroupsButton.SetEnabled(true);
            }
        },

        _NewButton_Click: function (e) {
            var that = this;

            var selectedNodeDataItem = that._TreeView.GetSelectedNodeDataItem();
            if (selectedNodeDataItem == null) {
                afw.MessageDialog.Show("ابتدا یک مورد را انتخاب نمایید.");
                return;
            }

            if (that._FinancialYearID == null) {
                afw.MessageDialog.Show("سال مالی انتخاب نشده است.");
                return;
            }

            var level_Text = "";
            var accountEntity = afw.uiApi.CreateNewEntity("acc.Account");
            accountEntity.SetFieldValue("FinancialYear", that._FinancialYearID);

            var selectedAccountGroup = $.grep(that._AccountGroupEntityList.Entities, function (o) {
                return o.GetFieldValue("ID") === selectedNodeDataItem.id;
            });

            if (selectedAccountGroup.length != 0) {
                accountEntity.SetFieldValue("AccountGroup", selectedNodeDataItem.id);
                accountEntity.SetFieldValue("AccountLevel", that._KolLevelID);
                level_Text = "حساب کل";
            }
            else {
                accountEntity.SetFieldValue("ParentAccount", selectedNodeDataItem.id);

                var selectedAccount = $.grep(that._AccountEntityList.Entities, function (o) {
                    return o.GetFieldValue("ID") === selectedNodeDataItem.id;
                });

                if (selectedAccount[0].GetFieldValue("AccountLevel_Name") == "Kol") {
                    accountEntity.SetFieldValue("AccountLevel", that._MoinLevelID);
                    level_Text = "حساب معین";
                }
                else if (selectedAccount[0].GetFieldValue("AccountLevel_Name") == "Moin") {
                    accountEntity.SetFieldValue("AccountLevel", that._TafsiliLevelID);
                    level_Text = "حساب تفصیلی";
                }
                else {
                    afw.MessageDialog.Show("در این سطح از کدینگ حساب نمیتوان حساب دیگری تعریف کرد .");
                    return;
                }
            }

            if (that._AccountHasDoc(selectedNodeDataItem.id)) {
                var confirmDialog = afw.ConfirmDialog.Show("برای این حساب سند حسابداری صادر شده است.\r\n آیا مایلید که سند های قدیمی را به حساب جدید منتقل کنید؟");
                confirmDialog.bind("Close", function () {
                    if (confirmDialog.GetDialogResult() == "Yes")
                        that._OpenAccountEditForm(accountEntity, level_Text, selectedNodeDataItem.text, "New");
                });
            }
            else
                that._OpenAccountEditForm(accountEntity, level_Text, selectedNodeDataItem.text, "New");
        },

        _OpenAccountEditForm: function (accountEntity, level_Text, selectedNodeDataItemText, formMode) {
            var that = this;

            var accountWindow = afw.uiApi.OpenSavedFormWindow("acc.AccountEditForm", {
                Name: "AccountEditFormWindow",
                Modal: true,
                FormMode: formMode,
                Entity: accountEntity,
                Level_Text: level_Text,
                Parent_Text: selectedNodeDataItemText.trim()
            });

            accountWindow.Center();
            accountWindow.bind("Close", function (e) {
                if (e.Sender._DialogResult == "Ok") {
                    that._Reload();
                }
            });
        },

        _AccountHasDoc: function (accountID) {
            var that = this;

            if (afw.uiApi.EntityExists("acc.accDocItem", String.Format("Account = '{0}'", accountID)))
                return true;
            else
                return false;
        },

        _EditButton_Click: function (e) {
            var that = this;

            var selectedNodeDataItem = that._TreeView.GetSelectedNodeDataItem();
            if (selectedNodeDataItem == null) {
                afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
                return;
            }

            var selectedAccountGroup = $.grep(that._AccountGroupEntityList.Entities, function (o) {
                return o.GetFieldValue("ID") === selectedNodeDataItem.id;
            });

            if (selectedAccountGroup.length != 0) {
                afw.MessageDialog.Show("این سطح از کدینگ حساب را نمیتوان ویرایش کرد .");
                return;
            }

            var selectedAccount = $.grep(that._AccountEntityList.Entities, function (o) {
                return o.GetFieldValue("ID") === selectedNodeDataItem.id;
            });

            var level_Text = "";
            if (selectedAccount[0].GetFieldValue("AccountLevel_Name") == "Kol")
                level_Text = "حساب کل";
            else if (selectedAccount[0].GetFieldValue("AccountLevel_Name") == "Moin")
                level_Text = "حساب معین";
            else
                level_Text = "حساب تفصیلی";

            var accountEntity = afw.uiApi.FetchEntity("acc.Account", String.Format("ID = '{0}'", selectedNodeDataItem.id));
            that._OpenAccountEditForm(accountEntity, level_Text, selectedNodeDataItem.text, "Edit");
        },

        _DeleteButton_Click: function (e) {
            var that = this;

            var selectedNodeDataItem = that._TreeView.GetSelectedNodeDataItem();
            if (selectedNodeDataItem == null) {
                afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
                return;
            }

            var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف موافقید؟");
            confirmDialog.bind("Close", function () {
                if (confirmDialog.GetDialogResult() == "Yes") {
                    var selectedAccountGroup = $.grep(that._AccountGroupEntityList.Entities, function (o) {
                        return o.GetFieldValue("ID") === selectedNodeDataItem.id;
                    });

                    if (selectedAccountGroup.length != 0) {
                        afw.MessageDialog.Show("این سطح از کدینگ حساب را نمیتوان حذف کرد .");
                        return;
                    }

                    var accDocItemEntityList = afw.uiApi.FetchEntityList("acc.AccDocItem", String.Format("Account = '{0}'", selectedNodeDataItem.id));
                    if (accDocItemEntityList.Entities.length > 0) {
                        afw.MessageDialog.Show("به علت استفاده این کدینگ حساب در اسناد ، امکان حذف وجود ندارد.");
                        return;
                    }

                    var childAccountEntityList = afw.uiApi.FetchEntityList("acc.Account", String.Format("ParentAccount = '{0}'", selectedNodeDataItem.id));
                    if (childAccountEntityList.Entities.length > 0) {
                        afw.MessageDialog.Show("این کدینگ حساب دارای زیر مجموعه بوده ، ابتدا زیرمجموعه های آن را حذف کنید.");
                        return;
                    }

                    var personGroupEntity = afw.uiApi.FetchEntityList("acc.PersonGroupAccount", String.Format("Account = '{0}'", selectedNodeDataItem.id));
                    for (var i = 0; i < personGroupEntity.Entities.length; i++)
                        afw.uiApi.DeleteEntity(personGroupEntity.Entities[i]);

                    var costCenterGroupEntity = afw.uiApi.FetchEntityList("acc.CostCenterGroupAccount", String.Format("Account = '{0}'", selectedNodeDataItem.id));
                    for (var i = 0; i < costCenterGroupEntity.Entities.length; i++)
                        afw.uiApi.DeleteEntity(costCenterGroupEntity.Entities[i]);

                    var projectGroupEntity = afw.uiApi.FetchEntityList("acc.ProjectGroupAccount", String.Format("Account = '{0}'", selectedNodeDataItem.id));
                    for (var i = 0; i < projectGroupEntity.Entities.length; i++)
                        afw.uiApi.DeleteEntity(projectGroupEntity.Entities[i]);

                    var floatPriority = afw.uiApi.FetchEntity("cmn.FloatPriority", String.Format("Account = '{0}'", selectedNodeDataItem.id));
                    if (floatPriority != null)
                        afw.uiApi.DeleteEntity(floatPriority);

                    var accountEntity = afw.uiApi.FetchEntity("acc.Account", String.Format("ID = '{0}'", selectedNodeDataItem.id));
                    afw.uiApi.DeleteEntity(accountEntity);
                    that._Reload();
                }
            });
        },

        _ReloadButton_Click: function (e) {
            var that = this;

            that._Reload();
        },

        _PrintButton_Click: function (e) {
            var that = this;

            afw.uiApi.OpenSavedFormWindow("acc.AccountCodeTreePrintForm", {
                Name: "AccountCodeTreePrintForm",
                Modal: true,
                Title: "چاپ درخت کدینگ"
            }).Center();
        },

        _AccountFloatGroupsButton_Click: function (e) {
            var that = this;

            var selectedNodeDataItem = that._TreeView.GetSelectedNodeDataItem();
            if (selectedNodeDataItem == null) {
                afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
                return;
            }

            var accountFloatGroupsWindow = afw.uiApi.OpenSavedFormWindow("acc.AccountFloatGroupsForm", {
                AccountID: selectedNodeDataItem.id,
                Modal: true,
                Title: "گروه های شناور حساب : " + selectedNodeDataItem.text.trim()
            });

            accountFloatGroupsWindow.Center();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountForm";
    FormClass.BaseType = afw.BasePanel;

    acc.AccountForm = FormClass;
})();