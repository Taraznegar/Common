﻿(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return acc.ForeignCurrencyGroupEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._AccountDockPanel = that.FindControl("AccountDockPanel");
            that._TreeView = that.FindControl("TreeView");
            that._GridPanel = that.FindControl("GridPanel");

            that._TitleFieldControl = that.FindControl("TitleFieldControl");

            that._AddButton = that.FindControl("AddButton");
            that._DelButton = that.FindControl("DelButton");

            that._TreeView.bind("SelectedNodeChanged", function (e) { that._TreeView_SelectedNodeChanged(e); });
            that._AddButton.bind("Click", function (e) { that._AddButton_Click(e); });
            that._DelButton.bind("Click", function (e) { that._DelButton_Click(e); });

            that._NodeItemID = null;

            that._ForeignCurrencyGroupID = that._BindableEntity.get("ID");
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._KolLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Kol");
            that._MoinLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Moin");
            that._TafsiliLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Tafsili");

            that._CreateNodes();

            that._ForeignCurrencyGroupAccountsGridView = new afw.GridView({
                ParentControl: that._GridPanel,
                Name: that.GetName() + "_EntitiesGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "ID",
                        field: "ID",
                        rightToLeft: true,
                        width: 1,
                    },
                    {
                        title: "کد حساب",
                        field: "Code",
                        rightToLeft: true,
                        width: 100,
                        valuesDisplayMethod: "number"
                    },
                    {
                        title: "نام حساب",
                        field: "Name",
                        rightToLeft: true,
                        width: 250
                    },
                    {
                        title: "ForeignCurrencyGroup",
                        field: "ForeignCurrencyGroup",
                        rightToLeft: true,
                        width: 1
                    },
                    {
                        title: "Account",
                        field: "Account",
                        rightToLeft: true,
                        width: 1
                    }
                ],

                SelectionMode: "SingleRow"
            });

            that._ForeignCurrencyGroupAccounts = afw.uiApi.CallServerMethodSync("cmn.GetForeignCurrencyGroupAccounts", [that._ForeignCurrencyGroupID, that._FinancialYearID]);

            that._SortItems();
            that._FillGrid();
        },

        _CreateNodes: function () {
            var that = this;

            that._AccountEntityList = afw.uiApi.CallServerMethodSync("acc.GetAccountsBef", [that._FinancialYearID]);
            var kol_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                return o.GetFieldValue("AccountLevel_Name") === "Kol";
            });

            for (var i = 0; i < kol_Accounts.length; i++) {
                var kolID = kol_Accounts[i].GetFieldValue("ID");
                var kolCodeAndName = kol_Accounts[i].GetFieldValue("CodeAndName");

                that._TreeView.AppendNode({ id: kolID, text: kolCodeAndName });
                var foundKolNodeItem = that._TreeView.FindNodeDataItemById(kolID);

                var moin_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                    return o.GetFieldValue("AccountLevel_Name") === "Moin" && o.GetFieldValue("KolID") === kolID;
                });

                for (var j = 0; j < moin_Accounts.length; j++) {
                    var moinID = moin_Accounts[j].GetFieldValue("ID");
                    var moinCodeAndName = moin_Accounts[j].GetFieldValue("CodeAndName");

                    that._TreeView.AppendNode({ id: moinID, text: moinCodeAndName }, kolID);
                    var foundMoinNodeItem = that._TreeView.FindNodeDataItemById(moinID);

                    var tafsil_Accounts = $.grep(that._AccountEntityList.Entities, function (o) {
                        return o.GetFieldValue("AccountLevel_Name") === "Tafsili" && o.GetFieldValue("MoinID") === moinID;
                    });

                    for (var k = 0; k < tafsil_Accounts.length; k++) {
                        var tafsiliID = tafsil_Accounts[k].GetFieldValue("ID");
                        var tafsiliCodeAndName = tafsil_Accounts[k].GetFieldValue("CodeAndName");

                        that._TreeView.AppendNode({ id: tafsiliID, text: tafsiliCodeAndName }, moinID);
                        that._TreeView.CollapseNode(tafsiliID);
                    }

                    that._TreeView.CollapseNode(moinID);
                }

                that._TreeView.CollapseNode(kolID);
            }
        },

        _TreeView_SelectedNodeChanged: function (e) {
            var that = this;

            that._NodeItemID = e.SelectedNodeDataItem.id;
        },

        _AddButton_Click: function (e) {
            var that = this;

            if (that._TitleFieldControl.GetValue() != null) {
                if (!ValueIsEmpty(that._TitleFieldControl.GetValue().trim())) {
                    that._Save();

                    if (that._NodeItemID != null && that._ForeignCurrencyGroupID != null)
                        afw.uiApi.CallServerMethodSync("cmn.SeveForeignCurrencyGroupAccounts", [that._NodeItemID, that._ForeignCurrencyGroupID, that._FinancialYearID]);

                    that._Refresh();
                }
                else
                    afw.MessageDialog.Show("کاراکتر فاصله نمیتواند بعنوان نام گروه قرار بگیرد.");
            }
            else
                afw.MessageDialog.Show("فیلد عنوان وارد نشده است.");
        },

        _DelButton_Click: function (e) {
            var that = this;

            var selectedEntities = that._ForeignCurrencyGroupAccountsGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {
                var accountItemID = selectedEntities[0].DataItem["Account"];
                if (accountItemID != null && that._ForeignCurrencyGroupID != null)
                    afw.uiApi.CallServerMethodSync("cmn.DeleteForeignCurrencyGroupAccount", [accountItemID, that._ForeignCurrencyGroupID]);

                that._Refresh();
            }
        },

        _SortItems: function () {
            var that = this;

            that._ForeignCurrencyGroupAccounts.Entities = that._ForeignCurrencyGroupAccounts.Entities.sort(
                function (item1, item2) {
                    if (item1.GetFieldValue("Code") < item2.GetFieldValue("Code"))
                        return -1;
                    else if (item1.GetFieldValue("Code") > item2.GetFieldValue("Code"))
                        return 1;
                    else
                        return 0;
                });
        },

        _FillGrid: function () {
            var that = this;

            that._ForeignCurrencyGroupAccountsGridView.GetDataSource().data(that._ForeignCurrencyGroupAccounts.ToDataSourceData());

            //that._ForeignCurrencyGroupAccountsGridView.GetDataSource().data(
            //    $.grep(that._ForeignCurrencyGroupAccounts.ToDataSourceData(),
            //        function (o) { return o._Entity.GetFieldValue("ID") == that._MaleLockerComboBox.GetValue(); })
            //    );
            //that._ForeignCurrencyGroupAccountsGridView.SelectRowByIndex(that._ForeignCurrencyGroupAccounts.Entities.length - 1); 
        },

        _Refresh: function () {
            var that = this;

            that._ForeignCurrencyGroupAccounts = afw.uiApi.CallServerMethodSync("cmn.GetForeignCurrencyGroupAccounts", [that._ForeignCurrencyGroupID, that._FinancialYearID]);

            that._SortItems();
            that._FillGrid();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }

    });

    //Static Members:

    FormClass.TypeName = "acc.ForeignCurrencyGroupEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    acc.ForeignCurrencyGroupEditForm = FormClass;
})();