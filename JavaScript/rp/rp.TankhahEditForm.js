(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.TankhahEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that._ActiveFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (that._ActiveFinancialYearEntity != null) {
                that._FromDateTimeControl = that._ActiveFinancialYearEntity.GetFieldValue("StartDate");
                that._ToDateTimeControl = that._ActiveFinancialYearEntity.GetFieldValue("EndDate");
            }
            that._TankhahNoDockPanel = that.FindControl("TankhahNoDockPanel");
            that._TankhahNoRefreshImageButton = that.FindControl("TankhahNoRefreshImageButton");
            that._FinancialDocTypeFieldControl = that.FindControl("FinancialDocTypeFieldControl");
            that._FinancialDocTypeFieldControl.FindControl("InnerControl").SetShowRequiredStar(true);
            that._IssueDateFieldControl = that.FindControl("IssueDateFieldControl");
            that._IssueDateControl = that._IssueDateFieldControl.FindControl("InnerControl");
            that._IssueDateControl.SetShowRequiredStar(true);
            that._OwnerPersonFieldControl = that.FindControl("PersonFieldControl");
            that._OwnerPersonLookupControl = that._OwnerPersonFieldControl.FindControl("InnerControl");
            that._OwnerPersonLookupControl.SetHasEntityViewButton(false);
            that._TankhahNoFieldControl = that.FindControl("TankhahNoFieldControl");
            that._TankhahGardanPerson = null
            that._TankhahGardanFieldControl = that.FindControl("TankhahGardanFieldControl").FindControl("innerControl");
            that._CustomerMandeLabel = that.FindControl("CustomerMandeLabel");

            that._TankhahGardanFieldControl.bind("ValueChanged", function (e) { that._TankhahGardanFieldControl_ValueChanged(e); });
            that._FinancialDocTypeFieldControl.bind("ValueChanged", function (e) { that._FinancialDocTypeFieldControl_ValueChanged(e); });
            that._TankhahNoRefreshImageButton.bind("Click", function (e) { that._TankhahNoRefreshImageButton_Click(e); });

            if (that._FormMode == "New") {
                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                that._TankhahNoFieldControl.SetValue(that._GetLastTankhahNo());
            }
            else if (that._FormMode == "Edit") {
                if (!ValueIsEmpty(that._BindableEntity.get("AccDoc"))) {
                    //hide form toolbar:
                    that.EntityWindowBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);

                    //hide items list toolbar:
                    var tankhahItemsFieldControl = that.FindControl("TankhahItemsFieldControl").FindControl("InnerControl");
                    that._TankhahItemsDataListControl = tankhahItemsFieldControl.FindControl("DataListControl");
                    var tankhahItemsToolBar = that._TankhahItemsDataListControl.ToolBar;

                    tankhahItemsToolBar.RemoveButton("New");
                    tankhahItemsToolBar.RemoveButton("Edit");
                    tankhahItemsToolBar.RemoveButton("Delete");
                    tankhahItemsToolBar.AddButton("View", "مشاهده", { Image: "resource(cmn.View)" });

                    tankhahItemsToolBar.bind("ButtonClick", function (e) { that._TankhahItemsToolBar_ButtonClick(e); });
                }

                that._HideTankhahNoRefreshImageButton();
            }

            if (that._BindableEntity.get("Person") != null)
                that._OwnerPersonFieldControl.SetReadOnly(true);

            that._TankhahNoFieldControl.SetReadOnly(true);
        },

        _TankhahItemsToolBar_ButtonClick: function (e) {
            var that = this;

            if (e.ButtonKey == "View") {
                var selectedEntities = that._TankhahItemsDataListControl.GetEntitiesGridView().GetSelectedRows();

                if (selectedEntities.length != 0) {
                    var entityId = selectedEntities[0].DataItem["ID"];
                    var tankhahItem = afw.uiApi.FetchEntityByID("rp.TankhahItem", entityId);

                    that._TankhahItemsDataListControl.ShowEntityWindow(tankhahItem, "Edit", { IsView: true });
                }
            }
        },

        _TankhahGardanFieldControl_ValueChanged: function (e) {
            var that = this;

            that._CustomerMandeLabel.SetText("مانده حسابداری : 0 بی حساب");

            if (!ValueIsEmpty(that._TankhahGardanFieldControl.GetValue())) {

                var tankhahGardanAccSettingEntity = afw.uiApi.FetchEntity("rp.TankhahGardanAccSetting",
                    String.Format("TankhahGardan = '{0}' and FinancialYear = '{1}'", that._TankhahGardanFieldControl.GetValue(), that._ActiveFinancialYearID));
                if (tankhahGardanAccSettingEntity != null) {
                    if (tankhahGardanAccSettingEntity.GetFieldValue("OwnerPerson") != null) {
                        that._BindableEntity.set("Person", tankhahGardanAccSettingEntity.GetFieldValue("OwnerPerson"));
                        that._MohasebehMandehHedabdari(tankhahGardanAccSettingEntity.GetFieldValue("OwnerPerson"));
                        that._OwnerPersonFieldControl.SetReadOnly(true);
                    }
                    else {
                        that._BindableEntity.set("Person", null);
                        that._OwnerPersonFieldControl.SetReadOnly(false);
                    }
                }
                else {
                    that._TankhahGardanPerson = null;
                    that._BindableEntity.set("Person", null);
                    that._OwnerPersonFieldControl.SetReadOnly(false);
                }
            }
            else {
                that._TankhahGardanPerson = null;
                that._BindableEntity.set("Person", null);
                that._OwnerPersonFieldControl.SetReadOnly(false);
            }

        },

        _FinancialDocTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._FinancialDocTypeFieldControl.GetValue()))
                return;

            try {
                var financialGroupEntity = cmn.GetFinancialGroupEntity(that._BindableEntity.get("OrganizationUnit"),
                    that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
                if (financialGroupEntity != null)
                    that._BindableEntity.set("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._BindableEntity.set("FinancialGroup", null);
            }
            catch (ex) {
                that._BindableEntity.set("FinancialDocType", null);
                afw.ErrorDialog.Show(ex);
            }
        },

        _TankhahNoRefreshImageButton_Click: function (e) {
            var that = this;

            that._TankhahNoFieldControl.SetValue(that._GetLastTankhahNo());
        },

        _GetLastTankhahNo: function () {
            var that = this;

            var lastTankhahNo = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",
                ["TankhahNo", "rp_Tankhahha", String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID)]);

            return lastTankhahNo + 1;
        },

        _MohasebehMandehHedabdari: function (ownerPerson) {
            var that = this;

            if (ownerPerson != null) {
                var entityList = afw.uiApi.CallServerMethodSync("acc.GetShenavarhaEntityList", that._GetParameters(ownerPerson));

                if (entityList.Entities.length != 0) {
                    that._CustomerMandeLabel.SetText("مانده حسابداری :  " + FormatNumber(entityList.Entities[entityList.Entities.length - 1].GetFieldValue("RemainingAmount") + "  " +
                        entityList.Entities[entityList.Entities.length - 1].GetFieldValue("BalanceStatus")));
                }
                else
                    that._CustomerMandeLabel.SetText("مانده حسابداری : 0 بی حساب");
            }
        },

        _GetParameters: function (ownerPerson) {
            var that = this;

            var financialYearID = that._ActiveFinancialYearEntity.GetFieldValue("ID");
            var person = ownerPerson;
            var costCenter = null;
            var project = null;
            var foreignCurrency = null;
            var financialDocType = null;
            var organizationUnit = null;
            var account = null;

            return [that._FromDateTimeControl, that._ToDateTimeControl, financialYearID, financialDocType, organizationUnit, person, costCenter, project, foreignCurrency, account];
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            if (that._FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (activeOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", activeOrgUnitID[0]);
            }
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

            if (ValueIsEmpty(that._IssueDateFieldControl.GetValue())) {
                afw.ErrorDialog.Show("تاریخ صدور وارد نشده است");
                return false;
            }

            if (ValueIsEmpty(that._FinancialDocTypeFieldControl.GetValue())) {
                afw.ErrorDialog.Show("نوع سند مالی را انتخاب نمایید");
                return false;
            }

            if (ValueIsEmpty(that._BindableEntity.get("Person")) &&
                !ValueIsEmpty(that._BindableEntity.get("TankhahGardan"))) {
                afw.ErrorDialog.Show("برای تنخواه گردان هیچ شخصی انتخاب نشده است");
                return false;
            }

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved)
                that._HideTankhahNoRefreshImageButton();

            return saved;
        },

        _HideTankhahNoRefreshImageButton: function () {
            var that = this;

            that._TankhahNoDockPanel.SetPaneSizeSetting(1, 1);
            that._TankhahNoRefreshImageButton.SetVisible(false);
        },

        Save: function () {
            var that = this;

            return that._Save();
        },

        GetEntity: function () {
            var that = this;

            return that._BindableEntity.GetEntity();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.TankhahEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.TankhahEditForm = FormClass;
})();