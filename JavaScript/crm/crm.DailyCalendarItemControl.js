(function () {
    var Class = afw.BasePanel.extend({
        GetType: function () {
            return crm.DailyCalendarItemControl;
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

            titleLabel.SetText(that._ItemInfoEntity.GetFieldValue("ItemDescription"));
            titleLabel.bind("Click", function (e) { that._Click(e); });

            if (!ValueIsEmpty(that._ItemInfoEntity.GetFieldValue("SalesCase_Title"))) {
                //var salesCaseDate = afw.DateTimeHelper.GregorianToJalali(that._SalesCase.GetFieldValue("CreationTime")).split(" ")[0];
                titleLabel2.SetText(
                    String.Format("{0} ({1})", that._ItemInfoEntity.GetFieldValue("SalesCase_Title"), that._ItemInfoEntity.GetFieldValue("SalesCaseCustomer_Text")));
            }
            else
                titleLabel2.SetText("");

            titleLabel2.bind("Click", function (e) { that._Click(e); });

            var label3Title = String.Format("مسئول: {0}", that._ItemInfoEntity.GetFieldValue("OwnerUser_Text"));
            //if (!ValueIsEmpty(that._ItemInfoEntity.GetFieldValue("ItemTime")))
            //    label3Title += " - " + that._ItemInfoEntity.GetFieldValue("ItemTime").split(" ")[1].substring(0, 5)
            titleLabel3.SetText(label3Title);
            titleLabel3.bind("Click", function (e) { that._Click(e); });

            if (that._ItemInfoEntity.GetFieldValue("Priority") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityPriority.Normal"))
                that.FindControl("PriorityIconPanel").SetBackgroundImage("resource(crm.NormalPriorityIcon1)");
            else if (that._ItemInfoEntity.GetFieldValue("Priority") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityPriority.High"))
                that.FindControl("PriorityIconPanel").SetBackgroundImage("resource(crm.HighPriorityIcon1)");

            if (ValueIsIn(that._ItemInfoEntity.GetFieldValue("ActivityStatus"),
                    [afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed"), afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Canceled")])) {
                that._ShowLineOnTitle();
            }

            that.SetMouseCursor("pointer");

            //that._InitDraggable();
        },

        GetItemInfoEntity: function () {
            var that = this;

            return that._ItemInfoEntity;
        },

        _Click: function () {
            var that = this;

            afw.uiApi.ShowProgress(that._ParentDailyCalendarControl);
            afw.uiApi.AsyncFetchEntityByID("cmn.Activity", that._ItemInfoEntity.GetFieldValue("ID"), null,
                function (result) {
                    afw.uiApi.HideProgress(that._ParentDailyCalendarControl);
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
                                that._ParentDailyCalendarControl.RefreshItems();
                            }
                        });
                    }
                });
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            if (that._LineOnTitle != null) {
                that._AdjustLineOnTitle();
            }
        },

        _ShowLineOnTitle: function () {
            var that = this;

            that._LineOnTitle = new afw.Panel({
                ParentControl: that,
                Height: 2,
                Width: 100,
                Top: 12,
                Left: 15,
                BackColor: "black"
            });

            if (that._ItemInfoEntity.GetFieldValue("ActivityStatus") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed"))
                that._LineOnTitle.SetBackColor("#00b33c");
            if (that._ItemInfoEntity.GetFieldValue("ActivityStatus") == afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Canceled"))
                that._LineOnTitle.SetBackColor("#808080");

            that._AdjustLineOnTitle();
        },
        
        _AdjustLineOnTitle: function () {
            var that = this;

            that._LineOnTitle.SetWidth(that.GetWidth() - 55 > 1 ? that.GetWidth() - 55 : 1);
        },

        _SetItemIcon: function () {
            var that = this;

            var minorType = that._ItemInfoEntity.GetFieldValue("MinorType");
            iconName = "cmn.ActivityTypeIcon1_" + minorType;
            that.FindControl("IconPanel").SetBackgroundImage(String.Format("resource({0})", iconName));
        },

        _InitDraggable: function () {
            var that = this;

            var tool1Draggable = $("#" + that._DomElementId).kendoDraggable({
                //cursorOffset: { top: 0, left: 0 },
                hint: function (element) {
                    return element.clone();
                },
                drag: function (e) {
                    //that._PipelineViewControl.ShowBottomBar();
                },
                dragend: function (e) {
                    //that._PipelineViewControl.HideBottomBar();
                }
            });
        }

    });

    //Static Members:

    Class.TypeName = "crm.DailyCalendarItemControl";
    Class.BaseType = afw.BasePanel;


    crm.DailyCalendarItemControl = Class;
})();