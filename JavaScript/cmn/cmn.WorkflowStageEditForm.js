(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.WorkflowStageEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
             
            that._SystemActionFieldControl = that.FindControl("SystemActionFieldControl").FindControl("InnerControl");

            
          
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

             var workflowDefEntity = afw.uiApi.FetchEntity("cmn.WorkflowDef", String.Format("ID = '{0}'", that._BindableEntity.get("WorkflowDef")));
             var worklowForm = workflowDefEntity.GetFieldValue("WorkflowForm");
             that._SystemActionFieldControl.SetBaseFilterExpression(String.Format("WorkflowForm = '{0}'", worklowForm));
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

    FormClass.TypeName = "cmn.WorkflowStageEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.WorkflowStageEditForm = FormClass;
})();