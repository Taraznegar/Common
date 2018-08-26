(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.WorkflowDefEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainTabControl = that.FindControl("MainTabControl");
            that._OrgPositionPanel = that.FindControl("OrgPositionPanel");

            setTimeout(function () {
                that._StagesOrgPositionsFieldControl = that.FindControl("StagesOrgPositionsFieldControl").FindControl("InnerControl");
                that._StagesDataListControl = that._StagesOrgPositionsFieldControl.FindControl("DataListControl");
                that._StagesDataListControl.bind("EntityWindowOpened", function (e) { that._StagesDataListControl_EntityWindowOpened(e); });
            }, 3000)
        },
        
        _StagesDataListControl_EntityWindowOpened: function(e){
            var that = this;

            e.EntityWindow._WorkflowStageFieldControl.SetBaseFilterExpression(String.Format("WorkflowDef = '{0}'", that._BindableEntity.get("ID")));            
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

    FormClass.TypeName = "cmn.WorkflowDefEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.WorkflowDefEditForm = FormClass;
})();