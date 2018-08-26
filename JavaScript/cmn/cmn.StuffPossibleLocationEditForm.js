(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffPossibleLocationEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._StockMinFieldControlText = that.FindControl("StockMinFieldControl").FindControl("InnerControl");
            that._StockMaxFieldControlText = that.FindControl("StockMaxFieldControl").FindControl("InnerControl");

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

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (that._StockMinFieldControlText.GetText() > that._StockMaxFieldControlText.GetText()) {

                afw.MessageDialog.Show("حداقل موجودی نباید از حداکثر موجودی بیشتر باشد");
                return false;
            }

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

    FormClass.TypeName = "cmn.StuffPossibleLocationEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.StuffPossibleLocationEditForm = FormClass;
})();