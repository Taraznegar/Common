(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.SefareshEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._PersonLookupControl = that.FindControl("PersonFieldControl").FindControl("InnerControl");
            that._DateRegister = that.FindControl("DateRegisterFieldControl").FindControl("InnerControl");
            that._DateInwarehouseFieldControl = that.FindControl("DateInwarehouseFieldControl").FindControl("InnerControl");

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            //that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            that._BindableEntity._Entity.SetFieldValue("FinancialYear", that._FinancialYearID);


            if (options.SefareshType == "ExternalSefaresh") {

                that._BindableEntity._Entity.SetFieldValue("SefareshType", afw.OptionSetHelper.GetOptionSetItemID("cmn.SefareshType.ExternalSefaresh"));
            }
            else {
                that._DateInwarehouseFieldControl.SetShowRequiredStar(false);
            }

            if (!that._BindableEntity._Entity.FieldExists("SefareshItems"))
                that._BindableEntity._Entity.AddField("SefareshItems");

            that.ItemsEntityList = null;

            if (that._FormMode == "New") {

                that.ItemsEntityList = afw.uiApi.CreateEntityList("wm.SefareshItem");
                that._BindableEntity._Entity.SetFieldValue("SefareshItems", that.ItemsEntityList);
                if (options.SefareshType == "ExternalSefaresh") {
                    var lastSefareshExternalNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ExternalNumber", "wm_Sefareshha", null]);
                    that._BindableEntity.set("ExternalNumber", lastSefareshExternalNumber + 1);
                }
                else {
                    var lastSefareshInternalNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["InternalNumber", "wm_Sefareshha", null]);
                    that._BindableEntity.set("InternalNumber", lastSefareshInternalNumber + 1);
                }

                that._NowDateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
                var nowDateTimeSplited = that._NowDateTime.split(' ');
                that._DateRegister.SetValue(nowDateTimeSplited[0]);

                that._NowDateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
                var nowDateTimeSplited = that._NowDateTime.split(' ');
                that._DateInwarehouseFieldControl.SetValue(nowDateTimeSplited[0]);
            }
            else {
                if (that._BindableEntity._Entity.GetFieldValue("SefareshItems") == null) {
                    var itemsEntityList = afw.uiApi.FetchEntityList("wm.SefareshItem",
                                              String.Format("Sefaresh = '{0}'", that._BindableEntity.get("ID")), "RowNo");

                    that._BindableEntity._Entity.SetFieldValue("SefareshItems", itemsEntityList);
                }
            }

            that.ItemsEntityList = that._BindableEntity._Entity.GetFieldValue("SefareshItems");

            that._CreateItemsGrid();

            that._ItemsGridControl.AddEmptyItems(1);

            that._FormHasUnsavedChanges = true;
            that._ItemsGridControl.LastSelectedRowIndex = 0;
        },

        _CreateItemsGrid: function () {
            var that = this;

            that._ItemsGridControl = new wm.SefareshItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[3],
                Name: "ItemsGridControl",
                SefareshEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                FillParent: false
            });

            for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
            }
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            that._ItemsGridControl.FindControl("GridTitleDockPanel").AdjustPanes();

            setTimeout(function () {
                that._PersonLookupControl.Focus();
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
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.SefareshEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.SefareshEditForm = FormClass;
})();