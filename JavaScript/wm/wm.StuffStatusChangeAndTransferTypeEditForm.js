(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.StuffStatusChangeAndTransferTypeEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._AllowDestinationWarehouseChangeFieldControl = that.FindControl("AllowDestinationWarehouseChangeFieldControl");
            that._DestinationWarehouseFieldControl = that.FindControl("DestinationWarehouseFieldControl");
            that._SourceWarehouseFieldControl = that.FindControl("SourceWarehouseFieldControl");

            that._AllowDestinationWarehouseChangeFieldControl.bind("ValueChanged", function (e) {
                that._AllowDestinationWarehouseChangeFieldControl_ValueChanged(e);
            });

            that._AdjustForm();
        },

        _AllowDestinationWarehouseChangeFieldControl_ValueChanged: function (e) {
            var that = this;

            if (that._AllowDestinationWarehouseChangeFieldControl.GetValue())
                that._DestinationWarehouseFieldControl.SetValue(null);

            that._AdjustForm();
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
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

            if (that._AllowDestinationWarehouseChangeFieldControl.GetValue())
                that._DestinationWarehouseFieldControl.SetVisible(false);
            else {
                that._DestinationWarehouseFieldControl.SetVisible(true);
                that._DestinationWarehouseFieldControl.SetFillParent(true);
            }
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

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.StuffStatusChangeAndTransferTypeEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.StuffStatusChangeAndTransferTypeEditForm = FormClass;
})();