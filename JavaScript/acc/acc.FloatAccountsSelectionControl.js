(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.FloatAccountsSelectionControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._FloatAccountsDockPanel = that.FindControl("FloatAccountsDockPanel");

            that._BindableEntity = options.BindableEntity;
            that._PersonFieldName = options.PersonFieldName;
            that._CostCenterFieldName = options.CostCenterFieldName;
            that._ProjectFieldName = options.ProjectFieldName;
            that._ForeignCurrencyFieldName = options.ForeignCurrencyFieldName;

            if (options.RightPadding != null)
                that._FloatAccountsDockPanel.SetPaneSizeSetting(0, options.RightPadding);

            if (options.LabelWidth != null)
                that._LabelWidth = options.LabelWidth;

            that._ForeignCurrencyPopup = null;
        },

        SetAccount: function (accountID) {
            var that = this;

            that._DestroyFloatLookupControls();

            if (accountID != null)
                that._CreateFloatLookupControls(accountID);
        },

        Focus: function () {
            var that = this;

            var floatAccountDockPanel = that.FindControl("FloatAccountDockPanel2");
            if (floatAccountDockPanel != null && floatAccountDockPanel.Panes[2].HasChildControls)
                floatAccountDockPanel.Panes[2].ChildControls[0].Focus();
        },

        GetLastFloatControl: function () {
            var that = this;

            var lastFloatControl = null;
            for (var i = 0; i < 4; i++) {
                var floatAccountDockPanel = that.FindControl("FloatAccountDockPanel" + (i + 2).toString());
                if (floatAccountDockPanel != null && floatAccountDockPanel.Panes[2].HasChildControls)
                    lastFloatControl = floatAccountDockPanel.Panes[2].ChildControls[0];
            }
            return lastFloatControl;
        },

        _CreateFloatLookupControls: function (accountID) {
            var that = this;

            var floatLookupControl = null;
            var floatAutoComplete = null;
            var floatAccountsInfoArray = null;

            var floatAccountDockPanelNumber = 2;
            var floatAccountsInfoArray = that._GetSortedFloatsPriority(accountID);

            if (ValueIsEmpty(floatAccountsInfoArray))
                return;

            for (var i = 0; i < floatAccountsInfoArray.length; i++) {

                var floatName = floatAccountsInfoArray[i].Name;

                var floatAccountDockPanel = that.FindControl("FloatAccountDockPanel" + floatAccountDockPanelNumber.toString());
                floatAccountDockPanel.SetPaneSizeSetting(0, 20);//Pane for Icon
                floatAccountDockPanel.SetPaneSizeSetting(1, that._LabelWidth == null ? 60 : that._LabelWidth);//Pane for Label
                floatAccountDockPanel.SetPaneSizeSetting(2, "fill");//Pane for LookupControl
                floatAccountDockPanel.SetPaneSizeSetting(3, 5);//pane for space

                var valueDataMember = null;
                var backgroundImage = null;

                if (floatName == "Person") {
                    valueDataMember = that._PersonFieldName;
                    backgroundImage = "Resource(cmn.PersonGrayIcon)";
                }
                else if (floatName == "CostCenter") {
                    valueDataMember = that._CostCenterFieldName;
                    backgroundImage = "Resource(cmn.RedDollarIcon)";
                }
                else if (floatName == "Project") {
                    valueDataMember = that._ProjectFieldName;
                    backgroundImage = "Resource(cmn.RedStarIcon)";
                }
                else if (floatName == "ForeignCurrency") {
                    valueDataMember = that._ForeignCurrencyFieldName;
                    backgroundImage = "Resource(cmn.RedDollarIcon)";
                }

                if (valueDataMember != null) {
                    var iconPanel = new afw.Panel({
                        ParentControl: floatAccountDockPanel.Panes[0],
                        Name: "IconPanel",
                        FillParent: true,
                        BackgroundImage: backgroundImage
                    });

                    var label = new afw.Label({
                        ParentControl: floatAccountDockPanel.Panes[1],
                        Name: floatName + "Label",
                        Text: floatAccountsInfoArray[i].Title,
                        Visible: true
                    });

                    floatLookupControl = new afw.SingleEntityLookupControl({
                        ParentControl: floatAccountDockPanel.Panes[2],
                        Name: floatName + "LookupControl",
                        DataListFullName: floatAccountsInfoArray[i].DataList,
                        EntityCaptionFieldName: floatAccountsInfoArray[i].CaptionFieldName,
                        LabelVisible: false,
                        FillParent: true,
                        HasEntityViewButton: false,
                        HasEntityBrowseButton: false,
                        ValueDataMember: valueDataMember,
                        LabelText: floatAccountsInfoArray[i].Title,
                        Visible: true,
                        BaseFilterExpression: acc.GetAccountRelatedFloatsFilterExpression(accountID, floatName)
                    });

                    floatAutoComplete = floatLookupControl.GetAutoComplete();

                    if (that._FormMode == "New")
                        floatLookupControl.SetValue(null);

                    if (that._BindableEntity != null)
                        floatLookupControl.InitDataBinding(that._BindableEntity);

                    floatAccountDockPanelNumber += 1;

                    floatAutoComplete.bind("KeyPressed", function (e) { that._FloatAutoComplete_KeyPressed(e); });
                    floatLookupControl.bind("ValueChanged", function (e) { that._FloatLookupControl_ValueChanged(e); });
                }
            }

            for (var i = 1; i <= 4; i++)
                that._FloatAccountsDockPanel.SetPaneSizeSetting(i, "fill");

            for (var i = floatAccountDockPanelNumber - 1; i < 5; i++)
                that._FloatAccountsDockPanel.SetPaneSizeSetting(i, 1);

        },

        _FloatLookupControl_ValueChanged: function (e) {
            var that = this;

            if (that._BindableEntity != null
                && e.Sender.GetName() == "ForeignCurrencyLookupControl"
                && that.FindControl("ForeignCurrencyLookupControl").GetValue() != null)
                that._OpenForeignCurrencyPopup();
        },

        _CurrencyItemsTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (e.Sender.GetName() == "CurrencyAmountTextBox")
                    that._CurrencyDebtorRatioTextBox.Focus();
                else if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox")
                    that._CurrencyCreditorRatioTextBox.Focus();
                else if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
                    that.FindControl("ForeignCurrencyLookupControl").Focus();
                    that._ForeignCurrencyPopup.Close();
                }
            }
            else if (e.Key == "Escape")
                that._ForeignCurrencyPopup.Close();
        },

        _CurrencyItemsTextBox_ValueChanged: function (e) {
            var that = this;

            if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
                var currencyDebtorRatio = that._CurrencyDebtorRatioTextBox.GetValue();
                if (currencyDebtorRatio == null || currencyDebtorRatio == "0")
                    that._CurrencyDebtorRatioTextBox.SetText(0);
                else
                    that._CurrencyCreditorRatioTextBox.SetText(0);
            }

            if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
                var currencyCreditorRatio = that._CurrencyCreditorRatioTextBox.GetValue()
                if (currencyCreditorRatio == null || currencyCreditorRatio == "0")
                    that._CurrencyCreditorRatioTextBox.SetText(0);
                else
                    that._CurrencyDebtorRatioTextBox.SetText(0);
            }

            if (!ValueIsEmpty(that._CurrencyDebtorRatioTextBox.GetValue()) && !ValueIsEmpty(that._CurrencyAmountTextBox.GetValue())) {
                if (that._CurrencyAmountTextBox.GetValue() != 0 && that._CurrencyDebtorRatioTextBox.GetValue() != 0) {
                    that._BindableEntity.set("CurrencyAmount", that._CurrencyAmountTextBox.GetValue());
                    that._BindableEntity.set("CurrencyDebtorRatio", that._CurrencyDebtorRatioTextBox.GetValue());
                    that._BindableEntity.set("CurrencyCreditorRatio", 0);

                    that._BindableEntity.set("DebtorAmount", Math.ceil(that._CurrencyAmountTextBox.GetValue() * that._CurrencyDebtorRatioTextBox.GetValue()));
                }
                else
                    that._BindableEntity.set("DebtorAmount", 0);
            }

            if (!ValueIsEmpty(that._CurrencyCreditorRatioTextBox.GetValue()) && !ValueIsEmpty(that._CurrencyAmountTextBox.GetValue())) {
                if (that._CurrencyAmountTextBox.GetValue() != 0 && that._CurrencyCreditorRatioTextBox.GetValue() != 0) {
                    that._BindableEntity.set("CurrencyAmount", that._CurrencyAmountTextBox.GetValue());
                    that._BindableEntity.set("CurrencyCreditorRatio", that._CurrencyCreditorRatioTextBox.GetValue());
                    that._BindableEntity.set("CurrencyDebtorRatio", 0);

                    that._BindableEntity.set("CreditorAmount", Math.ceil(that._CurrencyAmountTextBox.GetValue() * that._CurrencyCreditorRatioTextBox.GetValue()));
                }
                else
                    that._BindableEntity.set("CreditorAmount", 0);
            }
        },

        _OpenForeignCurrencyPopup: function () {
            var that = this;

            that._ForeignCurrencyPopup = new afw.Popup({ Name: "ForeignCurrencyPopup", Width: 470, Height: 115 });
            var popupContentForm = afw.uiApi.CreateSavedFormByName(that._ForeignCurrencyPopup, "acc.AccDocForeignCurrencyPopupForm",
                { FillParent: true });

            that._CurrencyAmountTextBox = popupContentForm.FindControl("CurrencyAmountTextBox");
            that._CurrencyDebtorRatioTextBox = popupContentForm.FindControl("CurrencyDebtorRatioTextBox");
            that._CurrencyCreditorRatioTextBox = popupContentForm.FindControl("CurrencyCreditorRatioTextBox");

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyAmount")))
                that._CurrencyAmountTextBox.SetText(that._BindableEntity.get("CurrencyAmount"));
            else
                that._CurrencyAmountTextBox.SetText(0);

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyDebtorRatio")))
                that._CurrencyDebtorRatioTextBox.SetText(that._BindableEntity.get("CurrencyDebtorRatio"));
            else
                that._CurrencyDebtorRatioTextBox.SetText(0);

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyCreditorRatio")))
                that._CurrencyCreditorRatioTextBox.SetText(that._BindableEntity.get("CurrencyCreditorRatio"));
            else
                that._CurrencyCreditorRatioTextBox.SetText(0);

            that._CurrencyAmountTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });
            that._CurrencyDebtorRatioTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });
            that._CurrencyCreditorRatioTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });

            that._CurrencyAmountTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });
            that._CurrencyDebtorRatioTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });
            that._CurrencyCreditorRatioTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });

            var containerControl = that.ParentControl;
            that._ForeignCurrencyPopup.SetAnchor(containerControl, "top center", "top center");
            that._ForeignCurrencyPopup.Open();

            setTimeout(function () {
                that._CurrencyAmountTextBox.Focus();
            }, 1200);
        },

        _GetSortedFloatsPriority: function (accountID) {
            var that = this;

            var floatAccountsInfoArray = null;
            var floatPriorityEntity = null;

            if (!acc.AccountHasFloat(accountID))
                return null;

            var floatAccountsArray = acc.GetAccountFloatNames(accountID);
            floatPriorityEntity = afw.uiApi.FetchEntity("cmn.FloatPriority", String.Format("Account = '{0}'", accountID));

            if (floatPriorityEntity == null) {
                floatPriorityEntity = afw.uiApi.CreateNewEntity("cmn.FloatPriority");
                floatPriorityEntity.SetFieldValue("Account", accountID);
                floatPriorityEntity.SetFieldValue("FinancialYear", cmn.GetUserActiveFinancialYearID());
            }

            var maxPriorityNumber = that._GetMaxFloatPriorityNumber(floatPriorityEntity);
            floatAccountsInfoArray = that._SortFloats(floatPriorityEntity);
            var floatAccountsInfoArrayTemp = [];
            floatAccountsInfoArrayTemp = that._SortFloats(floatPriorityEntity);

            //////////////////////حذف آیتم های جدول اولویت شناور در صورتی که این شناور ها در حساب مربوطه وجود نداشته باشند
            var index = [];
            var indexNumber = 0;
            for (var i = 0; i < floatAccountsInfoArrayTemp.length; i++) {
                var floatName = floatAccountsInfoArrayTemp[i].Name;
                if (ValueIsIn(floatName, floatAccountsArray)) {
                    if (floatPriorityEntity.GetFieldValue(floatName + "Priority") == null)
                        maxPriorityNumber += 1;
                    floatPriorityEntity.SetFieldValue(floatName + "Priority", maxPriorityNumber);
                }
                else {
                    index[indexNumber] = floatName;
                    indexNumber++;
                }
            }

            for (var i = 0; i < index.length; i++) {
                for (var j = 0; j < floatAccountsInfoArray.length; j++) {
                    if (index[i] == floatAccountsInfoArray[j].Name)
                        floatAccountsInfoArray.RemoveItem(j);
                }
            }
            ///////////////////////////////////////////////
            return floatAccountsInfoArray;
        },

        _GetMaxFloatPriorityNumber: function (floatPriorityEntity) {
            var that = this;

            var maxPriorityNumber = 0;
            if (floatPriorityEntity.GetFieldValue("PersonPriority") > 0)
                maxPriorityNumber = floatPriorityEntity.GetFieldValue("PersonPriority");

            if (floatPriorityEntity.GetFieldValue("ProjectPriority") > 0)
                maxPriorityNumber = floatPriorityEntity.GetFieldValue("ProjectPriority");

            if (floatPriorityEntity.GetFieldValue("CostCenterPriority") > 0)
                maxPriorityNumber = floatPriorityEntity.GetFieldValue("CostCenterPriority");

            if (floatPriorityEntity.GetFieldValue("ForeignCurrencyPriority") > 0)
                maxPriorityNumber = floatPriorityEntity.GetFieldValue("ForeignCurrencyPriority");

            return maxPriorityNumber;
        },

        _DestroyFloatLookupControls: function () {
            var that = this;

            for (var i = 0; i < 4; i++) {
                var floatAccountDockPanel = that.FindControl("FloatAccountDockPanel" + (i + 2).toString());

                for (var j = 0; j < floatAccountDockPanel.Panes.length; j++) {
                    var floatAccountsControlsPane = floatAccountDockPanel.Panes[j];

                    if (floatAccountsControlsPane.HasChildControls) {
                        if (that._BindableEntity != null) {
                            if (floatAccountsControlsPane.ChildControls[0].GetName() == that._PersonFieldName + "LookupControl")
                                that._BindableEntity.set(that._PersonFieldName, null);

                            if (floatAccountsControlsPane.ChildControls[0].GetName() == that._CostCenterFieldName + "LookupControl")
                                that._BindableEntity.set(that._CostCenterFieldName, null);

                            if (floatAccountsControlsPane.ChildControls[0].GetName() == that._ProjectFieldName + "LookupControl")
                                that._BindableEntity.set(that._ProjectFieldName, null);

                            if (floatAccountsControlsPane.ChildControls[0].GetName() == that._ForeignCurrencyFieldName + "LookupControl")
                                that._BindableEntity.set(that._ForeignCurrencyFieldName, null);
                        }

                        floatAccountsControlsPane.ChildControls[0].Destroy();
                    }
                }
            }
        },

        _SortFloats: function (floatPriorityEntity) {
            var that = this;


            var personPriority = null;
            var costCenterPriority = null;
            var projectPriority = null;
            var ForeignCurrencyPriority = null;

            personPriority = floatPriorityEntity.GetFieldValue("PersonPriority");
            costCenterPriority = floatPriorityEntity.GetFieldValue("CostCenterPriority");
            projectPriority = floatPriorityEntity.GetFieldValue("ProjectPriority");
            ForeignCurrencyPriority = floatPriorityEntity.GetFieldValue("ForeignCurrencyPriority");

            var floatItems = [
                { Priority: personPriority, Name: "Person", Title: "شخص", DataList: "cmn.PersonBriefLookupList", CaptionFieldName: "FullName" },
                { Priority: costCenterPriority, Name: "CostCenter", Title: "مرکز هزینه", DataList: "cmn.CostCenterBriefLookupList", CaptionFieldName: "Name" },
                { Priority: projectPriority, Name: "Project", Title: "پروژه", DataList: "cmn.ProjectBriefLookupList", CaptionFieldName: "Name" },
                { Priority: ForeignCurrencyPriority, Name: "ForeignCurrency", Title: "ارز", DataList: "cmn.ForeignCurrencyBriefLookupList", CaptionFieldName: "Name" }
            ];

            return that._SortFloatItems(floatItems);
        },

        _SortFloatItems: function (array) {
            return array.sort(function (item1, item2) {
                var item1Priority = item1['Priority'];
                var item2Priority = item2['Priority'];

                if (ValueIsEmpty(item1Priority)) {
                    item1Priority = 9999999;
                }

                if (ValueIsEmpty(item2Priority)) {
                    item2Priority = 9999999;
                }

                return ((item1Priority < item2Priority) ? -1 : ((item1Priority > item2Priority) ? 1 : 0));
            });
        },

        _FloatAutoComplete_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter") {
                var paneIndex = e.Sender.ParentControl.ParentControl.ParentControl.ParentControl.ParentControl.ParentControl.GetPaneIndex();

                var floatAutoComplete = e.Sender.ParentControl.ParentControl.ParentControl;
                if (floatAutoComplete.GetValue() == null)
                    floatAutoComplete._OpenLookup();
                else {
                    paneIndex += 2;
                    var floatAccountsDockPanel = that.FindControl("FloatAccountDockPanel" + paneIndex.toString());
                    if (floatAccountsDockPanel != null && floatAccountsDockPanel.Panes[2].HasChildControls)
                        floatAccountsDockPanel.Panes[2].ChildControls[0].Focus();
                }
            }
        },

        ValidateControl: function () {
            var that = this;

            var personLookupControl = that.FindControl("PersonLookupControl");
            var costLookupControl = that.FindControl("CostCenterLookupControl");
            var projectLookupControl = that.FindControl("ProjectLookupControl");
            var foreignCurrencyLookupControl = that.FindControl("ForeignCurrencyLookupControl");

            if (personLookupControl != null)
                if (personLookupControl.GetValue() == null) {
                    afw.MessageDialog.Show("مقدار فیلد شخص را وارد نکرده اید");
                    return false;
                }

            if (costLookupControl != null)
                if (costLookupControl.GetValue() == null) {
                    afw.MessageDialog.Show("مقدار فیلد هزینه را وارد نکرده اید");
                    return false;
                }

            if (projectLookupControl != null)
                if (projectLookupControl.GetValue() == null) {
                    afw.MessageDialog.Show("مقدار فیلد پروژه را وارد نکرده اید.");
                    return false;
                }

            if (foreignCurrencyLookupControl != null)
                if (foreignCurrencyLookupControl.GetValue() == null) {
                    afw.MessageDialog.Show("مقدار فیلد ارز را وارد نکرده اید.");
                    return false;
                }

            return true;
        },

        GetFirstEmptyControl: function () {
            var that = this;

            var personLookupControl = that.FindControl("PersonLookupControl");
            var costLookupControl = that.FindControl("CostCenterLookupControl");
            var projectLookupControl = that.FindControl("ProjectLookupControl");
            var foreignCurrencyLookupControl = that.FindControl("ForeignCurrencyLookupControl");

            if (personLookupControl != null)
                if (personLookupControl.GetValue() == null)
                    return personLookupControl;

            if (projectLookupControl != null)
                if (projectLookupControl.GetValue() == null)
                    return projectLookupControl;

            if (costLookupControl != null)
                if (costLookupControl.GetValue() == null)
                    return costLookupControl;

            if (foreignCurrencyLookupControl != null)
                if (foreignCurrencyLookupControl.GetValue() == null)
                    return foreignCurrencyLookupControl;

            return null;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.FloatAccountsSelectionControl";
    FormClass.BaseType = afw.BasePanel;


    acc.FloatAccountsSelectionControl = FormClass;
})();