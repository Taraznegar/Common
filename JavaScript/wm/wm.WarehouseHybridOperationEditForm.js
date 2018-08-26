(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return wm.WarehouseHybridOperationEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that.ItemsEntityList = null;

            that.FetchedStuffs = [];

            that.BatchList = afw.DataListHelper.FetchEntityListOfDataList("wm.BatchList").ToDataSourceData();
            that.StuffStatusEntityList = afw.uiApi.FetchEntityList("wm.StuffStatus", null, "DisplayeOrder");

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._IssueDateFieldControl = that.FindControl("IssueDateFieldControl");
            that._CreatorUserLookupControl = that.FindControl("CreatorUserFieldControl").FindControl("InnerControl");
            that._WarehouseHybridOperationTypeFieldControl = that.FindControl("WarehouseHybridOperationTypeFieldControl");

            that._CreatorUserLookupControl.SetReadOnly(true);
            that._CreatorUserLookupControl.SetHasEntityViewButton(false);

            var itemsEntityList = null;

            var entity = that._BindableEntity.GetEntity();

            if (!entity.FieldExists("WarehouseHybridOperationItems"))
                entity.AddField("WarehouseHybridOperationItems");
            else {
                entity.RemoveField("WarehouseHybridOperationItems");
                entity.AddField("WarehouseHybridOperationItems");
            }

            if (that._FormMode == "New") {
                if (ValueIsEmpty(entity.GetFieldValue("WarehouseHybridOperationItems"))) {
                    itemsEntityList = afw.uiApi.CreateEntityList("wm.WarehouseHybridOperationItem");
                    entity.SetFieldValue("WarehouseHybridOperationItems", itemsEntityList);
                }
                else
                    entity.SetFieldValue("WarehouseHybridOperationItems", itemsEntityList);

                that._IssueDateFieldControl.SetValue(afw.DateTimeHelper.GetServerDateTime());

                that._CreatorUserLookupControl.SetValue(afw.App.CurrentUserID);

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                entity.SetFieldValue("OpNumber", -1);
            }
            else {
                if (ValueIsEmpty(entity.GetFieldValue("WarehouseHybridOperationItems"))) {
                    itemsEntityList = afw.uiApi.FetchEntityList("wm.WarehouseHybridOperationItem",
                        String.Format("WarehouseHybridOperation = '{0}'",
                        that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    entity.SetFieldValue("WarehouseHybridOperationItems", itemsEntityList);
                }

                that._WarehouseHybridOperationTypeFieldControl.SetReadOnly(true);
            }

            that.ItemsEntityList = that._BindableEntity._Entity.GetFieldValue("WarehouseHybridOperationItems");

            that._CreateItemsGridControl(that.ItemsEntityList);

            that._AdjustForm();
        },

        _CreateItemsGridControl: function (itemsEntityList) {
            var that = this;

            that._ItemsGridControl = new wm.WarehouseHybridOperationItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[4],
                Name: "ItemsGridControl",
                WarehouseHybridOperationEditForm: that,
                RowsEntityList: itemsEntityList,
                FillParent: true
            });

            if (itemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < itemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(itemsEntityList.Entities[i]);
                }
            }
        },

        _DestroyWarehouseOperationItemsControl: function () {
            var that = this;

            that._ItemsGridControl.Destroy();
            that._ItemsGridControl = null;
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);

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

            afw.EntityWindowBase.fn._OnClosed.call(that);
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

            if (saved) {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++)
                    that.ItemsEntityList.Entities[i].ChangeStatus = "None";
            }

            return saved;
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.EntityWindowBase.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.EntityWindowBase.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.WarehouseHybridOperationEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    wm.WarehouseHybridOperationEditForm = FormClass;
})();