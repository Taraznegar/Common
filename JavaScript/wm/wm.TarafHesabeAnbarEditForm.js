(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return wm.TarafHesabeAnbarEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._ParentEntity = options.ParentEntity;

            that._TitleTextBox = that.FindControl("TitleFieldControl").FindControl("innerControl");
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

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            var tarafHesabahyeAnbar = afw.uiApi.FetchEntityList("wm.TarafHesabeAnbar",
                String.Format("WarehouseDocsAccSettings = '{0}'", that._ParentEntity.GetFieldValue("ID")));

            if (tarafHesabahyeAnbar.Entities.length > 1) {
                for (var i = 0; i < tarafHesabahyeAnbar.Entities.length; i++) {
                    if (tarafHesabahyeAnbar.Entities[i].GetFieldValue("Title") == null) {
                        afw.ErrorDialog.Show("ابتدا عنوان را برای طرف حساب های موجود وارد نمایید.");
                        return false;
                    }
                }

                if (ValueIsEmpty(that._TitleTextBox.GetValue())) {
                    afw.ErrorDialog.Show("مقدار فیلد عنوان را وارد نمایید.");
                    return false;
                }
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

    FormClass.TypeName = "wm.TarafHesabeAnbarEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    wm.TarafHesabeAnbarEditForm = FormClass;
})();
