(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return wm.OnTheWayStuffInfoEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._NotReceivedNumber = null;

            that._DetailsTabControl = that.FindControl("DetailsTabControl");
            that._BatchNumberFieldControl = that.FindControl("BatchNumberFieldControl");
            that._StuffLookup = that.FindControl("StuffFieldControl").FindControl("InnerControl");
            that._NotReceivedNumberLabel = that.FindControl("NotReceivedNumberLabel");
            that._InitialOnTheWayQuantityControl = that.FindControl("InitialOnTheWayQuantityFieldControl").FindControl("InnerControl");

            that.FindControl("CreationTimeFieldControl").SetReadOnly(true);
            that._StuffLookup.BindEvent("ValueChanged", function (e) { that._StuffLookupValueChanged(e); });
            that._InitialOnTheWayQuantityControl.BindEvent("ValueChanged", function (e) { that._InitialOnTheWayQuantityControl_ValueChanged(e); });

            that._StuffLookup.SetHasEntityViewButton(false);

            that._OnTheWayStuffReceiveInfosDataList = that.FindControl("OnTheWayStuffReceiveInfosFieldControl").FindControl("InnerControl")
                .FindControl("DataListControl");
            that._OnTheWayStuffReceiveInfosDataList.BindEvent("DataLoaded", function (e) { that._OnTheWayStuffReceiveInfosDataList_DataLoaded(e); });

            if (that._FormMode == "New") {
                that.FindControl("CreationTimeFieldControl").FindControl("InnerControl").SetValue(afw.DateTimeHelper.GetServerDateTime());
                that._DetailsTabControl.SetTabEnabled(0, false);
            }

            if (that._FormMode == "Edit") {
                that._FetchStuffDefEntity(that._BindableEntity.get("Stuff"));
            }

            that._AdjustForm();
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _InitialOnTheWayQuantityControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._NotReceivedNumber)) {
                if (e.Sender.GetValue() - that._NotReceivedNumber < 0) {
                    afw.ErrorDialog.Show("مقدار وارد شده کمتر از تعداد کالاهای دریافت شده است.");
                    return;
                }
            }

            that._SetNotReceivedNumberLabel();
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            if (that._IsRequieredBatchNumber())
                that._BatchNumberFieldControl.SetVisible(true);
            else {
                that._BatchNumberFieldControl.SetVisible(false);
                that._BatchNumberFieldControl.FindControl("InnerControl").SetValue(null);
            }

            if (ValueIsEmpty(that._BindableEntity.get("Stuff"))) {

            }

            if (that._FormMode == "Edit") {
                that._DetailsTabControl.SetTabEnabled(0, true);
                that._DetailsTabControl.SelectTabByIndex(0);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (that._IsRequieredBatchNumber() && ValueIsEmpty(that._BindableEntity.get("BatchNumber"))) {
                afw.ErrorDialog.Show("شماره بچ مقداردهی نشده است.");
                return;
            }

            return true;
        },

        _StuffLookupValueChanged: function(e){
            var that = this;

            if (ValueIsEmpty(that._StuffLookup.GetValue()))
                that._StuffDefEntity = null;
            else {
                that._FetchStuffDefEntity(that._StuffLookup.GetValue());
                }

            that._AdjustForm();
        },

        _IsRequieredBatchNumber: function () {
            var that = this;

            if(ValueIsEmpty(that._StuffDefEntity))
                return false;
            else
                return that._StuffDefEntity.GetFieldValue("BatchNumberIsRequiered");
        },

        _FetchStuffDefEntity: function (struffID) {
            var that = this;

            var stuffEntity = afw.uiApi.FetchEntityByID("cmn.Stuff", struffID, null);
            that._StuffDefEntity = afw.uiApi.FetchEntityByID("cmn.StuffDef", stuffEntity.GetFieldValue("StuffDef"));
        },

        _SetNotReceivedNumberLabel: function () {
            var that = this;

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.GetNotReceivedStuffNumber", [that._BindableEntity.GetEntity()],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        that._NotReceivedNumber = null;
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    }
                    else {
                        that._NotReceivedNumber = result.Value;

                        if (!that._NotReceivedNumberLabel.IsDestroying && !that._IsDestroying) {
                            that._NotReceivedNumberLabel.SetText(that._NotReceivedNumber);

                            if (that._NotReceivedNumber == 0)
                                that._OnTheWayStuffReceiveInfosDataList.FindControl("DataListControl_ToolBar").SetButtonEnabled("New", false);
                            else
                                that._OnTheWayStuffReceiveInfosDataList.FindControl("DataListControl_ToolBar").SetButtonEnabled("New", true);
                        }
                    }
                });
        },

        _OnTheWayStuffReceiveInfosDataList_DataLoaded: function (e) {
            var that = this;

            that._SetNotReceivedNumberLabel();
        },

        _Save: function () {
            var that = this;

            that._ValidateForm();

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                that._DetailsTabControl.SetTabEnabled(0, true);
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

    FormClass.TypeName = "wm.OnTheWayStuffInfoEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    wm.OnTheWayStuffInfoEditForm = FormClass;
})();