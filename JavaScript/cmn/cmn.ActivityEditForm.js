(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.ActivityEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
           
            var salesCaseLink = that.FindControl("SalesCaseLink");

            if (that._FormMode != "New" && "ShowSalesCase" in options && options.ShowSalesCase === true
                    && !ValueIsEmpty(that._BindableEntity.get("SalesCase"))) {
                that.FindControl("SalesCaseInfoDockPanel").SetHeight(53);

                that._SalesCaseEntity = afw.uiApi.FetchEntityByID("crm.SalesCase", that._BindableEntity.get("SalesCase"));
                var salesCaseTitle = that._SalesCaseEntity.GetFieldValue("Title");
                salesCaseLink.SetText(salesCaseTitle);
                salesCaseLink.bind("Click", function (e) { that._SalesCaseLink_Click(e); });
            }
            else {
                that.FindControl("SalesCaseInfoDockPanel").SetVisible(false);
                that.FindControl("SalesCaseInfoDockPanel").SetHeight(1);
            }

            that._Toolbar = that.FindControl("Toolbar");
            that._ActivityStatusFieldControl = that.FindControl("ActivityStatusFieldControl");
            that._CompletionTimeControl = that.FindControl("CompletionTimeFieldControl");
            that._ActivityTypeControl = that.FindControl("ActivityTypeFieldControl");
            that._DueDateTypeFieldControl = that.FindControl("DueDateTypeFieldControl");


            if (that._FormMode == "New") {
                that._CompletionTimeControl.SetVisible(false);

                that._BindableEntity.set("OwnerUser", afw.App.Session.GetFieldValue("SystemUser"));

                if (that._BindableEntity._Entity.GetFieldValue("ActivityStatus") == null) {
                    var ActivityStatus_NotCompletedID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.NotCompleted");
                    that._ActivityStatusFieldControl.SetValue(ActivityStatus_NotCompletedID);
                }
            }
            else if (that._FormMode == "Edit") {
                that._CompletionTimeControl.SetReadOnly(true);
            }

            that._ActivityTypeControl.bind("ValueChanged", function (e) { that._ActivityTypeControl_ValueChanged(e); });
            that._DueDateTypeFieldControl.bind("ValueChanged", function (e) { that._DueDateTypeFieldControl_ValueChanged(e); });

            that._ConfigureDueDateControl();

            that.FindControl("ReminderTimeClearButton").bind("Click", function (e) {
                that._BindableEntity.set("ReminderTime", null);
            });
        },

        GetToolbar: function () {
            var that = this;

            return that._Toolbar;
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);

            if (that.FindControl("SalesCaseInfoDockPanel").GetVisible() == true)
                that.SetHeight(700);
            else
                that.SetHeight(655);
        },

        _SalesCaseLink_Click: function (e) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            //run in new thread:
            setTimeout(function () {
                try
                {
                    afw.EntityHelper.ShowEntityWindow(that._SalesCaseEntity, "crm.SalesCaseEditForm", "Edit");
                }
                catch (ex)
                {
                    afw.ErrorDialog.Show(ex);
                }

                afw.uiApi.HideProgress(that);               
            }, 1);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "SetActivityCompleted") {
                var activityStatus_CompletedID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed");
                that._ActivityStatusFieldControl.SetValue(activityStatus_CompletedID);

                if (that._Save()) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
            }
            else if (buttonKey == "SetActivityNotCompleted") {
                var activityStatus_NotCompletedID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.NotCompleted");
                that._ActivityStatusFieldControl.SetValue(activityStatus_NotCompletedID);

                if (that._Save()) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
            }
            else if (buttonKey == "SetActivityCanceled") {
                var activityStatus_CanceledID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Canceled");
                that._ActivityStatusFieldControl.SetValue(activityStatus_CanceledID);
                that.FindControl("CompletionTimeFieldControl").SetValue(null);

                if (that._Save()) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
            }
        },

        _ActivityTypeControl_ValueChanged: function (e) {
            var that = this;

            var activityTypeId = that._ActivityTypeControl.GetValue();
            var activityTypeName = afw.OptionSetHelper.GetOptionSetItemName(activityTypeId);
            if (activityTypeName == "IncommingCall") {
                var ActivityStatus_CompletedID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed");
                that._ActivityStatusFieldControl.SetValue(ActivityStatus_CompletedID);
            }

            that._AdjustForm();
        },

        _DueDateTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            that._ConfigureDueDateControl();
        },

        _ConfigureDueDateControl: function () {
            var that = this;

            var dueDateTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._DueDateTypeFieldControl.GetValue());
            var dueDateControlPanel = that.FindControl("DueDateControlPanel");
            var storedDueDate = null;

            if (dueDateControlPanel.HasChildControls) {
                storedDueDate = that.FindControl("DueDateControl").GetValue();
                dueDateControlPanel.ChildControls[0].Destroy();               
            }               

            var dueDateControlMode = null;
            if (dueDateTypeName == "Date")
                dueDateControlMode = "Date";
            else if (dueDateTypeName == "DateAndTime")
                dueDateControlMode = "DateAndTime";

            var dueDateControl = new afw.DateTimeControl({
                ParentControl: dueDateControlPanel,
                Name: "DueDateControl",
                Mode: dueDateControlMode,
                LabelVisible: true,
                LabelText: "مهلت انجام",
                FillParent: true,
                ValueDataMember: "DueDate",
                DataSource: that._BindableEntity
            });

            if (storedDueDate != null) {
                if (storedDueDate.Contains(" "))
                    dueDateControl.SetValue(storedDueDate.split(" ")[0]);
                else
                    dueDateControl.SetValue(storedDueDate);
            }

            that._AdjustForm();
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            var activityStatusName = afw.OptionSetHelper.GetOptionSetItemName(that._BindableEntity.get("ActivityStatus"));

            if (activityStatusName == "NotCompleted") {
                if (that._Toolbar.ButtonExists("SetActivityNotCompleted"))
                    that._Toolbar.RemoveButton("SetActivityNotCompleted");

                if (!that._Toolbar.ButtonExists("SetActivityCompleted"))
                    that._Toolbar.AddButton("SetActivityCompleted", "تغییر وضعیت به انجام شده");

                if (that._FormMode != "New" && !that._Toolbar.ButtonExists("SetActivityCanceled"))
                    that._Toolbar.AddButton("SetActivityCanceled", "تغییر وضعیت به لغو شده");

                that.FindControl("CompletionTimePanel").SetVisible(false);
            }
            else if (activityStatusName == "Completed") {
                if (that._Toolbar.ButtonExists("SetActivityCompleted"))
                    that._Toolbar.RemoveButton("SetActivityCompleted");

                if (!that._Toolbar.ButtonExists("SetActivityNotCompleted"))
                    that._Toolbar.AddButton("SetActivityNotCompleted", "تغییر وضعیت به انجام نشده");

                that.FindControl("CompletionTimePanel").SetVisible(true);
            }
            else if (activityStatusName == "Canceled") {
                if (that._Toolbar.ButtonExists("SetActivityCanceled"))
                    that._Toolbar.RemoveButton("SetActivityCanceled");

                if (!that._Toolbar.ButtonExists("SetActivityNotCompleted"))
                    that._Toolbar.AddButton("SetActivityNotCompleted", "تغییر وضعیت به انجام نشده");

                that.FindControl("CompletionTimePanel").SetVisible(false);
            }

            that.FindControl("TabularPanel1").AdjustRows();
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var dueDate = that._BindableEntity.get("DueDate");

            if (!ValueIsEmpty(dueDate) && dueDate.length > 5) {
                dueDate = dueDate.trim();
                if (!dueDate.Contains(" ")) {
                    dueDate += " " + "23:59:59";
                    that._BindableEntity.set("DueDate", dueDate);
                }
            }

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ActivityEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.ActivityEditForm = FormClass;
})();
