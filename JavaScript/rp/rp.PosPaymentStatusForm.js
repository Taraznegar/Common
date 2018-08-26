(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return rp.PosPaymentStatusForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._MessageText = options.MessageText; 

            that._MessageLabel = that.FindControl("MessageLabel");
            that._SuccessfulPaymentButton = that.FindControl("SuccessfulPaymentButton");
            that._UnsuccessfulPaymentButton = that.FindControl("UnsuccessfulPaymentButton");

            that._MessageLabel.SetText(that._MessageText);

            that._SuccessfulPaymentButton.bind("Click", function (e) { that._SuccessfulPaymentButton_Click(e); });
            that._UnsuccessfulPaymentButton.bind("Click", function (e) { that._UnsuccessfulPaymentButton_Click(e); });

            that.UserSelectedButton = "";
        },

        _SuccessfulPaymentButton_Click: function(e){
            var that = this;

            that.UserSelectedButton = "Successful";
            that.Close();
        },

        _UnsuccessfulPaymentButton_Click: function (e) {
            var that = this;

            that.UserSelectedButton = "Unsuccessful";
            that.Close();
        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that.Center();
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.Window.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.Window.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.PosPaymentStatusForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    rp.PosPaymentStatusForm = FormClass;
})();