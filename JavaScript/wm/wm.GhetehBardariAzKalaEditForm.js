(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.GhetehBardariAzKalaEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._SourceStuffLocationFieldControl = that.FindControl("SourceStuffLocationFieldControl");
            that._ComponentsDestinationStuffLocationFieldControl = that.FindControl("ComponentsDestinationStuffLocationFieldControl");
            that._BatchNumberFieldControl = that.FindControl("BatchNumberFieldControl");
            that._StuffSerialNumbersFieldControl = that.FindControl("StuffSerialNumbersFieldControl");
            that._MainStuffLookupControl = that.FindControl("MainStuffFieldControl").FindControl("InnerControl");

            that.FetchedStuffs = [];
            that.BatchList = afw.DataListHelper.FetchEntityListOfDataList("wm.BatchList").ToDataSourceData();
            that.StuffStatusEntityList = afw.uiApi.FetchEntityList("wm.StuffStatus", null, "DisplayeOrder");
            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that.ItemsEntityList = null;

            var entity = that._BindableEntity.GetEntity();

            that._MainStuffLookupControl.SetLookupWindowDefaultWidth(1300);

            that._SourceStuffLocationFieldControl.bind("ValueChanged", function (e) {
                that._SourceStuffLocationFieldControl_ValueChanged(e);
            });

            that._MainStuffLookupControl.bind("ValueChanged", function (e) { that._MainStuffLookupControl_ValueChanged(e); });
            that._MainStuffLookupControl.bind("OpeningLookup", function (e) { that._MainStuffLookupControl_OpeningLookup(e); });

            if (!entity.FieldExists("GhetehBardariAzKalaItems"))
                entity.AddField("GhetehBardariAzKalaItems");

            if (that._FormMode == "New") {
                if (ValueIsEmpty(entity.GetFieldValue("GhetehBardariAzKalaItems"))) {
                    that.ItemsEntityList = afw.uiApi.CreateEntityList("wm.GhetehBardariAzKalaItem");
                    entity.SetFieldValue("GhetehBardariAzKalaItems", that.ItemsEntityList);
                }
                else
                    that.ItemsEntityList = entity.GetFieldValue("GhetehBardariAzKalaItems");

                that._SourceStuffLocationFieldControl.SetValue(wm.GetDefaultSourceStuffLocation());

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                entity.SetFieldValue("OpNumber", -1);

                that._BatchNumberFieldControl.SetVisible(false);
                that._StuffSerialNumbersFieldControl.SetVisible(false);
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
            }
            else {
                if (ValueIsEmpty(entity.GetFieldValue("GhetehBardariAzKalaItems"))) {
                    that.ItemsEntityList = afw.uiApi.FetchEntityList("wm.GhetehBardariAzKalaItem",
                        String.Format("GhetehBardariAzKala = '{0}'",
                            that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    entity.SetFieldValue("GhetehBardariAzKalaItems", that.ItemsEntityList);
                }
                else
                    that.ItemsEntityList = entity.GetFieldValue("GhetehBardariAzKalaItems");
            }

            that._CreateItemsGridControl();
        },

        _CreateItemsGridControl: function () {
            var that = this;

            that._ItemsGridControl = new wm.GhetehBardariAzKalaItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[5],
                Name: "ItemsGridControl",
                GhetehBardariAzKalaEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                FillParent: true
            });

            if (that.ItemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
                }
            }
        },

        _MainStuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _SetStuffsLookupBaseFilterExpression: function () {
            var that = this;

            if (that._BindableEntity.get("SourceStuffLocation") != null) {
                that._MainStuffLookupControl.SetBaseFilterExpression(String.Format("InnerQuery.StuffDef in(\r\n" +
		            "select StuffPossibleLocation.StuffDef \r\n" +
		            "from cmn_StuffPossibleLocations StuffPossibleLocation \r\n" +
			        "    left join cmn_StuffLocations StuffLocation on StuffLocation.ID = StuffPossibleLocation.StuffLocation\r\n" +
		            "where StuffLocation.ID  = '{0}') and IsActive = 1",
                    that._BindableEntity.get("SourceStuffLocation")));
            }
        },

        _MainStuffLookupControl_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("BatchNumber", null);
            that._BindableEntity.set("StuffSerialNumbers", null);

            that._AdjustForm();
        },

        _GetStuffDef: function () {
            var that = this;

            var entity = that._BindableEntity.GetEntity();
            var mainStuffID = entity.GetFieldValue("MainStuff")

            if (ValueIsEmpty(mainStuffID)) {
                return null;
            }
            else {
                var foundStuff = $.grep(that.FetchedStuffs,
                    function (o) { return o.GetFieldValue("ID") == mainStuffID; });

                if (foundStuff.length != 0)
                    return foundStuff[0].GetFieldValue("StuffDef_Entity");
                else {
                    var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", mainStuffID, ["StuffDef"]);
                    that.FetchedStuffs.push(fetchedStuff);
                    return fetchedStuff.GetFieldValue("StuffDef_Entity");
                }
            }
        },

        _SourceStuffLocationFieldControl_ValueChanged: function () {
            var that = this;

            if (ValueIsEmpty(that._ComponentsDestinationStuffLocationFieldControl.GetValue()))
                that._ComponentsDestinationStuffLocationFieldControl.SetValue(that._SourceStuffLocationFieldControl.GetValue());

            that._SetStuffsLookupBaseFilterExpression();

            wm.SetDefaultSourceStuffLocation(that._SourceStuffLocationFieldControl.GetValue());
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
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

            setTimeout(function () {
                that._MainStuffLookupControl.Focus();
            }, 600);
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

            var stuffDefEntity = that._GetStuffDef();
            if (stuffDefEntity != null) {

                if (stuffDefEntity.GetFieldValue("BatchNumberIsRequiered"))
                    that._BatchNumberFieldControl.SetVisible(true);
                else
                    that._BatchNumberFieldControl.SetVisible(false);

                if (stuffDefEntity.GetFieldValue("NeedsSerialNumber"))
                    that._StuffSerialNumbersFieldControl.SetVisible(true);
                else
                    that._StuffSerialNumbersFieldControl.SetVisible(false);
            }
            else {
                that._BatchNumberFieldControl.SetVisible(false);
                that._StuffSerialNumbersFieldControl.SetVisible(false);
            }

            if (that._BatchNumberFieldControl.GetVisible() == false && that._StuffSerialNumbersFieldControl.GetVisible() == false)
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
            else
                that._MainDockPanel.SetPaneSizeSetting(2, 50);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (that._BatchNumberFieldControl.GetVisible() == true && ValueIsEmpty(that._BatchNumberFieldControl.GetValue())) {
                afw.ErrorDialog.Show("شماره بچ وارد نشده است.");
                return false;
            }

            if (that._StuffSerialNumbersFieldControl.GetVisible() == true && ValueIsEmpty(that._StuffSerialNumbersFieldControl.GetValue())) {
                afw.ErrorDialog.Show("شماره سریال وارد نشده است.");
                return false;
            }

            if (!that._ItemsGridControl.ValidateRows())
                return false;

            return true;
        },

        GetFormMode: function () {
            var that = this;

            return that._FormMode;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++)
                    that.ItemsEntityList.Entities[i].ChangeStatus = "None";
            }

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.GhetehBardariAzKalaEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.GhetehBardariAzKalaEditForm = FormClass;
})();