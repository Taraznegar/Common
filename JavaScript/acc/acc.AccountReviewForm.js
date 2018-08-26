(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccountReviewForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._AccountsReviewGridView = null;
            that._ShenavarhaGridView = null;
            that._DafaterForm = null;
            that._ShenavarType = null;
            that._AccountReviewType = null;
            that._AccountReview = null;
            that._LevelNumber = 0;
            that._ShenavarName = '';
            that._AccountaReviewName = '';
            that._ShenavarGroupID = null;
            that._AccountReviewDataListControl = null;

            that._AccountReviewPanel = that.FindControl("AccountReviewPanel");
            that._ShenavarhaPanel = that.FindControl("ShenavarhaPanel");

            that._FilterOnIssueDateReferenceDocCheckBox = that.FindControl("FilterOnIssueDateReferenceDocCheckBox");
            that._FilterOnDocReferenceNoCheckBox = that.FindControl("FilterOnDocReferenceNoCheckBox");
            that._FilterOnIssueDateReferenceDocCheckBox.SetValue(true);

            that._AccountNatureComboBox = that.FindControl("AccountNatureComboBox");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._OrganizationUnitComboBox = that.FindControl("OrganizationUnitComboBox");
            that._FinancialYearLookup = that.FindControl("FinancialYearLookup");
            that._ShenavarhaReviewRemainedStatusComboBox = that.FindControl("ShenavarhaReviewRemainedStatusComboBox");
            that._AccountReviewRemainedStatusComboBox = that.FindControl("AccountReviewRemainedStatusComboBox");
            that._KolButton = that.FindControl("KolButton");
            that._MoinButton = that.FindControl("MoinButton");
            that._TafsiliButton = that.FindControl("TafsiliButton");
            that._PersonsVerticalButton = that.FindControl("PersonsVerticalButton");
            that._PersonGroupLookupControl = that.FindControl("PersonGroupLookupControl");
            that._CostCentersVerticalButton = that.FindControl("CostCentersVerticalButton");
            that._CostCenterGroupLookupControl = that.FindControl("CostCenterGroupLookupControl");
            that._ProjectsVerticalButton = that.FindControl("ProjectsVerticalButton");
            that._ProjectGroupLookupControl = that.FindControl("ProjectGroupLookupControl");
            that._ProjectButton = that.FindControl("ProjectButton");
            that._CostCenterButton = that.FindControl("CostCenterButton");
            that._PersonButton = that.FindControl("PersonButton");
            that._GroupAccountButton = that.FindControl("GroupAccountButton");
            that._DaftarButton = that.FindControl("DaftarButton");
            that._ConnectedAccountsButton = that.FindControl("ConnectedAccountsButton");
            that._AccountReviewDockPanel = that.FindControl("AccountReviewDockPanel");
            that._ReloadFormButton = that.FindControl("ReloadFormButton");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");
            that._SplitterPanel = that.FindControl("SplitterPanel");
            that._OrganizationUnitVerticalButton = that.FindControl("OrganizationUnitVerticalButton");
            that._OrganizationUnitButton = that.FindControl("OrganizationUnitButton");

            that._HideShowFilterControlDockPanel = that.FindControl("HideShowFilterControlDockPanel");
            that._HideShowFilterControlDockPanel.SetMouseCursor("pointer");

            that._SplitterPanel.SetPaneSize(1, 400);
            that._AccountReviewDockPanel.SetPaneSizeSetting(0, 5);

            that._WithoutOpeningCheckBox = that.FindControl("WithoutOpeningCheckBox");
            that._WithoutCostAndBenefitCheckBox = that.FindControl("WithoutCostAndBenefitCheckBox");
            that._WithoutClosingCheckBox = that.FindControl("WithoutClosingCheckBox");
            that._AllCheckBox = that.FindControl("AllCheckBox");

            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");

            that._FromDocReferenceNoTextBox = that.FindControl("FromDocReferenceNoTextBox");
            that._ToDocReferenceNoTextBox = that.FindControl("ToDocReferenceNoTextBox");

            that._Level1Link = that.FindControl("Level1Link");
            that._Level2Link = that.FindControl("Level2Link");
            that._Level3Label = that.FindControl("Level3Label");
            that._Level4Label = that.FindControl("Level4Label");

            that._Level1Link.SetVisible(false);
            that._Level2Link.SetVisible(false);
            that._Level3Label.SetText('');
            that._Level4Label.SetText('');

            that._Level1Link.BindEvent("Click", function (e) { that._Level1Link_Click(e); });
            that._Level2Link.BindEvent("Click", function (e) { that._Level2Link_Click(e); });
            //that._Level3Label.BindEvent("Click", function (e) { that._Level3Label_Click(e); });
            //that._Level4Label.BindEvent("Click", function (e) { that._Level4Label_Click(e); });

            that._SumDebtorLabel = that.FindControl("SumDebtorLabel");
            that._SumCreditorLabel = that.FindControl("SumCreditorLabel");
            that._RemainedLabel = that.FindControl("RemainedLabel");

            that._PrintButton = that.FindControl("PrintButton");
            that._ShenavarPrintButton = that.FindControl("ShenavarPrintButton");
            that._PrintButton.SetEnabled(false);
            that._ShenavarPrintButton.SetEnabled(false);

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
            
            that._FinancialYearLookup.SetValue(that._FinancialYearEntity.GetFieldValue("ID"));

            that._FilterOnIssueDateReferenceDocCheckBox.SetValue(true);
            that._FilterOnIssueDateReferenceDocCheckBox.bind("CheckedChanged", function (e) { that._FilterOnIssueDateReferenceDocCheckBox_CheckedChanged(e); });
            that._FilterOnDocReferenceNoCheckBox.bind("CheckedChanged", function (e) { that._FilterOnDocReferenceNoCheckBox_CheckedChanged(e); });

            that._AllCheckBox.SetValue(true);
            that._WithoutOpeningCheckBox.bind("CheckedChanged", function (e) { that._WithoutOpeningCheckBox_CheckedChanged(e); });
            that._WithoutCostAndBenefitCheckBox.bind("CheckedChanged", function (e) { that._WithoutCostAndBenefitCheckBox_CheckedChanged(e); });
            that._WithoutClosingCheckBox.bind("CheckedChanged", function (e) { that._WithoutClosingCheckBox_CheckedChanged(e); });
            that._AllCheckBox.bind("CheckedChanged", function (e) { that._AllCheckBox_CheckedChanged(e); });

            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._ConnectedAccountsButton.bind("Click", function (e) { that._ConnectedAccountsButton_Click(e); });
            that._KolButton.bind("Click", function (e) { that._KolButton_Click(e); });
            that._MoinButton.bind("Click", function (e) { that._MoinButton_Click(e); });
            that._TafsiliButton.bind("Click", function (e) { that._TafsiliButton_Click(e); });
            that._PersonsVerticalButton.bind("Click", function (e) { that._PersonsVerticalButton_Click(e); });
            that._PersonGroupLookupControl.bind("ValueChanged", function (e) { that._PersonGroupLookupControl_ValueChanged(e); });
            that._CostCenterGroupLookupControl.bind("ValueChanged", function (e) { that._CostCenterGroupLookupControl_ValueChanged(e); });
            that._ProjectGroupLookupControl.bind("ValueChanged", function (e) { that._ProjectGroupLookupControl_ValueChanged(e); });
            that._CostCentersVerticalButton.bind("Click", function (e) { that._CostCentersVerticalButton_Click(e); });
            that._ProjectsVerticalButton.bind("Click", function (e) { that._ProjectsVerticalButton_Click(e); });
            that._OrganizationUnitVerticalButton.bind("Click", function (e) { that._OrganizationUnitVerticalButton_Click(e); });
            that._ProjectButton.bind("Click", function (e) { that._ProjectButton_Click(e); });
            that._CostCenterButton.bind("Click", function (e) { that._CostCenterButton_Click(e); });
            that._PersonButton.bind("Click", function (e) { that._PersonButton_Click(e); });
            that._OrganizationUnitButton.bind("Click", function (e) { that._OrganizationUnitButton_Click(e); });
            that._GroupAccountButton.bind("Click", function (e) { that._GroupAccountButton_Click(e); });
            that._DaftarButton.bind("Click", function (e) { that._DaftarButton_Click(e); });
            that._ShenavarPrintButton.bind("Click", function (e) { that._ShenavarPrintButton_Click(e); });
            that._ReloadFormButton.bind("Click", function (e) { that._ReloadFormButton_Click(e); });
            that._ApplyFilterButton.bind("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._HideShowFilterControlDockPanel.bind("Click", function (e) { that._HideShowFilterControlDockPanel_Click(e); });
            that._FilterControlVisible = true;

            that._FilterOnIssueDateReferenceDocCheckBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._FilterOnDocReferenceNoCheckBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._AccountNatureComboBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._FinancialDocTypeOptionSetControl.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._OrganizationUnitComboBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._FinancialYearLookup.BindEvent("ValueChanged", function (e) { that._FinancialYearLookup_ValueChanged(e); });

            that._FromDateTimeControl.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._ToDateTimeControl.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._FromDocReferenceNoTextBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });
            that._ToDocReferenceNoTextBox.BindEvent("ValueChanged", function (e) { that._ClearForm(e); });

            that._Kol = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Kol");
            that._Moin = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Moin");
            that._Tafsili = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Tafsili");

            var remainedStatusDataSource = [
                 {
                     Name: "All",
                     Title: "همه"
                 },
                 {
                     Name: "UnZeroRemained",
                     Title: "مانده غیر صفر"
                 },
                 {
                     Name: "RemainingDebtorAmount",
                     Title: "مانده بدهکار"
                 },
                 {
                     Name: "RemainingCreditorAmount",
                     Title: "مانده بستانکار"
                 }
            ];

            that._ShenavarhaReviewRemainedStatusComboBox.SetItemsDataSource(remainedStatusDataSource);
            that._ShenavarhaReviewRemainedStatusComboBox.SetValue("All");

            that._AccountReviewRemainedStatusComboBox.SetItemsDataSource(remainedStatusDataSource);
            that._AccountReviewRemainedStatusComboBox.SetValue("All");

            that._ShenavarhaReviewRemainedStatusComboBox.BindEvent("ValueChanged", function (e) {
                if (that._ShenavarType != null && that._AccountReview != null)
                    that._CreateShenavarhaDataList(that._ShenavarType, null, that._AccountReview);
            });

            that._AccountReviewRemainedStatusComboBox.BindEvent("ValueChanged", function (e) {
                if (!ValueIsEmpty(that._AccountReviewMode))
                    that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, that._AccountReviewID);
            });

            var organizationUnitDataSource = cmn.GetUserOrganizationUnitsDataSourceData();
            that._OrganizationUnitComboBox.SetItemsDataSource(organizationUnitDataSource);

            var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
            if (activeOrgUnitID.length == 1) {
                that._OrganizationUnitComboBox.SetValue(activeOrgUnitID[0]);
            }

            that._SetShenavrahaButtonsEnable(false);

            that._AccountLevelName = 'Kol';

            that._AccountReviewMode = "";
            that._ConnecetedAccounsForm = null;

            var accountNatureItems = [
                { Key: "AllCoding", Title: "همه کدینگ" },
                { Key: "BalanceSheetCoding", Title: "کدینگ ترازنامه" },
                { Key: "CostAndBenefitCoding", Title: "کدینگ سود و زیان" }];
            that._AccountNatureComboBox.SetItemsDataSource(accountNatureItems);
            that._AccountNatureComboBox.SetValue("AllCoding");

            that._InitOpeningForm();
            that._SortItems();

            that._ButtonsDockPanel = that.FindControl("ButtonsDockPanel");
            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false); 
            that._SetProjectGroupLookupControlVisibility(false);  
        },


        _SetPersonGroupLookupControlVisibility: function (visible) {
            var that = this;

            that._ButtonsDockPanel.SetPaneSizeSetting(6, visible? 40: 1);
            that._PersonGroupLookupControl.SetVisible(visible);
        },

        _SetCostCenterGroupLookupControlVisibility: function (visible) {
            var that = this;

            that._ButtonsDockPanel.SetPaneSizeSetting(8, visible? 40: 1);
            that._CostCenterGroupLookupControl.SetVisible(visible);
        },

        _SetProjectGroupLookupControlVisibility: function (visibile) {
            var that = this;

            that._ButtonsDockPanel.SetPaneSizeSetting(10, visibile? 40: 1);
            that._ProjectGroupLookupControl.SetVisible(visibile);
        },

        _InitOpeningForm: function (){
            var that = this;

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "Kol";
            that._AccountReviewID = null;
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();

            that._SetColorAccountReviewButtons("کل");
            that._AccountLevelName = 'Kol';
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
        },

        _ReloadFormButton_Click: function (e) {
            var that = this;

            acc.ShowAccountReviewForm();
        },

        _ApplyFilterButton_Click: function(e){
            var that = this;

            that._AccountReviewDockPanel.SetPaneSizeSetting(0, 5);
            if (ValueIsEmpty(that._AccountReviewMode))
                that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
        },

        _GetAccountReviewFilterDataSource: function (filterTextArray) {
            var that = this;

            var filteredAccountsReview = [];
            var filteredDataSource = null;

            for (var i = 0; i < filterTextArray.length; i++) {
                if (filterTextArray[i] != "") {

                    var itemCount = that._AccountReviewEntityList.Entities.length;

                    for (var index = 0; index < itemCount; index++) {
                        if (that._AccountReviewEntityList.Entities[index].GetFieldValue("AccountReviewName") != null) {
                            var resultFilter = that._AccountReviewEntityList.Entities[index].GetFieldValue("AccountReviewName").includes(filterTextArray[i]);

                            if (resultFilter)
                                filteredAccountsReview.push(that._AccountReviewEntityList.Entities[index].GetFieldValue("RowNumber"));
                        }
                    }

                    if (filteredDataSource == null) {
                        filteredDataSource = $.grep(that._AccountReviewEntityList.ToDataSourceData(),
                            function (o) { return ValueIsIn(o.get("RowNumber"), filteredAccountsReview); });
                    }
                    else {
                        filteredDataSource = $.grep(filteredDataSource,
                            function (o) { return ValueIsIn(o.get("RowNumber"), filteredAccountsReview); });
                    }

                    filteredAccountsReview = [];
                }
            }
            return filteredDataSource;
        },

        _ConnectedAccountsButton_Click: function(e){
            var that = this;

            if (that._AccountReviewType.substring(0, 7) == "Account") {
                afw.ErrorDialog.Show('ابتدا یکی از شناورها را انتخاب نمایید.');
                return;
            }

            if (that._ConnecetedAccounsForm != null) {
                var connecetedAccounsFormParent = that._ConnecetedAccounsForm.ParentControl;
                if (connecetedAccounsFormParent != null) {
                    if (!connecetedAccounsFormParent.IsDestroying)
                        connecetedAccounsFormParent.Destroy();
                }
            }
            
            if (that._AccountReview != null) {
                that._ConnecetedAccounsForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.ConnecetedAccouns", "حسابهای متصل", {
                    Name: 'ConnecetedAccouns',
                    ShenavarType: that._AccountReviewType,
                    ShenavarName: that._AccountaReviewName,
                    ShenavarID: that._AccountReview,
                    FromDate: that._FromDateTimeControl.GetValue(),
                    ToDate: that._ToDateTimeControl.GetValue(),
                    FromDocRefNo: that._FromDocReferenceNoTextBox.GetValue(),
                    ToDocRefNo: that._ToDocReferenceNoTextBox.GetValue(),
                    OrganizationUnit: that._OrganizationUnitComboBox.GetValue(),
                    FinancialDocType: that._FinancialDocTypeOptionSetControl.GetValue()
                });
            }
            else {
                afw.ErrorDialog.Show('ابتدا یک حساب را انتخاب نمایید.');
                return;
            }
        },

        _ShenavarPrintButton_Click: function (e) {
            var that = this;

            that._Print("acc.AccountReviewShenavar", that._AccountReview, that._ShenavarType);
        },

        _DaftarButton_Click: function(e){
            var that = this;

            var levelName = null;

            if (that._AccountsReviewGridView.GetSelectedRows() != null) {
                var selectedEntities = that._AccountsReviewGridView.GetSelectedRows();

                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show('ابتدا یک حساب را انتخاب نمایید.');
                    return;
                }

                if (selectedEntities[0].DataItem.AccountLevel != null) {

                    that.Account = selectedEntities[0].DataItem.AccountReviewItemID;
                    that._Shenavar = null;

                    if (!ValueIsEmpty(that._ShenavarhaGridView)) {
                        selectedEntities = that._ShenavarhaGridView.GetSelectedRows();

                        if (selectedEntities.length > 0) {
                            that._ShenavarName = selectedEntities[0].DataItem.Name;
                            that._Shenavar = selectedEntities[0].DataItem.AccountReviewItemID;
                        }
                    }

                    if (that._DafaterForm != null) {

                        var dafaterFormParent = that._DafaterForm.ParentControl;

                        if (dafaterFormParent != null) {
                            if (!dafaterFormParent.IsDestroying)
                                dafaterFormParent.Destroy();
                        }
                    }

                    that._CreateDafaterForm(that.Account);
                }
                else {
                    afw.ErrorDialog.Show('برای نمایش دفاتر باید یکی از حساب ها را انتخاب نمایید.');
                    return;
                }
            }


            else
                afw.ErrorDialog.Show('ابتدا یکی از حساب ها را انتخاب نمایید.');
        },

        _CreateDafaterForm: function (accountReviewID) {
            var that = this;
            if (that._FilterOnIssueDateReferenceDocCheckBox.GetValue()) {
                that._DafaterForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.DafaterForm", "دفاتر", {
                    Name: 'DafaterForm',
                    AccountsReviewMode: that._AccountReviewMode,
                    Account: accountReviewID,
                    ShenavarType: that._ShenavarType,
                    Shenavar: that._Shenavar,
                    ShenavarName: that._ShenavarName,
                    FromDate: that._FromDateTimeControl.GetValue(),
                    ToDate: that._ToDateTimeControl.GetValue(),
                    OrganizationUnit: that._OrganizationUnitComboBox.GetValue(),
                    FinancialDocType: that._FinancialDocTypeOptionSetControl.GetValue()
                });
            }
            else {
                that._DafaterForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.DafaterForm", "دفاتر", {
                    Name: 'DafaterForm',
                    AccountsReviewMode: that._AccountReviewMode,
                    Account: accountReviewID,
                    ShenavarType: that._ShenavarType,
                    Shenavar: that._Shenavar,
                    ShenavarName: that._ShenavarName,
                    FromDocReferenceNo: that._FromDocReferenceNoTextBox.GetValue(),
                    ToDocReferenceNo: that._ToDocReferenceNoTextBox.GetValue(),
                    OrganizationUnit: that._OrganizationUnitComboBox.GetValue(),
                    FinancialDocType: that._FinancialDocTypeOptionSetControl.GetValue()
                });
            }
        },

        _GroupAccountButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "AccountGroup";
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();

            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);

            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _KolButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "Kol";
            that._AccountReviewID = null;
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();

            that._AccountLevelName = 'Kol';
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);

            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _MoinButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "Moin";
            that._AccountReviewID = null;
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();

            that._AccountLevelName = 'Moin';
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);

            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _TafsiliButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "Tafsili";
            that._AccountReviewID = null;
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();

            that._AccountLevelName = 'Tafsili';
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);

            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _PersonsVerticalButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(true);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "Person";
            that._AccountReviewID = null;
            that._ShenavarGroupID = that._PersonGroupLookupControl.GetValue();

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
        },       

        _PersonGroupLookupControl_ValueChanged: function (e) {
            var that = this;

            that._AccountReviewMode = "Person";
            that._ShenavarGroupID = that._PersonGroupLookupControl.GetValue();

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _CostCentersVerticalButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(true);
            that._SetProjectGroupLookupControlVisibility(false);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, 0);

            that._AccountReviewMode = "CostCenter";
            that._AccountReviewID = null;
            that._ShenavarGroupID = that._CostCenterGroupLookupControl.GetValue();

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _CostCenterGroupLookupControl_ValueChanged: function (e) {
            var that = this;

            that._AccountReviewMode = "CostCenter";
            that._ShenavarGroupID = that._CostCenterGroupLookupControl.GetValue();

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
        },

        _ProjectsVerticalButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(true);

            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, null);
            
            that._AccountReviewMode = "Project";
            that._AccountReviewID = null;
            that._ShenavarGroupID = that._ProjectGroupLookupControl.GetValue();

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
            that._ProjectsVerticalButton.Focus();
        },

        _ProjectGroupLookupControl_ValueChanged: function (e) {
                var that = this;

                that._AccountReviewMode = "Project";
                that._ShenavarGroupID = that._ProjectGroupLookupControl.GetValue();

                that._DestroyAccountReviewShenavarDataList();
                that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
                that._SetColorAccountReviewButtons(e.Sender._Text);
            },

        _OrganizationUnitVerticalButton_Click: function(e){
            var that = this;

            that._SetPersonGroupLookupControlVisibility(false);
            that._SetCostCenterGroupLookupControlVisibility(false);
            that._SetProjectGroupLookupControlVisibility(false);


            that._LevelNumber = 1;
            var levelNumber = 1;
            that._SetLevelLabels(null, null, null);

            that._AccountReviewMode = "OrganizationUnit";
            that._AccountReviewID = null;
            that._ShenavarGroupID = null;

            that._DestroyAccountReviewShenavarDataList();
            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, null);
            that._SetColorAccountReviewButtons(e.Sender._Text);
            that._OrganizationUnitVerticalButton.Focus();
        },

        _PersonButton_Click: function(e){
            var that = this;

            that._CreateShenavarhaDataList('Person', null, that._AccountReview);

            that._ShenavarType = 'Person';
        },

        _CostCenterButton_Click: function(e){
            var that = this;

            that._CreateShenavarhaDataList('CostCenter', null, that._AccountReview);

            that._ShenavarType = 'CostCenter';
        },

        _ProjectButton_Click: function(e){
            var that = this;

            that._CreateShenavarhaDataList('Project', null, that._AccountReview);

            that._ShenavarType = 'Project';
        },

        _OrganizationUnitButton_Click: function(e){
            var that = this;

            that._CreateShenavarhaDataList('OrganizationUnit', null, that._AccountReview);

            that._ShenavarType = 'OrganizationUnit';
        },

        _GetAccountsReviewArray: function(){
            var that = this;

            var accountReviewArray = [];
            var itemCount = that._AccountReviewEntityList.Entities.length;
            for (var i = 0; i < itemCount; i++) {
                if (that._AccountReviewEntityList.Entities[i].GetFieldValue("RowNumber") != null)
                    accountReviewArray.push(that._AccountReviewEntityList.Entities[i].GetFieldValue("RowNumber"));
            }
            return accountReviewArray;
        },

        _CreateAccountsReviewDataListControl: function (accountReviewType, parentAccountGroup, parentAccount) {
            var that = this;

            that._DestroyAccountsReviewDataList();
            
            that._AccountReviewType = 'Shenavar_' + accountReviewType;

            that._CreateAccountReviewAdvanceFilterControl();

            var fromDate = null;
            var toDate = null;
            var fromDocReferenceNo = null;
            var toDocReferenceNo = null;

            if (that._FilterOnDocReferenceNoCheckBox.GetValue()) {
                if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                    afw.ErrorDialog.Show("نوع سند مالی انتخاب نشده است.");
                    return;
                }
            }            

            that._AccountReviewDataListControl = afw.uiApi.CreateDataListControl("acc.AccountReview", {
                Name: 'AccountReview',
                ParentControl: that._AccountReviewPanel,
                FillParent: true,
                FilterControl: that._AccountReviewDataListFilterControl,
                ParameterNames: ["NoeTaraz", "FromDate", "ToDate",
                    "FromDocNo", "ToDocNo", "FinancialYear", "FinancialDocType", "OrganizationUnit",
                    "AccountReviewType", "ParentAccountGroup", "ParentAccount", "ShenavarGroupID", "RemainedStatusFilter"],
                ParameterValues: [that._AccountNatureComboBox.GetValue(), that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(),
                    that._FromDocReferenceNoTextBox.GetValue(), that._ToDocReferenceNoTextBox.GetValue(), that._GetFinancialYearForProcedure(),
                    that._FinancialDocTypeOptionSetControl.GetValue(), that._OrganizationUnitComboBox.GetValue(),
                    accountReviewType, parentAccountGroup, parentAccount, that._ShenavarGroupID, that._AccountReviewRemainedStatusComboBox.GetValue()]
            });

            that._AccountsReviewGridView = that._AccountReviewDataListControl.GetEntitiesGridView();

            that._AccountReviewDataListControl.bind("DataLoaded", function (e) { that._AccountReviewDataListControl_DataLoaded(e); });

            that._AccountsReviewGridView.bind("SelectedRowsChanged", function (e) { that._AccountsReviewGridView_SelectedRowsChanged(e); });
            that._AccountsReviewGridView.bind("RowDoubleClick", function (e) { that._AccountsReviewGridView_RowDoubleClick(e); });
            that._AccountsReviewGridView.bind("RowKeyPressed", function (e) { that._AccountsReviewGridView_RowKeyPressed(e); });

            that._AccountReviewDataListControl.SetVisibleQuickSearch(false);
        },

        _AccountReviewDataListControl_DataLoaded: function(e){
            var that = this;

            var loadedData = that._AccountsReviewGridView.GetDataSource()._data;
            that._CalculateSummaryFields(loadedData);

            if (loadedData.length > 0) {
                that._PrintButton.SetEnabled(true);
                that._AccountsReviewGridView.SelectRowByIndex(0);
            }
            else
                that._PrintButton.SetEnabled(false);
        },

        _CreateShenavarhaDataList: function (accountReviewType, parentAccountGroup, parentAccount) {
            var that = this;

            that._DestroyAccountReviewShenavarDataList();
            that.FindControl("ShenavarhaReviewFilterDockPanel").SetVisible(true);

            that._AccountReviewShenavarDataListControl = afw.uiApi.CreateDataListControl("acc.AccountReviewShenavar", {
                Name: 'AccountReviewShenavar',
                ParentControl: that._ShenavarhaPanel,
                FillParent: true,
                ParameterNames: ["NoeTaraz", "FromDate", "ToDate", "FromDocNo", "ToDocNo", "FinancialYear",
                    "FinancialDocType", "OrganizationUnit", "AccountReviewType", "ParentAccountGroup",
                    "ParentAccount", "ShenavarGroupID", "RemainedStatusFilter"],
                ParameterValues: [that._AccountNatureComboBox.GetValue(), that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(),
                    that._FromDocReferenceNoTextBox.GetValue(), that._ToDocReferenceNoTextBox.GetValue(), that._GetFinancialYearForProcedure(),
                    that._FinancialDocTypeOptionSetControl.GetValue(), that._OrganizationUnitComboBox.GetValue(), accountReviewType,
                    parentAccountGroup, parentAccount, that._ShenavarGroupID, that._ShenavarhaReviewRemainedStatusComboBox.GetValue()]
            });

            that._ShenavarhaGridView = that._AccountReviewShenavarDataListControl.GetEntitiesGridView();

            that._AccountReviewShenavarDataListControl.bind("DataLoaded", function (e) { that._accountReviewShenavarDataListControl_DataLoaded(e); });

            that._ShenavarhaGridView.bind("RowDoubleClick", function (e) { that._ShenavarhaGridView_RowDoubleClick(e); });
            that._ShenavarhaGridView.bind("SelectedRowsChanged", function (e) { that._ShenavarhaGridView_SelectedRowsChanged(e); });

            that._SetShenavrahaButtonsEnable(true);
        },

        _accountReviewShenavarDataListControl_DataLoaded: function (e) {
            var that = this;

            var loadedData = that._ShenavarhaGridView.GetDataSource()._data;
            that._CalculateSummaryFields(loadedData);

            if (loadedData.length > 0) {
                that._ShenavarPrintButton.SetEnabled(true);
                that._ShenavarhaGridView.SelectRowByIndex(0);
            }
            else
                that._ShenavarPrintButton.SetEnabled(false);
        },

        _SetColorAccountReviewButtons: function(buttonText){
            var that = this;

            var buttonsArray = [that._GroupAccountButton, that._KolButton, that._MoinButton, that._TafsiliButton,
                that._PersonsVerticalButton, that._CostCentersVerticalButton, that._ProjectsVerticalButton, that._OrganizationUnitVerticalButton];
            
            for (var i = 0; i < 8; i++) {
                if (buttonsArray[i]._Text == buttonText) 
                    buttonsArray[i].SetBackColor("#cce6ff");
                
                else 
                    buttonsArray[i].SetBackColor("#ffffff");  
            }
        },

        _ShenavarhaGridView_SelectedRowsChanged: function(e){
            var that = this;

            var selectedEntities = that._ShenavarhaGridView.GetSelectedRows();
            if (selectedEntities.length > 0) {
                that._ShenavarName = selectedEntities[0].DataItem.Name;
                that._Shenavar = selectedEntities[0].DataItem.ShenavarID;
            }
        },

        _GetShenavarhaColumns: function(){
            var that = this;
            
            var columns = [];

            var ShenavarName = { title: "شخص", field: "ShenavarName", rightToLeft: true, width: 30 };
          
            var DebtorAmount_Shenavar = { title: "مانده بدهکار", field: "RemainingDebtorAmount_Shenavar", rightToLeft: true, width: 30, valuesDisplayMethod: "Number" };
            var CreditorAmount_Shenavar = { title: "مانده بستانکار", field: "RemainingCreditorAmount_Shenavar", rightToLeft: true, width: 30, valuesDisplayMethod: "Number" };
            
            columns = [ShenavarName, DebtorAmount_Shenavar, CreditorAmount_Shenavar];

            return columns;
        },

        _CreateAccountReviewAdvanceFilterControl: function () {
            var that = this;

            that._DestroyAccountReviewDataListFilterControl();

            that.FindControl("AccountReviewFilterControlDocPanel").SetVisible(true);
            that._AccountReviewDataListFilterControl = null;
            
            var columnsInfo = [
                {
                    FieldName: "Name",
                    Title: "شرح",
                    ControlType: "TextBox",
                    CompareOperator: "like"
                },
                {
                    FieldName: "DebtorAmount",
                    Title: "بدهکار",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "CreditorAmount",
                    Title: "بستانکار",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "RemainingDebtorAmount",
                    Title: "مانده بدهکار",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "RemainingCreditorAmount",
                    Title: "مانده بستانکار",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
            ];

            that._AccountReviewDataListFilterControl = afw.uiApi.CreateSavedFormByName(
                that.FindControl("AccountReviewFilterControlDocPanel").Panes[1],
                "cmn.DataListAdvancedFilterControl",
                {
                    Name: "AccountReviewDataListFilterControl",
                    ColumnsFilterInfo: columnsInfo,
                    InitialFilterColumnsCount: 1,
                    InitialFilterColumnsSizeSetting: "fill"
                });

            that._AccountReviewDataListFilterControl.bind("FilterChanged", function (e) { that._AccountReviewDataListFilterControl_FilterChanged(e); });
        },

        _DestroyAccountReviewDataListFilterControl: function () {
            var that = this;

            var accountReviewDataListFilterControl = that.FindControl("AccountReviewFilterControlDocPanel")
                .Panes[1].FindControl("AccountReviewDataListFilterControl");

            if (accountReviewDataListFilterControl != null)
                accountReviewDataListFilterControl.Destroy();
        },

        _AccountReviewDataListFilterControl_FilterChanged: function () {
            var that = this;

            that._AccountReviewDataListControl.LoadData();
        },

        _AccountsReviewGridView_SelectedRowsChanged: function (e) {
            var that = this;

            var titleLevel = '';
            var selectedEntities = that._AccountsReviewGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                return;
            }
            else {
                that._DestroyAccountReviewShenavarDataList();

                that._AccountReviewType = selectedEntities[0].DataItem["AccountType_Name"];
                that._AccountReview = selectedEntities[0].DataItem["AccountReviewItemID"]
                that._AccountaReviewName = selectedEntities[0].DataItem["Name"];

                var accountEntityCount = afw.uiApi.GetEntityCount("acc.Account", String.Format("ParentAccount = '{0}'", that._AccountReview));

                if (that._AccountLevelName == 'Tafsili')
                    that._SetShenavrahaButtonsEnable(true);

                else {
                    if (accountEntityCount > 0)
                        that._SetShenavrahaButtonsEnable(false);
                    else
                        that._SetShenavrahaButtonsEnable(true);
                }
            }
        },
         
        _AccountsReviewGridView_RowDoubleClick: function (e) {
            var that = this;
            
            that._DestroyAccountReviewShenavarDataList();

            that.NavigateInsideAccount();
        },

        _FinancialYearLookup_ValueChanged:function (e) {
            var that = this;

            that._ClearForm(e);

            if (!ValueIsEmpty(that._FinancialYearLookup.GetValue())) {
                if (that._FinancialYearLookup.GetValue() != that._FinancialYearEntity.GetFieldValue("ID"))
                    that._FinancialYearEntity = cmn.GetFinantialYearEntity(that._FinancialYearLookup.GetValue());
            }
            else
                that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));

        },

        _ClearForm: function (e) {
            var that = this;

            that._DestroyAccountReviewShenavarDataList();
            that._DestroyAccountsReviewDataList();
            that._CalculateSummaryFields(null);

            that._AccountsReviewGridView = null;
            that._ShenavarhaGridView = null;
            that._DafaterForm = null;
            that._ShenavarType = null;
            that._AccountReviewType = null;
            that._AccountReview = null;
            that._LevelNumber = 0;
            that._ShenavarName = '';
            that._AccountaReviewName = '';
            that._AccountReviewDataListControl = null;
            that._AccountLevelName = 'Kol';
            that._AccountReviewMode = "";

            that._Level1Link.SetVisible(false);
            that._Level2Link.SetVisible(false);

            that._SetColorAccountReviewButtons("");
        },            

        _DestroyAccountReviewShenavarDataList: function () {
            var that = this;

            var accountReviewShenavarDataList = that._ShenavarhaPanel.FindControl("AccountReviewShenavar");
            if (accountReviewShenavarDataList != null)
                accountReviewShenavarDataList.Destroy();

            that._ShenavarhaGridView = null;
            that._SetShenavrahaButtonsEnable(false);
            that.FindControl("ShenavarhaReviewFilterDockPanel").SetVisible(false);
        },

        _DestroyAccountsReviewDataList: function () {
            var that = this;

            var accountReview = that._AccountReviewPanel.FindControl("AccountReview");
            if (accountReview != null)
                accountReview.Destroy();

            that._AccountsReviewGridView = null;
            that._DestroyAccountReviewDataListFilterControl();
            that.FindControl("AccountReviewFilterControlDocPanel").SetVisible(false);            
        },

        _ShenavarhaGridView_RowDoubleClick: function (e) {
            var that = this;

            var selectedEntities = that._ShenavarhaGridView.GetSelectedRows();

            that._ShenavarName = selectedEntities[0].DataItem.Name;
            that._Shenavar = selectedEntities[0].DataItem.AccountReviewItemID;

            if (that._DafaterForm != null) {
                var dafaterFormParent = that._DafaterForm.ParentControl;
                if (!dafaterFormParent.IsDestroying)
                    dafaterFormParent.Destroy();
            }

            if (that._Shenavar != null)
                that._CreateDafaterForm(that._AccountReview);

        },

        _AccountsReviewGridView_RowKeyPressed: function (e) {
            var that = this;

            if (e.key == "Enter") {
                that._DestroyAccountReviewShenavarDataList();
                that.NavigateInsideAccount();
            }
        },

        NavigateInsideAccount: function () {
            var that = this;

            var titleLevel = '';
            var leveleNumber = 0;
            currentLevelNumber = null;

            var selectedEntities = that._AccountsReviewGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {
                that._AccountReviewType = selectedEntities[0].DataItem["AccountType_Name"];

                if (that._AccountReviewType.substring(0, 7) == 'Account') {
                    that._AccountReviewID = selectedEntities[0].DataItem["AccountReviewItemID"];

                    that._AccountReviewType == 'AccountGroup';

                    accountEntityList = afw.uiApi.GetEntityCount("acc.Account", String.Format("ParentAccount = '{0}'", that._AccountReviewID));
                    if (accountEntityList > 0) {
                        titleLevel = selectedEntities[0].DataItem["Name"];

                        if (that._AccountLevelName == 'Kol') {
                            that._AccountLevelName = 'Moin';
                            that._AccountReviewMode = 'Moin';
                            leveleNumber = 2;
                            that._SetColorAccountReviewButtons("معین");

                            that._ParentKolLevelAccountID = selectedEntities[0].DataItem["AccountReviewItemID"];
                            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, that._AccountReviewID);
                        }
                        else if (that._AccountLevelName == 'Moin') {
                            that._AccountLevelName = 'Tafsili';
                            that._AccountReviewMode = 'Tafsili';
                            leveleNumber = 3;
                            currentLevelNumber = 3;
                            that._SetColorAccountReviewButtons("تفصیلی");

                            that._ParentMoinLevelAccountID = selectedEntities[0].DataItem["AccountReviewItemID"];
                            that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, that._AccountReviewID);
                        }

                        that._SetLevelLabels(titleLevel, leveleNumber, currentLevelNumber);
                    }
                    else {
                        if (that._AccountLevelName == 'Tafsili') {
                            afw.MessageDialog.Show("فقط تا سطح تفصیلی میتوان ریز اطلاعات را مشاهده کرد .");
                        }

                        that._SetShenavrahaButtonsEnable(true);
                    }
                }                  
            }
        },

        _SetLevelLabels: function (title, levelNmeber, currentLevelNumber) {
            var that = this;

            var levelLinksDockPanel = that.FindControl("LevelLinksDockPanel");
            if (currentLevelNumber == 0)
                levelNmeber = -1;

            if (levelNmeber == 2) {
                that._Level1Link.SetVisible(true);
                that._Level1Link.SetText(title);
                levelLinksDockPanel.Panes[1].SetSizeSetting(that._Level1Link.GetText().length * 7 + 20);
            }

            else if (levelNmeber == 3) {
                if (that._Level1Link.GetVisible()) {
                    that._Level2Link.SetVisible(true);
                    that._Level2Link.SetText("> " + title);
                    levelLinksDockPanel.Panes[2].SetSizeSetting(that._Level2Link.GetText().length * 7 + 20);
                }
                else {
                    that._Level1Link.SetVisible(true);
                    that._Level1Link.SetText(title);
                    levelLinksDockPanel.Panes[1].SetSizeSetting(that._Level1Link.GetText().length * 7 + 20);
                }
            }

            else {
                that._Level1Link.SetVisible(false);
                that._Level2Link.SetVisible(false);
                that._Level3Label.SetText('');
                that._Level4Label.SetText('');
            }

            if (title == null)
                that._AccountReviewDockPanel.SetPaneSizeSetting(0, 5);
            else
                that._AccountReviewDockPanel.SetPaneSizeSetting(0, 25);
        },

        _GetLevelNumber: function(){
            var that = this;

            var levelNumer = 1;

            if (that._Level1Link.GetText() != '' && that._Level2Link.GetText() == '')
                levelNumer = 2;

            if (that._Level2Link.GetText() != '' && that._Level3Label.GetText() == '')
                levelNumer = 3;

            else if (that._Level3Label.GetText() != '' && that._Level4Label.GetText() == '')
                levelNumer = 4;

            return levelNumer;
        },

        _Level1Link_Click: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._ParentKolLevelAccountID)) {
                that._AccountLevelName = 'Moin';
                that._AccountReviewMode = 'Moin';
                that._ParentMoinLevelAccountID = null;

                that._Level2Link.SetVisible(false);

                afw.uiApi.ShowProgress(that);
                accountEntityList = afw.uiApi.AsyncFetchEntityByID("acc.Account", that._ParentKolLevelAccountID, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);

                        if (result.HasError)
                            afw.Application.HandleError(result.ErrorMessage);
                        else {
                            that._SetLevelLabels(result.Value.GetFieldValue("Name"), 2, null);
                        }
                    });

                that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, that._ParentKolLevelAccountID);
            }
        },

        _Level2Link_Click: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._ParentMoinLevelAccountID)) {
                that._AccountLevelName = 'Tafsili';
                that._AccountReviewMode = 'Tafsili';

                afw.uiApi.ShowProgress(that);
                accountEntityList = afw.uiApi.AsyncFetchEntityByID("acc.Account", that._ParentMoinLevelAccountID, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);

                        if (result.HasError)
                            afw.Application.HandleError(result.ErrorMessage);
                        else {
                            that._SetLevelLabels(result.Value.GetFieldValue("Name"), 3, 3);
                        }
                    });

                that._CreateAccountsReviewDataListControl(that._AccountReviewMode, null, that._ParentMoinLevelAccountID);
            }
        },

        _PrintButton_Click: function (e) {
            var that = this;            

            var parentAccount =  that._AccountReviewID;

            that._Print("acc.AccountReviewReport", parentAccount, that._AccountReviewMode);
        },

        _Print: function (reportName, parentAccount, accountReviewType) {
            var that = this;

            var fromDate = null;
            var toDate = null;
            var fromDocReferenceNo = null;
            var toDocReferenceNo = null;

            if (that._FilterOnIssueDateReferenceDocCheckBox.GetValue()) {
                fromDate = "'" + that._FromDateTimeControl.GetValue() + "'";
                toDate = "'" + that._ToDateTimeControl.GetValue() + "'";
            }
            else {
                if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                    afw.ErrorDialog.Show("نوع سند مالی انتخاب نشده است.");
                    return;
                }

                fromDocReferenceNo = that._FromDocReferenceNoTextBox.GetValue();
                toDocReferenceNo = that._ToDocReferenceNoTextBox.GetValue();
            }

            var accountNature = that._AccountNatureComboBox.GetValue();
            accountNature = ValueIsEmpty(accountNature) ? "null" : String.Format("'{0}'", accountNature);
          
            var financialYear = that._GetFinancialYearForProcedure();
            financialYear = ValueIsEmpty(financialYear) ? "null" : String.Format("'{0}'", financialYear);
            
            var financialDocType = that._FinancialDocTypeOptionSetControl.GetValue();
            financialDocType = ValueIsEmpty(financialDocType) ? "null" : String.Format("'{0}'", financialDocType);

            var organizationUnitID = that._OrganizationUnitComboBox.GetValue();
            organizationUnitID = ValueIsEmpty(organizationUnitID) ? "null" : String.Format("'{0}'", organizationUnitID);

            fromDocReferenceNo = ValueIsEmpty(fromDocReferenceNo) ? "null" : String.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = ValueIsEmpty(toDocReferenceNo) ? "null" : String.Format("'{0}'", toDocReferenceNo);

            var fromDateHeader = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue()).toString();
            var toDateHeader = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue()).toString();
            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);

            var accountReviewType = ValueIsEmpty(accountReviewType) ? "null" : String.Format("'{0}'", accountReviewType);
            var remainedStatusFilter = ValueIsEmpty(that._AccountReviewRemainedStatusComboBox.GetValue()) ? "null" : String.Format("'{0}'", that._AccountReviewRemainedStatusComboBox.GetValue());
            var datalist = that._AccountReviewDataListControl;

            if (reportName == "acc.AccountReviewShenavar") {
                datalist = that._AccountReviewShenavarDataListControl;
                remainedStatusFilter = ValueIsEmpty(that._ShenavarhaReviewRemainedStatusComboBox.GetValue()) ? "null" : String.Format("'{0}'", that._ShenavarhaReviewRemainedStatusComboBox.GetValue());
            }

            var filterExpression = datalist._GetTotalFilterExpression();
            filterExpression = ValueIsEmpty(filterExpression) ? "null" :
                String.Format("N'{0}'", filterExpression.ReplaceAll("'", "''"));

            var filterExpression_Text = "";
            if (!ValueIsEmpty(datalist.GetQuickSearchTextBox().GetValue()))
                filterExpression_Text = "متن جستجو سریع: " + datalist.GetQuickSearchTextBox().GetValue();

            var sortExpression = datalist.GetSortExpression();
            sortExpression = ValueIsEmpty(sortExpression) ? "null" : String.Format("'{0}'", sortExpression);

            var parentAccount = ValueIsEmpty(parentAccount) ? "null" : String.Format("'{0}'", parentAccount);
            var shenavarGroupID = ValueIsEmpty(that._ShenavarGroupID) ? "null" : String.Format("'{0}'", that._ShenavarGroupID);

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport(reportName,
                 ["NoeTaraz", "FromDate", "ToDate", "FromDocNo", "ToDocNo", "FinancialYear", "FinancialDocType", "AccountReviewType", "ParentAccountGroup", "ParentAccount", "ShenavarGroupID",
                  "OrganizationUnitID", "RemainedStatusFilter", "FilterExpression", "FilterExpression_Text", "SortExpression", "StartRecordNumber", "MaxRecords", "FromDateHeader", "ToDateHeader", "ReportDate", "ReportTime"],
                 [accountNature, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType, accountReviewType, 'null', parentAccount, shenavarGroupID,
                    organizationUnitID, remainedStatusFilter, filterExpression, filterExpression_Text, sortExpression, null, null, fromDateHeader, toDateHeader, timeAndDateArray[0], timeAndDateArray[1]],
                 null,
                 function (result) {
                     afw.uiApi.HideProgress(that);
                 });
        },

        _RefreshButton_Click: function (e) {
            var that = this;

            that._ParentAccounts = [null, null];

            that._AccountLevelName = 'Kol';
            that._AccountName = "";
            that._SortItems();
        },
  
        _SortItems: function () {
            var that = this;

            if(that._AccountReviewEntityList != null){
                that._AccountReviewEntityList.Entities = that._AccountReviewEntityList.Entities.sort(
                    function (item1, item2) {
                        if (item1.GetFieldValue("ID") < item2.GetFieldValue("ID"))
                            return -1;
                        else if (item1.GetFieldValue("ID") > item2.GetFieldValue("ID"))
                            return 1;
                        else
                            return 0;
                    });
             }
        },

        _CalculateSummaryFields: function (dataSource) {
            var that = this;

            var levelTitle = "";
            if (!ValueIsEmpty(dataSource) && dataSource.length > 0) {
                if (dataSource[0].DebtorAmountSum != null && dataSource[0].CreditorAmountSum != null) {
                    that._SumDebtorLabel.SetText("جمع بدهکار : " +afw.BaseUtils.FormatNumber(dataSource[0].DebtorAmountSum));
                    that._SumCreditorLabel.SetText("جمع بستانکار : " + afw.BaseUtils.FormatNumber(dataSource[0].CreditorAmountSum));

                    var reminded = dataSource[0].DebtorAmountSum - dataSource[0].CreditorAmountSum
                    reminded = reminded.toFixed(0);

                    if (reminded > 0)
                        that._RemainedLabel.SetText("مانده : " + afw.BaseUtils.FormatNumber(reminded) + " بد ");
                    else if (reminded < 0)
                        that._RemainedLabel.SetText("مانده : (" + afw.BaseUtils.FormatNumber(reminded * -1) + ") بس ");
                    else if (reminded == 0)
                        that._RemainedLabel.SetText("مانده : 0");
                }
            }
            else {
                that._SumDebtorLabel.SetText("جمع بدهکار : ");
                that._SumCreditorLabel.SetText("جمع بستانکار : ");
                that._RemainedLabel.SetText("مانده : ");
            }
        },

        _FilterOnIssueDateReferenceDocCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._FilterOnIssueDateReferenceDocCheckBox.GetValue() == true) {
                that._FilterOnDocReferenceNoCheckBox.SetValue(!that._FilterOnIssueDateReferenceDocCheckBox.GetValue());
                that._FromDocReferenceNoTextBox.SetValue(null);
                that._FromDocReferenceNoTextBox.SetReadOnly(true);
                that._ToDocReferenceNoTextBox.SetValue(null);
                that._ToDocReferenceNoTextBox.SetReadOnly(true);

                if (!ValueIsEmpty(that._FinancialYearLookup.GetValue())) {
                    if (that._FinancialYearLookup.GetValue() != that._FinancialYearEntity.GetFieldValue("ID"))
                        that._FinancialYearEntity = cmn.GetFinantialYearEntity(that._FinancialYearLookup.GetValue());
                }
                else
                    that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));

                that._FinancialYearLookup.SetReadOnly(false);
                that._FromDateTimeControl.SetReadOnly(false);
                that._ToDateTimeControl.SetReadOnly(false);
            }
        },

        _FilterOnDocReferenceNoCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._FilterOnDocReferenceNoCheckBox.GetValue() == true) {
                that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

                that._FilterOnIssueDateReferenceDocCheckBox.SetValue(!that._FilterOnDocReferenceNoCheckBox.GetValue());
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._FromDateTimeControl.SetReadOnly(true);
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
                that._ToDateTimeControl.SetReadOnly(true);
                that._FinancialYearLookup.SetValue(null);
                that._FinancialYearLookup.SetReadOnly(true);

                that._FromDocReferenceNoTextBox.SetValue(null);
                that._FromDocReferenceNoTextBox.SetReadOnly(false);
                that._ToDocReferenceNoTextBox.SetValue(null);
                that._ToDocReferenceNoTextBox.SetReadOnly(false);
            }
        },

        _SetShenavrahaButtonsEnable: function(value){
            var that = this;

            that._ProjectButton.SetEnabled(value);
            that._CostCenterButton.SetEnabled(value);
            that._PersonButton.SetEnabled(value);
            that._OrganizationUnitButton.SetEnabled(value);
        },

        _WithoutOpeningCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._WithoutOpeningCheckBox.GetValue() == true) {
                that._AllCheckBox.SetValue(!that._WithoutOpeningCheckBox.GetValue());
            }
        },

        _WithoutCostAndBenefitCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._WithoutCostAndBenefitCheckBox.GetValue() == true) {
                that._AllCheckBox.SetValue(!that._WithoutCostAndBenefitCheckBox.GetValue());
            }
        },

        _WithoutClosingCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._WithoutClosingCheckBox.GetValue() == true) {
                that._AllCheckBox.SetValue(!that._WithoutClosingCheckBox.GetValue());
            }
        },

        _AllCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._AllCheckBox.GetValue() == true) {
                that._WithoutOpeningCheckBox.SetValue(!that._AllCheckBox.GetValue());
                that._WithoutCostAndBenefitCheckBox.SetValue(!that._AllCheckBox.GetValue());
                that._WithoutClosingCheckBox.SetValue(!that._AllCheckBox.GetValue());
            }
        },

        _HideShowFilterControlDockPanel_Click: function (e){
            var that = this;

            var filterControlDockPanel = that.FindControl("FilterControlDockPanel");
            
            if (that._FilterControlVisible) {
                that._FilterControlVisible = false;
                filterControlDockPanel.SetPaneSizeSetting(0, 1);
                filterControlDockPanel.SetPaneSizeSetting(1, 1);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 23);
                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToDown)");
            }
            else {
                that._FilterControlVisible = true;
                filterControlDockPanel.SetPaneSizeSetting(0, 57);
                filterControlDockPanel.SetPaneSizeSetting(1, 95);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 175);
                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToUp)");
            }
        },

        _GetFinancialYearForProcedure: function () {
            var that = this;

            if (that._FinancialYearLookup.GetValue() == null) {
                if (that._FilterOnIssueDateReferenceDocCheckBox.GetValue() == true)
                    return null;
                else
                    return that._FinancialYearEntity.GetFieldValue("ID");
            }
            else return that._FinancialYearLookup.GetValue();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountReviewForm";
    FormClass.BaseType = afw.BasePanel;


    acc.AccountReviewForm = FormClass;
})();