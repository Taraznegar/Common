(function () {
    var Class = afw.BasePanel.extend({
        GetType: function () {
            return cmn.ReminderItemControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._ParentDailyCalendarControl = options.ParentDailyCalendarControl;
            that._LineOnTitle = null;

            var itemWrapperDockPanel = that.FindControl("ItemWrapperDockPanel");
            var titleLabel = that.FindControl("TitleLabel");
            var titleLabel2 = that.FindControl("TitleLabel2");
            var titleLabel3 = that.FindControl("TitleLabel3");

            itemWrapperDockPanel.SetFillParent(true);
            itemWrapperDockPanel.Panes[1].SetBackColor("#cccccc");

            if ("ItemInfoEntity" in options)
                that._ItemInfoEntity = options.ItemInfoEntity;
            else
                throw "ItemInfoEntity is not set.";

            that._SetItemIcon();

            titleLabel.SetText(that._ItemInfoEntity.GetFieldValue("Title"));
            titleLabel.bind("Click", function (e) { that._Click(e); });

            //var salesCaseDate = afw.DateTimeHelper.GregorianToJalali(that._SalesCase.GetFieldValue("CreationTime")).split(" ")[0];

            if (!ValueIsEmpty(that._ItemInfoEntity.GetFieldValue("SalesCase_Title"))) {
                titleLabel2.SetText(
                    String.Format("{0} ({1})", that._ItemInfoEntity.GetFieldValue("SalesCase_Title"), that._ItemInfoEntity.GetFieldValue("SalesCaseCustomer_Text"))
                    );
            }
            else
                titleLabel2.SetText("");

            titleLabel2.bind("Click", function (e) { that._Click(e); });

            //var label3Title = String.Format("مسئول: {0}", that._ItemInfoEntity.GetFieldValue("OwnerUser_Text"));
            ////if (!ValueIsEmpty(that._ItemInfoEntity.GetFieldValue("ItemTime")))
            ////    label3Title += " - " + that._ItemInfoEntity.GetFieldValue("ItemTime").split(" ")[1].substring(0, 5)
            //titleLabel3.SetText(label3Title);
            //titleLabel3.bind("Click", function (e) { that._Click(e); });

            titleLabel3.SetVisible(false);

            if (that._ItemInfoEntity.GetFieldValue("Priority") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityPriority.Normal"))
                that.FindControl("PriorityIconPanel").SetBackgroundImage("resource(crm.NormalPriorityIcon1)");
            else if (that._ItemInfoEntity.GetFieldValue("Priority") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityPriority.High"))
                that.FindControl("PriorityIconPanel").SetBackgroundImage("resource(crm.HighPriorityIcon1)");

            that.SetMouseCursor("pointer");

            //that._InitDraggable();
        },

        GetItemInfoEntity: function () {
            var that = this;

            return that._ItemInfoEntity;
        },

        _Click: function () {
            var that = this;

            afw.uiApi.ShowProgress(cmn.ReminderWindow.Instance);
            afw.uiApi.AsyncFetchEntityByID("cmn.Activity", that._ItemInfoEntity.GetFieldValue("ID"), null,
                function (result) {
                    if (cmn.ReminderWindow.IsOpen)
                        afw.uiApi.HideProgress(cmn.ReminderWindow.Instance);

                    if (result.HasError)
                        afw.Application.HandleError(result.ErrorMessage);
                    else {
                        var entityWindow = afw.EntityHelper.ShowEntityWindow(result.Value, "cmn.ActivityEditForm", "Edit", { ShowSalesCase: true });
                        if (entityWindow == null) {
                            afw.Application.HandleError("Could not create Entity window.");
                            return;
                        }

                        entityWindow.GetToolbar().RemoveButton("Save");

                        entityWindow.bind("Close", function () {
                            if (entityWindow.GetDialogResult() == "Ok") {
                                if (cmn.ReminderWindow.IsOpen) {
                                    afw.uiApi.ShowProgress(cmn.ReminderWindow.Instance);
                                    cmn.ReminderManager.SyncReminder();
                                }
                            }
                        });
                    }
                });
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);
        },

        _SetItemIcon: function () {
            var that = this;

            var minorType = that._ItemInfoEntity.GetFieldValue("ActivityType_Name");
            iconName = "cmn.ActivityTypeIcon1_" + minorType;
            that.FindControl("IconPanel").SetBackgroundImage(String.Format("resource({0})", iconName));
        }
    });

    //Static Members:

    Class.TypeName = "cmn.ReminderItemControl";
    Class.BaseType = afw.BasePanel;


    cmn.ReminderItemControl = Class;
})();