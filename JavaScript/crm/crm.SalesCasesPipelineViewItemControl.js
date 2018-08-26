(function () {
    var Class = afw.BasePanel.extend({
        GetType: function () {
            return crm.SalesCasesPipelineViewItemControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);

            that._PipelineViewControl = options.PipelineViewControl;

            if ("SalesCase" in options)
                that._SalesCase = options.SalesCase;
            else
                throw "SalesCase is not set.";

            that._IsLoaded = false;

            //that.Load();
        },

        GetIsLoaded: function () {
            var that = this;

            return that._IsLoaded;
        },

        Load: function () {
            var that = this;

            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            var itemWrapperDockPanel = that.FindControl("ItemWrapperDockPanel");
            var titleLabel = that.FindControl("TitleLabel");
            var titleLabel2 = that.FindControl("TitleLabel2");
            var titleLabel3 = that.FindControl("TitleLabel3");

            itemWrapperDockPanel.SetFillParent(true);
            itemWrapperDockPanel.Panes[1].SetBackColor("#cccccc");

            if (that._SalesCase.GetFieldValue("DaysRemainedInCurrentStage") > that._SalesCase.GetFieldValue("CurrentStageAllowedDays"))
                that._SetStageDaysWarningIcon();
            else
                that.FindControl("StageDaysWarningLabel").SetText("");

            titleLabel.SetText(that._SalesCase.GetFieldValue("Title"));
            titleLabel.bind("Click", function (e) { that._Click(e); });

            var estimatedRevenue = that._SalesCase.GetFieldValue("EstimatedRevenue");
            if (estimatedRevenue == null)
                estimatedRevenue = 0;

            //var salesCaseDate = afw.DateTimeHelper.GregorianToJalali(that._SalesCase.GetFieldValue("CreationTime")).split(" ")[0];
            var salesCase_LastActionTime = afw.DateTimeHelper.GregorianToJalali(that._SalesCase.GetFieldValue("LastActionTime"));
            titleLabel2.SetText(
                that._SalesCase.GetFieldValue("Customer_Text") + ", " + salesCase_LastActionTime
                );
            titleLabel2.bind("Click", function (e) { that._Click(e); });

            titleLabel3.SetText(
                that._SalesCase.GetFieldValue("OwnerUser_Text") + ", " +
                String.Format("{0} ریال", FormatNumber(estimatedRevenue))
                );
            titleLabel3.bind("Click", function (e) { that._Click(e); });

            that.SetMouseCursor("pointer");
            //that.bind("Click", function (e) { that._Click(e); });
            that.FindControl("IconPanel").bind("Click", function (e) { that._Click(e); });

            that._InitDraggable();

            that._IsLoaded = true;
        },

        GetSalesCase: function () {
            var that = this;

            return that._SalesCase;
        },

        _SetStageDaysWarningIcon: function () {
            var that = this;

            that.FindControl("IconPanel").SetBackgroundImage("resource(cmn.WarningIcon1)");

            var daysRemainedInCurrentStage = that._SalesCase.GetFieldValue("DaysRemainedInCurrentStage")            
            var stageDaysWarningLabel = that.FindControl("StageDaysWarningLabel");
            
            stageDaysWarningLabel.SetText(daysRemainedInCurrentStage);

            if (daysRemainedInCurrentStage < 10)
                stageDaysWarningLabel.SetWidth(21);
            else
                stageDaysWarningLabel.SetWidth(25);
        },

        _Click: function () {
            var that = this;

            afw.uiApi.ShowProgress(that._PipelineViewControl);
            afw.uiApi.AsyncFetchEntityByID("crm.SalesCase", that._SalesCase.GetFieldValue("ID"), null,
                function (result) {
                    afw.uiApi.HideProgress(that._PipelineViewControl);
                    if (result.HasError)
                        afw.Application.HandleError(result.ErrorMessage);
                    else {
                        var entityWindow = afw.EntityHelper.ShowEntityWindow(result.Value, "crm.SalesCaseEditForm", "Edit");
                        if (entityWindow == null) {
                            afw.Application.HandleError("Could not create Entity window.");
                            return;
                        }

                        entityWindow.bind("Close", function () {
                            if (entityWindow.GetDialogResult() == "Ok") {
                                that._PipelineViewControl.CreatePipeline();
                            }
                        });
                    }
                });
        },

        _InitDraggable: function () {
            var that = this;

            var tool1Draggable = $("#" + that._DomElementId).kendoDraggable({
                //cursorOffset: { top: 0, left: 0 },
                hint: function (element) {
                    return element.clone();
                }
                ,
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

    Class.TypeName = "crm.SalesCasesPipelineViewItemControl";
    Class.BaseType = afw.BasePanel;


    crm.SalesCasesPipelineViewItemControl = Class;
})();