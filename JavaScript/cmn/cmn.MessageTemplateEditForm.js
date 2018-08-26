(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.MessageTemplateEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._FirstNoteVariablePhraseComboBox = that.FindControl("FirstNoteVariablePhraseComboBox");
            that._SecondNoteVariablePhraseComboBox = that.FindControl("SecondNoteVariablePhraseComboBox");
            that._ThirdNoteVariablePhraseComboBox = that.FindControl("ThirdNoteVariablePhraseComboBox");
            that._FourthNoteVariablePhraseComboBox = that.FindControl("FourthNoteVariablePhraseComboBox");
            that._FifthNoteVariablePhraseComboBox = that.FindControl("FifthNoteVariablePhraseComboBox");
            that._SixthNoteVariablePhraseComboBox = that.FindControl("SixthNoteVariablePhraseComboBox");

            that._FirstNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
            that._SecondNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
            that._ThirdNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
            that._FourthNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
            that._FifthNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
            that._SixthNoteVariablePhraseComboBox.InitDataBinding(that._BindableEntity);
             
            var variablePhrasesList = afw.uiApi.CallServerMethodSync("cmn.GetOptionSetItemsList", ["cmn.VariablePhrases"]);
            if (variablePhrasesList.Entities.length > 0) {     
                that._FirstNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
                that._SecondNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
                that._ThirdNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
                that._FourthNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
                that._FifthNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
                that._SixthNoteVariablePhraseComboBox.SetItemsDataSource(variablePhrasesList.ToDataSourceData());
            } 
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

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

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

    FormClass.TypeName = "cmn.MessageTemplateEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    cmn.MessageTemplateEditForm = FormClass;
})();