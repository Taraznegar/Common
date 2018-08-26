(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return wm.GhabzOrHavaleItemForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._GhabzOrHavaleEditForm = options.GhabzOrHavaleEditForm;
            that._BindableEntity = options.GhabzOrHavaleItemEntity.ToBindableEntity();
            that._FormMode = options.FormMode;

            that._GhabzOrHavaleItemFormDockPanel = that.FindControl("GhabzOrHavaleItemFormDockPanel");

            var itemsEntityList = afw.uiApi.CreateEntityList("wm.GhabzOrHavaleItem");
            itemsEntityList.Entities.push(options.GhabzOrHavaleItemEntity);

            that._CreateItemsGridControl(itemsEntityList);
        },

        _CreateItemsGridControl: function (itemsEntityList, ghabzOrHavaleTypeEntity) {
            var that = this;

            that.ItemsGridControl = new wm.GhabzOrHavaleItemsGridControl({
                ParentControl: that._GhabzOrHavaleItemFormDockPanel.Panes[0],
                Name: "ItemsGridControl",
                GhabzOrHavaleEditForm: that._GhabzOrHavaleEditForm,
                RowsEntityList: itemsEntityList,
                GhabzOrHavaleTypeEntity: that._GhabzOrHavaleEditForm.GhabzOrHavaleTypeEntity,
                FillParent: true
            });

            if (itemsEntityList.Entities.length == 0)
                that.ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < itemsEntityList.Entities.length; i++) {
                    that.ItemsGridControl.AddRow(itemsEntityList.Entities[i]);
                }
            }
        },

        SetFocus: function () {
            var that = this;

            that._StuffLookupControl.Focus();
        },

        GetControl: function (controlName) {
            var that = this;

            return that.FindControl(controlName);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "Escape")
                that.CloseForm();

            afw.BasePanel.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.GhabzOrHavaleItemForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    wm.GhabzOrHavaleItemForm = FormClass;
})();